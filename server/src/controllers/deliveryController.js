import { checkDeliveryEligibility } from '../services/deliveryEligibilityService.js';
import { WAREHOUSES, DELIVERY_ZONES } from '../data/deliveryData.js';

/**
 * Controller to check Fast Delivery Eligibility for a product and location.
 * @route POST /api/delivery/check
 */
export const checkDelivery = async (req, res, next) => {
  const { productId, quantity, location, mockTime } = req.body || {};
  const pincode = typeof location === 'object' ? location?.pincode : location;

  console.log(`\n⚡ [API Request] POST /api/delivery/check | Product: ${productId} | Quantity: ${quantity || 1} | PIN: ${pincode || 'None'}`);

  try {
    const result = await checkDeliveryEligibility({
      productId,
      quantity: quantity || 1,
      pincode,
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
 * Controller to list available fulfillment hubs and supported sample pincodes.
 * @route GET /api/delivery/warehouses
 */
export const getDeliveryWarehouses = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      warehouses: WAREHOUSES,
      samplePincodes: [
        { pincode: '500081', city: 'Hyderabad', label: 'Hyderabad Cyberabad Hub (One-Day Eligible)' },
        { pincode: '560100', city: 'Bengaluru', label: 'Bengaluru Electronic City (One-Day Eligible)' },
        { pincode: '400001', city: 'Mumbai', label: 'Mumbai Fort (Standard 2-Day Delivery)' },
        { pincode: '122002', city: 'Gurugram', label: 'Gurugram NCR (Capacity Tested Hub)' },
        { pincode: '700001', city: 'Kolkata', label: 'Kolkata Regional (Standard 3-Day Delivery)' },
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
