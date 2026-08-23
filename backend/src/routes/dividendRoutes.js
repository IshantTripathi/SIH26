import { Router } from 'express';
import { calculateWorkerDividend, getCooperativeSurplusSummary } from '../services/dividendCalcService.js';

const router = Router();

router.get('/worker/:workerId', (req, res) => {
  try {
    const dividend = calculateWorkerDividend(req.params.workerId);
    if (!dividend) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, dividend });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-dividend', (req, res) => {
  try {
    const workerId = req.user?.workerId || 'WRK-001';
    const dividend = calculateWorkerDividend(workerId);
    if (!dividend) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, dividend });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/surplus', (req, res) => {
  try {
    const summary = getCooperativeSurplusSummary();
    return res.json({ success: true, summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
