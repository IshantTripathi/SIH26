import { Router } from 'express';
import { calculateWorkerTrustScore, calculateCustomerTrustScore, getTrustBadge } from '../services/trustScoreService.js';
import { store } from '../data/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/worker/:id', authenticate, (req, res) => {
  try {
    const worker = store.findById('workers', req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
    const jobs = store.find('jobs', { workerId: worker.id });
    const trust = calculateWorkerTrustScore(worker, jobs);
    return res.json({ success: true, trust });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customer/:id', authenticate, (req, res) => {
  try {
    const customer = store.findById('users', req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const jobs = store.find('jobs', { customerId: customer.id });
    const trust = calculateCustomerTrustScore(customer, jobs);
    return res.json({ success: true, trust });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/badge/:score', authenticate, (req, res) => {
  try {
    const badge = getTrustBadge(Number(req.params.score));
    return res.json({ success: true, badge });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
