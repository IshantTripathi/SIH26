import { Router } from 'express';
import { calculateWorkerDividend, getCooperativeSurplusSummary, approveDividendDistribution } from '../services/dividendCalcService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleGuard.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/worker/:workerId', authenticate, (req, res) => {
  try {
    const { workerId } = req.params;
    if (req.user.role === ROLES.WORKER && workerId !== req.user.workerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own dividend benefits.' });
    }
    const dividend = calculateWorkerDividend(workerId);
    if (!dividend) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, dividend });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-dividend', authenticate, (req, res) => {
  try {
    const workerId = req.user.workerId || req.user.id;
    const dividend = calculateWorkerDividend(workerId);
    if (!dividend) return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    return res.json({ success: true, dividend });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/surplus', authenticate, (req, res) => {
  try {
    const summary = getCooperativeSurplusSummary();
    return res.json({ success: true, summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/approve', authenticate, requireRoles(ROLES.SOCIETY_ADMIN, ROLES.FEDERATION_ADMIN, ROLES.PLATFORM_ADMIN), (req, res) => {
  try {
    const { quarter = 'Q3 2026', societyId } = req.body;
    const targetSociety = req.user.role === ROLES.SOCIETY_ADMIN ? req.user.societyId : societyId;
    const result = approveDividendDistribution(quarter, targetSociety, req.user.name);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
