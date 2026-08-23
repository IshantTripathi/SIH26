import { Router } from 'express';
import { getWorkerProfile, updateWorkerStatus, getWorkerEarnings, updateWorkerLocation, getWorkerLocation, getJobWorkerLocation } from '../controllers/workerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/profile', authenticate, getWorkerProfile);
router.get('/profile/:id', authenticate, getWorkerProfile);
router.patch('/status', authenticate, updateWorkerStatus);
router.get('/earnings', authenticate, getWorkerEarnings);
router.get('/earnings/:id', authenticate, getWorkerEarnings);
router.patch('/location', authenticate, updateWorkerLocation);
router.get('/location/:workerId', authenticate, getWorkerLocation);
router.get('/location/job/:id', authenticate, getJobWorkerLocation);

export default router;
