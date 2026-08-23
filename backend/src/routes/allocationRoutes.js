import { Router } from 'express';
import { simulateAllocation, classifyIntent, getFivePlumberScenario, explainAllocation, verifySkillCertificate } from '../controllers/allocationController.js';

const router = Router();

router.post('/simulate', simulateAllocation);
router.post('/classify-intent', classifyIntent);
router.get('/five-plumber-scenario', getFivePlumberScenario);
router.post('/explain', explainAllocation);
router.get('/verify-cert/:code', verifySkillCertificate);

export default router;
