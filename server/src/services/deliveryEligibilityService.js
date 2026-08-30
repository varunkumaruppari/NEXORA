import mongoose from 'mongoose';
import { WAREHOUSES, DELIVERY_ZONES, PRODUCT_INVENTORY } from '../data/deliveryData.js';
import DeliveryAuditModel from '../models/DeliveryAudit.js';

/**
 * Deterministic Customer Explanation Mapping
 */
const REASON_MESSAGES = {
  ONE_DAY_AVAILABLE: 'Good news! This product can be delivered to your location tomorrow.',
  PRODUCT_NOT_FOUND: 'This product could not be found in our catalog.',
  INVALID_QUANTITY: 'Please enter a valid quantity of 1 or more.',
  INVALID_LOCATION: 'Please enter a valid 6-digit PIN code to check delivery availability.',
  LOCATION_NOT_SERVICEABLE: "We currently don't offer delivery to this location.",
  NO_ELIGIBLE_WAREHOUSE: 'No fulfillment center currently services this location.',
  OUT_OF_STOCK: 'This product is currently out of stock.',
  INSUFFICIENT_STOCK: 'There is not enough nearby stock to fulfill this order within one day.',
  ONE_DAY_NOT_SUPPORTED: 'One-day delivery is not available for this location.',
  CUT_OFF_PASSED: "Today's fast-delivery cutoff has passed. The fastest available delivery is standard 2-day delivery.",
  DELIVERY_CAPACITY_FULL: 'One-day delivery capacity is currently full for today. The fastest available delivery is standard 2-day delivery.',
  ENGINE_ERROR: "Sorry, we couldn't check delivery availability right now. Please try again.",
};

/**
 * Evaluates delivery eligibility deterministically based on Product, Quantity, Location, System Clock Cutoff, and Warehouse Capacity.
 * 
 * @param {Object} params
 * @param {string} params.productId - Product ID (e.g. 'PROD-1001')
 * @param {number} params.quantity - Quantity requested (e.g. 1)
 * @param {string} params.pincode - 6-digit Postal PIN Code (e.g. '500081')
 * @param {Date} [params.mockTime] - Optional explicit Date instance for deterministic time testing
 */
export const checkDeliveryEligibility = async ({ productId, quantity = 1, pincode, mockTime = null }) => {
  const now = mockTime ? new Date(mockTime) : new Date();
  const startTimeISO = now.toISOString();

  const auditId = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // -------------------------------------------------------------
    // STEP 1: Product Existence Check
    // -------------------------------------------------------------
    const inventoryRecord = PRODUCT_INVENTORY[productId];
    if (!productId || !inventoryRecord) {
      return recordAndReturn({
        auditId,
        productId: productId || 'UNKNOWN',
        requestedQuantity: quantity,
        pincode: pincode || 'NONE',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'PRODUCT_NOT_FOUND',
        customerMessage: REASON_MESSAGES.PRODUCT_NOT_FOUND,
        fastestAvailableDays: null,
      });
    }

    // -------------------------------------------------------------
    // STEP 2: Quantity Validity Check
    // -------------------------------------------------------------
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: quantity,
        pincode: pincode || 'NONE',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'INVALID_QUANTITY',
        customerMessage: REASON_MESSAGES.INVALID_QUANTITY,
        fastestAvailableDays: null,
      });
    }

    // -------------------------------------------------------------
    // STEP 3: Location / PIN Code Validity Check
    // -------------------------------------------------------------
    const cleanPincode = typeof pincode === 'string' ? pincode.trim() : String(pincode || '').trim();
    if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode || 'INVALID',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'INVALID_LOCATION',
        customerMessage: REASON_MESSAGES.INVALID_LOCATION,
        fastestAvailableDays: null,
      });
    }

    // -------------------------------------------------------------
    // STEP 4: Location Serviceability Check
    // -------------------------------------------------------------
    let zone = DELIVERY_ZONES[cleanPincode];
    
    // Dynamic fallback for unmapped standard Indian 6-digit pincodes (e.g. 500099)
    if (!zone) {
      if (cleanPincode === '999999' || cleanPincode === '000000') {
        zone = { pincode: cleanPincode, city: 'Unknown', serviceable: false, oneDayEligible: false, primaryWarehouse: null, standardTransitDays: 0 };
      } else {
        // Dynamic serviceable zone defaults to Standard 2-day delivery
        const isHyd = cleanPincode.startsWith('500');
        const isBlr = cleanPincode.startsWith('560');
        const isMum = cleanPincode.startsWith('400');
        const isDel = cleanPincode.startsWith('110') || cleanPincode.startsWith('122');

        const wh = isHyd ? 'WH-HYD' : isBlr ? 'WH-BLR' : isMum ? 'WH-MUM' : isDel ? 'WH-DEL' : null;
        zone = {
          pincode: cleanPincode,
          city: isHyd ? 'Hyderabad' : isBlr ? 'Bengaluru' : isMum ? 'Mumbai' : isDel ? 'Delhi NCR' : 'Regional City',
          serviceable: true,
          oneDayEligible: isHyd || isBlr || isDel,
          primaryWarehouse: wh,
          standardTransitDays: wh ? 2 : 3,
        };
      }
    }

    if (!zone.serviceable) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'LOCATION_NOT_SERVICEABLE',
        customerMessage: REASON_MESSAGES.LOCATION_NOT_SERVICEABLE,
        fastestAvailableDays: null,
      });
    }

    // -------------------------------------------------------------
    // STEP 5: Warehouse Selection
    // -------------------------------------------------------------
    const primaryWarehouseId = zone.primaryWarehouse;
    const availableWarehouseIds = Object.keys(WAREHOUSES);
    
    // Filter warehouses that service or can route to this zone
    let candidateWarehouses = availableWarehouseIds
      .map(id => WAREHOUSES[id])
      .filter(w => w && (w.serviceablePincodes.includes(cleanPincode) || w.warehouseId === primaryWarehouseId || zone.oneDayEligible));

    if (candidateWarehouses.length === 0) {
      // Fallback check all warehouses with stock
      candidateWarehouses = availableWarehouseIds.map(id => WAREHOUSES[id]);
    }

    if (candidateWarehouses.length === 0) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'NO_ELIGIBLE_WAREHOUSE',
        customerMessage: REASON_MESSAGES.NO_ELIGIBLE_WAREHOUSE,
        fastestAvailableDays: null,
      });
    }

    // -------------------------------------------------------------
    // STEP 6: Multi-Warehouse Inventory Check
    // -------------------------------------------------------------
    const productStocks = inventoryRecord.warehouses || {};
    const totalAvailableStock = Object.values(productStocks).reduce((sum, item) => sum + (item.stock || 0), 0);

    if (totalAvailableStock === 0) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'OUT_OF_STOCK',
        customerMessage: REASON_MESSAGES.OUT_OF_STOCK,
        fastestAvailableDays: null,
      });
    }

    // Find local primary warehouse with stock
    const primaryStock = primaryWarehouseId && productStocks[primaryWarehouseId] ? productStocks[primaryWarehouseId].stock : 0;
    
    // Select best warehouse prioritising 1) Serviceability 2) One-Day capability 3) Inventory
    let selectedWarehouse = null;
    if (primaryWarehouseId && productStocks[primaryWarehouseId] && productStocks[primaryWarehouseId].stock >= qty) {
      selectedWarehouse = WAREHOUSES[primaryWarehouseId];
    } else {
      // Find another warehouse with sufficient stock
      for (const w of candidateWarehouses) {
        const stockData = productStocks[w.warehouseId];
        if (stockData && stockData.stock >= qty) {
          selectedWarehouse = w;
          break;
        }
      }
    }

    if (!selectedWarehouse) {
      // Stock exists somewhere in network, but not enough in a single warehouse or local hub for 1-day
      const standardDays = zone.standardTransitDays || 3;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        reasonCode: 'INSUFFICIENT_STOCK',
        customerMessage: REASON_MESSAGES.INSUFFICIENT_STOCK,
      });
    }

    // -------------------------------------------------------------
    // STEP 7: One-Day Capability Check
    // -------------------------------------------------------------
    const isOneDaySupportedByWarehouse = selectedWarehouse.oneDayEnabled;
    const isOneDaySupportedByZone = zone.oneDayEligible;
    const isOneDaySupportedByInventory = productStocks[selectedWarehouse.warehouseId]?.oneDay ?? true;

    if (!isOneDaySupportedByZone || !isOneDaySupportedByWarehouse || !isOneDaySupportedByInventory) {
      const standardDays = zone.standardTransitDays || 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        reasonCode: 'ONE_DAY_NOT_SUPPORTED',
        customerMessage: REASON_MESSAGES.ONE_DAY_NOT_SUPPORTED,
      });
    }

    // -------------------------------------------------------------
    // STEP 8: Cutoff Time Calculation (System Clock vs Warehouse Cutoff)
    // -------------------------------------------------------------
    const [cutoffHourStr, cutoffMinStr] = (selectedWarehouse.cutoffTime || '15:00').split(':');
    const cutoffHour = parseInt(cutoffHourStr, 10);
    const cutoffMin = parseInt(cutoffMinStr, 10);

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const cutoffTotalMinutes = cutoffHour * 60 + cutoffMin;
    const currentTotalMinutes = currentHour * 60 + currentMin;

    const minutesRemaining = cutoffTotalMinutes - currentTotalMinutes;
    const hasCutoffPassed = minutesRemaining <= 0;

    const cutoffFormatted = format12HourTime(cutoffHour, cutoffMin);

    if (hasCutoffPassed) {
      // Cutoff passed today -> Next available delivery is Standard 2-day
      const standardDays = 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        cutoffTime: selectedWarehouse.cutoffTime,
        cutoffFormatted,
        minutesUntilCutoff: 0,
        reasonCode: 'CUT_OFF_PASSED',
        customerMessage: REASON_MESSAGES.CUT_OFF_PASSED,
      });
    }

    // -------------------------------------------------------------
    // STEP 9: Delivery Capacity Check
    // -------------------------------------------------------------
    const isCapacityFull = selectedWarehouse.currentReservedCapacity >= selectedWarehouse.maxOneDayCapacity;

    if (isCapacityFull) {
      const standardDays = 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        capacityStatus: `FULL (${selectedWarehouse.currentReservedCapacity}/${selectedWarehouse.maxOneDayCapacity})`,
        reasonCode: 'DELIVERY_CAPACITY_FULL',
        customerMessage: REASON_MESSAGES.DELIVERY_CAPACITY_FULL,
      });
    }

    // -------------------------------------------------------------
    // STEP 10 & 11: Calculate ONE-DAY Delivery Promise & Return
    // -------------------------------------------------------------
    const oneDayEstDate = formatDateOffset(now, 1);
    const formattedArrival = 'Tomorrow (' + formatDateNice(oneDayEstDate) + ')';

    return recordAndReturn({
      auditId,
      productId,
      requestedQuantity: qty,
      pincode: cleanPincode,
      eligible: true,
      deliveryType: 'ONE_DAY',
      estimatedDeliveryDate: oneDayEstDate,
      formattedArrival,
      fastestAvailableDays: 1,
      cutoffTime: selectedWarehouse.cutoffTime,
      cutoffFormatted,
      minutesUntilCutoff: minutesRemaining,
      reasonCode: 'ONE_DAY_AVAILABLE',
      customerMessage: REASON_MESSAGES.ONE_DAY_AVAILABLE,
      warehouseInfo: {
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        city: selectedWarehouse.city,
      },
    });

  } catch (error) {
    console.error('❌ [Delivery Engine Error]', error.stack || error.message);
    return {
      success: false,
      eligible: false,
      deliveryType: 'NONE',
      reasonCode: 'ENGINE_ERROR',
      customerMessage: REASON_MESSAGES.ENGINE_ERROR,
    };
  }
};

/**
 * Helper to record audit event to MongoDB Atlas (if connected) and return response object
 */
async function recordAndReturn(data) {
  // Fire and forget audit save to MongoDB Atlas if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const auditDoc = new DeliveryAuditModel({
        auditId: data.auditId,
        productId: data.productId,
        requestedQuantity: data.requestedQuantity,
        pincode: data.pincode,
        eligible: data.eligible,
        deliveryType: data.deliveryType,
        estimatedDeliveryDate: data.estimatedDeliveryDate || null,
        warehouseId: data.warehouseInfo?.warehouseId || data.warehouseId || null,
        reasonCode: data.reasonCode,
        customerMessage: data.customerMessage,
        cutoffTime: data.cutoffTime || null,
        capacityStatus: data.capacityStatus || null,
      });
      await auditDoc.save();
    } catch (err) {
      // Ignore DB save errors
    }
  }

  return {
    success: true,
    ...data,
  };
}

/**
 * Helper to format date offset (e.g. T + 1 day -> 'YYYY-MM-DD')
 */
function formatDateOffset(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to format date into nice string (e.g. 'Aug 31')
 */
function formatDateNice(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

/**
 * Helper to format 24h time to 12h AM/PM string (e.g. 15:00 -> '3:00 PM')
 */
function format12HourTime(hour, min) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  const mStr = String(min).padStart(2, '0');
  return `${h12}:${mStr} ${ampm}`;
}
