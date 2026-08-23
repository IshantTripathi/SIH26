import { Router } from 'express';
import { startVoiceBooking, processVoiceInput, getVoiceBookingSession } from '../services/voiceBookingService.js';

const router = Router();

router.post('/start', (req, res) => {
  try {
    const customerId = req.user?.id || 'USR-CUST-001';
    const result = startVoiceBooking(customerId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/input', (req, res) => {
  try {
    const { sessionId, text } = req.body;
    if (!sessionId || !text) {
      return res.status(400).json({ success: false, message: 'sessionId and text are required.' });
    }
    const result = processVoiceInput(sessionId, text);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/session/:sessionId', (req, res) => {
  try {
    const session = getVoiceBookingSession(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    return res.json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
