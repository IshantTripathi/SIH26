import { Router } from 'express';
import { getWorkerWellness, getWellnessAlerts } from '../services/wellnessService.js';

const router = Router();

router.get('/worker/:workerId', (req, res) => {
  try {
    const wellness = getWorkerWellness(req.params.workerId);
    if (!wellness) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, wellness });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-wellness', (req, res) => {
  try {
    const workerId = req.user?.workerId || 'WRK-001';
    const wellness = getWorkerWellness(workerId);
    if (!wellness) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, wellness });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/alerts/:societyId', (req, res) => {
  try {
    const alerts = getWellnessAlerts(req.params.societyId);
    return res.json({ success: true, ...alerts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
