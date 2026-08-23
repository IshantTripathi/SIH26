/**
 * Active Workload Balancing & Redistribution Service
 * 
 * Monitors worker workload in real-time and triggers:
 * - Auto-redistribution when imbalance detected
 * - Workload caps (max 6 concurrent jobs)
 * - Cross-society balancing alerts
 * - Fatigue risk scoring
 */

const MAX_CONCURRENT_JOBS = 6;
const IMBALANCE_THRESHOLD = 3;

export function analyzeWorkload(societyId, store) {
  const workers = store.find('workers', { societyId });
  const jobs = store.find('jobs', { societyId });

  const activeWorkers = workers.filter(w => w.isOnline);
  const overloaded = workers.filter(w => (w.activeJobsCount || 0) > 4);
  const underutilized = workers.filter(w => (w.activeJobsCount || 0) === 0 && w.isOnline);
  const balanced = workers.filter(w => {
    const count = w.activeJobsCount || 0;
    return count > 0 && count <= 4;
  });

  const avgWorkload = activeWorkers.length > 0
    ? activeWorkers.reduce((sum, w) => sum + (w.activeJobsCount || 0), 0) / activeWorkers.length
    : 0;

  const imbalanceScore = overloaded.length > 0 && underutilized.length > 0
    ? Math.min(100, Math.round(((overloaded.length * 2) / Math.max(1, activeWorkers.length)) * 100))
    : 0;

  const fatigueRisk = overloaded.map(w => ({
    workerId: w.id,
    workerName: w.name,
    activeJobs: w.activeJobsCount || 0,
    riskLevel: (w.activeJobsCount || 0) >= 6 ? 'Critical' : (w.activeJobsCount || 0) >= 5 ? 'High' : 'Medium',
    recommendation: (w.activeJobsCount || 0) >= 6
      ? 'Immediately redistribute jobs to prevent burnout'
      : 'Consider redistributing 1-2 jobs to underutilized workers'
  }));

  const redistributionPlan = [];
  if (overloaded.length > 0 && underutilized.length > 0) {
    overloaded.forEach(ow => {
      const excessJobs = (ow.activeJobsCount || 0) - 4;
      if (excessJobs > 0) {
        const pendingJobs = store.find('jobs', { workerId: ow.id, status: 'OFFERED' });
        pendingJobs.slice(0, excessJobs).forEach(job => {
          const bestTarget = underutilized
            .filter(uw => uw.primarySkill === job.serviceCategory || uw.serviceCategories?.includes(job.serviceCategory))
            .sort((a, b) => (a.activeJobsCount || 0) - (b.activeJobsCount || 0))[0];
          if (bestTarget) {
            redistributionPlan.push({
              jobId: job.id,
              jobCode: job.code,
              fromWorker: ow.name,
              fromWorkerId: ow.id,
              toWorker: bestTarget.name,
              toWorkerId: bestTarget.id,
              reason: `Reduce overload on ${ow.name} (${ow.activeJobsCount} jobs) → ${bestTarget.name} (${bestTarget.activeJobsCount || 0} jobs)`
            });
          }
        });
      }
    });
  }

  return {
    societyId,
    totalWorkers: workers.length,
    activeWorkers: activeWorkers.length,
    overloaded: overloaded.length,
    underutilized: underutilized.length,
    balanced: balanced.length,
    avgWorkload: Math.round(avgWorkload * 10) / 10,
    imbalanceScore,
    fatigueRisk,
    redistributionPlan,
    caps: { maxConcurrent: MAX_CONCURRENT_JOBS, workersAtCap: workers.filter(w => (w.activeJobsCount || 0) >= MAX_CONCURRENT_JOBS).length }
  };
}

export function autoRedistribute(store) {
  const societies = store.getCollection('societies');
  let totalRedistributed = 0;

  societies.forEach(society => {
    const analysis = analyzeWorkload(society.id, store);
    analysis.redistributionPlan.forEach(plan => {
      store.findByIdAndUpdate('jobs', plan.jobId, {
        workerId: plan.toWorkerId,
        workerName: plan.toWorker,
        redistributionReason: plan.reason,
        redistributedAt: new Date().toISOString()
      });

      const fromWorker = store.findById('workers', plan.fromWorkerId);
      if (fromWorker) {
        store.findByIdAndUpdate('workers', plan.fromWorkerId, {
          activeJobsCount: Math.max(0, (fromWorker.activeJobsCount || 1) - 1)
        });
      }
      const toWorker = store.findById('workers', plan.toWorkerId);
      if (toWorker) {
        store.findByIdAndUpdate('workers', plan.toWorkerId, {
          activeJobsCount: (toWorker.activeJobsCount || 0) + 1
        });
      }

      totalRedistributed++;
    });
  });

  return { totalRedistributed };
}

export function getWorkloadHeatmap(store) {
  const societies = store.getCollection('societies');
  return societies.map(s => {
    const analysis = analyzeWorkload(s.id, store);
    return {
      societyId: s.id,
      societyName: s.name,
      lat: s.centerLocation?.lat,
      lng: s.centerLocation?.lng,
      healthScore: Math.max(0, 100 - analysis.imbalanceScore),
      overloaded: analysis.overloaded,
      underutilized: analysis.underutilized,
      avgWorkload: analysis.avgWorkload,
      alertLevel: analysis.imbalanceScore > 60 ? 'Critical' : analysis.imbalanceScore > 30 ? 'Warning' : 'Healthy'
    };
  });
}
