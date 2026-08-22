import { Router } from 'express';
import { getAuditLogs, getAllServices, addService } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/logs', authenticate, getAuditLogs);
router.get('/services', getAllServices);
router.post('/services', authenticate, addService);

export default router;
