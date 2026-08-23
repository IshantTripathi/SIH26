import { Router } from 'express';
import { getFederationDashboard, mobilizeWorkforce, getNotifications, getDividendPool, distributeDividends, getProposals, createProposal, voteOnProposal, getToolInventory, borrowTool, returnTool } from '../controllers/federationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticate, getFederationDashboard);
router.get('/dashboard/:id', authenticate, getFederationDashboard);
router.post('/mobilize', authenticate, mobilizeWorkforce);
router.get('/notifications', authenticate, getNotifications);
router.get('/dividend', authenticate, getDividendPool);
router.post('/dividend/distribute', authenticate, distributeDividends);
router.get('/proposals', authenticate, getProposals);
router.post('/proposals', authenticate, createProposal);
router.post('/proposals/:id/vote', authenticate, voteOnProposal);
router.get('/tools', authenticate, getToolInventory);
router.post('/tools/borrow', authenticate, borrowTool);
router.post('/tools/return/:id', authenticate, returnTool);

export default router;
