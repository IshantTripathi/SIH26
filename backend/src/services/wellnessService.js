import { store } from '../data/store.js';

/**
 * Worker Wellness & Fatigue Prevention System
 * Monitors work patterns, tracks earnings vs hours,
 * ensures minimum wage compliance, and provides wellness recommendations.
 */

const MINIMUM_WAGE_PER_HOUR = 100;
const MAX_DAILY_HOURS = 8;
const MAX_WEEKLY_HOURS = 48;
const REST_BETWEEN_JOBS_MINUTES = 30;
const FATIGUE_THRESHOLD_HOURS = 6;

export function getWorkerWellness(workerId) {
  const worker = store.findById('workers', workerId);
  if (!worker) return null;

  const jobs = store.find('jobs', { workerId });
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');

  // Calculate work hours (estimated from job durations)
  const today = new Date().toISOString().split('T')[0];
  const todayJobs = completedJobs.filter(j => {
    const completedDate = (j.completedAt || j.updatedAt || '').split('T')[0];
    return completedDate === today;
  });

  const thisWeekJobs = completedJobs.filter(j => {
    const jd = new Date(j.completedAt || j.updatedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return jd >= weekAgo;
  });

  const dailyHours = todayJobs.reduce((sum, j) => sum + (j.durationHours || 1), 0);
  const weeklyHours = thisWeekJobs.reduce((sum, j) => sum + (j.durationHours || 1), 0);

  // Earnings analysis
  const todayEarnings = todayJobs.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);
  const weeklyEarnings = thisWeekJobs.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);

  // Hourly rate analysis
  const effectiveHourlyRate = dailyHours > 0 ? Math.round(todayEarnings / dailyHours) : 0;
  const weeklyHourlyRate = weeklyHours > 0 ? Math.round(weeklyEarnings / weeklyHours) : 0;

  // Minimum wage compliance
  const meetsMinimumWage = effectiveHourlyRate >= MINIMUM_WAGE_PER_HOUR || effectiveHourlyRate === 0;

  // Fatigue risk scoring
  let fatigueRisk = 'Low';
  let fatigueScore = 0;
  if (dailyHours >= MAX_DAILY_HOURS) {
    fatigueRisk = 'Critical';
    fatigueScore = 100;
  } else if (dailyHours >= FATIGUE_THRESHOLD_HOURS) {
    fatigueRisk = 'High';
    fatigueScore = 75;
  } else if (dailyHours >= 4) {
    fatigueRisk = 'Medium';
    fatigueScore = 50;
  } else {
    fatigueRisk = 'Low';
    fatigueScore = Math.round((dailyHours / 4) * 50);
  }

  // Rest recommendation
  const lastJob = completedJobs[completedJobs.length - 1];
  let restRecommendation = null;
  if (lastJob) {
    const lastEnd = new Date(lastJob.completedAt || lastJob.updatedAt);
    const minutesSinceLastJob = (Date.now() - lastEnd.getTime()) / (1000 * 60);
    if (minutesSinceLastJob < REST_BETWEEN_JOBS_MINUTES && dailyHours >= 4) {
      restRecommendation = {
        message: `You completed a job ${Math.round(minutesSinceLastJob)} minutes ago. Take a ${REST_BETWEEN_JOBS_MINUTES - Math.round(minutesSinceLastJob)}-minute rest before accepting new jobs.`,
        restMinutesRemaining: REST_BETWEEN_JOBS_MINUTES - Math.round(minutesSinceLastJob),
        priority: 'High'
      };
    }
  }

  // Wellness score (0-100)
  let wellnessScore = 100;
  if (dailyHours > MAX_DAILY_HOURS) wellnessScore -= 30;
  else if (dailyHours > FATIGUE_THRESHOLD_HOURS) wellnessScore -= 15;
  if (!meetsMinimumWage && dailyHours > 0) wellnessScore -= 20;
  if (fatigueRisk === 'High') wellnessScore -= 15;
  if (fatigueRisk === 'Critical') wellnessScore -= 30;
  wellnessScore = Math.max(0, wellnessScore);

  // Recommendations
  const recommendations = [];
  if (dailyHours >= MAX_DAILY_HOURS) {
    recommendations.push({ type: 'REST', message: 'You have reached the maximum daily work hours. Please rest.', priority: 'High' });
  }
  if (!meetsMinimumWage && dailyHours > 0) {
    recommendations.push({ type: 'WAGE', message: `Your effective hourly rate (₹${effectiveHourlyRate}) is below minimum wage (₹${MINIMUM_WAGE_PER_HOUR}/hr). Discuss with your society admin.`, priority: 'Medium' });
  }
  if (weeklyHours >= MAX_WEEKLY_HOURS) {
    recommendations.push({ type: 'WEEKLY_LIMIT', message: 'You have reached the recommended weekly work limit. Consider taking a day off.', priority: 'High' });
  }
  if (fatigueRisk === 'High' || fatigueRisk === 'Critical') {
    recommendations.push({ type: 'FATIGUE', message: 'High fatigue risk detected. Take a break and hydrate.', priority: 'High' });
  }
  if (todayJobs.length > 0 && todayJobs.length % 3 === 0) {
    recommendations.push({ type: 'BREAK', message: `You have completed ${todayJobs.length} jobs today. Take a 15-minute break.`, priority: 'Medium' });
  }

  // Insurance and welfare status
  const welfareRecord = store.findOne('welfareRecords', { workerId });
  const insuranceStatus = welfareRecord ? {
    hasInsurance: true,
    policyNumber: welfareRecord.insuranceId || 'POL-DEMO-001',
    coverageAmount: welfareRecord.coverageAmount || 200000,
    status: 'Active'
  } : {
    hasInsurance: false,
    message: 'No welfare record found. Contact your society admin.'
  };

  return {
    workerId,
    workerName: worker.name,
    wellnessScore,
    fatigueRisk,
    fatigueScore,
    workHours: {
      today: dailyHours,
      thisWeek: weeklyHours,
      dailyLimit: MAX_DAILY_HOURS,
      weeklyLimit: MAX_WEEKLY_HOURS,
      dailyUtilization: Math.round((dailyHours / MAX_DAILY_HOURS) * 100),
      weeklyUtilization: Math.round((weeklyHours / MAX_WEEKLY_HOURS) * 100)
    },
    earnings: {
      today: `₹${todayEarnings.toLocaleString('en-IN')}`,
      thisWeek: `₹${weeklyEarnings.toLocaleString('en-IN')}`,
      total: `₹${totalEarnings.toLocaleString('en-IN')}`,
      effectiveHourlyRate: `₹${effectiveHourlyRate}`,
      weeklyHourlyRate: `₹${weeklyHourlyRate}`,
      meetsMinimumWage,
      minimumWagePerHour: `₹${MINIMUM_WAGE_PER_HOUR}`
    },
    restRecommendation,
    recommendations,
    insuranceStatus,
    completedJobsToday: todayJobs.length,
    completedJobsThisWeek: thisWeekJobs.length,
    totalJobsCompleted: completedJobs.length
  };
}

export function getWellnessAlerts(societyId) {
  const workers = store.getCollection('workers');
  const societyWorkers = societyId
    ? workers.filter(w => w.societyId === societyId)
    : workers;

  const alerts = [];
  for (const worker of societyWorkers) {
    const wellness = getWorkerWellness(worker.id);
    if (!wellness) continue;

    if (wellness.fatigueRisk === 'Critical') {
      alerts.push({
        workerId: worker.id,
        workerName: worker.name,
        type: 'FATIGUE_CRITICAL',
        message: `${worker.name} has exceeded daily work hour limit (${wellness.workHours.today}h/${MAX_DAILY_HOURS}h).`,
        priority: 'High'
      });
    }
    if (!wellness.earnings.meetsMinimumWage && wellness.workHours.today > 0) {
      alerts.push({
        workerId: worker.id,
        workerName: worker.name,
        type: 'MINIMUM_WAGE',
        message: `${worker.name}'s effective hourly rate (₹${wellness.earnings.effectiveHourlyRate}) is below minimum wage.`,
        priority: 'Medium'
      });
    }
    if (wellness.wellnessScore < 50) {
      alerts.push({
        workerId: worker.id,
        workerName: worker.name,
        type: 'LOW_WELLNESS',
        message: `${worker.name}'s wellness score is ${wellness.wellnessScore}/100. Needs rest.`,
        priority: 'High'
      });
    }
  }

  return {
    totalWorkers: societyWorkers.length,
    alertsCount: alerts.length,
    alerts: alerts.sort((a, b) => a.priority === 'High' ? -1 : 1)
  };
}
