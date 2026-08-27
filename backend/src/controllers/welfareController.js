import { store } from '../data/store.js';
import { ROLES } from '../config/constants.js';

export function getWelfareRecords(req, res) {
  try {
    const { workerId, societyId } = req.query;
    let records = store.getCollection('welfareRecords');

    if (workerId) {
      records = records.filter(r => r.workerId === workerId);
    }
    if (societyId) {
      records = records.filter(r => r.societyId === societyId);
    }

    return res.json({ success: true, count: records.length, welfareRecords: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getWelfareByWorkerId(req, res) {
  try {
    const workerId = req.params.workerId || req.user?.workerId;

    if (req.user?.role === ROLES.WORKER && req.params.workerId && req.params.workerId !== req.user.workerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another worker\'s welfare records.' });
    }

    const record = store.findOne('welfareRecords', { workerId });

    if (!record) {
      // Return default eligible template for demo
      const fallback = {
        id: `WELFARE-DEMO-${Date.now().toString().slice(-3)}`,
        workerId,
        welfareSchemeName: 'NCCT Labour Cooperative Welfare Program (Demo)',
        insurancePolicyNumber: `INSURANCE-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        insuranceStatus: 'Active',
        coverageAmount: 200000,
        accidentalCoverage: 300000,
        benefits: [
          'Annual Health Screening Support',
          'Safety Gear & Protective Kit Allowance',
          'Cooperative Emergency Distress Fund Coverage'
        ],
        totalContributionsContributed: 250,
        claimsProcessedCount: 0,
        eligibilityStatus: 'Eligible & Enrolled',
        status: 'Active (Demo Record)'
      };
      return res.json({ success: true, welfareRecord: fallback });
    }

    return res.json({ success: true, welfareRecord: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function submitWelfareClaim(req, res) {
  try {
    const targetWorkerId = req.user?.role === ROLES.WORKER ? req.user.workerId : (req.body.workerId || req.user?.workerId);
    const { claimPurpose, requestedAmount, claimDetails } = req.body;
    const worker = store.findById('workers', targetWorkerId);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const claimRecord = {
      id: `CLAIM-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      workerId: worker.id,
      workerName: worker.name,
      societyId: worker.societyId,
      claimPurpose: claimPurpose || 'Safety & Tool Kit Grant',
      requestedAmount: requestedAmount || 2500,
      claimDetails: claimDetails || 'Subsidized cooperative equipment claim',
      status: 'Under Review',
      submittedAt: new Date().toISOString()
    };

    store.create('welfareClaims', claimRecord);

    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WELFARE_CLAIM_SUBMITTED',
      module: 'Worker Welfare',
      recordId: claimRecord.id,
      details: `Claim for ₹${claimRecord.requestedAmount} submitted by ${worker.name}`
    });
    store.pushNotification({
      title: 'New Welfare Claim Filed',
      message: `${worker.name} requested ₹${claimRecord.requestedAmount} for ${claimRecord.claimPurpose}`,
      targetRole: 'society_admin',
      type: 'welfare'
    });

    return res.status(201).json({
      success: true,
      message: 'Welfare benefit claim submitted to Cooperative Society Board for approval.',
      claim: claimRecord
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getAllWelfareClaims(req, res) {
  try {
    const { societyId, workerId, status } = req.query;
    let claims = store.getCollection('welfareClaims');
    if (societyId) claims = claims.filter(c => c.societyId === societyId);
    if (workerId) claims = claims.filter(c => c.workerId === workerId);
    if (status) claims = claims.filter(c => c.status === status);
    return res.json({ success: true, count: claims.length, claims });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateWelfareClaimStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNotes, approvedAmount } = req.body;
    const claim = store.findById('welfareClaims', id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    const allowed = ['Approved', 'Rejected', 'Under Review', 'Disbursed'];
    const nextStatus = allowed.includes(status) ? status : 'Under Review';

    const updated = store.findByIdAndUpdate('welfareClaims', id, {
      status: nextStatus,
      reviewNotes: reviewNotes || '',
      approvedAmount: approvedAmount !== undefined ? Number(approvedAmount) : claim.requestedAmount,
      reviewedBy: req.user.name,
      reviewedAt: new Date().toISOString()
    });

    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WELFARE_CLAIM_REVIEWED',
      module: 'Worker Welfare',
      recordId: id,
      details: `Claim ${claim.id} marked ${nextStatus} by ${req.user.name}`
    });
    store.pushNotification({
      title: `Welfare Claim ${nextStatus}`,
      message: `Your claim for ${claim.claimPurpose} is now ${nextStatus}`,
      targetUserId: claim.workerId,
      type: nextStatus === 'Approved' ? 'success' : 'info'
    });

    return res.json({ success: true, message: `Claim ${nextStatus}`, claim: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
