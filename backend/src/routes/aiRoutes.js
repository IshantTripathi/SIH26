import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleAiChat, getRoleSuggestions, getAiStatus } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Rate limiter: max 40 AI chat requests per 15-minute window per IP
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    reply: 'Rate limit exceeded: You have sent too many requests to the AI Assistant. Please wait a few minutes before trying again.',
    message: 'Too many requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI Assistant Chat Route (Protected + Rate-Limited)
router.post('/chat', aiChatLimiter, authenticate, handleAiChat);

// Role-Aware Suggested Prompts
router.get('/suggestions', authenticate, getRoleSuggestions);

// AI Status & Capability Metadata
router.get('/status', getAiStatus);

export default router;
