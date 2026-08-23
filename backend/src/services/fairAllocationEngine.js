import { store } from '../data/store.js';
import { VERIFICATION_STATUS, WORKLOAD_STATUS, URGENCY_LEVELS } from '../config/constants.js';

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.0; // default fallback radius
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Fair Work Allocation Scoring Engine
 * 
 * Total Score =
 *   Skill Match (25)
 * + Certification Match (15)
 * + Availability (20)
 * + Distance Proximity (15)
 * + Workload Balancing (15)
 * + Cooperative Opportunity Fairness (10)
 * + Reliability & Ratings (5)
 */
export function scoreWorkerForJob(worker, jobRequest) {
  const { serviceCategory, urgency = URGENCY_LEVELS.NORMAL, customerLocation = { lat: 28.6140, lng: 77.2095 } } = jobRequest;

  // 1. Skill Match (Max 25 pts)
  let skillScore = 0;
  const hasPrimarySkill = worker.primarySkill?.toLowerCase() === serviceCategory?.toLowerCase();
  const hasSecondarySkill = worker.secondarySkills?.some(s => s.toLowerCase().includes(serviceCategory?.toLowerCase()));
  const inCategories = worker.serviceCategories?.includes(serviceCategory);

  if (hasPrimarySkill) {
    skillScore = 25;
  } else if (hasSecondarySkill || inCategories) {
    skillScore = 18;
  } else {
    skillScore = 0;
  }

  // 2. Certification Match (Max 15 pts)
  let certScore = 0;
  const isVerified = worker.verificationStatus === VERIFICATION_STATUS.VERIFIED;
  const hasCert = worker.certifications && worker.certifications.length > 0;
  const verifiedCerts = worker.certifications?.filter(c => c.verified) || [];

  if (isVerified && verifiedCerts.length > 0) {
    certScore = 15;
  } else if (hasCert) {
    certScore = 8;
  } else {
    certScore = 2;
  }

  // 3. Availability (Max 20 pts)
  let availScore = 0;
  if (worker.isOnline) {
    availScore = 20;
  } else {
    availScore = 0; // Worker is unavailable / offline
  }

  // 4. Distance Calculation & Score (Max 15 pts)
  let distanceKm = 2.0;
  if (worker.distanceToCustomerKm !== undefined) {
    distanceKm = worker.distanceToCustomerKm;
  } else if (worker.location && customerLocation) {
    distanceKm = calculateDistanceKm(
      worker.location.lat,
      worker.location.lng,
      customerLocation.lat,
      customerLocation.lng
    );
  }

  let distScore = 0;
  if (distanceKm <= 1.0) {
    distScore = 15;
  } else if (distanceKm <= 2.0) {
    distScore = 13;
  } else if (distanceKm <= 4.0) {
    distScore = 10;
  } else if (distanceKm <= 7.0) {
    distScore = 6;
  } else {
    distScore = 2;
  }

  // 5. Workload Balancing (Max 15 pts) - Core Cooperative Pillar
  // Penalizes overloaded workers, rewards balanced and underutilized workers
  let workloadScore = 0;
  const activeJobs = worker.activeJobsCount || 0;

  if (activeJobs === 0) {
    workloadScore = 15; // Highest priority to distribute work to underutilized workers
  } else if (activeJobs <= 2) {
    workloadScore = 14; // Low / Balanced workload
  } else if (activeJobs <= 4) {
    workloadScore = 10; // Medium workload
  } else if (activeJobs <= 7) {
    workloadScore = 4;  // Heavy workload
  } else {
    workloadScore = 0;  // Severely overloaded (e.g. 8+ active jobs)
  }

  // 6. Cooperative Opportunity Fairness & Parity Index (Max 10 pts)
  let fairnessScore = 0;
  const totalEarnings = worker.totalEarningsGross || 0;
  if (totalEarnings < 5000) {
    fairnessScore = 10; // Needs opportunities
  } else if (totalEarnings < 20000) {
    fairnessScore = 8;
  } else if (totalEarnings < 40000) {
    fairnessScore = 5;
  } else {
    fairnessScore = 3;
  }

  // 7. Reliability & Ratings (Max 5 pts) — includes punctuality
  let reliabilityScore = 0;
  const ratingAvg = worker.ratingAvg || 4.5;

  // Punctuality: calculate on-time % from completed jobs' statusHistory
  let punctualityPercent = 100;
  const workerJobs = store.getCollection('jobs').filter(j => j.workerId === worker.id && j.status === 'COMPLETED');
  if (workerJobs.length > 0) {
    let onTimeCount = 0;
    for (const j of workerJobs) {
      const history = j.statusHistory || [];
      const accepted = history.find(h => h.status === 'ACCEPTED');
      const arrived = history.find(h => h.status === 'ARRIVED');
      if (accepted?.timestamp && arrived?.timestamp) {
        const diffMin = (new Date(arrived.timestamp) - new Date(accepted.timestamp)) / 60000;
        if (diffMin <= 20) onTimeCount++;
      }
    }
    punctualityPercent = Math.round((onTimeCount / workerJobs.length) * 100);
  }

  if (ratingAvg >= 4.8 && punctualityPercent >= 90) {
    reliabilityScore = 5;
  } else if (ratingAvg >= 4.5 && punctualityPercent >= 80) {
    reliabilityScore = 4;
  } else {
    reliabilityScore = 3;
  }

  // Emergency weighting adjustments
  if (urgency === URGENCY_LEVELS.EMERGENCY) {
    // For emergency, proximity and instant availability are heavily boosted
    distScore = Math.min(15, distScore * 1.2);
  }

  // If worker is offline or lacks skill, total score is capped heavily
  let totalScore = skillScore + certScore + availScore + distScore + workloadScore + fairnessScore + reliabilityScore;
  if (!worker.isOnline) {
    totalScore = 0;
  }
  if (skillScore === 0) {
    totalScore = 0;
  }

  // Generate transparent, human-readable rationale
  const reasons = [];
  if (hasPrimarySkill) reasons.push(`Primary verified skill: ${worker.primarySkill}`);
  if (isVerified) reasons.push(`Official NCCT / Cooperative Society verified`);
  if (!worker.isOnline) {
    reasons.push(`Currently Offline / Unavailable`);
  } else {
    reasons.push(`Currently Online & on-duty`);
  }

  if (activeJobs > 5) {
    reasons.push(`High current workload (${activeJobs} active jobs) - deprioritized for fair distribution`);
  } else if (activeJobs === 0) {
    reasons.push(`Underutilized opportunity priority (0 active jobs)`);
  } else {
    reasons.push(`Balanced workload (${activeJobs} active jobs)`);
  }

  reasons.push(`Service distance: ${distanceKm} km from request`);
  reasons.push(`Punctuality: ${punctualityPercent}% on-time arrival`);

  return {
    workerId: worker.id,
    workerName: worker.name,
    workerCode: worker.code,
    societyId: worker.societyId,
    distanceKm,
    activeJobs,
    isOnline: worker.isOnline,
    punctualityPercent,
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown: {
      skillScore,
      certScore,
      availScore,
      distScore: Math.round(distScore * 10) / 10,
      workloadScore,
      fairnessScore,
      reliabilityScore
    },
    recommendationReason: reasons.join(' • ')
  };
}

/**
 * Finds and ranks candidates for a service job request.
 */
export function rankWorkersForJob(jobRequest) {
  const allWorkers = store.getCollection('workers');
  
  // Filter relevant trade workers first
  const candidates = allWorkers.map(w => scoreWorkerForJob(w, jobRequest));

  // Sort descending by total score
  candidates.sort((a, b) => b.totalScore - a.totalScore);

  const recommendedWorker = candidates.length > 0 && candidates[0].totalScore > 0 ? candidates[0] : null;

  return {
    recommendedWorker,
    rankedCandidates: candidates,
    evaluatedAt: new Date().toISOString()
  };
}
