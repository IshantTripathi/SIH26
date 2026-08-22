import { Router } from 'express';
import { getDemandAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/demand', authenticate, getDemandAnalytics);
router.get('/public-demand', getDemandAnalytics);

export default router;
