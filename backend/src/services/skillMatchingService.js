/**
 * AI-Enhanced Skill-to-Job Matching Service
 * 
 * Goes beyond simple keyword matching with contextual scoring:
 * - Semantic skill mapping (understands related skills)
 * - Historical success rate per skill-job pair
 * - Learning from past match outcomes
 * - Multi-signal confidence scoring
 */

const SKILL_RELATIONSHIPS = {
  'Plumbing': { primary: ['Plumbing', 'Sanitary Fittings'], related: ['General Maintenance'], synonyms: ['pipe', 'leak', 'drain', 'faucet', 'toilet', 'geyser'] },
  'Electrical': { primary: ['Electrical', 'Wiring'], related: ['General Maintenance', 'Appliance Repair'], synonyms: ['fan', 'light', 'switch', 'mcb', 'fuse', 'spark'] },
  'Carpentry': { primary: ['Carpentry', 'Woodwork'], related: ['General Maintenance', 'Painting'], synonyms: ['door', 'window', 'furniture', 'hinge', 'lock'] },
  'Painting': { primary: ['Painting', 'Wall Coating'], related: ['Carpentry', 'Cleaning'], synonyms: ['paint', 'wall', 'damp', 'color', 'coat'] },
  'Cleaning': { primary: ['Cleaning', 'Sanitization'], related: ['Gardening'], synonyms: ['clean', 'wash', 'scrub', 'dust', 'sanitize'] },
  'Gardening': { primary: ['Gardening', 'Landscaping'], related: ['Cleaning'], synonyms: ['lawn', 'plant', 'grass', 'prune', 'tree'] },
  'Driving': { primary: ['Driving', 'Chauffeur'], related: [], synonyms: ['driver', 'car', 'cab', 'vehicle', 'transport'] },
  'Caregiving': { primary: ['Caregiving', 'Nursing'], related: [], synonyms: ['elderly', 'patient', 'nurse', 'care', 'medication'] },
  'General Maintenance': { primary: ['General Maintenance', 'Handyman'], related: ['Plumbing', 'Electrical', 'Carpentry'], synonyms: ['repair', 'fix', 'drill', 'mount', 'install'] },
  'Appliance Repair': { primary: ['Appliance Repair'], related: ['Electrical'], synonyms: ['fridge', 'washing machine', 'microwave', 'cooler', 'ac'] }
};

function computeSkillMatchScore(worker, serviceCategory) {
  const skillData = SKILL_RELATIONSHIPS[serviceCategory] || { primary: [serviceCategory], related: [], synonyms: [] };

  if (worker.primarySkill === serviceCategory) return { score: 25, matchType: 'exact_primary' };
  if (skillData.primary.includes(worker.primarySkill)) return { score: 23, matchType: 'primary_category' };
  if (worker.secondarySkills?.some(s => skillData.primary.includes(s))) return { score: 20, matchType: 'secondary_match' };
  if (worker.serviceCategories?.includes(serviceCategory)) return { score: 18, matchType: 'service_category' };
  if (skillData.related.includes(worker.primarySkill)) return { score: 12, matchType: 'related_trade' };
  if (worker.secondarySkills?.some(s => skillData.related.includes(s))) return { score: 10, matchType: 'related_secondary' };

  return { score: 0, matchType: 'no_match' };
}

function computeExperienceBonus(worker, serviceCategory) {
  const years = worker.experienceYears || 0;
  if (years >= 8) return 5;
  if (years >= 5) return 4;
  if (years >= 3) return 3;
  if (years >= 1) return 2;
  return 1;
}

function computeCertificationBonus(worker, serviceCategory) {
  const certs = worker.certifications || [];
  const verifiedCerts = certs.filter(c => c.verified);
  if (verifiedCerts.length >= 3) return 5;
  if (verifiedCerts.length >= 2) return 4;
  if (verifiedCerts.length >= 1) return 3;
  return 0;
}

function computeHistoricalSuccess(workerId, serviceCategory, store) {
  const jobs = store.find('jobs', { workerId, serviceCategory });
  const completed = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  if (jobs.length === 0) return 3;
  const successRate = completed.length / jobs.length;
  return Math.round(successRate * 5);
}

export function matchWorkersToJob(jobRequest, store) {
  const { serviceCategory, urgency, customerLocation } = jobRequest;
  const allWorkers = store.getCollection('workers');

  const candidates = allWorkers
    .filter(w => w.isOnline && (w.activeJobsCount || 0) < 6)
    .map(worker => {
      const skillMatch = computeSkillMatchScore(worker, serviceCategory);
      const experienceBonus = computeExperienceBonus(worker, serviceCategory);
      const certBonus = computeCertificationBonus(worker, serviceCategory);
      const historicalBonus = computeHistoricalSuccess(worker.id, serviceCategory, store);

      const matchConfidence = skillMatch.score + experienceBonus + certBonus + historicalBonus;

      return {
        workerId: worker.id,
        workerName: worker.name,
        matchConfidence: Math.min(50, matchConfidence),
        matchType: skillMatch.matchType,
        skillScore: skillMatch.score,
        experienceBonus,
        certBonus,
        historicalBonus,
        trustFactors: {
          ratingAvg: worker.ratingAvg || 0,
          ratingCount: worker.ratingCount || 0,
          verificationStatus: worker.verificationStatus
        }
      };
    })
    .filter(c => c.matchConfidence > 0)
    .sort((a, b) => b.matchConfidence - a.matchConfidence);

  return {
    totalCandidates: candidates.length,
    topMatches: candidates.slice(0, 5),
    matchQuality: candidates.length > 0 ? (candidates[0].matchConfidence >= 30 ? 'High' : candidates[0].matchConfidence >= 15 ? 'Medium' : 'Low') : 'None',
    skillGraph: {
      requested: serviceCategory,
      relatedTrades: (SKILL_RELATIONSHIPS[serviceCategory]?.related || []),
      synonymKeywords: (SKILL_RELATIONSHIPS[serviceCategory]?.synonyms || []).slice(0, 5)
    }
  };
}

export function explainMatch(candidate, serviceCategory) {
  const reasons = [];
  if (candidate.matchType === 'exact_primary') reasons.push(`Direct ${serviceCategory} specialist`);
  else if (candidate.matchType === 'primary_category') reasons.push('Primary skill in this category');
  else if (candidate.matchType === 'related_trade') reasons.push(`Related trade experience (${candidate.workerName})`);
  else reasons.push('Cross-trade capability');

  if (candidate.experienceBonus >= 4) reasons.push('Highly experienced (5+ years)');
  if (candidate.certBonus >= 4) reasons.push('Multiple verified certifications');
  if (candidate.historicalBonus >= 4) reasons.push('Strong track record in this trade');

  return { reasons, confidence: candidate.matchConfidence };
}
