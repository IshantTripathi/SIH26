import { Router } from 'express';
import { getAllComplaints, createComplaint, updateComplaintStatus } from '../controllers/complaintsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getAllComplaints);
router.post('/', authenticate, createComplaint);
router.patch('/:id/status', authenticate, updateComplaintStatus);

export default router;
