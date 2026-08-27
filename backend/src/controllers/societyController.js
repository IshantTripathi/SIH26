import { store } from '../data/store.js';
import { VERIFICATION_STATUS, WORKLOAD_STATUS, ROLES } from '../config/constants.js';

export function getSocietyDashboard(req, res) {
  try {
    const societyId = req.params.id || req.user?.societyId || 'SOC-DEMO-001';

    if (req.user?.role === ROLES.SOCIETY_ADMIN && req.user.societyId && societyId !== req.user.societyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only access your own society.' });
    }

    const society = store.findById('societies', societyId);

    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    const workers = store.find('workers', { societyId });
    const jobs = store.find('jobs', { societyId });
    const complaints = store.find('complaints', { societyId });

    // Aggregate statistics
    const totalWorkers = workers.length;
    const activeWorkers = workers.filter(w => w.isOnline).length;
    const verifiedWorkers = workers.filter(w => w.verificationStatus === VERIFICATION_STATUS.VERIFIED).length;
    const pendingVerification = workers.filter(w => w.verificationStatus === VERIFICATION_STATUS.PENDING || w.verificationStatus === VERIFICATION_STATUS.UNDER_REVIEW).length;

    const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED' || j.status === 'ON_THE_WAY' || j.status === 'ARRIVED');
    const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);
    const totalCoopFundCollected = completedJobs.reduce((sum, j) => sum + (j.pricing?.coopContribution || 0), 0);
    const totalWelfareFundCollected = completedJobs.reduce((sum, j) => sum + (j.pricing?.welfareDeduction || 0), 0);

    // Workload Balance distribution
    const workloadBreakdown = {
      underutilized: workers.filter(w => (w.activeJobsCount || 0) === 0).length,
      balanced: workers.filter(w => (w.activeJobsCount || 0) > 0 && (w.activeJobsCount || 0) <= 4).length,
      highWorkload: workers.filter(w => (w.activeJobsCount || 0) > 4).length
    };

    return res.json({
      success: true,
      society,
      stats: {
        totalWorkers,
        activeWorkers,
        verifiedWorkers,
        pendingVerification,
        totalJobsCount: jobs.length,
        completedJobsCount: completedJobs.length,
        inProgressJobsCount: inProgressJobs.length,
        totalEarnings,
        totalCoopFundCollected,
        totalWelfareFundCollected,
        complaintsCount: complaints.length,
        workloadBreakdown
      },
      workersList: workers,
      recentJobs: jobs.slice(0, 10),
      complaints
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateWorkerVerification(req, res) {
  try {
    const { workerId } = req.params;
    const { verificationStatus, certCode, notes } = req.body;

    const worker = store.findById('workers', workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    if (req.user?.role === ROLES.SOCIETY_ADMIN && req.user.societyId && worker.societyId !== req.user.societyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot manage workers outside your society.' });
    }

    const updatedCerts = (worker.certifications || []).map(c => {
      if (!certCode || c.code === certCode) {
        return { ...c, verified: verificationStatus === VERIFICATION_STATUS.VERIFIED };
      }
      return c;
    });

    const updatedWorker = store.findByIdAndUpdate('workers', workerId, {
      verificationStatus,
      certifications: updatedCerts
    });

    store.logAudit({
      actorName: req.user?.name || 'Society Admin',
      actorRole: req.user?.role || 'society_admin',
      action: 'WORKER_VERIFICATION_MODIFIED',
      module: 'Society Admin',
      recordId: workerId,
      details: `Worker ${worker.name} status updated to: ${verificationStatus}. ${notes || ''}`
    });

    return res.json({
      success: true,
      message: `Worker verification status updated to ${verificationStatus}`,
      worker: updatedWorker
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateSocietyConfig(req, res) {
  try {
    const { id } = req.params;
    const { coopContributionPercent, welfareFundPercent, coverageRadiusKm } = req.body;

    if (req.user?.role === ROLES.SOCIETY_ADMIN && req.user.societyId && id !== req.user.societyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit parameters of another society.' });
    }

    const updated = store.findByIdAndUpdate('societies', id, {
      ...(coopContributionPercent !== undefined && { coopContributionPercent: Number(coopContributionPercent) }),
      ...(welfareFundPercent !== undefined && { welfareFundPercent: Number(welfareFundPercent) }),
      ...(coverageRadiusKm !== undefined && { coverageRadiusKm: Number(coverageRadiusKm) })
    });

    return res.json({
      success: true,
      message: 'Society parameters updated successfully.',
      society: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
