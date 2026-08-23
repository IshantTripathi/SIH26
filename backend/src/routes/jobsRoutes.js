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
  resendOtp,
  rescheduleJob,
  requestReService,
  sendSosAlert,
  getJobEta,
  getPackCredits,
  purchasePack
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
router.post('/:id/reschedule', authenticate, rescheduleJob);
router.post('/:id/re-service', authenticate, requestReService);
router.post('/:id/sos', authenticate, sendSosAlert);
router.get('/:id/eta', authenticate, getJobEta);
router.get('/packs/credits', authenticate, getPackCredits);
router.post('/packs/purchase', authenticate, purchasePack);

export default router;
