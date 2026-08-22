import { Router } from 'express';
import { login, register, getProfile, getDemoAccounts, resetDemoData } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', authenticate, getProfile);
router.get('/demo-accounts', getDemoAccounts);
router.post('/reset-demo', resetDemoData);

export default router;
