import { store } from '../data/store.js';

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
    const workerId = req.params.workerId || req.user.workerId;
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
        status: 'Active'
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
    const { workerId, claimPurpose, requestedAmount, claimDetails } = req.body;
    const worker = store.findById('workers', workerId || req.user.workerId);

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

    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WELFARE_CLAIM_SUBMITTED',
      module: 'Worker Welfare',
      recordId: claimRecord.id,
      details: `Claim for ₹${claimRecord.requestedAmount} submitted by ${worker.name}`
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
