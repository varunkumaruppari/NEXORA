import express from 'express';
import { checkDelivery, getDeliveryWarehouses } from '../controllers/deliveryController.js';

const router = express.Router();

// POST /api/delivery/check - Check Fast Delivery Eligibility
router.post('/check', checkDelivery);

// GET /api/delivery/warehouses - Fetch active fulfillment hubs & sample pincodes
router.get('/warehouses', getDeliveryWarehouses);

export default router;
