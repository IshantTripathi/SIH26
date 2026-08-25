import { store } from '../data/store.js';

const SUBSCRIPTION_PACKS = {
  'SERV-HOUSEHELP': [
    { id: 'PACK-WEEKLY-12H', name: 'Weekly Basic', hoursPerWeek: 12, price: 3500, pricePerHour: 292, description: '12 hours/week for basic household chores' },
    { id: 'PACK-WEEKLY-24H', name: 'Weekly Premium', hoursPerWeek: 24, price: 6000, pricePerHour: 250, description: '24 hours/week including cooking and deep cleaning' },
    { id: 'PACK-MONTHLY-48H', name: 'Monthly Basic', hoursPerMonth: 48, price: 12000, pricePerHour: 250, description: '48 hours/month for regular household maintenance' },
    { id: 'PACK-MONTHLY-96H', name: 'Monthly Premium', hoursPerMonth: 96, price: 21000, pricePerHour: 219, description: '96 hours/month full household management' }
  ],
  'SERV-BEAUTY-SPA': [
    { id: 'PACK-BEAUTY-4', name: 'Beauty Pack - 4 Sessions', sessions: 4, price: 2800, pricePerSession: 700, description: '4 beauty sessions at discounted rate' },
    { id: 'PACK-BEAUTY-8', name: 'Beauty Pack - 8 Sessions', sessions: 8, price: 5000, pricePerSession: 625, description: '8 beauty sessions with premium discount' },
    { id: 'PACK-BEAUTY-12', name: 'Beauty Pack - 12 Sessions', sessions: 12, price: 7200, pricePerSession: 600, description: '12 beauty sessions with maximum savings' }
  ],
  'SERV-MANICURE-PEDICURE': [
    { id: 'PACK-NAILS-4', name: 'Nail Care - 4 Sessions', sessions: 4, price: 1800, pricePerSession: 450, description: '4 manicure/pedicure sessions at discounted rate' },
    { id: 'PACK-NAILS-8', name: 'Nail Care - 8 Sessions', sessions: 8, price: 3200, pricePerSession: 400, description: '8 manicure/pedicure sessions with premium discount' },
    { id: 'PACK-NAILS-12', name: 'Nail Care - 12 Sessions', sessions: 12, price: 4200, pricePerSession: 350, description: '12 manicure/pedicure sessions with maximum savings' }
  ]
};

const INSTANT_BOOKING_CONFIG = {
  maxResponseTimeMinutes: 30,
  instantBookingFee: 50,
  eligibleCategories: ['Househelp', 'Cleaning'],
  nearbyRadiusKm: 5,
  maxWorkersToNotify: 5
};

export class SubscriptionService {
  static getAvailablePacks(serviceCategory) {
    const packs = SUBSCRIPTION_PACKS[serviceCategory] || [];
    return {
      serviceCategory,
      packs: packs.map(pack => ({
        ...pack,
        savings: pack.pricePerSession ? Math.round((1 - pack.pricePerSession / (pack.pricePerSession * 1.15)) * 100) : 0,
        validity: pack.hoursPerWeek ? '1 week' : pack.hoursPerMonth ? '1 month' : '3 months'
      })),
      totalPacksAvailable: packs.length
    };
  }

  static purchasePack(customerId, serviceCategory, packId) {
    const packs = SUBSCRIPTION_PACKS[serviceCategory];
    if (!packs) {
      return { success: false, error: 'Service category not eligible for subscription packs' };
    }
    
    const selectedPack = packs.find(p => p.id === packId);
    if (!selectedPack) {
      return { success: false, error: 'Invalid pack ID' };
    }

    const subscription = {
      id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      serviceCategory,
      packId: selectedPack.id,
      packName: selectedPack.name,
      totalSessions: selectedPack.sessions || (selectedPack.hoursPerWeek ? selectedPack.hoursPerWeek : selectedPack.hoursPerMonth),
      sessionsUsed: 0,
      totalAmount: selectedPack.price,
      pricePerSession: selectedPack.pricePerSession,
      status: 'ACTIVE',
      purchasedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    if (!store.subscriptions) store.subscriptions = [];
    store.subscriptions.push(subscription);

    return {
      success: true,
      subscription,
      message: `Successfully purchased ${selectedPack.name} pack. You have ${subscription.totalSessions} sessions available.`
    };
  }

  static getCustomerSubscriptions(customerId) {
    const subscriptions = (store.subscriptions || []).filter(s => s.customerId === customerId && s.status === 'ACTIVE');
    return {
      activeSubscriptions: subscriptions.map(sub => ({
        ...sub,
        sessionsRemaining: sub.totalSessions - sub.sessionsUsed,
        usagePercent: Math.round((sub.sessionsUsed / sub.totalSessions) * 100)
      })),
      totalActivePacks: subscriptions.length
    };
  }

  static useSession(subscriptionId) {
    const subscription = (store.subscriptions || []).find(s => s.id === subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }
    if (subscription.sessionsUsed >= subscription.totalSessions) {
      return { success: false, error: 'All sessions used. Please purchase a new pack.' };
    }

    subscription.sessionsUsed += 1;
    return {
      success: true,
      sessionsRemaining: subscription.totalSessions - subscription.sessionsUsed,
      message: `Session used. ${subscription.totalSessions - subscription.sessionsUsed} sessions remaining.`
    };
  }
}

export class InstantBookingService {
  static getInstantBookingEligibility(serviceCategory) {
    const eligible = INSTANT_BOOKING_CONFIG.eligibleCategories.includes(serviceCategory);
    return {
      eligible,
      serviceCategory,
      maxResponseTimeMinutes: INSTANT_BOOKING_CONFIG.maxResponseTimeMinutes,
      instantBookingFee: INSTANT_BOOKING_CONFIG.instantBookingFee,
      nearbyRadiusKm: INSTANT_BOOKING_CONFIG.nearbyRadiusKm,
      message: eligible
        ? `Instant booking available. You can get a househelp within ${INSTANT_BOOKING_CONFIG.maxResponseTimeMinutes} minutes.`
        : 'Instant booking not available for this service category.'
    };
  }

  static createInstantBooking(customerId, serviceCategory, customerLocation, problemDescription) {
    const eligibility = this.getInstantBookingEligibility(serviceCategory);
    if (!eligibility.eligible) {
      return { success: false, error: 'Service not eligible for instant booking' };
    }

    const eligibleWorkers = (store.workers || []).filter(worker => {
      const isInCategory = worker.serviceCategories.includes(serviceCategory);
      const isOnline = worker.isOnline;
      const isInstantEligible = worker.instantBookingEligible;
      const isVerified = worker.verificationStatus === 'Verified';
      const distance = this.calculateDistance(
        customerLocation.lat, customerLocation.lng,
        worker.location.lat, worker.location.lng
      );
      return isInCategory && isOnline && isInstantEligible && isVerified && distance <= INSTANT_BOOKING_CONFIG.nearbyRadiusKm;
    });

    if (eligibleWorkers.length === 0) {
      return {
        success: false,
        error: 'No workers available for instant booking in your area. Please try regular booking.',
        fallbackAvailable: true
      };
    }

    const sortedWorkers = eligibleWorkers.sort((a, b) => {
      const scoreA = (a.ratingAvg * 20) + (a.reliabilityScore * 0.3) - (a.activeJobsCount * 5);
      const scoreB = (b.ratingAvg * 20) + (b.reliabilityScore * 0.3) - (b.activeJobsCount * 5);
      return scoreB - scoreA;
    }).slice(0, INSTANT_BOOKING_CONFIG.maxWorkersToNotify);

    const instantBooking = {
      id: `INST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      serviceCategory,
      problemDescription,
      customerLocation,
      status: 'SEARCHING',
      instantBookingFee: INSTANT_BOOKING_CONFIG.instantBookingFee,
      maxResponseTimeMinutes: INSTANT_BOOKING_CONFIG.maxResponseTimeMinutes,
      notifiedWorkers: sortedWorkers.map(w => ({
        workerId: w.id,
        workerName: w.name,
        distance: this.calculateDistance(
          customerLocation.lat, customerLocation.lng,
          w.location.lat, w.location.lng
        ),
        estimatedArrivalMin: Math.round(this.calculateDistance(
          customerLocation.lat, customerLocation.lng,
          w.location.lat, w.location.lng
        ) * 3),
        rating: w.ratingAvg,
        notifiedAt: new Date().toISOString(),
        responded: false
      })),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + INSTANT_BOOKING_CONFIG.maxResponseTimeMinutes * 60 * 1000).toISOString()
    };

    if (!store.instantBookings) store.instantBookings = [];
    store.instantBookings.push(instantBooking);

    return {
      success: true,
      instantBooking,
      message: `Searching for nearby workers. You'll get a match within ${INSTANT_BOOKING_CONFIG.maxResponseTimeMinutes} minutes.`,
      workersNotified: sortedWorkers.length,
      nearestWorker: sortedWorkers[0] ? {
        name: sortedWorkers[0].name,
        distance: instantBooking.notifiedWorkers[0].distance,
        estimatedArrivalMin: instantBooking.notifiedWorkers[0].estimatedArrivalMin
      } : null
    };
  }

  static respondToInstantBooking(bookingId, workerId, accepted) {
    const booking = (store.instantBookings || []).find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Instant booking not found' };
    }

    const workerResponse = booking.notifiedWorkers.find(w => w.workerId === workerId);
    if (!workerResponse) {
      return { success: false, error: 'Worker not part of this booking' };
    }

    workerResponse.responded = true;
    workerResponse.accepted = accepted;
    workerResponse.respondedAt = new Date().toISOString();

    if (accepted) {
      booking.status = 'MATCHED';
      booking.matchedWorker = workerResponse;
      booking.matchedAt = new Date().toISOString();

      return {
        success: true,
        booking,
        message: `Worker ${workerResponse.workerName} accepted the instant booking. They will arrive in approximately ${workerResponse.estimatedArrivalMin} minutes.`
      };
    }

    const allResponded = booking.notifiedWorkers.every(w => w.responded);
    if (allResponded) {
      booking.status = 'NO_MATCH';
      return {
        success: false,
        booking,
        message: 'No workers available for instant booking. Please try regular booking.'
      };
    }

    return {
      success: true,
      booking,
      message: 'Worker declined. Waiting for other workers to respond.'
    };
  }

  static getInstantBookingStatus(bookingId) {
    const booking = (store.instantBookings || []).find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Instant booking not found' };
    }

    return {
      success: true,
      booking: {
        ...booking,
        timeRemaining: Math.max(0, Math.round((new Date(booking.expiresAt) - new Date()) / 60000)),
        respondedCount: booking.notifiedWorkers.filter(w => w.responded).length,
        acceptedCount: booking.notifiedWorkers.filter(w => w.responded && w.accepted).length
      }
    };
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
