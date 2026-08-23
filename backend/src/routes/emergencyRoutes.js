import { Router } from 'express';
import { createEmergencyJob, acceptEmergencyJob, getEmergencyPool, getActiveEmergencies } from '../controllers/emergencyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/broadcast', authenticate, createEmergencyJob);
router.post('/:id/accept', authenticate, acceptEmergencyJob);
router.get('/pool', authenticate, getEmergencyPool);
router.get('/active', authenticate, getActiveEmergencies);

export default router;
