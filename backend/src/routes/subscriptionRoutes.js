import { Router } from 'express';
import { SubscriptionService, InstantBookingService } from '../services/subscriptionService.js';

const router = Router();

router.get('/packs/:serviceCategory', (req, res) => {
  try {
    const { serviceCategory } = req.params;
    const packs = SubscriptionService.getAvailablePacks(serviceCategory);
    res.json({ success: true, ...packs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/purchase', (req, res) => {
  try {
    const { customerId, serviceCategory, packId } = req.body;
    if (!customerId || !serviceCategory || !packId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: customerId, serviceCategory, packId' });
    }
    const result = SubscriptionService.purchasePack(customerId, serviceCategory, packId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customer/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;
    const subscriptions = SubscriptionService.getCustomerSubscriptions(customerId);
    res.json({ success: true, ...subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/use-session', (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'Missing subscriptionId' });
    }
    const result = SubscriptionService.useSession(subscriptionId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/instant-booking/eligibility/:serviceCategory', (req, res) => {
  try {
    const { serviceCategory } = req.params;
    const eligibility = InstantBookingService.getInstantBookingEligibility(serviceCategory);
    res.json({ success: true, ...eligibility });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/instant-booking/create', (req, res) => {
  try {
    const { customerId, serviceCategory, customerLocation, problemDescription } = req.body;
    if (!customerId || !serviceCategory || !customerLocation) {
      return res.status(400).json({ success: false, error: 'Missing required fields: customerId, serviceCategory, customerLocation' });
    }
    const result = InstantBookingService.createInstantBooking(customerId, serviceCategory, customerLocation, problemDescription);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/instant-booking/respond', (req, res) => {
  try {
    const { bookingId, workerId, accepted } = req.body;
    if (!bookingId || !workerId || accepted === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: bookingId, workerId, accepted' });
    }
    const result = InstantBookingService.respondToInstantBooking(bookingId, workerId, accepted);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/instant-booking/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = InstantBookingService.getInstantBookingStatus(bookingId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
