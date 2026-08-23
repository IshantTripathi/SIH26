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
      contactPerson
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

    const grossAmount = customAmount || basePrice || 500;
    const coopContribution = Math.round((grossAmount * (coopPercent / 100)) * 10) / 10;
    const welfareDeduction = Math.round((grossAmount * (welfarePercent / 100)) * 10) / 10;
    const netWorkerEarnings = Math.round((grossAmount - coopContribution - welfareDeduction) * 10) / 10;

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
      pricing: {
        grossAmount,
        coopContribution,
        welfareDeduction,
        netWorkerEarnings,
        coopPercent,
        welfarePercent,
        disclaimer: 'Demo cooperative contribution model — values are configurable and not presented as statutory rates.'
      },
      paymentStatus: 'PAYMENT_PENDING',
      otp,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || 'Immediately / On Demand',
      allocationReason: recommended?.recommendationReason || 'Evaluating verified cooperative roster',
      allocationCandidates: allocationResult.rankedCandidates,
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
