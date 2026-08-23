import { store } from '../data/store.js';
import { JOB_STATUSES, URGENCY_LEVELS } from '../config/constants.js';

export function createEmergencyJob(req, res) {
  try {
    const {
      serviceCategory,
      problemDescription,
      customerLocation,
      customerAddress
    } = req.body;

    const customer = req.user;
    const category = serviceCategory || 'General Maintenance';
    const serviceTitle = `EMERGENCY ${category}`;

    const allWorkers = store.getCollection('workers');
    const eligibleWorkers = allWorkers.filter(w =>
      w.isOnline &&
      w.primarySkill === category &&
      (w.activeJobsCount || 0) < 3 &&
      w.verificationStatus === 'Verified'
    );

    const customerLoc = customerLocation || customer.location || { lat: 28.6140, lng: 77.2095 };

    const ranked = eligibleWorkers.map(w => {
      const loc = w.location || { lat: 28.6140, lng: 77.2095 };
      const R = 6371;
      const dLat = ((customerLoc.lat - loc.lat) * Math.PI) / 180;
      const dLon = ((customerLoc.lng - loc.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((loc.lat * Math.PI) / 180) * Math.cos((customerLoc.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { workerId: w.id, name: w.name, distanceKm: Math.round(dist * 10) / 10, ratingAvg: w.ratingAvg || 4.5 };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    const emergencyEntry = store.create('emergencyQueue', {
      customerId: customer.id,
      customerName: customer.name,
      serviceCategory: category,
      customerLocation: customerLoc,
      customerAddress: customerAddress || customer.address || 'Emergency Location',
      status: 'BROADCASTING',
      broadcastTo: ranked.map(w => w.workerId),
      acceptedBy: null,
      broadcastAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      problemDescription: problemDescription || `Emergency ${category} request`
    });

    ranked.forEach(w => {
      store.pushNotification({
        title: 'EMERGENCY REQUEST BROADCAST',
        message: `Urgent ${category} job near ${customer.name}. Distance: ${w.distanceKm}km. Accept within 60 seconds!`,
        targetUserId: w.workerId,
        type: 'emergency'
      });
    });

    store.logAudit({
      actorName: customer.name,
      actorRole: customer.role,
      action: 'EMERGENCY_BROADCAST',
      module: 'Emergency Queue',
      recordId: emergencyEntry.id,
      details: `Emergency ${category} broadcast to ${ranked.length} workers. Expires in 60s.`
    });

    return res.status(201).json({
      success: true,
      message: `EMERGENCY BROADCAST sent to ${ranked.length} eligible workers. Auto-escalates in 60 seconds.`,
      emergency: {
        id: emergencyEntry.id,
        broadcastCount: ranked.length,
        expiresAt: emergencyEntry.expiresAt,
        workers: ranked.slice(0, 5)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function acceptEmergencyJob(req, res) {
  try {
    const { id } = req.params;
    const worker = req.user;

    const emergency = store.findById('emergencyQueue', id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found.' });
    if (emergency.status !== 'BROADCASTING') return res.status(400).json({ success: false, message: 'Emergency no longer accepting responses.' });
    if (new Date(emergency.expiresAt) < new Date()) {
      store.findByIdAndUpdate('emergencyQueue', id, { status: 'EXPIRED' });
      return res.status(400).json({ success: false, message: 'Emergency broadcast has expired.' });
    }

    const workerProfile = store.getCollection('workers').find(w => w.id === worker.workerId || w.userId === worker.id);
    if (!workerProfile) return res.status(404).json({ success: false, message: 'Worker profile not found.' });

    const updatedEmergency = store.findByIdAndUpdate('emergencyQueue', id, {
      status: 'ASSIGNED',
      acceptedBy: workerProfile.id,
      acceptedAt: new Date().toISOString()
    });

    const emergencyJob = store.create('jobs', {
      code: `EMG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: emergency.customerId,
      customerName: emergency.customerName,
      workerId: workerProfile.id,
      workerName: workerProfile.name,
      societyId: workerProfile.societyId,
      serviceCategory: emergency.serviceCategory,
      serviceTitle: `EMERGENCY ${emergency.serviceCategory}`,
      problemDescription: emergency.problemDescription,
      urgency: URGENCY_LEVELS.EMERGENCY,
      customerLocation: emergency.customerLocation,
      customerAddress: emergency.customerAddress,
      status: JOB_STATUSES.ACCEPTED,
      isEmergency: true,
      emergencyId: id,
      pricing: { grossAmount: 600, coopContribution: 24, welfareDeduction: 6, netWorkerEarnings: 570, coopPercent: 4, welfarePercent: 1 },
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: 'Immediate',
      statusHistory: [
        { status: JOB_STATUSES.REQUESTED, timestamp: emergency.broadcastAt },
        { status: JOB_STATUSES.ACCEPTED, timestamp: new Date().toISOString() }
      ]
    });

    store.findByIdAndUpdate('workers', workerProfile.id, {
      activeJobsCount: (workerProfile.activeJobsCount || 0) + 1
    });

    store.pushNotification({
      title: 'EMERGENCY JOB ACCEPTED',
      message: `${workerProfile.name} accepted the emergency ${emergency.serviceCategory} job. Job code: ${emergencyJob.code}`,
      targetUserId: emergency.customerId,
      type: 'success'
    });

    store.logAudit({
      actorName: workerProfile.name,
      actorRole: 'worker',
      action: 'EMERGENCY_ACCEPTED',
      module: 'Emergency Queue',
      recordId: emergency.id,
      details: `Emergency accepted by ${workerProfile.name}. Job ${emergencyJob.code} created.`
    });

    return res.json({
      success: true,
      message: `Emergency accepted! Job ${emergencyJob.code} created. Proceed to customer location immediately.`,
      job: emergencyJob
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getEmergencyPool(req, res) {
  try {
    const { category } = req.query;
    const allWorkers = store.getCollection('workers');
    let pool = allWorkers.filter(w => w.isOnline && (w.activeJobsCount || 0) < 3);
    if (category) pool = pool.filter(w => w.primarySkill === category);

    return res.json({
      success: true,
      count: pool.length,
      workers: pool.map(w => ({
        id: w.id,
        name: w.name,
        primarySkill: w.primarySkill,
        ratingAvg: w.ratingAvg,
        distanceKm: w.distanceToCustomerKm || null,
        location: w.location
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getActiveEmergencies(req, res) {
  try {
    const emergencies = store.find('emergencyQueue', { status: 'BROADCASTING' });
    return res.json({ success: true, count: emergencies.length, emergencies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
