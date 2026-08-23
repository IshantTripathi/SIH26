import { Router } from 'express';
import {
  submitApplication, getAssessmentQuestions, submitAssessment,
  getPendingApplications, reviewApplication, getMyApplications
} from '../controllers/applicationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/apply', authenticate, submitApplication);
router.get('/assessment/:trade', authenticate, getAssessmentQuestions);
router.post('/assessment/submit', authenticate, submitAssessment);
router.get('/pending', authenticate, getPendingApplications);
router.get('/pending/:societyId', authenticate, getPendingApplications);
router.patch('/:id/review', authenticate, reviewApplication);
router.get('/my-applications', authenticate, getMyApplications);

export default router;
