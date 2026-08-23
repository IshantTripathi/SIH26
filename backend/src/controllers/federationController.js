import { store } from '../data/store.js';

export function getFederationDashboard(req, res) {
  try {
    const federationId = req.params.id || req.user.federationId || 'FED-DEMO-001';
    const federation = store.findById('federations', federationId);

    if (!federation) {
      return res.status(404).json({ success: false, message: 'Federation not found.' });
    }

    const societies = store.find('societies', { federationId });
    const allWorkers = store.getCollection('workers');
    const allJobs = store.getCollection('jobs');
    const allComplaints = store.getCollection('complaints');
    const demandData = store.getCollection('demandData');

    // Cross-society aggregation
    const totalSocieties = societies.length;
    const totalWorkers = allWorkers.length;
    const onlineWorkers = allWorkers.filter(w => w.isOnline).length;
    const verifiedWorkers = allWorkers.filter(w => w.verificationStatus === 'Verified').length;

    const completedJobs = allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    const totalGrossEarnings = completedJobs.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);
    const totalWelfareFundAccumulated = completedJobs.reduce((sum, j) => sum + (j.pricing?.welfareDeduction || 0), 0);

    const avgRating = allWorkers.reduce((sum, w) => sum + (w.ratingAvg || 4.5), 0) / (allWorkers.length || 1);

    // Society comparison table
    const societySummaries = societies.map(soc => {
      const socWorkers = allWorkers.filter(w => w.societyId === soc.id);
      const socJobs = allJobs.filter(j => j.societyId === soc.id);
      const socCompleted = socJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
      const socEarnings = socCompleted.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);

      return {
        id: soc.id,
        name: soc.name,
        district: soc.district,
        workersCount: socWorkers.length,
        onlineCount: socWorkers.filter(w => w.isOnline).length,
        jobsCount: socJobs.length,
        completedCount: socCompleted.length,
        grossEarnings: socEarnings,
        underutilizedCount: socWorkers.filter(w => (w.activeJobsCount || 0) === 0).length,
        overloadedCount: socWorkers.filter(w => (w.activeJobsCount || 0) > 4).length
      };
    });

    // Trade-wise distribution
    const tradeDistribution = {};
    allWorkers.forEach(w => {
      const skill = w.primarySkill || 'Other';
      tradeDistribution[skill] = (tradeDistribution[skill] || 0) + 1;
    });

    return res.json({
      success: true,
      federation,
      macroMetrics: {
        totalSocieties,
        totalWorkers,
        onlineWorkers,
        verifiedWorkers,
        totalJobs: allJobs.length,
        completedJobs: completedJobs.length,
        totalGrossEarnings,
        totalWelfareFundAccumulated,
        averageWorkerRating: Math.round(avgRating * 100) / 100,
        underutilizedTotal: allWorkers.filter(w => (w.activeJobsCount || 0) === 0).length,
        highWorkloadTotal: allWorkers.filter(w => (w.activeJobsCount || 0) > 4).length
      },
      societySummaries,
      tradeDistribution,
      demandHighlights: demandData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function mobilizeWorkforce(req, res) {
  try {
    const { fromDistrict, toDistrict, serviceCategory = 'Plumbing', count = 4 } = req.body;
    if (!fromDistrict || !toDistrict) {
      return res.status(400).json({ success: false, message: 'fromDistrict and toDistrict are required.' });
    }
    const num = Math.min(10, Math.max(1, Number(count) || 4));
    // Simulate mobilization by logging audit and adjusting demandData shortage
    const demandList = store.getCollection('demandData');
    const target = demandList.find(d => d.district === toDistrict && d.serviceCategory === serviceCategory);
    if (target) {
      target.activeWorkersAvailable = (target.activeWorkersAvailable || 0) + num;
      target.potentialShortage = Math.max(0, (target.predictedDemand || 0) - target.activeWorkersAvailable);
      if (target.potentialShortage === 0) target.recommendation = 'Workforce deficit resolved after mobilization. Monitor for next shift.';
      else target.recommendation = `Partial mobilization: moved ${num} workers; remaining shortage ${target.potentialShortage}.`;
    }
    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WORKFORCE_MOBILIZED',
      module: 'Federation Governance',
      recordId: `${fromDistrict}->${toDistrict}`,
      details: `Mobilized ${num} certified ${serviceCategory} workers from ${fromDistrict} to ${toDistrict} for demand surge.`
    });
    store.pushNotification({
      title: 'Workforce Mobilization Executed',
      message: `${num} ${serviceCategory} workers mobilized from ${fromDistrict} to ${toDistrict}`,
      targetRole: 'society_admin',
      type: 'success'
    });
    return res.json({ success: true, message: `Successfully mobilized ${num} workers from ${fromDistrict} to ${toDistrict}`, mobilizedCount: num, updatedDemand: target || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getNotifications(req, res) {
  try {
    const { limit = 20 } = req.query;
    const user = req.user;
    let notes = store.getCollection('notifications') || [];
    // filter to relevant: global audit + targeted
    if (user.role === 'worker') {
      notes = notes.filter(n => !n.targetRole || n.targetRole === 'worker' || n.targetUserId === user.workerId || n.targetUserId === user.id || n.action?.includes('JOB'));
    }
    return res.json({ success: true, count: notes.length, notifications: notes.slice(0, Number(limit)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
