import { store } from '../data/store.js';

/**
 * Predictive Maintenance Alerts for Institutions (B2B)
 * Analyzes institution service history to predict when equipment
 * needs maintenance, sending proactive alerts.
 */

const MAINTENANCE_INTERVALS = {
  'AC Servicing': { months: 6, warningMonths: 1, priority: 'High' },
  'Appliance Repair': { months: 12, warningMonths: 2, priority: 'Medium' },
  'Electrical': { months: 12, warningMonths: 2, priority: 'High' },
  'Plumbing': { months: 6, warningMonths: 1, priority: 'Medium' },
  'Cleaning': { months: 3, warningMonths: 1, priority: 'Low' },
  'Painting': { months: 24, warningMonths: 3, priority: 'Low' },
  'Pest Control': { months: 6, warningMonths: 1, priority: 'Medium' },
  'Carpentry': { months: 18, warningMonths: 2, priority: 'Low' },
  'Gardening': { months: 4, warningMonths: 1, priority: 'Low' },
  'General Maintenance': { months: 6, warningMonths: 1, priority: 'Medium' },
  'Geyser Repair': { months: 12, warningMonths: 2, priority: 'High' },
  'Heater Service': { months: 12, warningMonths: 2, priority: 'Medium' },
  'Waterproofing': { months: 36, warningMonths: 3, priority: 'Medium' },
  'Driving': { months: 12, warningMonths: 2, priority: 'Medium' },
  'Caregiving': { months: 1, warningMonths: 0, priority: 'High' }
};

function calculateNextMaintenance(lastServiceDate, category) {
  const interval = MAINTENANCE_INTERVALS[category] || MAINTENANCE_INTERVALS['General Maintenance'];
  const lastDate = new Date(lastServiceDate);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + interval.months);

  const warningDate = new Date(nextDate);
  warningDate.setMonth(warningDate.getMonth() - interval.warningMonths);

  return {
    lastServiceDate: lastDate.toISOString(),
    nextMaintenanceDate: nextDate.toISOString(),
    warningDate: warningDate.toISOString(),
    intervalMonths: interval.months,
    priority: interval.priority,
    isOverdue: new Date() > nextDate,
    isWarning: new Date() >= warningDate && new Date() <= nextDate,
    daysUntilMaintenance: Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24))
  };
}

export function generateMaintenanceAlerts(customerId) {
  const jobs = store.find('jobs', { customerId });
  const completedJobs = jobs.filter(j =>
    (j.status === 'COMPLETED' || j.status === 'PAID') &&
    (j.customerType === 'Institution' || j.institutionName)
  );

  if (completedJobs.length === 0) return { alerts: [], summary: 'No institutional service history found.' };

  // Group by service category and find last service date
  const serviceHistory = {};
  for (const job of completedJobs) {
    const cat = job.serviceCategory;
    if (!serviceHistory[cat] || new Date(job.completedAt || job.updatedAt) > new Date(serviceHistory[cat].lastDate)) {
      serviceHistory[cat] = {
        lastDate: job.completedAt || job.updatedAt,
        jobCode: job.code,
        workerName: job.workerName
      };
    }
  }

  const alerts = [];
  for (const [category, history] of Object.entries(serviceHistory)) {
    const maintenance = calculateNextMaintenance(history.lastDate, category);
    const alert = {
      id: `MAINT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      serviceCategory: category,
      lastServiceDate: history.lastDate,
      lastJobCode: history.jobCode,
      lastWorker: history.workerName,
      ...maintenance,
      status: maintenance.isOverdue ? 'OVERDUE' : maintenance.isWarning ? 'WARNING' : 'OK',
      recommendation: maintenance.isOverdue
        ? `${category} maintenance is overdue by ${Math.abs(maintenance.daysUntilMaintenance)} days. Book immediately.`
        : maintenance.isWarning
        ? `${category} maintenance due in ${maintenance.daysUntilMaintenance} days. Schedule now to avoid breakdown.`
        : `${category} maintenance due in ${maintenance.daysUntilMaintenance} days.`,
      estimatedCost: getEstimatedCost(category),
      suggestedWorker: findBestWorker(category)
    };
    alerts.push(alert);
  }

  // Sort by urgency
  alerts.sort((a, b) => {
    const order = { OVERDUE: 0, WARNING: 1, OK: 2 };
    return (order[a.status] || 2) - (order[b.status] || 2);
  });

  const overdue = alerts.filter(a => a.status === 'OVERDUE').length;
  const warnings = alerts.filter(a => a.status === 'WARNING').length;

  return {
    customerId,
    institutionName: completedJobs[0]?.institutionName || 'Institution',
    alerts,
    summary: overdue > 0
      ? `${overdue} overdue maintenance, ${warnings} upcoming. Schedule immediately.`
      : warnings > 0
      ? `${warnings} maintenance tasks due soon. Schedule to prevent issues.`
      : 'All maintenance up to date.',
    totalAlerts: alerts.length,
    overdueCount: overdue,
    warningCount: warnings
  };
}

function getEstimatedCost(category) {
  const costs = {
    'AC Servicing': 800, 'Appliance Repair': 600, 'Electrical': 500,
    'Plumbing': 450, 'Cleaning': 350, 'Painting': 2000,
    'Pest Control': 600, 'Carpentry': 700, 'Gardening': 400,
    'General Maintenance': 500, 'Geyser Repair': 900, 'Heater Service': 700,
    'Waterproofing': 3000, 'Driving': 500, 'Caregiving': 300
  };
  return costs[category] || 500;
}

function findBestWorker(category) {
  const workers = store.getCollection('workers');
  const eligible = workers.filter(w =>
    w.isOnline &&
    (w.primarySkill === category || (w.serviceCategories || []).includes(category)) &&
    w.verificationStatus === 'Verified'
  );
  if (eligible.length === 0) return null;
  const best = eligible.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))[0];
  return { workerId: best.id, name: best.name, rating: best.ratingAvg };
}

export function getMaintenanceStats(customerId) {
  const alerts = generateMaintenanceAlerts(customerId);
  return {
    totalServices: alerts.alerts.length,
    overdue: alerts.overdueCount,
    upcoming: alerts.warningCount,
    allGood: alerts.overdueCount === 0 && alerts.warningCount === 0
  };
}
