import { Router } from 'express';
import { getCommunityImpact } from '../services/impactService.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const impact = getCommunityImpact();
    return res.json({ success: true, impact });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
