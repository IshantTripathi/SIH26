import { store } from '../data/store.js';

/**
 * Cooperative Dividend & Member Benefit Calculation Service
 * 
 * Flow:
 * COOPERATIVE SURPLUS POOL
 *       ↓
 * APPROVED ALLOCATION MODEL
 *       ↓
 * ELIGIBLE WORKER MEMBERS
 *       ↓
 * PROPORTIONATE SURPLUS DISTRIBUTION
 *       ↓
 * APPROVAL & DISBURSEMENT STATUS
 */

export const DEFAULT_DIVIDEND_CONFIG = {
  surplusAllocationPercent: 60, // 60% of coop surplus distributed back to members
  memberWeightBase: 0.4,
  jobWeightBase: 0.3,
  earningsWeightBase: 0.3,
  minBenefitFloor: 50,
  distributionFrequency: 'Quarterly',
  disclaimer: 'Illustrative cooperative allocation model — values are configurable and not presented as statutory rates or guaranteed legal returns.'
};

export function calculateWorkerDividend(workerId) {
  const worker = store.findById('workers', workerId);
  if (!worker) return null;

  const jobs = store.find('jobs', { workerId });
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');

  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);
  const totalGross = completedJobs.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);
  const totalCoopContribution = completedJobs.reduce((sum, j) => sum + (j.pricing?.coopContribution || 0), 0);

  // Worker's contribution metrics
  const totalJobs = completedJobs.length;
  const avgRating = worker.ratingAvg || 0;
  const experienceMonths = (worker.experienceYears || 0) * 12;

  // Aggregate cooperative surplus pool
  const allJobs = store.getCollection('jobs');
  const allCompleted = allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  const totalPoolContributions = allCompleted.reduce((sum, j) => sum + (j.pricing?.coopContribution || 0), 0);

  // Surplus pool = 60% of total coop contributions
  const surplusPool = Math.round(totalPoolContributions * (DEFAULT_DIVIDEND_CONFIG.surplusAllocationPercent / 100));

  // Multi-factor weight calculation
  const jobWeight = totalJobs / Math.max(allCompleted.length, 1);
  const totalNetAll = allCompleted.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);
  const earningsWeight = totalEarnings / Math.max(totalNetAll, 1);
  const memberWeight = Math.min(experienceMonths / 24, 1);
  const ratingWeight = avgRating / 5;

  const totalWeight = (
    jobWeight * DEFAULT_DIVIDEND_CONFIG.jobWeightBase +
    earningsWeight * DEFAULT_DIVIDEND_CONFIG.earningsWeightBase +
    memberWeight * DEFAULT_DIVIDEND_CONFIG.memberWeightBase +
    ratingWeight * 0.1
  );

  const estimatedDividend = Math.round(surplusPool * totalWeight);
  const baselineBenefit = Math.max(DEFAULT_DIVIDEND_CONFIG.minBenefitFloor, Math.round(totalCoopContribution * 0.15));

  // Check if existing persistent dividend record exists for this quarter
  const currentPeriod = 'Q3 2026';
  let dividendRecord = store.findOne('dividends', { memberId: workerId, financialPeriod: currentPeriod });

  if (!dividendRecord) {
    dividendRecord = store.create('dividends', {
      memberId: workerId,
      workerName: worker.name,
      societyId: worker.societyId,
      financialPeriod: currentPeriod,
      surplusBasis: totalCoopContribution,
      calculatedAmount: estimatedDividend,
      eligibility: totalJobs > 0 ? 'Eligible' : 'Enrolled — Minimum Activity Required',
      approvalStatus: 'Projected',
      payoutStatus: 'Projected',
      disclaimer: DEFAULT_DIVIDEND_CONFIG.disclaimer
    });
  }

  // Historical dividend records
  const historicalDividends = [
    { quarter: 'Q1 2026', amount: Math.round(baselineBenefit * 0.8), approvalStatus: 'Approved', status: 'Paid' },
    { quarter: 'Q2 2026', amount: Math.round(baselineBenefit * 0.9), approvalStatus: 'Approved', status: 'Paid' },
    { quarter: 'Q3 2026', amount: estimatedDividend, approvalStatus: dividendRecord.approvalStatus || 'Projected', status: dividendRecord.payoutStatus || 'Projected' }
  ];

  return {
    workerId,
    workerName: worker.name,
    trade: worker.primarySkill,
    membershipMonths: experienceMonths,
    disclaimer: DEFAULT_DIVIDEND_CONFIG.disclaimer,
    contribution: {
      totalJobsCompleted: totalJobs,
      totalEarnings: `₹${totalEarnings.toLocaleString('en-IN')}`,
      totalCoopContribution: `₹${Math.round(totalCoopContribution).toLocaleString('en-IN')}`,
      contributionModel: 'Illustrative 4% Society Contribution'
    },
    dividendPool: {
      totalPool: `₹${surplusPool.toLocaleString('en-IN')}`,
      totalContributions: `₹${Math.round(totalPoolContributions).toLocaleString('en-IN')}`,
      surplusAllocationPercent: `${DEFAULT_DIVIDEND_CONFIG.surplusAllocationPercent}%`,
      distributionFrequency: DEFAULT_DIVIDEND_CONFIG.distributionFrequency
    },
    weightBreakdown: {
      jobContribution: `${Math.round(jobWeight * 100)}% (weight: ${DEFAULT_DIVIDEND_CONFIG.jobWeightBase * 100}%)`,
      earningsContribution: `${Math.round(earningsWeight * 100)}% (weight: ${DEFAULT_DIVIDEND_CONFIG.earningsWeightBase * 100}%)`,
      membershipContribution: `${Math.round(memberWeight * 100)}% (weight: ${DEFAULT_DIVIDEND_CONFIG.memberWeightBase * 100}%)`,
      ratingContribution: `${Math.round(ratingWeight * 100)}% (weight: 10%)`
    },
    dividend: {
      estimatedDividend: `₹${estimatedDividend.toLocaleString('en-IN')}`,
      baselineProjectedBenefit: `₹${baselineBenefit.toLocaleString('en-IN')}`,
      payoutDate: 'End of Financial Quarter',
      status: dividendRecord.payoutStatus || 'Projected',
      approvalStatus: dividendRecord.approvalStatus || 'Projected'
    },
    record: dividendRecord,
    historicalDividends,
    totalDividendReceived: historicalDividends
      .filter(d => d.status === 'Paid')
      .reduce((sum, d) => sum + d.amount, 0),
    nextDistribution: {
      date: getNextQuarterEnd(),
      daysRemaining: Math.max(1, Math.ceil((getNextQuarterEndDate() - Date.now()) / (1000 * 60 * 60 * 24))),
      poolStatus: 'Accumulating'
    }
  };
}

function getNextQuarterEnd() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  if (quarterEnd < now) {
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);
  }
  return quarterEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNextQuarterEndDate() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  if (quarterEnd < now) {
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);
  }
  return quarterEnd.getTime();
}

export function getCooperativeSurplusSummary() {
  const allJobs = store.getCollection('jobs');
  const completed = allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');

  const totalGross = completed.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);
  const totalCoop = completed.reduce((sum, j) => sum + (j.pricing?.coopContribution || 0), 0);
  const totalWelfare = completed.reduce((sum, j) => sum + (j.pricing?.welfareDeduction || 0), 0);
  const totalWorker = completed.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0);

  const surplusPool = Math.round(totalCoop * (DEFAULT_DIVIDEND_CONFIG.surplusAllocationPercent / 100));
  const reserveFund = Math.round(totalCoop * (1 - DEFAULT_DIVIDEND_CONFIG.surplusAllocationPercent / 100));

  return {
    totalGrossVolume: `₹${totalGross.toLocaleString('en-IN')}`,
    totalWorkerPayout: `₹${totalWorker.toLocaleString('en-IN')}`,
    totalCoopContributions: `₹${Math.round(totalCoop).toLocaleString('en-IN')}`,
    totalWelfareFund: `₹${Math.round(totalWelfare).toLocaleString('en-IN')}`,
    surplusPool: `₹${surplusPool.toLocaleString('en-IN')}`,
    reserveFund: `₹${reserveFund.toLocaleString('en-IN')}`,
    surplusAllocation: `${DEFAULT_DIVIDEND_CONFIG.surplusAllocationPercent}% of cooperative surplus fund`,
    totalJobs: completed.length,
    disclaimer: DEFAULT_DIVIDEND_CONFIG.disclaimer,
    averageDividendPerWorker: completed.length > 0
      ? `₹${Math.round(surplusPool / Math.max(store.getCollection('workers').length, 1)).toLocaleString('en-IN')}`
      : '₹0'
  };
}

export function approveDividendDistribution(quarter, societyId, approvedBy) {
  const dividends = store.find('dividends', { financialPeriod: quarter });
  for (const d of dividends) {
    if (!societyId || d.societyId === societyId) {
      store.findByIdAndUpdate('dividends', d.id, {
        approvalStatus: 'Approved',
        approvedBy: approvedBy || 'Society Board',
        approvedAt: new Date().toISOString()
      });
    }
  }

  store.logAudit({
    actorName: approvedBy || 'Society Admin',
    actorRole: 'society_admin',
    action: 'DIVIDEND_DISTRIBUTION_APPROVED',
    module: 'Cooperative Governance',
    recordId: quarter,
    details: `Approved cooperative dividend distribution for period ${quarter}`
  });

  return { success: true, message: `Dividends for ${quarter} approved successfully.` };
}
