import { store } from '../data/store.js';
import { ROLES, WORKLOAD_STATUS } from '../config/constants.js';

export function updateWorkerLocation(req, res) {
  try {
    const workerId = req.user.workerId || req.user.id;
    const { lat, lng, jobId } = req.body;

    if (!workerId || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'workerId, lat, and lng are required.' });
    }

    store.workerLocations[workerId] = {
      lat: Number(lat),
      lng: Number(lng),
      jobId: jobId || null,
      updatedAt: new Date().toISOString()
    };

    store.findByIdAndUpdate('workers', workerId, {
      location: { lat: Number(lat), lng: Number(lng), area: store.findById('workers', workerId)?.location?.area || '' }
    });

    return res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getWorkerLocation(req, res) {
  try {
    const { workerId } = req.params;
    const loc = store.workerLocations[workerId];
    if (!loc) {
      const worker = store.findById('workers', workerId);
      if (worker?.location) {
        return res.json({ success: true, location: worker.location, source: 'registered' });
      }
      return res.status(404).json({ success: false, message: 'No location data for this worker.' });
    }
    return res.json({ success: true, location: loc, source: 'live' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getJobWorkerLocation(req, res) {
  try {
    const { id: jobId } = req.params;
    const job = store.findById('jobs', jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!job.workerId) return res.json({ success: true, location: null, message: 'No worker assigned.' });

    const loc = store.workerLocations[job.workerId];
    if (loc) {
      return res.json({ success: true, location: loc, source: 'live', workerId: job.workerId });
    }
    const worker = store.findById('workers', job.workerId);
    if (worker?.location) {
      return res.json({ success: true, location: worker.location, source: 'registered', workerId: job.workerId });
    }
    return res.json({ success: true, location: null, message: 'Worker location unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

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
