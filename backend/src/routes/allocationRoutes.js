import { Router } from 'express';
import { simulateAllocation, classifyIntent, getFivePlumberScenario } from '../controllers/allocationController.js';

const router = Router();

router.post('/simulate', simulateAllocation);
router.post('/classify-intent', classifyIntent);
router.get('/five-plumber-scenario', getFivePlumberScenario);

export default router;
