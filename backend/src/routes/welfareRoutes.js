import { Router } from 'express';
import { getWelfareRecords, getWelfareByWorkerId, submitWelfareClaim } from '../controllers/welfareController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getWelfareRecords);
router.get('/worker/:workerId', authenticate, getWelfareByWorkerId);
router.get('/my-welfare', authenticate, getWelfareByWorkerId);
router.post('/claim', authenticate, submitWelfareClaim);
router.post('/claims', authenticate, submitWelfareClaim);

export default router;
