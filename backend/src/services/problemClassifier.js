import { store } from '../data/store.js';

/**
 * Problem-First Intent Classifier
 * Categorizes customer free-text descriptions into cooperative service categories.
 */
export function classifyProblemDescription(text = '') {
  if (!text || typeof text !== 'string') {
    return {
      serviceCategory: 'General Maintenance',
      serviceId: 'SERV-MAINTENANCE',
      confidence: 0.5,
      matchedKeywords: [],
      suggestedUrgency: 'Normal'
    };
  }

  const normalized = text.toLowerCase();
  const services = store.getCollection('services');

  let bestMatch = null;
  let highestScore = 0;
  let matchedKeywordsList = [];

  for (const service of services) {
    let matchCount = 0;
    const matched = [];

    for (const kw of service.keywords || []) {
      if (normalized.includes(kw.toLowerCase())) {
        matchCount++;
        matched.push(kw);
      }
    }

    if (matchCount > highestScore) {
      highestScore = matchCount;
      bestMatch = service;
      matchedKeywordsList = matched;
    }
  }

  // Check for emergency indicators
  const emergencyWords = ['urgent', 'emergency', 'spark', 'short circuit', 'flood', 'flooding', 'burst pipe', 'critical', 'immediately', 'danger'];
  const isEmergency = emergencyWords.some(w => normalized.includes(w));

  if (bestMatch && highestScore > 0) {
    const confidence = Math.min(0.98, 0.65 + (highestScore * 0.1));
    return {
      category: bestMatch.category,
      serviceCategory: bestMatch.category,
      serviceId: bestMatch.id,
      serviceTitle: bestMatch.title,
      basePrice: bestMatch.basePrice,
      confidence: Math.round(confidence * 100) / 100,
      matchedKeywords: matchedKeywordsList,
      suggestedUrgency: isEmergency ? 'Emergency' : (highestScore > 2 ? 'High' : 'Normal')
    };
  }

  // Fallback if no specific keyword matched
  return {
    serviceCategory: 'General Maintenance',
    serviceId: 'SERV-MAINTENANCE',
    serviceTitle: 'General Handyman & Facility Support',
    basePrice: 400,
    confidence: 0.45,
    matchedKeywords: [],
    suggestedUrgency: isEmergency ? 'Emergency' : 'Normal'
  };
}
