import { Router } from 'express';
import { matchWorkersToJob, explainMatch } from '../services/skillMatchingService.js';
import { store } from '../data/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/match', authenticate, (req, res) => {
  try {
    const { serviceCategory, urgency, customerLocation } = req.body;
    if (!serviceCategory) return res.status(400).json({ success: false, message: 'serviceCategory required.' });
    const result = matchWorkersToJob({ serviceCategory, urgency, customerLocation }, store);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/explain', authenticate, (req, res) => {
  try {
    const { candidate, serviceCategory } = req.body;
    const explanation = explainMatch(candidate, serviceCategory);
    return res.json({ success: true, explanation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
