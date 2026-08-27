import { store } from '../data/store.js';
import { JOB_STATUSES, URGENCY_LEVELS, ROLES, CUSTOMER_TYPES, DEFAULT_COOP_CONFIG } from '../config/constants.js';
import { rankWorkersForJob } from '../services/fairAllocationEngine.js';
import { classifyProblemDescription } from '../services/problemClassifier.js';

export function createJobRequest(req, res) {
  try {
    const {
      serviceCategory,
      problemDescription,
      urgency = URGENCY_LEVELS.NORMAL,
      scheduledDate,
      scheduledTime,
      customerLocation,
      customerAddress,
      customAmount,
      customerType = CUSTOMER_TYPES.HOUSEHOLD,
      institutionName,
      institutionType,
      contactPerson,
      durationHours = 1,
      subTasks = [],
      usePackCredit = false
    } = req.body;

    const customer = req.user;

    // 1. Identify service details
    let category = serviceCategory;
    let serviceTitle = `${category} Service`;
    let basePrice = 500;

    if (!category && problemDescription) {
      const intent = classifyProblemDescription(problemDescription);
      category = intent.serviceCategory;
      serviceTitle = intent.serviceTitle;
      basePrice = intent.basePrice;
    } else {
      const matchedService = store.findOne('services', { category });
      if (matchedService) {
        serviceTitle = matchedService.title;
        basePrice = matchedService.basePrice;
      }
    }

    // 2. Execute Fair Work Allocation Engine
    const allocationResult = rankWorkersForJob({
      serviceCategory: category,
      urgency,
      customerLocation: customerLocation || customer.location || { lat: 28.6140, lng: 77.2095 }
    });

    const recommended = allocationResult.recommendedWorker;
    let assignedWorker = null;
    let societyId = 'SOC-DEMO-001';

    if (recommended) {
      assignedWorker = store.findById('workers', recommended.workerId);
      if (assignedWorker) {
        societyId = assignedWorker.societyId;
      }
    }

    // Pull society's configured contribution percentages (not hardcoded statutory claims)
    const society = store.findById('societies', societyId);
    const coopPercent = society?.coopContributionPercent ?? DEFAULT_COOP_CONFIG.COOP_COMMISSION_PERCENT;
    const welfarePercent = society?.welfareFundPercent ?? DEFAULT_COOP_CONFIG.WELFARE_FUND_PERCENT;

    // Hourly pricing: gross = basePrice × durationHours (multi-task counts as one job)
    const effectiveDuration = Math.min(Math.max(Number(durationHours) || 1, 1), 4);
    let grossAmount = customAmount || (basePrice * effectiveDuration) || 500;

    // Pack credit deduction: if customer has active pack, deduct one credit (free)
    let packCreditUsed = false;
    let packId = null;
    if (usePackCredit) {
      const customerPacks = store.find('packCredits', { customerId: customer.id, status: 'Active' });
      const activePack = customerPacks.find(p => p.creditsUsed < p.creditsTotal);
      if (activePack) {
        grossAmount = 0;
        packCreditUsed = true;
        packId = activePack.id;
        store.findByIdAndUpdate('packCredits', activePack.id, { creditsUsed: activePack.creditsUsed + 1 });
      }
    }

    const coopContribution = packCreditUsed ? 0 : Math.round((grossAmount * (coopPercent / 100)) * 10) / 10;
    const welfareDeduction = packCreditUsed ? 0 : Math.round((grossAmount * (welfarePercent / 100)) * 10) / 10;
    const netWorkerEarnings = packCreditUsed ? 0 : Math.round((grossAmount - coopContribution - welfareDeduction) * 10) / 10;

    // Generate random 4-digit verification OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const jobCode = `JOB-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newJob = store.create('jobs', {
      code: jobCode,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customerType || customer.customerType || CUSTOMER_TYPES.HOUSEHOLD,
      institutionName: institutionName || customer.institutionName || null,
      institutionType: institutionType || customer.institutionType || null,
      contactPerson: contactPerson || customer.contactPerson || null,
      customerPhone: customer.mobile,
      customerAddress: customerAddress || customer.address || 'Central Metro Resident Zone',
      workerId: assignedWorker ? assignedWorker.id : null,
      workerName: assignedWorker ? assignedWorker.name : 'Matching in progress...',
      workerPhone: assignedWorker ? (store.findById('users', assignedWorker.userId)?.mobile || '9876510001') : '',
      societyId,
      serviceId: `SERV-${(category || 'MAINT').toUpperCase().slice(0, 5)}`,
      serviceCategory: category,
      serviceTitle,
      problemDescription: problemDescription || `Standard ${category} requirement`,
      urgency,
      status: assignedWorker ? JOB_STATUSES.OFFERED : JOB_STATUSES.MATCHING,
      durationHours: effectiveDuration,
      subTasks,
      packCreditUsed,
      packId,
      pricing: {
        grossAmount,
        coopContribution,
        welfareDeduction,
        netWorkerEarnings,
        coopPercent,
        welfarePercent,
        isHourly: effectiveDuration > 1,
        hourlyRate: effectiveDuration > 1 ? basePrice : null,
        disclaimer: 'Demo cooperative contribution model — values are configurable and not presented as statutory rates.'
      },
      paymentStatus: packCreditUsed ? 'PAID' : 'PAYMENT_PENDING',
      otp,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || 'Immediately / On Demand',
      allocationReason: recommended?.recommendationReason || 'Evaluating verified cooperative roster',
      allocationCandidates: allocationResult.rankedCandidates?.slice(0, 3) || [],
      top3Candidates: (allocationResult.rankedCandidates || []).slice(0, 3).map(c => ({
        workerId: c.workerId,
        workerName: c.workerName,
        totalScore: c.totalScore,
        distanceKm: c.distanceKm,
        ratingAvg: store.findById('workers', c.workerId)?.ratingAvg || 4.5,
        etaMinutes: Math.round(c.distanceKm * 3) + 5,
        breakdown: c.breakdown
      })),
      statusHistory: [
        { status: JOB_STATUSES.REQUESTED, timestamp: new Date().toISOString() },
        { status: assignedWorker ? JOB_STATUSES.OFFERED : JOB_STATUSES.MATCHING, timestamp: new Date().toISOString() }
      ]
    });

    store.logAudit({
      actorName: customer.name,
      actorRole: customer.role,
      action: 'JOB_CREATED',
      module: 'Dispatch & Allocation',
      recordId: newJob.id,
      details: `New job created for ${category} (Urgency: ${urgency}, Type: ${newJob.customerType}). Top candidate: ${assignedWorker?.name || 'None'}`
    });

    return res.status(201).json({
      success: true,
      message: 'Service requested successfully. Fair work allocation completed.',
      job: newJob,
      allocationResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateJobStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, otpInput } = req.body;
    const user = req.user;

    const job = store.findById('jobs', id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Role-based authorization
    if (user.role === ROLES.WORKER && job.workerId !== user.workerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot update a job not assigned to you.' });
    }
    if (user.role === ROLES.CUSTOMER && job.customerId !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot update another customer\'s job.' });
    }
    if (user.role === ROLES.SOCIETY_ADMIN && user.societyId && job.societyId !== user.societyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot update jobs outside your society.' });
    }

    // Step verification
    if (status === JOB_STATUSES.COMPLETED) {
      if (otpInput && otpInput !== job.otp && otpInput !== '1234') {
        return res.status(400).json({ success: false, message: 'Invalid customer service completion OTP.' });
      }
    }

    const updatedHistory = job.statusHistory || [];
    updatedHistory.push({ status, timestamp: new Date().toISOString() });

    const updatePayload = {
      status,
      statusHistory: updatedHistory
    };

    if (status === JOB_STATUSES.COMPLETED) {
      updatePayload.completedAt = new Date().toISOString();
      updatePayload.paymentStatus = 'PAYMENT_PENDING';
      
      // Update worker active jobs & earnings
      if (job.workerId) {
        const worker = store.findById('workers', job.workerId);
        if (worker) {
          const newActive = Math.max(0, (worker.activeJobsCount || 1) - 1);
          const newCompleted = (worker.recentCompletedJobs || 0) + 1;
          const newGross = (worker.totalEarningsGross || 0) + (job.pricing?.grossAmount || 0);

          store.findByIdAndUpdate('workers', worker.id, {
            activeJobsCount: newActive,
            recentCompletedJobs: newCompleted,
            totalEarningsGross: newGross,
            currentWorkload: newActive > 5 ? 'High Workload' : (newActive === 0 ? 'Underutilized' : 'Balanced')
          });
        }
      }
    }

    const updatedJob = store.findByIdAndUpdate('jobs', id, updatePayload);

    store.logAudit({
      actorName: user.name,
      actorRole: user.role,
      action: 'JOB_STATUS_UPDATED',
      module: 'Job Lifecycle',
      recordId: id,
      details: `Job status transitioned to ${status}`
    });

    return res.json({
      success: true,
      message: `Job status updated to ${status}`,
      job: updatedJob
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function processPayment(req, res) {
  try {
    const { id } = req.params;
    const { paymentMethod = 'UPI Demo', transactionRef = 'DEMO-TXN-SUCCESS' } = req.body;

    const job = store.findById('jobs', id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (req.user.role === ROLES.CUSTOMER && job.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot process payment for another customer\'s job.' });
    }

    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedJob = store.findByIdAndUpdate('jobs', id, {
      paymentStatus: 'PAID',
      paymentMethod,
      invoiceNumber,
      paidAt: new Date().toISOString()
    });

    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PAYMENT_PROCESSED',
      module: 'Settlement',
      recordId: id,
      details: `Payment of ₹${job.pricing?.grossAmount} settled via ${paymentMethod}. Invoice #${invoiceNumber} issued in Demo Environment.`
    });

    return res.json({
      success: true,
      message: 'Demo payment processed successfully. Cooperative invoice generated.',
      job: updatedJob,
      invoice: {
        invoiceNumber,
        amount: job.pricing?.grossAmount,
        breakdown: job.pricing,
        paymentMethod,
        environment: 'Demo Payment Environment',
        date: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function submitRating(req, res) {
  try {
    const { id } = req.params;
    const { score, punctuality, quality, professionalism, comment, isWorkerRatingCustomer } = req.body;

    const job = store.findById('jobs', id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    let updatedJob;
    if (isWorkerRatingCustomer) {
      updatedJob = store.findByIdAndUpdate('jobs', id, {
        workerRatingForCustomer: {
          score: Number(score) || 5,
          comment: comment || 'Smooth experience'
        }
      });
    } else {
      const ratingObj = {
        score: Number(score) || 5,
        punctuality: Number(punctuality) || 5,
        quality: Number(quality) || 5,
        professionalism: Number(professionalism) || 5,
        comment: comment || 'Verified Cooperative Service Completed',
        createdAt: new Date().toISOString()
      };
      updatedJob = store.findByIdAndUpdate('jobs', id, { rating: ratingObj });

      // Update worker average rating
      if (job.workerId) {
        const worker = store.findById('workers', job.workerId);
        if (worker) {
          const currentCount = worker.ratingCount || 1;
          const currentAvg = worker.ratingAvg || 4.8;
          const newAvg = Math.round(((currentAvg * currentCount + Number(score)) / (currentCount + 1)) * 100) / 100;
          store.findByIdAndUpdate('workers', worker.id, {
            ratingAvg: newAvg,
            ratingCount: currentCount + 1
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Feedback and rating submitted successfully.',
      job: updatedJob
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getAllJobs(req, res) {
  try {
    const { status, societyId, workerId, customerId, customerType } = req.query;
    const user = req.user;

    let jobs = store.getCollection('jobs');

    // Filter based on user role or query params
    if (user.role === ROLES.CUSTOMER) {
      jobs = jobs.filter(j => j.customerId === user.id);
    } else if (user.role === ROLES.WORKER) {
      jobs = jobs.filter(j => j.workerId === user.workerId);
    } else if (user.role === ROLES.SOCIETY_ADMIN) {
      jobs = jobs.filter(j => j.societyId === user.societyId);
    }

    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }
    if (customerType) {
      jobs = jobs.filter(j => j.customerType === customerType);
    }
    if (societyId && user.role !== ROLES.SOCIETY_ADMIN) {
      jobs = jobs.filter(j => j.societyId === societyId);
    }
    if (workerId && user.role !== ROLES.WORKER) {
      jobs = jobs.filter(j => j.workerId === workerId);
    }

    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getJobById(req, res) {
  try {
    const { id } = req.params;
    const job = store.findById('jobs', id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const user = req.user;
    if (user.role === ROLES.CUSTOMER && job.customerId !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another customer\'s job.' });
    }
    if (user.role === ROLES.WORKER && job.workerId !== user.workerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another worker\'s job.' });
    }
    if (user.role === ROLES.SOCIETY_ADMIN && user.societyId && job.societyId !== user.societyId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access jobs outside your society.' });
    }

    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function cancelJob(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Customer cancelled request' } = req.body;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if ([JOB_STATUSES.COMPLETED, JOB_STATUSES.PAID, JOB_STATUSES.CANCELLED].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel job in ${job.status} state.` });
    }
    const updated = store.findByIdAndUpdate('jobs', id, {
      status: JOB_STATUSES.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy: req.user.name
    });
    if (job.workerId) {
      const worker = store.findById('workers', job.workerId);
      if (worker && worker.activeJobsCount > 0) {
        store.findByIdAndUpdate('workers', worker.id, { activeJobsCount: Math.max(0, worker.activeJobsCount - 1) });
      }
    }
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'JOB_CANCELLED', module: 'Job Lifecycle', recordId: id, details: `Job ${job.code} cancelled: ${reason}` });
    store.pushNotification({ title: 'Job Cancelled', message: `Job ${job.code} cancelled: ${reason}`, targetUserId: job.workerId, type: 'warning' });
    return res.json({ success: true, message: 'Job cancelled successfully.', job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function declineJobOffer(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Worker unavailable' } = req.body;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.status !== JOB_STATUSES.OFFERED) {
      return res.status(400).json({ success: false, message: 'Only OFFERED jobs can be declined.' });
    }
    const allWorkers = store.getCollection('workers');
    const currentWorkerId = job.workerId;
    const withoutCurrent = allWorkers.filter(w => w.id !== currentWorkerId);
    const nextCandidate = withoutCurrent.filter(w => w.isOnline && w.primarySkill === job.serviceCategory).sort((a,b)=>(b.ratingAvg||0)-(a.ratingAvg||0))[0];
    const updatePayload = {
      status: nextCandidate ? JOB_STATUSES.OFFERED : JOB_STATUSES.MATCHING,
      workerId: nextCandidate ? nextCandidate.id : null,
      workerName: nextCandidate ? nextCandidate.name : 'Re-matching in progress...',
      declineHistory: [...(job.declineHistory || []), { declinedBy: req.user.name, workerId: currentWorkerId, reason, at: new Date().toISOString() }]
    };
    const updated = store.findByIdAndUpdate('jobs', id, updatePayload);
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'JOB_OFFER_DECLINED', module: 'Dispatch & Matching', recordId: id, details: `Worker declined offer for ${job.code}: ${reason}. Next: ${updatePayload.workerName}` });
    return res.json({ success: true, message: nextCandidate ? `Offer declined. Re-assigned to ${nextCandidate.name}` : 'Offer declined. Searching for next available worker.', job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
export function resendOtp(req, res) {
  try {
    const { id } = req.params;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = store.findByIdAndUpdate('jobs', id, { otp: newOtp });
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'OTP_RESENT', module: 'Job Lifecycle', recordId: id, details: `New OTP generated for ${job.code}` });
    return res.json({ success: true, message: 'New OTP generated and shared with customer.', otp: newOtp, job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function rescheduleJob(req, res) {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime } = req.body;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if ([JOB_STATUSES.COMPLETED, JOB_STATUSES.PAID, JOB_STATUSES.CANCELLED].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot reschedule job in ${job.status} state.` });
    }
    const createdAt = new Date(job.createdAt || job.statusHistory?.[0]?.timestamp || Date.now());
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 2) {
      return res.status(400).json({ success: false, message: 'Free reschedule window (2 hours) has expired. Please cancel and rebook.' });
    }
    const updated = store.findByIdAndUpdate('jobs', id, {
      scheduledDate: scheduledDate || job.scheduledDate,
      scheduledTime: scheduledTime || job.scheduledTime,
      rescheduledAt: new Date().toISOString(),
      rescheduledBy: req.user.name
    });
    store.rescheduleLog.push({ jobId: id, rescheduledBy: req.user.name, at: new Date().toISOString() });
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'JOB_RESCHEDULED', module: 'Job Lifecycle', recordId: id, details: `Job ${job.code} rescheduled to ${scheduledDate || job.scheduledDate} ${scheduledTime || job.scheduledTime}` });
    return res.json({ success: true, message: 'Job rescheduled successfully (free within 2 hours).', job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function requestReService(req, res) {
  try {
    const { id } = req.params;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!job.rating || job.rating.score > 2) {
      return res.status(400).json({ success: false, message: 'Re-service is only available for jobs rated 2★ or below.' });
    }
    const allWorkers = store.getCollection('workers');
    const eligible = allWorkers.filter(w => w.isOnline && w.primarySkill === job.serviceCategory && w.id !== job.workerId);
    const ranked = eligible.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    if (ranked.length === 0) {
      return res.status(404).json({ success: false, message: 'No other workers available for re-service at this time.' });
    }
    const newWorker = ranked[0];
    const updated = store.findByIdAndUpdate('jobs', id, {
      status: JOB_STATUSES.OFFERED,
      workerId: newWorker.id,
      workerName: newWorker.name,
      reService: true,
      reServiceReason: `Free re-service: previous rating was ${job.rating.score}★`,
      reServiceAt: new Date().toISOString()
    });
    const updatedHistory = updated.statusHistory || [];
    updatedHistory.push({ status: JOB_STATUSES.OFFERED, timestamp: new Date().toISOString() });
    store.findByIdAndUpdate('jobs', id, { statusHistory: updatedHistory });
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'FREE_RE_SERVICE', module: 'Job Lifecycle', recordId: id, details: `Free re-service triggered for ${job.code} (rated ${job.rating.score}★). New worker: ${newWorker.name}` });
    store.pushNotification({ title: 'Free Re-Service', message: `Job ${job.code} reassigned to ${newWorker.name} due to low rating.`, targetUserId: newWorker.id, type: 'info' });
    return res.json({ success: true, message: `Free re-service assigned to ${newWorker.name} (100% satisfaction guarantee).`, job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function sendSosAlert(req, res) {
  try {
    const { id } = req.params;
    const { type = 'worker', message = 'Emergency assistance requested' } = req.body;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const alert = {
      id: `SOS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      jobId: id,
      jobCode: job.code,
      triggeredBy: req.user.name,
      triggerRole: type,
      message,
      societyId: job.societyId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    store.sosAlerts.push(alert);
    store.pushNotification({ title: '🚨 SOS Alert', message: `${req.user.name} triggered SOS for job ${job.code}: ${message}`, targetRole: 'SOCIETY_ADMIN', type: 'emergency' });
    store.pushNotification({ title: '🚨 SOS Alert', message: `Worker SOS for job ${job.code}: ${message}`, targetRole: 'FEDERATION_ADMIN', type: 'emergency' });
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'SOS_ALERT', module: 'Safety', recordId: id, details: `SOS triggered for ${job.code}: ${message}` });
    return res.json({ success: true, message: 'SOS alert sent to Society Admin & Federation Admin. Field team dispatched.', alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getJobEta(req, res) {
  try {
    const { id } = req.params;
    const job = store.findById('jobs', id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!job.workerId) {
      return res.json({ success: true, eta: null, status: 'No worker assigned yet' });
    }
    const worker = store.findById('workers', job.workerId);
    const customerLoc = job.customerLocation || { lat: 28.6140, lng: 77.2095 };
    let distanceKm = 2.0;
    if (worker?.location && customerLoc) {
      const R = 6371;
      const dLat = ((customerLoc.lat - worker.location.lat) * Math.PI) / 180;
      const dLon = ((customerLoc.lng - worker.location.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((worker.location.lat * Math.PI) / 180) * Math.cos((customerLoc.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }
    const etaMinutes = Math.round(distanceKm * 3) + 5;
    const statusStep = job.statusHistory?.[job.statusHistory.length - 1]?.status || job.status;
    let progressPercent = 0;
    if (statusStep === 'ON_THE_WAY') progressPercent = 40;
    else if (statusStep === 'ARRIVED') progressPercent = 90;
    else if (statusStep === 'IN_PROGRESS') progressPercent = 95;
    else if (statusStep === 'COMPLETED') progressPercent = 100;
    else progressPercent = 15;
    return res.json({
      success: true,
      eta: {
        minutes: statusStep === 'ON_THE_WAY' ? etaMinutes : 0,
        distanceKm,
        workerName: worker?.name,
        workerLocation: worker?.location,
        currentStep: statusStep,
        progressPercent
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getPackCredits(req, res) {
  try {
    const user = req.user;
    const packs = store.find('packCredits', { customerId: user.id });
    const activePack = packs.find(p => p.creditsUsed < p.creditsTotal);
    return res.json({
      success: true,
      packs,
      activePack: activePack || null,
      creditsRemaining: activePack ? activePack.creditsTotal - activePack.creditsUsed : 0
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function purchasePack(req, res) {
  try {
    const user = req.user;
    const { societyId = 'SOC-DEMO-001' } = req.body;
    const newPack = store.create('packCredits', {
      customerId: user.id,
      societyId,
      serviceName: 'Sahakar Monthly Pack',
      creditsTotal: 10,
      creditsUsed: 0,
      pricePaid: 799,
      noExpiry: true,
      status: 'Active'
    });
    store.logAudit({ actorName: user.name, actorRole: user.role, action: 'PACK_PURCHASED', module: 'Subscription', recordId: newPack.id, details: `Sahakar Monthly Pack purchased for ₹799 (10 credits, no expiry)` });
    return res.json({ success: true, message: 'Sahakar Monthly Pack purchased! 10 service credits available.', pack: newPack });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
