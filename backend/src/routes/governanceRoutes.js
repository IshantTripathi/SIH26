import { Router } from 'express';
import {
  createMeeting, getMeetings, recordAttendance, updateMeetingMinutes,
  getBylaws, createBylaw, createResolution, getResolutions, voteResolution, getParticipationLog
} from '../controllers/governanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/meetings', authenticate, createMeeting);
router.get('/meetings', authenticate, getMeetings);
router.post('/meetings/:id/attendance', authenticate, recordAttendance);
router.patch('/meetings/:id/minutes', authenticate, updateMeetingMinutes);

router.get('/bylaws', authenticate, getBylaws);
router.post('/bylaws', authenticate, createBylaw);

router.post('/resolutions', authenticate, createResolution);
router.get('/resolutions', authenticate, getResolutions);
router.post('/resolutions/:id/vote', authenticate, voteResolution);

router.get('/participation', authenticate, getParticipationLog);

export default router;
