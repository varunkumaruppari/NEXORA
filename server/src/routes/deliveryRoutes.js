import express from 'express';
import {
  checkDelivery,
  getDeliveryWarehouses,
  getHyderabadNetwork,
  getWarehouseById,
  geocodeEndpoint,
  routeEndpoint,
} from '../controllers/deliveryController.js';

const router = express.Router();

// POST /api/delivery/check - Check Fast Delivery Eligibility
router.post('/check', checkDelivery);

// GET /api/delivery/network - Operations Command Center Hyderabad Fulfillment Network
router.get('/network', getHyderabadNetwork);

// GET /api/delivery/warehouses - Fetch active fulfillment hubs & sample pincodes
router.get('/warehouses', getDeliveryWarehouses);

// GET /api/delivery/warehouses/:id - Get details for a specific warehouse
router.get('/warehouses/:id', getWarehouseById);

// POST /api/delivery/route - Real Road Distance and Duration Routing Endpoint
router.post('/route', routeEndpoint);

// POST /api/location/geocode - Geocoding & Address Normalization Endpoint
router.post('/geocode', geocodeEndpoint);

export default router;

