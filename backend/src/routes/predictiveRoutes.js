import { Router } from 'express';
import { generateMaintenanceAlerts, getMaintenanceStats } from '../services/predictiveMaintenanceService.js';

const router = Router();

router.get('/alerts/:customerId', (req, res) => {
  try {
    const result = generateMaintenanceAlerts(req.params.customerId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats/:customerId', (req, res) => {
  try {
    const stats = getMaintenanceStats(req.params.customerId);
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
