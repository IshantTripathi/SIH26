import { Router } from 'express';
import { getSocietyDashboard, updateWorkerVerification, updateSocietyConfig } from '../controllers/societyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticate, getSocietyDashboard);
router.get('/dashboard/:id', authenticate, getSocietyDashboard);
router.patch('/workers/:workerId/verify', authenticate, updateWorkerVerification);
router.patch('/config/:id', authenticate, updateSocietyConfig);

export default router;
