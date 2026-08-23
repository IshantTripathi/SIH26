import { store } from '../data/store.js';

// Tier calculation: Silver (₹5K+), Gold (₹10K+), Platinum (₹15K+)
const TIER_THRESHOLDS = [
  { tier: 'Silver', minSpend: 5000, discount: 10, benefits: ['Priority booking', '10% discount on all services', 'Birthday bonus credit'] },
  { tier: 'Gold', minSpend: 10000, discount: 15, benefits: ['Priority booking', 'Customized service', 'Early access', 'Family bookings', '15% discount'] },
  { tier: 'Platinum', minSpend: 15000, discount: 20, benefits: ['VIP booking slots', 'Dedicated support', '20% discount', 'Free annual deep clean', 'Tool library priority'] }
];

export function getLoyaltyStatus(req, res) {
  try {
    const user = req.user;
    const paidJobs = store.find('jobs', { customerId: user.id, paymentStatus: 'PAID' });
    const totalSpend = paidJobs.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);

    let currentTier = null;
    let nextTier = null;
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalSpend >= TIER_THRESHOLDS[i].minSpend) {
        currentTier = TIER_THRESHOLDS[i];
        if (i < TIER_THRESHOLDS.length - 1) nextTier = TIER_THRESHOLDS[i + 1];
        break;
      }
    }
    if (!currentTier) nextTier = TIER_THRESHOLDS[0];

    const existing = store.findOne('loyaltyTiers', { customerId: user.id });
    if (existing) {
      store.findByIdAndUpdate('loyaltyTiers', existing.id, {
        totalSpend,
        tier: currentTier?.tier || 'Bronze',
        discount: currentTier?.discount || 0,
        benefits: currentTier?.benefits || ['Standard cooperative rates']
      });
    } else if (currentTier) {
      store.create('loyaltyTiers', {
        customerId: user.id,
        totalSpend,
        tier: currentTier.tier,
        discount: currentTier.discount,
        benefits: currentTier.benefits,
        joinedAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      loyalty: {
        customerId: user.id,
        totalSpend,
        currentTier: currentTier?.tier || 'Bronze',
        discount: currentTier?.discount || 0,
        benefits: currentTier?.benefits || ['Standard cooperative rates'],
        nextTier: nextTier?.tier || null,
        nextTierSpend: nextTier?.minSpend || null,
        spendToNext: nextTier ? Math.max(0, nextTier.minSpend - totalSpend) : 0,
        allTiers: TIER_THRESHOLDS
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function applyCoupon(req, res) {
  try {
    const { code, jobId } = req.body;
    const user = req.user;

    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const coupon = store.findOne('coupons', { code: code.toUpperCase(), status: 'Active' });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });

    const now = new Date();
    if (new Date(coupon.validUntil) < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }

    let discount = 0;
    let job = null;
    if (jobId) {
      job = store.findById('jobs', jobId);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      if (job.pricing?.grossAmount < coupon.minOrder) {
        return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrder} required for this coupon.` });
      }
      const grossAmount = job.pricing.grossAmount;
      discount = coupon.type === 'flat' ? Math.min(coupon.value, grossAmount) : Math.round(grossAmount * (coupon.value / 100));
      discount = Math.min(discount, grossAmount);

      const newGross = grossAmount - discount;
      const coopPercent = job.pricing.coopPercent || 4;
      const welfarePercent = job.pricing.welfarePercent || 1;
      const newCoop = Math.round((newGross * (coopPercent / 100)) * 10) / 10;
      const newWelfare = Math.round((newGross * (welfarePercent / 100)) * 10) / 10;
      const newNet = Math.round((newGross - newCoop - newWelfare) * 10) / 10;

      store.findByIdAndUpdate('jobs', jobId, {
        pricing: { ...job.pricing, grossAmount: newGross, coopContribution: newCoop, welfareDeduction: newWelfare, netWorkerEarnings: newNet },
        couponApplied: coupon.code,
        couponDiscount: discount
      });
    }

    store.findByIdAndUpdate('coupons', coupon.id, { usedCount: coupon.usedCount + 1 });

    store.logAudit({
      actorName: user.name, actorRole: user.role,
      action: 'COUPON_APPLIED', module: 'Loyalty & Discounts',
      recordId: coupon.id,
      details: `Coupon ${coupon.code} applied. Discount: ₹${discount}${jobId ? ` on job ${job?.code}` : ''}`
    });

    return res.json({
      success: true,
      message: `Coupon applied! ₹${discount} discount.`,
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
      discount,
      newTotal: job ? job.pricing.grossAmount - discount : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getCoupons(req, res) {
  try {
    const coupons = store.getCollection('coupons');
    const active = coupons.filter(c => c.status === 'Active' && new Date(c.validUntil) > new Date());
    return res.json({ success: true, coupons: active, total: active.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function createWarranty(req, res) {
  try {
    const { jobId, description } = req.body;
    const job = store.findById('jobs', jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.status !== 'COMPLETED' && job.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Warranty only available for completed jobs.' });
    }

    const warranty = store.create('warranties', {
      jobId: job.id,
      jobCode: job.code,
      customerId: job.customerId,
      workerId: job.workerId,
      workerName: job.workerName,
      serviceCategory: job.serviceCategory,
      description: description || `1-year service warranty for ${job.serviceCategory}`,
      warrantyPeriod: '1 Year',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
      claimsUsed: 0,
      maxClaims: 2
    });

    store.logAudit({
      actorName: req.user.name, actorRole: req.user.role,
      action: 'WARRANTY_ISSUED', module: 'Service Warranty',
      recordId: warranty.id,
      details: `1-year warranty issued for job ${job.code} (${job.serviceCategory})`
    });

    return res.json({ success: true, message: '1-year service warranty activated.', warranty });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function claimWarranty(req, res) {
  try {
    const { id } = req.params;
    const { issueDescription } = req.body;

    const warranty = store.findById('warranties', id);
    if (!warranty) return res.status(404).json({ success: false, message: 'Warranty not found.' });
    if (warranty.status !== 'Active') return res.status(400).json({ success: false, message: 'Warranty is no longer active.' });
    if (new Date(warranty.expiresAt) < new Date()) {
      store.findByIdAndUpdate('warranties', id, { status: 'Expired' });
      return res.status(400).json({ success: false, message: 'Warranty has expired.' });
    }
    if (warranty.claimsUsed >= warranty.maxClaims) {
      return res.status(400).json({ success: false, message: `Maximum ${warranty.maxClaims} warranty claims reached.` });
    }

    const allWorkers = store.getCollection('workers');
    const eligible = allWorkers.filter(w => w.isOnline && w.primarySkill === warranty.serviceCategory && w.id !== warranty.workerId);
    const newWorker = eligible.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))[0];

    const job = store.findById('jobs', warranty.jobId);
    const newJob = store.create('jobs', {
      code: `WARRANTY-${Math.floor(100 + Math.random() * 900)}`,
      customerId: warranty.customerId,
      customerName: job?.customerName || 'Customer',
      customerType: job?.customerType || 'Household',
      customerPhone: job?.customerPhone || '',
      customerAddress: job?.customerAddress || '',
      workerId: newWorker?.id || null,
      workerName: newWorker?.name || 'Matching in progress...',
      societyId: newWorker?.societyId || 'SOC-DEMO-001',
      serviceCategory: warranty.serviceCategory,
      serviceTitle: `Warranty Re-Service: ${warranty.serviceCategory}`,
      problemDescription: issueDescription || `Warranty claim for original job ${warranty.jobCode}`,
      status: newWorker ? 'OFFERED' : 'MATCHING',
      pricing: { grossAmount: 0, coopContribution: 0, welfareDeduction: 0, netWorkerEarnings: 0, coopPercent: 0, welfarePercent: 0, disclaimer: 'Free warranty re-service' },
      paymentStatus: 'WAIVED',
      isWarrantyClaim: true,
      warrantyId: warranty.id,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: 'Priority Scheduling',
      statusHistory: [{ status: 'REQUESTED', timestamp: new Date().toISOString() }]
    });

    store.findByIdAndUpdate('warranties', id, { claimsUsed: warranty.claimsUsed + 1, lastClaimAt: new Date().toISOString() });

    store.logAudit({
      actorName: req.user.name, actorRole: req.user.role,
      action: 'WARRANTY_CLAIMED', module: 'Service Warranty',
      recordId: warranty.id,
      details: `Warranty claim for ${warranty.jobCode}. Free re-service job ${newJob.code} created.`
    });

    return res.json({ success: true, message: 'Warranty claim approved. Free re-service scheduled.', newJob, warranty });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getWarranties(req, res) {
  try {
    const user = req.user;
    let warranties = store.getCollection('warranties');
    if (user.role === 'Customer') warranties = warranties.filter(w => w.customerId === user.id);
    return res.json({ success: true, warranties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function scheduleCallback(req, res) {
  try {
    const { preferredTime, reason, phone } = req.body;
    const user = req.user;

    const callback = store.create('callbacks', {
      customerId: user.id,
      customerName: user.name,
      phone: phone || user.mobile || '',
      preferredTime: preferredTime || 'Next available slot',
      reason: reason || 'General inquiry',
      status: 'Scheduled',
      scheduledAt: new Date().toISOString(),
      assignedTo: 'Customer Support Team'
    });

    store.logAudit({
      actorName: user.name, actorRole: user.role,
      action: 'CALLBACK_SCHEDULED', module: 'Support',
      recordId: callback.id,
      details: `Callback scheduled for ${preferredTime}: ${reason}`
    });

    return res.json({ success: true, message: 'Callback scheduled. Our team will call you at the preferred time.', callback });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getSeasonalSuggestions(req, res) {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const suggestions = store.seasonalSuggestions.filter(s => s.months.includes(currentMonth));
    return res.json({ success: true, suggestions, currentMonth });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
