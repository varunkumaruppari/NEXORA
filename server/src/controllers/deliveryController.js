import { checkDeliveryEligibility } from '../services/deliveryEligibilityService.js';
import { geocodeLocation } from '../services/locationService.js';
import { calculateRoute } from '../services/routeService.js';
import { WAREHOUSES, DELIVERY_ZONES, DELIVERY_AGENTS } from '../data/deliveryData.js';

/**
 * Controller to check Fast Delivery Eligibility for a product and location.
 * @route POST /api/delivery/check
 */
export const checkDelivery = async (req, res, next) => {
  const { productId, quantity, location, pincode: rawPincode, mockTime } = req.body || {};
  const locationInput = location || rawPincode;

  console.log(`\n⚡ [API Request] POST /api/delivery/check | Product: ${productId} | Quantity: ${quantity || 1}`);

  try {
    const result = await checkDeliveryEligibility({
      productId,
      quantity: quantity || 1,
      location: locationInput,
      pincode: typeof locationInput === 'string' ? locationInput : locationInput?.pincode,
      mockTime: mockTime || null,
    });

    console.log(`✅ [Delivery Engine Result] Eligible: ${result.eligible} | Type: ${result.deliveryType} | Reason: ${result.reasonCode}`);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ [API Error] Delivery check failure:', error.stack || error.message);
    return res.status(500).json({
      success: false,
      eligible: false,
      deliveryType: 'NONE',
      reasonCode: 'ENGINE_ERROR',
      customerMessage: "Sorry, we couldn't check delivery availability right now. Please try again.",
    });
  }
};

/**
 * Controller to fetch all 10 NEXORA Hyderabad Fulfillment Hubs for Operations Map / Operations Command Center
 * @route GET /api/delivery/network
 */
export const getHyderabadNetwork = async (req, res, next) => {
  try {
    const hubs = Object.values(WAREHOUSES)
      .filter((w) => w.code) // Filter unique hubs with codes
      .map((w) => {
        const capacityRatio = w.currentReservedCapacity / w.maxOneDayCapacity;
        let status = 'AVAILABLE';
        if (w.warehouseId === 'WH-CLOSED' || w.oneDayEnabled === false) {
          status = 'UNAVAILABLE';
        } else if (capacityRatio >= 0.8) {
          status = 'CONSTRAINED';
        }

        const hubAgents = DELIVERY_AGENTS.filter((a) => a.warehouseId === w.warehouseId);
        const availableAgentsCount = hubAgents.filter((a) => a.status === 'AVAILABLE').length;

        return {
          warehouseId: w.warehouseId,
          code: w.code,
          name: w.name,
          city: w.city,
          tier: w.tier,
          latitude: w.latitude,
          longitude: w.longitude,
          status,
          oneDayEnabled: w.oneDayEnabled,
          maxCapacity: w.maxOneDayCapacity,
          currentOrders: w.currentReservedCapacity,
          demandLevel: capacityRatio > 0.7 ? 'HIGH' : capacityRatio > 0.4 ? 'MEDIUM' : 'LOW',
          activeAgents: availableAgentsCount,
          totalAgents: hubAgents.length,
          cutoffTime: w.cutoffTime,
          openingTime: w.openingTime,
          closingTime: w.closingTime,
        };
      });

    return res.status(200).json({
      success: true,
      network: 'NEXORA_HYDERABAD_FULFILLMENT_NETWORK',
      totalHubs: hubs.length,
      activeHubs: hubs.filter((h) => h.status !== 'UNAVAILABLE').length,
      hubs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Hyderabad network details',
    });
  }
};

/**
 * Controller to list available fulfillment hubs and supported sample pincodes.
 * @route GET /api/delivery/warehouses
 */
export const getDeliveryWarehouses = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      warehouses: WAREHOUSES,
      samplePincodes: [
        { pincode: '500081', city: 'Hyderabad', label: 'HITEC City Tech Hub (One-Day Eligible)' },
        { pincode: '500032', city: 'Hyderabad', label: 'Gachibowli Fulfillment Hub (One-Day Eligible)' },
        { pincode: '500072', city: 'Hyderabad', label: 'Kukatpally Logistics Center (Capacity Tested)' },
        { pincode: '500003', city: 'Hyderabad', label: 'Secunderabad Central (Standard 2-Day Delivery)' },
        { pincode: '500039', city: 'Hyderabad', label: 'Uppal East Hub (One-Day Eligible)' },
        { pincode: '999999', city: 'Remote Station', label: 'Restricted Zone (Non-Serviceable)' },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse information',
    });
  }
};

/**
 * Controller to get specific warehouse by ID
 * @route GET /api/delivery/warehouses/:id
 */
export const getWarehouseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = WAREHOUSES[id];
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    return res.status(200).json({ success: true, warehouse });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch warehouse' });
  }
};

/**
 * Controller for Geocoding Endpoint
 * @route POST /api/location/geocode
 */
export const geocodeEndpoint = async (req, res, next) => {
  try {
    const result = await geocodeLocation(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, reason: 'GEOCODING_ERROR' });
  }
};

/**
 * Controller for Route Calculation Endpoint
 * @route POST /api/delivery/route
 */
export const routeEndpoint = async (req, res, next) => {
  try {
    const { origin, destination } = req.body || {};
    const result = await calculateRoute(origin, destination);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, available: false });
  }
};

