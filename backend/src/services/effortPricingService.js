/**
 * Effort-Based Fair Payout Calculator
 * 
 * Computes a dynamic payout based on multiple effort dimensions:
 * - Base rate (per trade)
 * - Complexity multiplier (routine / moderate / complex / critical)
 * - Physical demand multiplier (low / medium / high / extreme)
 * - Skill difficulty tier (basic / intermediate / advanced / specialist)
 * - Urgency premium (normal / high / emergency)
 * - Travel compensation (per km beyond free threshold)
 * - Waiting time compensation (per 15-min block after grace period)
 * - Time-of-day multiplier (daytime / evening / night / holiday)
 * - Sub-task count bonus (each额外 sub-task adds a flat fee)
 */

const COMPLEXITY_MULTIPLIERS = {
  routine: 1.0,
  moderate: 1.25,
  complex: 1.6,
  critical: 2.0
};

const PHYSICAL_DEMAND_MULTIPLIERS = {
  low: 1.0,
  medium: 1.15,
  high: 1.35,
  extreme: 1.5
};

const SKILL_DIFFICULTY_MULTIPLIERS = {
  basic: 1.0,
  intermediate: 1.2,
  advanced: 1.5,
  specialist: 1.8
};

const URGENCY_MULTIPLIERS = {
  Normal: 1.0,
  High: 1.2,
  Emergency: 1.5
};

const TIME_OF_DAY_MULTIPLIERS = {
  daytime: 1.0,
  evening: 1.15,
  night: 1.35,
  holiday: 1.5
};

const TRADE_DEFAULTS = {
  'Plumbing': { complexity: 'moderate', physicalDemand: 'high', skillDifficulty: 'intermediate' },
  'Electrical': { complexity: 'complex', physicalDemand: 'medium', skillDifficulty: 'advanced' },
  'Carpentry': { complexity: 'moderate', physicalDemand: 'high', skillDifficulty: 'intermediate' },
  'Painting': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
  'Cleaning': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
  'Gardening': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
  'Driving': { complexity: 'moderate', physicalDemand: 'low', skillDifficulty: 'basic' },
  'Caregiving': { complexity: 'complex', physicalDemand: 'high', skillDifficulty: 'advanced' },
  'General Maintenance': { complexity: 'moderate', physicalDemand: 'medium', skillDifficulty: 'basic' },
  'Appliance Repair': { complexity: 'complex', physicalDemand: 'medium', skillDifficulty: 'advanced' }
};

const FREE_TRAVEL_KM = 3;
const TRAVEL_RATE_PER_KM = 15;
const WAITING_GRACE_MINUTES = 15;
const WAITING_RATE_PER_15MIN = 50;
const SUB_TASK_FLAT_FEE = 75;

function getTimeOfDay(scheduledTime) {
  if (!scheduledTime || scheduledTime === 'Immediately / On Demand') return 'daytime';
  const hour = parseInt(scheduledTime.split(':')[0], 10);
  if (isNaN(hour)) return 'daytime';
  if (hour >= 6 && hour < 18) return 'daytime';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function isHoliday(dateString) {
  const nationalHolidays = [
    '01-26', '08-15', '10-02', '01-01', '12-25', '11-01', '03-10', '04-14', '05-01'
  ];
  if (!dateString) return false;
  const md = dateString.slice(5);
  return nationalHolidays.includes(md);
}

export function calculateEffortPricing({
  basePrice,
  serviceCategory,
  durationHours = 1,
  urgency = 'Normal',
  scheduledTime,
  scheduledDate,
  customerLocation,
  workerLocation,
  subTasks = [],
  waitingMinutes = 0,
  complexity,
  physicalDemand,
  skillDifficulty
}) {
  const tradeDefaults = TRADE_DEFAULTS[serviceCategory] || TRADE_DEFAULTS['General Maintenance'];

  const effectiveComplexity = complexity || tradeDefaults.complexity;
  const effectivePhysical = physicalDemand || tradeDefaults.physicalDemand;
  const effectiveSkill = skillDifficulty || tradeDefaults.skillDifficulty;

  const timeOfDay = getTimeOfDay(scheduledTime);
  const holiday = isHoliday(scheduledDate);

  const complexityMult = COMPLEXITY_MULTIPLIERS[effectiveComplexity] || 1.0;
  const physicalMult = PHYSICAL_DEMAND_MULTIPLIERS[effectivePhysical] || 1.0;
  const skillMult = SKILL_DIFFICULTY_MULTIPLIERS[effectiveSkill] || 1.0;
  const urgencyMult = URGENCY_MULTIPLIERS[urgency] || 1.0;
  const timeMult = holiday ? TIME_OF_DAY_MULTIPLIERS.holiday : (TIME_OF_DAY_MULTIPLIERS[timeOfDay] || 1.0);

  const effortMultiplier = complexityMult * physicalMult * skillMult;

  const serviceAmount = basePrice * durationHours * effortMultiplier;
  const urgencySurcharge = serviceAmount * (urgencyMult - 1);
  const timeSurcharge = serviceAmount * (timeMult - 1);
  const subTaskBonus = subTasks.length * SUB_TASK_FLAT_FEE;

  let travelCompensation = 0;
  let travelDistanceKm = 0;
  if (customerLocation && workerLocation) {
    const R = 6371;
    const dLat = ((customerLocation.lat - workerLocation.lat) * Math.PI) / 180;
    const dLon = ((customerLocation.lng - workerLocation.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((workerLocation.lat * Math.PI) / 180) * Math.cos((customerLocation.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    travelDistanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    const billableKm = Math.max(0, travelDistanceKm - FREE_TRAVEL_KM);
    travelCompensation = Math.round(billableKm * TRAVEL_RATE_PER_KM);
  }

  let waitingCompensation = 0;
  const billableWaitBlocks = Math.max(0, Math.floor((waitingMinutes - WAITING_GRACE_MINUTES) / 15));
  waitingCompensation = billableWaitBlocks * WAITING_RATE_PER_15MIN;

  const grossAmount = Math.round((serviceAmount + urgencySurcharge + timeSurcharge + subTaskBonus + travelCompensation + waitingCompensation) * 10) / 10;

  return {
    grossAmount,
    breakdown: {
      basePrice,
      durationHours,
      effortMultiplier: Math.round(effortMultiplier * 100) / 100,
      serviceAmount: Math.round(serviceAmount * 10) / 10,
      complexity: { level: effectiveComplexity, multiplier: complexityMult },
      physicalDemand: { level: effectivePhysical, multiplier: physicalMult },
      skillDifficulty: { level: effectiveSkill, multiplier: skillMult },
      urgency: { level: urgency, multiplier: urgencyMult, surcharge: Math.round(urgencySurcharge * 10) / 10 },
      timeOfDay: { period: holiday ? 'holiday' : timeOfDay, multiplier: timeMult, surcharge: Math.round(timeSurcharge * 10) / 10 },
      subTasks: { count: subTasks.length, fee: subTaskBonus },
      travel: { distanceKm: travelDistanceKm, freeKm: FREE_TRAVEL_KM, billableKm: Math.max(0, travelDistanceKm - FREE_TRAVEL_KM), ratePerKm: TRAVEL_RATE_PER_KM, compensation: travelCompensation },
      waiting: { totalMinutes: waitingMinutes, graceMinutes: WAITING_GRACE_MINUTES, billableBlocks: billableWaitBlocks, ratePerBlock: WAITING_RATE_PER_15MIN, compensation: waitingCompensation }
    },
    disclaimer: 'Effort-based cooperative pricing — multipliers are transparent and configurable by society admin.'
  };
}

export function calculateWorkerPayout(grossAmount, coopPercent = 4, welfarePercent = 1) {
  const coopContribution = Math.round((grossAmount * coopPercent / 100) * 10) / 10;
  const welfareDeduction = Math.round((grossAmount * welfarePercent / 100) * 10) / 10;
  const netWorkerEarnings = Math.round((grossAmount - coopContribution - welfareDeduction) * 10) / 10;
  return { coopContribution, welfareDeduction, netWorkerEarnings, coopPercent, welfarePercent };
}
