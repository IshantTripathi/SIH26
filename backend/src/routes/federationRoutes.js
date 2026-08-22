import { Router } from 'express';
import { getFederationDashboard } from '../controllers/federationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticate, getFederationDashboard);
router.get('/dashboard/:id', authenticate, getFederationDashboard);

export default router;
