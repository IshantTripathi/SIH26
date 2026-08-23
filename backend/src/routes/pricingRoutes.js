import { Router } from 'express';
import { calculateEffortPricing, calculateWorkerPayout } from '../services/effortPricingService.js';
import { store } from '../data/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/calculate', authenticate, (req, res) => {
  try {
    const {
      serviceCategory, basePrice, durationHours, urgency, scheduledTime, scheduledDate,
      customerLocation, workerLocation, subTasks, waitingMinutes,
      complexity, physicalDemand, skillDifficulty
    } = req.body;

    const matchedService = store.findOne('services', { category: serviceCategory });
    const effectiveBasePrice = basePrice || matchedService?.basePrice || 500;

    const pricing = calculateEffortPricing({
      basePrice: effectiveBasePrice, serviceCategory, durationHours, urgency,
      scheduledTime, scheduledDate, customerLocation, workerLocation,
      subTasks, waitingMinutes, complexity, physicalDemand, skillDifficulty
    });

    const society = store.findById('societies', req.user?.societyId || 'SOC-DEMO-001');
    const coopPercent = society?.coopContributionPercent ?? 4;
    const welfarePercent = society?.welfareFundPercent ?? 1;
    const payout = calculateWorkerPayout(pricing.grossAmount, coopPercent, welfarePercent);

    return res.json({
      success: true,
      pricing: { ...pricing, ...payout },
      cooperativeSplit: { coopPercent, welfarePercent, workerPercent: 100 - coopPercent - welfarePercent }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/trade-defaults', authenticate, (req, res) => {
  const TRADE_DEFAULTS = {
    'Plumbing': { complexity: 'moderate', physicalDemand: 'high', skillDifficulty: 'intermediate' },
    'Electrical': { complexity: 'complex', physicalDemand: 'medium', skillDifficulty: 'advanced' },
    'Carpentry': { complexity: 'moderate', physicalDemand: 'high', skillDifficulty: 'intermediate' },
    'Painting': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
    'Cleaning': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
    'Gardening': { complexity: 'routine', physicalDemand: 'medium', skillDifficulty: 'basic' },
    'Driving': { complexity: 'moderate', physicalDemand: 'low', skillDifficulty: 'basic' },
    'Caregiving': { complexity: 'complex', physicalDemand: 'high', skillDifficulty: 'advanced' },
    'General Maintenance': { complexity: 'moderate', physicalDemand: 'medium', skillDifficulty: 'basic' },
    'Appliance Repair': { complexity: 'complex', physicalDemand: 'medium', skillDifficulty: 'advanced' }
  };
  return res.json({ success: true, defaults: TRADE_DEFAULTS });
});

export default router;
