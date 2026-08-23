import { store } from '../data/store.js';

/**
 * Dynamic Cooperative Dividend Calculator
 * Shows workers real-time dividend projection based on their
 * contribution to the cooperative surplus pool.
 */

const DIVIDEND_CONFIG = {
  surplusAllocationPercent: 60,
  memberWeightBase: 0.4,
  jobWeightBase: 0.3,
  earningsWeightBase: 0.3,
  minDividend: 50,
  distributionFrequency: 'Quarterly'
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

  // Dividend pool (from all workers' coop contributions)
  const allWorkers = store.getCollection('workers');
  const allJobs = store.getCollection('jobs');
  const allCompleted = allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  const totalPoolContributions = allCompleted.reduce((sum, j) => sum + (j.pricing?.coopContribution || 0), 0);

  // Surplus pool = 60% of total coop contributions
  const surplusPool = Math.round(totalPoolContributions * (DIVIDEND_CONFIG.surplusAllocationPercent / 100));

  // Worker's weight in dividend calculation
  const jobWeight = totalJobs / Math.max(allCompleted.length, 1);
  const earningsWeight = totalEarnings / Math.max(allCompleted.reduce((sum, j) => sum + (j.pricing?.netWorkerEarnings || 0), 0), 1);
  const memberWeight = Math.min(experienceMonths / 24, 1);
  const ratingWeight = avgRating / 5;

  const totalWeight = (
    jobWeight * DIVIDEND_CONFIG.jobWeightBase +
    earningsWeight * DIVIDEND_CONFIG.earningsWeightBase +
    memberWeight * DIVIDEND_CONFIG.memberWeightBase +
    ratingWeight * 0.1
  );

  const estimatedDividend = Math.round(surplusPool * totalWeight);
  const guaranteedDividend = Math.max(DIVIDEND_CONFIG.minDividend, Math.round(totalCoopContribution * 0.15));

  // Monthly contribution breakdown
  const monthlyContribution = completedJobs.length > 0
    ? Math.round(totalCoopContribution / Math.max(1, Math.ceil(completedJobs.length / 6)))
    : 0;

  // Historical dividends (simulated for last 4 quarters)
  const historicalDividends = [
    { quarter: 'Q1 2026', amount: Math.round(guaranteedDividend * 0.8), status: 'Paid' },
    { quarter: 'Q2 2026', amount: Math.round(guaranteedDividend * 0.9), status: 'Paid' },
    { quarter: 'Q3 2026', amount: estimatedDividend, status: 'Projected' }
  ];

  return {
    workerId,
    workerName: worker.name,
    trade: worker.primarySkill,
    membershipMonths: experienceMonths,
    contribution: {
      totalJobsCompleted: totalJobs,
      totalEarnings: `₹${totalEarnings.toLocaleString('en-IN')}`,
      totalCoopContribution: `₹${Math.round(totalCoopContribution).toLocaleString('en-IN')}`,
      monthlyContribution: `₹${monthlyContribution.toLocaleString('en-IN')}`,
      contributionPercent: '4%'
    },
    dividendPool: {
      totalPool: `₹${surplusPool.toLocaleString('en-IN')}`,
      totalContributions: `₹${Math.round(totalPoolContributions).toLocaleString('en-IN')}`,
      surplusPercent: `${DIVIDEND_CONFIG.surplusAllocationPercent}%`,
      distributionFrequency: DIVIDEND_CONFIG.distributionFrequency
    },
    weightBreakdown: {
      jobContribution: `${Math.round(jobWeight * 100)}% (weight: ${DIVIDEND_CONFIG.jobWeightBase * 100}%)`,
      earningsContribution: `${Math.round(earningsWeight * 100)}% (weight: ${DIVIDEND_CONFIG.earningsWeightBase * 100}%)`,
      membershipContribution: `${Math.round(memberWeight * 100)}% (weight: ${DIVIDEND_CONFIG.memberWeightBase * 100}%)`,
      ratingContribution: `${Math.round(ratingWeight * 100)}% (weight: 10%)`
    },
    dividend: {
      estimatedDividend: `₹${estimatedDividend.toLocaleString('en-IN')}`,
      guaranteedMinimum: `₹${guaranteedDividend.toLocaleString('en-IN')}`,
      payoutDate: 'End of Quarter',
      status: 'Projected'
    },
    historicalDividends,
    totalDividendReceived: historicalDividends
      .filter(d => d.status === 'Paid')
      .reduce((sum, d) => sum + d.amount, 0),
    nextDistribution: {
      date: getNextQuarterEnd(),
      daysRemaining: Math.ceil((getNextQuarterEndDate() - Date.now()) / (1000 * 60 * 60 * 24)),
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

  const surplusPool = Math.round(totalCoop * (DIVIDEND_CONFIG.surplusAllocationPercent / 100));
  const adminFund = Math.round(totalCoop * (1 - DIVIDEND_CONFIG.surplusAllocationPercent / 100));

  return {
    totalGrossVolume: `₹${totalGross.toLocaleString('en-IN')}`,
    totalWorkerPayout: `₹${totalWorker.toLocaleString('en-IN')}`,
    totalCoopContributions: `₹${Math.round(totalCoop).toLocaleString('en-IN')}`,
    totalWelfareFund: `₹${Math.round(totalWelfare).toLocaleString('en-IN')}`,
    surplusPool: `₹${surplusPool.toLocaleString('en-IN')}`,
    adminFund: `₹${adminFund.toLocaleString('en-IN')}`,
    surplusAllocation: `${DIVIDEND_CONFIG.surplusAllocationPercent}% of coop contributions`,
    totalJobs: completed.length,
    averageDividendPerWorker: completed.length > 0
      ? `₹${Math.round(surplusPool / Math.max(store.getCollection('workers').length, 1)).toLocaleString('en-IN')}`
      : '₹0'
  };
}
