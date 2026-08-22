import { store } from '../data/store.js';
import { ROLES, WORKLOAD_STATUS } from '../config/constants.js';

export function getWorkerProfile(req, res) {
  try {
    const workerId = req.params.id || req.user.workerId;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker ID required.' });
    }

    const worker = store.findById('workers', workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const society = store.findById('societies', worker.societyId);
    const welfare = store.findById('welfareRecords', worker.welfareId);
    const jobs = store.find('jobs', { workerId });

    return res.json({
      success: true,
      worker,
      society,
      welfare,
      jobsCount: jobs.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateWorkerStatus(req, res) {
  try {
    const workerId = req.user.workerId;
    const { isOnline, serviceAreas } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker profile not linked.' });
    }

    const updates = {};
    if (typeof isOnline === 'boolean') updates.isOnline = isOnline;
    if (Array.isArray(serviceAreas)) updates.serviceAreas = serviceAreas;

    const updatedWorker = store.findByIdAndUpdate('workers', workerId, updates);

    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WORKER_DUTY_STATUS_UPDATED',
      module: 'Worker Operations',
      recordId: workerId,
      details: `Worker duty status changed to: ${isOnline ? 'Online' : 'Offline'}`
    });

    return res.json({
      success: true,
      message: `Status updated to ${isOnline ? 'Online' : 'Offline'}`,
      worker: updatedWorker
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getWorkerEarnings(req, res) {
  try {
    const workerId = req.user.workerId || req.params.id;
    const worker = store.findById('workers', workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const jobs = store.find('jobs', { workerId });
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');

    let grossTotal = 0;
    let coopDeductionTotal = 0;
    let welfareDeductionTotal = 0;
    let netTotal = 0;
    let paidTotal = 0;
    let pendingPayout = 0;

    completedJobs.forEach(job => {
      const p = job.pricing || {};
      grossTotal += p.grossAmount || 0;
      coopDeductionTotal += p.coopContribution || 0;
      welfareDeductionTotal += p.welfareDeduction || 0;
      netTotal += p.netWorkerEarnings || 0;

      if (job.paymentStatus === 'PAID') {
        paidTotal += p.netWorkerEarnings || 0;
      } else {
        pendingPayout += p.netWorkerEarnings || 0;
      }
    });

    return res.json({
      success: true,
      summary: {
        workerId: worker.id,
        workerName: worker.name,
        completedJobsCount: completedJobs.length,
        grossTotal: Math.round(grossTotal * 100) / 100,
        coopDeductionTotal: Math.round(coopDeductionTotal * 100) / 100,
        welfareDeductionTotal: Math.round(welfareDeductionTotal * 100) / 100,
        netTotal: Math.round(netTotal * 100) / 100,
        paidTotal: Math.round(paidTotal * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        currency: 'INR (₹)'
      },
      history: completedJobs.map(j => ({
        jobId: j.id,
        code: j.code,
        service: j.serviceCategory,
        date: j.completedAt || j.scheduledDate,
        gross: j.pricing?.grossAmount,
        coopFee: j.pricing?.coopContribution,
        welfareFee: j.pricing?.welfareDeduction,
        netPay: j.pricing?.netWorkerEarnings,
        paymentStatus: j.paymentStatus
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
