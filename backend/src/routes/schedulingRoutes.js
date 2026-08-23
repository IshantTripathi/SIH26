import { Router } from 'express';
import { getSmartScheduleSuggestions, getSeasonalDemandForecast } from '../services/smartSchedulingService.js';

const router = Router();

router.get('/suggestions', (req, res) => {
  try {
    const { serviceCategory = 'General Maintenance', city = 'Delhi' } = req.query;
    const result = getSmartScheduleSuggestions(serviceCategory, city);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/forecast', (req, res) => {
  try {
    const { city = 'Delhi' } = req.query;
    const result = getSeasonalDemandForecast(city);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
