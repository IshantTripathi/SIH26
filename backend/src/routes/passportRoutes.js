import { Router } from 'express';
import { generateSkillPassport, verifyPassport, addEndorsement, getPassportStats } from '../services/skillPassportService.js';

const router = Router();

router.get('/worker/:workerId', (req, res) => {
  try {
    const passport = generateSkillPassport(req.params.workerId);
    if (!passport) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, passport });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/verify/:workerId/:hash', (req, res) => {
  try {
    const result = verifyPassport(req.params.workerId, req.params.hash);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/endorse', (req, res) => {
  try {
    const { workerId, fromWorkerId, rating, comment } = req.body;
    const endorsement = addEndorsement(workerId, fromWorkerId, rating, comment);
    return res.json({ success: true, endorsement });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = getPassportStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
