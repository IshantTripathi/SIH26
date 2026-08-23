import { Router } from 'express';
import { getRepairGuide, getAllGuides, getToolRecommendations } from '../services/arGuidanceService.js';

const router = Router();

router.get('/guide/:category/:issueType', (req, res) => {
  try {
    const result = getRepairGuide(req.params.category, req.params.issueType);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/guide/:category', (req, res) => {
  try {
    const result = getRepairGuide(req.params.category);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/guides', (req, res) => {
  try {
    const guides = getAllGuides();
    return res.json({ success: true, guides });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tools/:category', (req, res) => {
  try {
    const result = getToolRecommendations(req.params.category);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
