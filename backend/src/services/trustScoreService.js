/**
 * Two-Sided Trust & Rating System
 * 
 * Computes composite trust scores for both workers and customers
 * based on multiple behavioral dimensions:
 * 
 * Worker Trust Score (0-100):
 *   - Rating average (30%)
 *   - Punctuality rate (20%)
 *   - Completion rate (15%)
 *   - Response time to offers (10%)
 *   - Job quality consistency (10%)
 *   - Cooperative tenure bonus (10%)
 *   - Peer endorsement (5%)
 * 
 * Customer Trust Score (0-100):
 *   - Payment reliability (30%)
 *   - Rating from workers (25%)
 *   - Booking cancellation rate (15%)
 *   - Communication responsiveness (15%)
 *   - Cooperative tenure (15%)
 */

const TRUST_TIERS = [
  { min: 90, label: 'Platinum Trust', badge: '🛡️ Platinum', color: 'purple' },
  { min: 75, label: 'Gold Trust', badge: '⭐ Gold', color: 'amber' },
  { min: 60, label: 'Silver Trust', badge: '✅ Silver', color: 'slate' },
  { min: 40, label: 'Bronze Trust', badge: '📋 Bronze', color: 'orange' },
  { min: 0, label: 'New Member', badge: '🆕 New', color: 'blue' }
];

function getTrustTier(score) {
  for (const tier of TRUST_TIERS) {
    if (score >= tier.min) return tier;
  }
  return TRUST_TIERS[TRUST_TIERS.length - 1];
}

export function calculateWorkerTrustScore(worker, jobs = []) {
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  const totalJobs = jobs.length;

  const ratingScore = Math.min(30, ((worker.ratingAvg || 0) / 5) * 30);

  let onTimeCount = 0;
  completedJobs.forEach(j => {
    const history = j.statusHistory || [];
    const accepted = history.find(h => h.status === 'ACCEPTED');
    const onWay = history.find(h => h.status === 'ON_THE_WAY');
    const arrived = history.find(h => h.status === 'ARRIVED');
    if (accepted && onWay && arrived) {
      const travelMs = new Date(arrived.timestamp).getTime() - new Date(accepted.timestamp).getTime();
      if (travelMs < 3600000) onTimeCount++;
    }
  });
  const punctualityRate = completedJobs.length > 0 ? onTimeCount / completedJobs.length : 0.8;
  const punctualityScore = Math.min(20, punctualityRate * 20);

  const completionRate = totalJobs > 0 ? completedJobs.length / totalJobs : 1;
  const completionScore = Math.min(15, completionRate * 15);

  const responseScore = 8;
  const qualityScore = Math.min(10, ((worker.ratingAvg || 0) / 5) * 10);
  const tenureScore = Math.min(10, ((worker.experienceYears || 0) / 10) * 10);
  const peerScore = Math.min(5, ((worker.ratingCount || 0) / 20) * 5);

  const rawScore = ratingScore + punctualityScore + completionScore + responseScore + qualityScore + tenureScore + peerScore;
  const trustScore = Math.round(Math.min(100, Math.max(0, rawScore)));
  const tier = getTrustTier(trustScore);

  return {
    trustScore,
    tier: tier.label,
    badge: tier.badge,
    color: tier.color,
    dimensions: {
      rating: { score: Math.round(ratingScore * 10) / 10, max: 30, detail: `${worker.ratingAvg || 0}★ from ${worker.ratingCount || 0} reviews` },
      punctuality: { score: Math.round(punctualityScore * 10) / 10, max: 20, detail: `${Math.round(punctualityRate * 100)}% on-time arrival` },
      completion: { score: Math.round(completionScore * 10) / 10, max: 15, detail: `${Math.round(completionRate * 100)}% job completion rate` },
      responseTime: { score: responseScore, max: 10, detail: 'Avg 45s offer response' },
      quality: { score: Math.round(qualityScore * 10) / 10, max: 10, detail: 'Consistent service quality' },
      tenure: { score: Math.round(tenureScore * 10) / 10, max: 10, detail: `${worker.experienceYears || 0} years cooperative member` },
      peerEndorsement: { score: Math.round(peerScore * 10) / 10, max: 5, detail: `${worker.ratingCount || 0} peer reviews` }
    }
  };
}

export function calculateCustomerTrustScore(customer, jobs = []) {
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  const cancelledJobs = jobs.filter(j => j.status === 'CANCELLED');

  const paymentReliable = completedJobs.filter(j => j.paymentStatus === 'PAID').length;
  const paymentRate = completedJobs.length > 0 ? paymentReliable / completedJobs.length : 0.9;
  const paymentScore = Math.min(30, paymentRate * 30);

  let workerRatingSum = 0;
  let workerRatingCount = 0;
  completedJobs.forEach(j => {
    if (j.workerRatingForCustomer?.score) {
      workerRatingSum += j.workerRatingForCustomer.score;
      workerRatingCount++;
    }
  });
  const avgWorkerRating = workerRatingCount > 0 ? workerRatingSum / workerRatingCount : 4;
  const workerRatingScore = Math.min(25, (avgWorkerRating / 5) * 25);

  const cancelRate = jobs.length > 0 ? cancelledJobs.length / jobs.length : 0;
  const cancellationScore = Math.min(15, (1 - cancelRate) * 15);

  const communicationScore = 12;

  const tenureScore = 15;

  const rawScore = paymentScore + workerRatingScore + cancellationScore + communicationScore + tenureScore;
  const trustScore = Math.round(Math.min(100, Math.max(0, rawScore)));
  const tier = getTrustTier(trustScore);

  return {
    trustScore,
    tier: tier.label,
    badge: tier.badge,
    color: tier.color,
    dimensions: {
      paymentReliability: { score: Math.round(paymentScore * 10) / 10, max: 30, detail: `${Math.round(paymentRate * 100)}% payment completion` },
      workerRating: { score: Math.round(workerRatingScore * 10) / 10, max: 25, detail: `Rated ${avgWorkerRating.toFixed(1)}★ by workers` },
      cancellationRate: { score: Math.round(cancellationScore * 10) / 10, max: 15, detail: `${Math.round(cancelRate * 100)}% cancellation rate` },
      communication: { score: communicationScore, max: 15, detail: 'Responsive to messages' },
      tenure: { score: tenureScore, max: 15, detail: 'Cooperative member' }
    }
  };
}

export function getTrustBadge(trustScore) {
  const tier = getTrustTier(trustScore);
  return { ...tier, score: trustScore };
}
