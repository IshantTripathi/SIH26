import { store } from '../data/store.js';

/**
 * Smart Scheduling with Weather & Festival Awareness
 * Considers weather forecasts, Indian festival calendar,
 * and local events to suggest optimal booking times.
 */

const INDIAN_FESTIVALS_2026 = [
  { name: 'Makar Sankranti', date: '2026-01-14', services: ['Cleaning', 'Painting'], demandMultiplier: 1.4 },
  { name: 'Republic Day', date: '2026-01-26', services: ['General Maintenance'], demandMultiplier: 1.1 },
  { name: 'Holi', date: '2026-03-10', services: ['Cleaning', 'Painting', 'Plumbing'], demandMultiplier: 1.6 },
  { name: 'Ram Navami', date: '2026-03-26', services: ['Cleaning', 'Gardening'], demandMultiplier: 1.2 },
  { name: 'Good Friday', date: '2026-04-03', services: [], demandMultiplier: 1.0 },
  { name: 'Ambedkar Jayanti', date: '2026-04-14', services: [], demandMultiplier: 1.0 },
  { name: 'Easter', date: '2026-04-05', services: [], demandMultiplier: 1.0 },
  { name: 'May Day', date: '2026-05-01', services: [], demandMultiplier: 1.0 },
  { name: 'Eid ul-Fitr', date: '2026-03-20', services: ['Cleaning', 'Painting'], demandMultiplier: 1.3 },
  { name: 'Eid ul-Adha', date: '2026-05-27', services: ['Cleaning'], demandMultiplier: 1.2 },
  { name: 'Rath Yatra', date: '2026-06-26', services: ['Cleaning', 'Gardening'], demandMultiplier: 1.2 },
  { name: 'Independence Day', date: '2026-08-15', services: ['Painting', 'Cleaning'], demandMultiplier: 1.3 },
  { name: 'Janmashtami', date: '2026-08-25', services: ['Cleaning', 'Painting'], demandMultiplier: 1.4 },
  { name: 'Ganesh Chaturthi', date: '2026-09-16', services: ['Cleaning', 'Painting', 'Gardening'], demandMultiplier: 1.5 },
  { name: 'Gandhi Jayanti', date: '2026-10-02', services: ['Cleaning'], demandMultiplier: 1.1 },
  { name: 'Dussehra', date: '2026-10-11', services: ['Cleaning', 'Painting', 'Carpentry'], demandMultiplier: 1.5 },
  { name: 'Diwali', date: '2026-11-01', services: ['Cleaning', 'Painting', 'Electrical', 'Plumbing', 'Carpentry'], demandMultiplier: 2.0 },
  { name: 'Govardhan Puja', date: '2026-11-02', services: ['Cleaning'], demandMultiplier: 1.4 },
  { name: 'Bhai Dooj', date: '2026-11-03', services: ['Cleaning'], demandMultiplier: 1.2 },
  { name: 'Guru Nanak Jayanti', date: '2026-11-20', services: ['Cleaning', 'Painting'], demandMultiplier: 1.3 },
  { name: 'Christmas', date: '2026-12-25', services: ['Cleaning', 'Painting'], demandMultiplier: 1.3 }
];

const WEATHER_PATTERNS = {
  'Delhi': {
    summer: { months: [3, 4, 5], temp: '35-45°C', advisory: 'Extreme heat — AC servicing demand high', demandBoost: ['AC Servicing', 'Appliance Repair'] },
    monsoon: { months: [6, 7, 8, 9], temp: '28-35°C', advisory: 'Heavy rains — plumbing & waterproofing demand spikes', demandBoost: ['Plumbing', 'Waterproofing', 'Pest Control'] },
    winter: { months: [10, 11, 12, 1, 2], temp: '5-20°C', advisory: 'Cold wave — geyser & heater demand high', demandBoost: ['Geyser Repair', 'Heater Service', 'Electrical'] }
  },
  'Mumbai': {
    summer: { months: [2, 3, 4, 5], temp: '30-38°C', advisory: 'Humid heat — AC & pest control demand', demandBoost: ['AC Servicing', 'Pest Control'] },
    monsoon: { months: [6, 7, 8, 9], temp: '25-32°C', advisory: 'Heavy monsoon — waterproofing critical', demandBoost: ['Waterproofing', 'Plumbing'] },
    winter: { months: [10, 11, 12, 1], temp: '18-28°C', advisory: 'Mild — general maintenance peak', demandBoost: ['General Maintenance', 'Painting'] }
  },
  'Default': {
    summer: { months: [3, 4, 5], temp: '30-40°C', advisory: 'Summer peak — appliance servicing recommended', demandBoost: ['AC Servicing', 'Electrical'] },
    monsoon: { months: [6, 7, 8, 9], temp: '25-35°C', advisory: 'Monsoon prep — check plumbing & waterproofing', demandBoost: ['Plumbing', 'Waterproofing'] },
    winter: { months: [10, 11, 12, 1, 2], temp: '8-25°C', advisory: 'Winter — heating & insulation services', demandBoost: ['Geyser Repair', 'Heater Service'] }
  }
};

function getSeasonForMonth(month) {
  if ([3, 4, 5].includes(month)) return 'summer';
  if ([6, 7, 8, 9].includes(month)) return 'monsoon';
  return 'winter';
}

function getUpcomingFestival(daysAhead = 30) {
  const now = new Date();
  const upcoming = [];
  for (const festival of INDIAN_FESTIVALS_2026) {
    const fDate = new Date(festival.date);
    const diffDays = Math.ceil((fDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= daysAhead) {
      upcoming.push({ ...festival, daysUntil: diffDays });
    }
  }
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getSmartScheduleSuggestions(serviceCategory, city = 'Delhi') {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const season = getSeasonForMonth(currentMonth);
  const weatherPattern = WEATHER_PATTERNS[city] || WEATHER_PATTERNS['Default'];
  const weather = weatherPattern[season];
  const upcomingFestivals = getUpcomingFestival(30);

  // Check if service category is weather-relevant
  const isWeatherBoosted = weather.demandBoost.includes(serviceCategory);

  // Check if near a festival
  const relevantFestival = upcomingFestivals.find(f => f.services.includes(serviceCategory));

  // Generate optimal time slots
  const suggestions = [];
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Morning slot (usually less busy)
  suggestions.push({
    time: 'Morning (8 AM - 11 AM)',
    availability: 'High',
    priceMultiplier: 1.0,
    reason: 'Off-peak hours — workers readily available, no surge pricing'
  });

  // Afternoon
  suggestions.push({
    time: 'Afternoon (12 PM - 3 PM)',
    availability: 'Medium',
    priceMultiplier: 1.0,
    reason: 'Moderate demand — standard availability'
  });

  // Evening
  suggestions.push({
    time: 'Evening (4 PM - 7 PM)',
    availability: 'Low',
    priceMultiplier: 1.1,
    reason: 'Peak hours — high demand, slight surge possible'
  });

  // Weekend
  suggestions.push({
    time: 'Weekend Morning',
    availability: 'Medium',
    priceMultiplier: 1.0,
    reason: 'Weekend slots fill fast — book 2-3 days ahead'
  });

  return {
    serviceCategory,
    city,
    season: season.charAt(0).toUpperCase() + season.slice(1),
    weather: {
      current: weather.temp,
      advisory: weather.advisory,
      demandBoost: isWeatherBoosted
    },
    upcomingFestivals: upcomingFestivals.filter(f => f.services.includes(serviceCategory)).slice(0, 3),
    suggestions,
    bestTimeToBook: isWeatherBoosted
      ? `Book NOW — ${serviceCategory} demand is high due to ${season} season. Early booking ensures faster worker allocation.`
      : relevantFestival
      ? `Book 3-5 days before ${relevantFestival.name} (${relevantFestival.date}) for best availability.`
      : 'Standard demand — book anytime for quick service.',
    demandLevel: isWeatherBoosted ? 'High' : relevantFestival ? 'Elevated' : 'Normal',
    estimatedWaitTime: isWeatherBoosted ? '30-60 minutes' : '15-30 minutes',
    festivalPrepTip: relevantFestival
      ? `${relevantFestival.name} is in ${relevantFestival.daysUntil} days. ${serviceCategory} demand will increase ${Math.round((relevantFestival.demandMultiplier - 1) * 100)}%. Book early!`
      : null
  };
}

export function getSeasonalDemandForecast(city = 'Delhi') {
  const now = new Date();
  const currentSeason = getSeasonForMonth(now.getMonth() + 1);
  const weatherPattern = WEATHER_PATTERNS[city] || WEATHER_PATTERNS['Default'];
  const weather = weatherPattern[currentSeason];

  const services = store.getCollection('services');
  const forecast = services.map(s => {
    const isBoosted = weather.demandBoost.includes(s.category);
    return {
      category: s.category,
      currentDemand: isBoosted ? 'High' : 'Normal',
      recommendation: isBoosted
        ? `High demand expected — deploy more ${s.category} workers in ${city}`
        : `Standard demand — maintain regular workforce`,
      optimalStaffing: isBoosted ? 'Increase by 30%' : 'Standard'
    };
  });

  return {
    city,
    season: currentSeason,
    weather: weather.advisory,
    forecast,
    upcomingFestivals: getUpcomingFestival(30).slice(0, 5)
  };
}
