import { Router } from 'express';
import {
  createJobRequest,
  updateJobStatus,
  processPayment,
  submitRating,
  getAllJobs,
  getJobById,
  cancelJob,
  declineJobOffer,
  resendOtp
} from '../controllers/jobsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createJobRequest);
router.get('/', authenticate, getAllJobs);
router.get('/:id', authenticate, getJobById);
router.patch('/:id/status', authenticate, updateJobStatus);
router.post('/:id/payment', authenticate, processPayment);
router.post('/:id/rate', authenticate, submitRating);
router.post('/:id/cancel', authenticate, cancelJob);
router.post('/:id/decline', authenticate, declineJobOffer);
router.post('/:id/resend-otp', authenticate, resendOtp);

export default router;
