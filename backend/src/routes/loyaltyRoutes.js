import { Router } from 'express';
import {
  getLoyaltyStatus,
  applyCoupon,
  getCoupons,
  createWarranty,
  claimWarranty,
  getWarranties,
  scheduleCallback,
  getSeasonalSuggestions
} from '../controllers/loyaltyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/loyalty', authenticate, getLoyaltyStatus);
router.post('/coupons/apply', authenticate, applyCoupon);
router.get('/coupons', authenticate, getCoupons);
router.post('/warranties', authenticate, createWarranty);
router.post('/warranties/:id/claim', authenticate, claimWarranty);
router.get('/warranties', authenticate, getWarranties);
router.post('/callbacks', authenticate, scheduleCallback);
router.get('/seasonal', authenticate, getSeasonalSuggestions);

export default router;
