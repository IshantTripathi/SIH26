import { Router } from 'express';
import { getWelfareRecords, getWelfareByWorkerId, submitWelfareClaim, getAllWelfareClaims, updateWelfareClaimStatus } from '../controllers/welfareController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getWelfareRecords);
router.get('/claims', authenticate, getAllWelfareClaims);
router.get('/worker/:workerId', authenticate, getWelfareByWorkerId);
router.get('/my-welfare', authenticate, getWelfareByWorkerId);
router.post('/claim', authenticate, submitWelfareClaim);
router.post('/claims', authenticate, submitWelfareClaim);
router.patch('/claims/:id/status', authenticate, updateWelfareClaimStatus);

export default router;
