/**
 * RESOLV AI / NEXORA Master Deterministic Fast Delivery Decision Engine
 * 18-Step Pipeline verifying Inventory + Warehouse + Distance + Location + Agent + Workload + Cutoff + Capacity + Demand
 */

import mongoose from 'mongoose';
import { WAREHOUSES, DELIVERY_ZONES, PRODUCT_INVENTORY, DELIVERY_AGENTS } from '../data/deliveryData.js';
import DeliveryAuditModel from '../models/DeliveryAudit.js';
import { geocodeLocation } from './locationService.js';
import { calculateRoute } from './routeService.js';

export const REASON_MESSAGES = {
  ONE_DAY_AVAILABLE: '⚡ One-day fast delivery is available for your location.',
  PRODUCT_NOT_FOUND: 'The specified product could not be located in our catalog.',
  INVALID_QUANTITY: 'Please enter a valid order quantity of 1 or more.',
  INVALID_LOCATION: 'Please enter a valid 6-digit PIN code or address.',
  LOCATION_NOT_SERVICEABLE: 'Sorry, we currently do not deliver to this location.',
  OUT_OF_STOCK: 'This product is currently out of stock across all fulfillment hubs.',
  INSUFFICIENT_STOCK: 'Requested quantity exceeds available inventory in nearby hubs.',
  NO_ELIGIBLE_WAREHOUSE: 'No fulfillment hub is available to serve your location.',
  DISTANCE_TOO_FAR: 'Location exceeds the maximum 35 km fast-delivery radius from the nearest hub.',
  ONE_DAY_NOT_SUPPORTED: 'One-day express delivery is not currently available for your zone.',
  WAREHOUSE_CLOSED: 'Fulfillment warehouse is currently outside operating hours.',
  CUT_OFF_PASSED: 'Today\'s 1-day express cutoff time has passed. Standard delivery will be used.',
  NO_AVAILABLE_AGENT: 'All delivery agents serving your zone are currently offline or busy.',
  AGENT_CAPACITY_FULL: 'Assigned delivery agent has reached maximum active workload capacity.',
  DELIVERY_CAPACITY_FULL: 'One-day delivery slots for today are fully booked in your zone.',
  DEMAND_TOO_HIGH: 'High delivery demand in your area has temporarily paused fast delivery.',
  SYSTEM_ERROR: 'Unable to verify delivery availability at this moment.',
};

/**
 * Calculates Haversine geographic distance in kilometers between two lat/lng coordinates
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 12.5;
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Formats a Date offset into ISO YYYY-MM-DD format
 */
export function formatDateOffset(baseDate, daysToAdd) {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + daysToAdd);
  return target.toISOString().split('T')[0];
}

/**
 * Formats hour/minute into readable 12-hour AM/PM string
 */
export function format12HourTime(hour, min) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  const mStr = min < 10 ? `0${min}` : `${min}`;
  return `${h12}:${mStr} ${period}`;
}

/**
 * Master Deterministic Fast Delivery Eligibility Pipeline (18 Steps)
 */
export async function checkDeliveryEligibility(options = {}) {
  const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const { productId, quantity, pincode, location, mockTime } = options;

    // Use mockTime for deterministic testing if provided, otherwise real system clock
    const now = mockTime ? new Date(mockTime) : new Date();

    // -------------------------------------------------------------
    // STEP 1: Product Existence Check
    // -------------------------------------------------------------
    if (!productId || typeof productId !== 'string') {
      return recordAndReturn({
        auditId,
        productId: productId || 'UNKNOWN',
        requestedQuantity: quantity || 0,
        pincode: pincode || 'UNKNOWN',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'PRODUCT_NOT_FOUND',
        customerMessage: REASON_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    const productData = PRODUCT_INVENTORY[productId];
    if (!productData) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: quantity || 0,
        pincode: pincode || 'UNKNOWN',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'PRODUCT_NOT_FOUND',
        customerMessage: REASON_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    // -------------------------------------------------------------
    // STEP 2: Quantity Validity Check
    // -------------------------------------------------------------
    if (quantity === null || quantity === undefined || typeof quantity === 'object' || typeof quantity === 'boolean') {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: quantity,
        pincode: pincode || 'UNKNOWN',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'INVALID_QUANTITY',
        customerMessage: REASON_MESSAGES.INVALID_QUANTITY,
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: quantity,
        pincode: pincode || 'UNKNOWN',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'INVALID_QUANTITY',
        customerMessage: REASON_MESSAGES.INVALID_QUANTITY,
      });
    }

    // -------------------------------------------------------------
    // STEP 3: Location / Address / Geocoding Validation
    // -------------------------------------------------------------
    const locInput = location || pincode;
    const geocodeResult = await geocodeLocation(locInput);

    if (!geocodeResult.success) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: typeof pincode === 'string' ? pincode : 'INVALID',
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'INVALID_LOCATION',
        customerMessage: REASON_MESSAGES.INVALID_LOCATION,
      });
    }

    const cleanPincode = geocodeResult.pincode;

    // -------------------------------------------------------------
    // STEP 4: Location Serviceability Check
    // -------------------------------------------------------------
    const zoneInfo = DELIVERY_ZONES[cleanPincode];
    if (!zoneInfo || !zoneInfo.serviceable) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'LOCATION_NOT_SERVICEABLE',
        customerMessage: REASON_MESSAGES.LOCATION_NOT_SERVICEABLE,
      });
    }

    // -------------------------------------------------------------
    // STEP 5: Hyderabad Multi-Warehouse Discovery & Route Intelligence
    // -------------------------------------------------------------
    const productStocks = productData.warehouses || {};
    const candidateWarehouses = Object.values(WAREHOUSES).filter(
      (w) => w.warehouseId !== 'WH-CLOSED' && w.active !== false
    );

    let selectedWarehouse = null;
    let distanceKm = 0;
    let durationMinutes = 0;
    let distanceType = 'ROAD';
    let routeGeometry = [];
    let routeProvider = 'NONE';

    // Primary zone warehouse check
    if (zoneInfo.primaryWarehouse && WAREHOUSES[zoneInfo.primaryWarehouse]) {
      const primaryWh = WAREHOUSES[zoneInfo.primaryWarehouse];
      const stockData = productStocks[primaryWh.warehouseId];
      if (stockData && stockData.stock >= qty) {
        selectedWarehouse = primaryWh;
      }
    }

    if (selectedWarehouse && geocodeResult.latitude != null && geocodeResult.longitude != null) {
      const routeResult = await calculateRoute(
        { latitude: selectedWarehouse.latitude, longitude: selectedWarehouse.longitude },
        { latitude: geocodeResult.latitude, longitude: geocodeResult.longitude }
      );
      distanceKm = routeResult.distanceKm;
      durationMinutes = routeResult.durationMinutes;
      distanceType = routeResult.distanceType || 'ROAD';
      routeGeometry = routeResult.geometry || [];
      routeProvider = routeResult.provider || 'OSRM_ROUTING_ENGINE';
    } else if (geocodeResult.latitude != null && geocodeResult.longitude != null) {
      let evaluatedCandidates = [];
      for (const w of candidateWarehouses) {
        const stockData = productStocks[w.warehouseId];
        const hasStock = stockData && stockData.stock >= qty;
        const routeResult = await calculateRoute(
          { latitude: w.latitude, longitude: w.longitude },
          { latitude: geocodeResult.latitude, longitude: geocodeResult.longitude }
        );
        evaluatedCandidates.push({
          warehouse: w,
          hasStock: !!hasStock,
          distanceKm: routeResult.distanceKm,
          durationMinutes: routeResult.durationMinutes,
          geometry: routeResult.geometry,
          distanceType: routeResult.distanceType || 'ROAD',
          provider: routeResult.provider || 'OSRM_ROUTING_ENGINE',
        });
      }

      evaluatedCandidates.sort((a, b) => {
        if (a.hasStock !== b.hasStock) return b.hasStock ? 1 : -1;
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        return a.warehouse.warehouseId.localeCompare(b.warehouse.warehouseId);
      });

      const bestCandidate = evaluatedCandidates[0] || null;
      selectedWarehouse = bestCandidate?.warehouse || candidateWarehouses[0] || null;
      distanceKm = bestCandidate?.distanceKm || 0;
      durationMinutes = bestCandidate?.durationMinutes || 0;
      distanceType = bestCandidate?.distanceType || 'ROAD';
      routeGeometry = bestCandidate?.geometry || [];
      routeProvider = bestCandidate?.provider || 'NONE';
    }

    // -------------------------------------------------------------
    // STEP 6: Network Inventory Level Check
    // -------------------------------------------------------------
    const totalNetworkStock = Object.values(productStocks).reduce(
      (acc, curr) => acc + (curr.stock || 0),
      0
    );

    if (totalNetworkStock <= 0) {
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'OUT_OF_STOCK',
        customerMessage: REASON_MESSAGES.OUT_OF_STOCK,
      });
    }

    if (!selectedWarehouse || (productStocks[selectedWarehouse.warehouseId]?.stock || 0) < qty) {
      const standardDays = zoneInfo.standardTransitDays || 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse?.warehouseId || null,
        warehouseName: selectedWarehouse?.name || null,
        distanceKm,
        reasonCode: 'INSUFFICIENT_STOCK',
        customerMessage: REASON_MESSAGES.INSUFFICIENT_STOCK,
      });
    }

    // -------------------------------------------------------------
    // STEP 7: One-Day Hub Capability Check
    // -------------------------------------------------------------
    const isOneDaySupported = zoneInfo.oneDayEligible && selectedWarehouse.oneDayEnabled;
    if (!isOneDaySupported) {
      const standardDays = zoneInfo.standardTransitDays || 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        distanceKm,
        durationMinutes,
        reasonCode: 'ONE_DAY_NOT_SUPPORTED',
        customerMessage: REASON_MESSAGES.ONE_DAY_NOT_SUPPORTED,
      });
    }

    // -------------------------------------------------------------
    // STEP 8: Distance Feasibility Check (Max 35 km for 1-day)
    // -------------------------------------------------------------
    if (distanceKm > 35) {
      const standardDays = zoneInfo.standardTransitDays || 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse?.warehouseId || null,
        warehouseName: selectedWarehouse?.name || null,
        warehouseLatitude: selectedWarehouse?.latitude || null,
        warehouseLongitude: selectedWarehouse?.longitude || null,
        distanceKm,
        durationMinutes,
        geometry: routeGeometry,
        reasonCode: 'DISTANCE_TOO_FAR',
        customerMessage: REASON_MESSAGES.DISTANCE_TOO_FAR,
      });
    }

    // -------------------------------------------------------------
    // STEP 9: Warehouse Operating Hours Check (e.g. 08:00 - 20:00)
    // -------------------------------------------------------------
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    const [openH, openM] = (selectedWarehouse.openingTime || '08:00').split(':').map(Number);
    const [closeH, closeM] = (selectedWarehouse.closingTime || '20:00').split(':').map(Number);
    const openTimeMinutes = openH * 60 + openM;
    const closeTimeMinutes = closeH * 60 + closeM;

    if (currentTimeMinutes < openTimeMinutes || currentTimeMinutes >= closeTimeMinutes) {
      const standardDays = 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        warehouseLatitude: selectedWarehouse.latitude,
        warehouseLongitude: selectedWarehouse.longitude,
        distanceKm,
        durationMinutes,
        geometry: routeGeometry,
        operatingHoursStatus: 'CLOSED',
        reasonCode: 'WAREHOUSE_CLOSED',
        customerMessage: REASON_MESSAGES.WAREHOUSE_CLOSED,
      });
    }

    // -------------------------------------------------------------
    // STEP 10: Cutoff Time Check
    // -------------------------------------------------------------
    const [cutoffHour, cutoffMin] = selectedWarehouse.cutoffTime.split(':').map(Number);
    const cutoffMinutes = cutoffHour * 60 + cutoffMin;
    const minutesRemaining = cutoffMinutes - currentTimeMinutes;
    const hasCutoffPassed = minutesRemaining <= 0;
    const cutoffFormatted = format12HourTime(cutoffHour, cutoffMin);

    if (hasCutoffPassed) {
      const standardDays = 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        warehouseLatitude: selectedWarehouse.latitude,
        warehouseLongitude: selectedWarehouse.longitude,
        cutoffTime: selectedWarehouse.cutoffTime,
        cutoffFormatted,
        minutesUntilCutoff: 0,
        distanceKm,
        durationMinutes,
        geometry: routeGeometry,
        reasonCode: 'CUT_OFF_PASSED',
        customerMessage: REASON_MESSAGES.CUT_OFF_PASSED,
      });
    }

    // -------------------------------------------------------------
    // STEP 11 & STEP 12: Delivery Agent Discovery & Workload Capacity
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // STEP 11 & STEP 12: Intelligent Delivery Agent Selection & Scoring (Phase 15G)
    // -------------------------------------------------------------
    const candidateAgents = DELIVERY_AGENTS.filter(
      (agent) => agent.warehouseId === selectedWarehouse.warehouseId
    );

    const validAgents = candidateAgents.filter(
      (agent) => agent.status === 'AVAILABLE' && agent.activeDeliveries < agent.capacity
    );

    if (validAgents.length === 0) {
      const busyAgent = candidateAgents.find(
        (agent) => agent.status === 'BUSY' || agent.activeDeliveries >= agent.capacity
      );
      const reasonCode = busyAgent ? 'AGENT_CAPACITY_FULL' : 'NO_AVAILABLE_AGENT';
      const customerMsg = busyAgent ? REASON_MESSAGES.AGENT_CAPACITY_FULL : REASON_MESSAGES.NO_AVAILABLE_AGENT;

      const standardDays = 2;
      const estDateStr = formatDateOffset(now, standardDays);
      return recordAndReturn({
        auditId,
        productId,
        requestedQuantity: qty,
        pincode: cleanPincode,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        locationSource: geocodeResult.source,
        eligible: false,
        deliveryType: 'STANDARD',
        estimatedDeliveryDate: estDateStr,
        fastestAvailableDays: standardDays,
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        warehouseLatitude: selectedWarehouse.latitude,
        warehouseLongitude: selectedWarehouse.longitude,
        distanceKm,
        durationMinutes,
        geometry: routeGeometry,
        reasonCode,
        customerMessage: customerMsg,
      });
    }

    // Deterministic Scoring Engine for Agent Selection
    const scoredAgents = validAgents.map((agent) => {
      const zoneMatchScore = (agent.serviceZones && agent.serviceZones.includes(cleanPincode)) ? 10 : 0;
      const remainingCapacity = agent.capacity - agent.activeDeliveries;
      const remainingCapacityScore = remainingCapacity * 5;
      const workloadScore = (10 - agent.activeDeliveries) * 2;

      let proximityScore = 0;
      if (
        agent.currentLocation?.latitude != null &&
        agent.currentLocation?.longitude != null &&
        geocodeResult.latitude != null &&
        geocodeResult.longitude != null
      ) {
        const proxDist = calculateHaversineDistance(
          agent.currentLocation.latitude,
          agent.currentLocation.longitude,
          geocodeResult.latitude,
          geocodeResult.longitude
        );
        proximityScore = Math.max(0, 15 - proxDist);
      }

      const totalScore = zoneMatchScore + remainingCapacityScore + workloadScore + proximityScore;
      return { agent, score: totalScore, remainingCapacity };
    });

    // Deterministic Sort: Highest score first, tie-breaker: lowest agentId (alphabetical)
    scoredAgents.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.agent.agentId.localeCompare(b.agent.agentId);
    });

    const bestAgentRecord = scoredAgents[0];
    const selectedAgent = bestAgentRecord.agent;

    // -------------------------------------------------------------
    // STEP 13: Estimated Travel Time (Consistent with route calculation)
    // -------------------------------------------------------------
    const travelTimeMinutes = distanceKm === 0 ? 0 : (durationMinutes || Math.round((distanceKm / 30) * 60) + 10);

    // -------------------------------------------------------------
    // STEP 14: Daily Warehouse One-Day Capacity Check
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
        warehouseName: selectedWarehouse.name,
        warehouseLatitude: selectedWarehouse.latitude,
        warehouseLongitude: selectedWarehouse.longitude,
        customerLatitude: geocodeResult.latitude,
        customerLongitude: geocodeResult.longitude,
        cutoffTime: selectedWarehouse.cutoffTime,
        cutoffFormatted,
        capacityStatus: 'FULL',
        distanceKm,
        durationMinutes: travelTimeMinutes,
        travelTimeMinutes,
        reasonCode: 'DELIVERY_CAPACITY_FULL',
        customerMessage: REASON_MESSAGES.DELIVERY_CAPACITY_FULL,
        allWarehouses: Object.values(WAREHOUSES).map((w) => ({
          warehouseId: w.warehouseId,
          name: w.name,
          code: w.code,
          latitude: w.latitude,
          longitude: w.longitude,
          oneDayEnabled: w.oneDayEnabled,
          status: !w.oneDayEnabled ? 'UNAVAILABLE' : (w.currentReservedCapacity >= w.maxOneDayCapacity ? 'CONSTRAINED' : 'AVAILABLE'),
        })),
      });
    }

    // -------------------------------------------------------------
    // STEP 15: Operational Demand Level Calculation (Phase 15H)
    // -------------------------------------------------------------
    const capacityRatio = selectedWarehouse.currentReservedCapacity / selectedWarehouse.maxOneDayCapacity;
    let demandLevel = 'LOW';
    let demandFeeAddon = 0;
    if (capacityRatio >= 0.90) {
      demandLevel = 'VERY_HIGH';
      demandFeeAddon = 40;
    } else if (capacityRatio >= 0.70) {
      demandLevel = 'HIGH';
      demandFeeAddon = 25;
    } else if (capacityRatio >= 0.40) {
      demandLevel = 'MEDIUM';
      demandFeeAddon = 10;
    } else {
      demandLevel = 'LOW';
      demandFeeAddon = 0;
    }

    // -------------------------------------------------------------
    // STEP 16: Bounded Dynamic Fast Delivery Pricing (Base ₹40 + Distance + Demand)
    // Floor: ₹20 min, Cap: ₹150 max
    // -------------------------------------------------------------
    const baseFee = 40;
    const distanceFeeAddon = Math.round(distanceKm * 1.5);
    const rawFee = baseFee + distanceFeeAddon + demandFeeAddon;
    const fastDeliveryFee = Math.max(20, Math.min(150, rawFee));

    const pricing = {
      baseFee,
      distanceFee: distanceFeeAddon,
      demandFee: demandFeeAddon,
      finalFee: fastDeliveryFee,
      demandLevel,
    };

    const agentPayload = {
      agentId: selectedAgent.agentId,
      status: 'AVAILABLE',
      remainingCapacity: selectedAgent.capacity - selectedAgent.activeDeliveries,
      name: selectedAgent.name,
    };

    // -------------------------------------------------------------
    // STEP 17: Estimated Arrival Date (Tomorrow T+1)
    // -------------------------------------------------------------
    const oneDayDateStr = formatDateOffset(now, 1);

    // -------------------------------------------------------------
    // STEP 18: Deterministic Approval & Return Payload
    // -------------------------------------------------------------
    return recordAndReturn({
      auditId,
      productId,
      requestedQuantity: qty,
      pincode: cleanPincode,
      eligible: true,
      deliveryType: 'ONE_DAY',
      estimatedDeliveryDate: oneDayDateStr,
      fastestAvailableDays: 1,
      cutoffTime: selectedWarehouse.cutoffTime,
      cutoffFormatted,
      minutesUntilCutoff: minutesRemaining,
      capacityStatus: 'AVAILABLE',
      distanceKm,
      durationMinutes: travelTimeMinutes,
      travelTimeMinutes,
      agentId: selectedAgent.agentId,
      agent: agentPayload,
      demandLevel,
      pricing,
      fastDeliveryFee,
      operatingHoursStatus: 'OPEN',
      reasonCode: 'ONE_DAY_AVAILABLE',
      customerMessage: REASON_MESSAGES.ONE_DAY_AVAILABLE,
      warehouseId: selectedWarehouse.warehouseId,
      warehouseName: selectedWarehouse.name,
      warehouseLatitude: selectedWarehouse.latitude,
      warehouseLongitude: selectedWarehouse.longitude,
      customerLatitude: geocodeResult.latitude,
      customerLongitude: geocodeResult.longitude,
      locationSource: geocodeResult.source,
      routeGeometry,
      routeProvider,
      warehouseInfo: {
        warehouseId: selectedWarehouse.warehouseId,
        warehouseName: selectedWarehouse.name,
        city: selectedWarehouse.city,
        latitude: selectedWarehouse.latitude,
        longitude: selectedWarehouse.longitude,
      },
      allWarehouses: Object.values(WAREHOUSES).map((w) => ({
        warehouseId: w.warehouseId,
        name: w.name,
        code: w.code,
        latitude: w.latitude,
        longitude: w.longitude,
        oneDayEnabled: w.oneDayEnabled,
        status: !w.oneDayEnabled ? 'UNAVAILABLE' : (w.currentReservedCapacity >= w.maxOneDayCapacity ? 'CONSTRAINED' : 'AVAILABLE'),
      })),
    });

  } catch (error) {
    console.error('❌ [Delivery Engine Error]', error.stack || error.message);
    return {
      success: false,
      eligible: false,
      deliveryType: 'NONE',
      reasonCode: 'SYSTEM_ERROR',
      customerMessage: REASON_MESSAGES.SYSTEM_ERROR,
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
        estimatedDeliveryDate: data.estimatedDeliveryDate ?? null,
        warehouseId: data.warehouseInfo?.warehouseId || data.warehouseId || null,
        distanceKm: data.distanceKm ?? null,
        agentId: data.agentId || null,
        demandLevel: data.demandLevel || null,
        fastDeliveryFee: data.fastDeliveryFee ?? null,
        travelTimeMinutes: data.travelTimeMinutes ?? null,
        operatingHoursStatus: data.operatingHoursStatus || null,
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

  const resolvedWhId = data.warehouseInfo?.warehouseId || data.warehouseId || null;
  const resolvedWh = resolvedWhId ? WAREHOUSES[resolvedWhId] : null;
  const whInfo = data.warehouseInfo || (resolvedWh ? {
    warehouseId: resolvedWh.warehouseId,
    warehouseName: resolvedWh.name,
    city: resolvedWh.city,
    latitude: resolvedWh.latitude,
    longitude: resolvedWh.longitude,
  } : null);

  return {
    success: true,
    auditId: data.auditId,
    productId: data.productId,
    requestedQuantity: data.requestedQuantity,
    pincode: data.pincode,
    eligible: data.eligible,
    deliveryType: data.deliveryType,
    estimatedDeliveryDate: data.estimatedDeliveryDate ?? null,
    fastestAvailableDays: data.fastestAvailableDays ?? null,
    cutoffTime: data.cutoffTime || null,
    cutoffFormatted: data.cutoffFormatted || null,
    minutesUntilCutoff: data.minutesUntilCutoff ?? null,
    capacityStatus: data.capacityStatus || null,
    warehouseId: whInfo?.warehouseId || data.warehouseId || null,
    warehouseName: whInfo?.warehouseName || whInfo?.name || data.warehouseName || null,
    warehouseLatitude: whInfo?.latitude ?? data.warehouseLatitude ?? null,
    warehouseLongitude: whInfo?.longitude ?? data.warehouseLongitude ?? null,
    customerLatitude: data.customerLatitude ?? null,
    customerLongitude: data.customerLongitude ?? null,
    locationSource: data.locationSource || 'PIN',
    distanceKm: data.distanceKm ?? null,
    distanceType: data.distanceType || 'ROAD',
    durationMinutes: data.travelTimeMinutes ?? data.durationMinutes ?? null,
    routeGeometry: data.routeGeometry || data.geometry || null,
    geometry: data.geometry || data.routeGeometry || null,
    route: {
      available: data.distanceKm != null,
      source: data.routeProvider || 'OSRM',
      distanceKm: data.distanceKm ?? null,
      durationMinutes: data.travelTimeMinutes ?? data.durationMinutes ?? null,
      geometry: data.routeGeometry || data.geometry || [],
    },
    agentId: data.agentId || null,
    agent: data.agent || (data.agentId ? { agentId: data.agentId, status: 'AVAILABLE', remainingCapacity: 4 } : null),
    demandLevel: data.demandLevel || 'LOW',
    fee: data.fastDeliveryFee ?? null,
    fastDeliveryFee: data.fastDeliveryFee ?? null,
    pricing: data.pricing || {
      baseFee: 40,
      distanceFee: Math.round((data.distanceKm || 0) * 1.5),
      demandFee: 0,
      finalFee: data.fastDeliveryFee ?? 40,
      demandLevel: data.demandLevel || 'LOW',
    },
    travelTimeMinutes: data.travelTimeMinutes ?? null,
    operatingHoursStatus: data.operatingHoursStatus || null,
    reasonCode: data.reasonCode,
    customerMessage: data.customerMessage,
    warehouseInfo: whInfo,
    allWarehouses: data.allWarehouses || null,
  };
}
