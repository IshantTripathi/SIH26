import { store } from '../data/store.js';
import crypto from 'crypto';

/**
 * Worker Digital Skill Passport
 * Portable, verifiable digital credential with trust scoring,
 * work history, endorsements, and shareable public link.
 */

function generatePassportHash(passportData) {
  const payload = JSON.stringify({
    workerId: passportData.workerId,
    name: passportData.name,
    skills: passportData.skills,
    trustScore: passportData.trustScore,
    issuedAt: passportData.issuedAt
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

export function generateSkillPassport(workerId) {
  const worker = store.findById('workers', workerId);
  if (!worker) return null;

  const user = store.findById('users', worker.userId);
  const jobs = store.find('jobs', { workerId });
  const completedJobs = jobs.filter(j => j.status === 'PAID' || j.status === 'COMPLETED');

  // Trust score
  const avgRating = worker.ratingAvg || 0;
  const totalJobs = completedJobs.length;
  const trustScore = Math.min(100, Math.round(
    (avgRating / 5) * 40 +
    Math.min(totalJobs / 50, 1) * 30 +
    (worker.experienceYears || 0) / 10 * 20 +
    (worker.reliabilityScore || 80) / 100 * 10
  ));

  // Skill certifications
  const skills = (worker.serviceCategories || [worker.primarySkill]).map(cat => ({
    name: cat,
    certified: worker.verificationStatus === 'Verified',
    certifiedBy: worker.societyId || 'N/A',
    certificationDate: worker.createdAt
  }));

  // Work history summary
  const workHistory = completedJobs.slice(0, 20).map(j => ({
    jobCode: j.code,
    service: j.serviceCategory,
    rating: j.rating?.score || null,
    completedAt: j.completedAt || j.updatedAt
  }));

  // Endorsements (simulated from high-rated jobs)
  const endorsements = completedJobs
    .filter(j => j.rating?.score >= 4)
    .slice(0, 5)
    .map(j => ({
      from: j.customerName || 'Customer',
      rating: j.rating.score,
      comment: j.rating.comment || 'Good service',
      date: j.completedAt || j.updatedAt
    }));

  // Tier
  let tier = 'New';
  if (trustScore >= 90) tier = 'Platinum';
  else if (trustScore >= 75) tier = 'Gold';
  else if (trustScore >= 55) tier = 'Silver';
  else if (trustScore >= 35) tier = 'Bronze';

  const passport = {
    workerId: worker.id,
    name: worker.name,
    trade: worker.primarySkill,
    society: worker.societyId,
    verificationStatus: worker.verificationStatus,
    experienceYears: worker.experienceYears || 0,
    totalJobsCompleted: totalJobs,
    averageRating: avgRating,
    trustScore,
    tier,
    skills,
    workHistory,
    endorsements,
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'Sahakar Gig Platform - SIH26089',
    organization: 'Ministry of Cooperation / NCCT'
  };

  passport.verificationHash = generatePassportHash(passport);
  passport.qrPayload = `https://sahakar.coop/verify/${worker.id}?hash=${passport.verificationHash}`;

  return passport;
}

export function verifyPassport(workerId, hash) {
  const passport = generateSkillPassport(workerId);
  if (!passport) return { valid: false, reason: 'Worker not found' };

  const expectedHash = generatePassportHash(passport);
  const isValid = hash === expectedHash;

  return {
    valid: isValid,
    workerId: passport.workerId,
    name: passport.name,
    trade: passport.trade,
    tier: passport.tier,
    trustScore: passport.trustScore,
    verificationStatus: passport.verificationStatus,
    verifiedBy: 'Sahakar Cooperative Platform',
    verificationDate: new Date().toISOString()
  };
}

export function addEndorsement(workerId, fromWorkerId, rating, comment) {
  const endorsements = store.getCollection('passortEndorsements');
  const endorsement = {
    id: `ENDORSE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workerId,
    fromWorkerId,
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment || 'Verified peer endorsement',
    createdAt: new Date().toISOString()
  };
  endorsements.unshift(endorsement);
  return endorsement;
}

export function getPassportStats() {
  const workers = store.getCollection('workers');
  const verified = workers.filter(w => w.verificationStatus === 'Verified');
  const avgTrust = verified.length > 0
    ? Math.round(verified.reduce((sum, w) => sum + (w.ratingAvg || 0), 0) / verified.length * 20)
    : 0;

  return {
    totalWorkers: workers.length,
    verifiedWorkers: verified.length,
    averageTrustScore: avgTrust,
    platinumWorkers: verified.filter(w => (w.ratingAvg || 0) >= 4.5).length,
    goldWorkers: verified.filter(w => (w.ratingAvg || 0) >= 4.0 && (w.ratingAvg || 0) < 4.5).length,
    silverWorkers: verified.filter(w => (w.ratingAvg || 0) >= 3.5 && (w.ratingAvg || 0) < 4.0).length
  };
}
