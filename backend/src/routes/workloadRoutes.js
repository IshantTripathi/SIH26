import { Router } from 'express';
import { analyzeWorkload, autoRedistribute, getWorkloadHeatmap } from '../services/workloadBalancerService.js';
import { store } from '../data/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/analyze/:societyId', authenticate, (req, res) => {
  try {
    const analysis = analyzeWorkload(req.params.societyId, store);
    return res.json({ success: true, analysis });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/redistribute', authenticate, (req, res) => {
  try {
    const result = autoRedistribute(store);
    store.logAudit({
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'WORKLOAD_REDISTRIBUTION',
      module: 'Workload Balancing',
      recordId: 'SYSTEM',
      details: `Auto-redistributed ${result.totalRedistributed} jobs across societies`
    });
    return res.json({ success: true, message: `${result.totalRedistributed} jobs redistributed.`, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/heatmap', authenticate, (req, res) => {
  try {
    const heatmap = getWorkloadHeatmap(store);
    return res.json({ success: true, heatmap });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
