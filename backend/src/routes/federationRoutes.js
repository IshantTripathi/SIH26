import { Router } from 'express';
import { getFederationDashboard, mobilizeWorkforce, getNotifications } from '../controllers/federationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticate, getFederationDashboard);
router.get('/dashboard/:id', authenticate, getFederationDashboard);
router.post('/mobilize', authenticate, mobilizeWorkforce);
router.get('/notifications', authenticate, getNotifications);

export default router;
