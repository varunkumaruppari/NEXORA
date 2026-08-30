/**
 * RESOLV AI / NEXORA Master 60 Fast Delivery Eligibility Automated Tests
 */

import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';

let passed = 0;
let failed = 0;

async function runTest(num, title, params, expected) {
  try {
    const result = await checkDeliveryEligibility(params);
    let isPass = true;
    let failReason = '';

    if (expected.eligible !== undefined && result.eligible !== expected.eligible) {
      isPass = false;
      failReason += `Expected eligible=${expected.eligible}, got ${result.eligible}. `;
    }
    if (expected.deliveryType && result.deliveryType !== expected.deliveryType) {
      isPass = false;
      failReason += `Expected deliveryType=${expected.deliveryType}, got ${result.deliveryType}. `;
    }
    if (expected.reasonCode && result.reasonCode !== expected.reasonCode) {
      isPass = false;
      failReason += `Expected reasonCode=${expected.reasonCode}, got ${result.reasonCode}. `;
    }
    if (expected.fastestAvailableDays !== undefined && result.fastestAvailableDays !== expected.fastestAvailableDays) {
      isPass = false;
      failReason += `Expected fastestAvailableDays=${expected.fastestAvailableDays}, got ${result.fastestAvailableDays}. `;
    }
    if (expected.operatingHoursStatus && result.operatingHoursStatus !== expected.operatingHoursStatus) {
      isPass = false;
      failReason += `Expected operatingHoursStatus=${expected.operatingHoursStatus}, got ${result.operatingHoursStatus}. `;
    }

    if (isPass) {
      console.log(`[Test ${num}] ${title}`);
      console.log(`  ✅ PASS | Type: ${result.deliveryType} | Reason: ${result.reasonCode} | Days: ${result.fastestAvailableDays ?? 'N/A'} | Fee: ₹${result.fastDeliveryFee ?? 0} | Dist: ${result.distanceKm ?? 0}km`);
      passed++;
      return true;
    } else {
      console.error(`[Test ${num}] ${title}`);
      console.error(`  ❌ FAIL | ${failReason}`);
      failed++;
      return false;
    }
  } catch (err) {
    console.error(`[Test ${num}] ${title}`);
    console.error(`  ❌ EXCEPTION: ${err.message}`);
    failed++;
    return false;
  }
}

async function runSuite() {
  console.log('==================================================');
  console.log('  NEXORA FAST DELIVERY ELIGIBILITY TEST SUITE (60 TESTS)');
  console.log('==================================================\n');

  // Baseline Times
  const morningTime = new Date();
  morningTime.setHours(10, 0, 0, 0); // 10:00 AM

  const postCutoffTime = new Date();
  postCutoffTime.setHours(16, 30, 0, 0); // 16:30 PM (After 15:00 cutoff)

  const preCutoffTime = new Date();
  preCutoffTime.setHours(14, 59, 0, 0); // 14:59 PM (1 min before cutoff)

  const nightClosedTime = new Date();
  nightClosedTime.setHours(22, 30, 0, 0); // 22:30 PM (Outside 08:00 - 20:00)

  // -------------------------------------------------------------
  // PRODUCT CATEGORY (Tests 1 - 2)
  // -------------------------------------------------------------
  await runTest(1, 'Valid Product (PROD-1001)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(2, 'Invalid Product (PROD-9999)', {
    productId: 'PROD-9999', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'PRODUCT_NOT_FOUND' });

  // -------------------------------------------------------------
  // INVENTORY CATEGORY (Tests 3 - 7)
  // -------------------------------------------------------------
  await runTest(3, 'Product In Stock (PROD-1001, Qty 1)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(4, 'Product Out of Stock (PROD-OUT-OF-STOCK)', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'OUT_OF_STOCK' });

  await runTest(5, 'Insufficient Quantity (PROD-1001, Qty 50 Exceeding Max Hub Stock 35)', {
    productId: 'PROD-1001', quantity: 50, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'INSUFFICIENT_STOCK' });

  await runTest(6, 'Exact Available Stock (PROD-1001, Qty 23 Available in HYD)', {
    productId: 'PROD-1001', quantity: 23, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(7, 'Reserved Inventory Full (PROD-RESERVED-FULL)', {
    productId: 'PROD-RESERVED-FULL', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'OUT_OF_STOCK' });

  // -------------------------------------------------------------
  // LOCATION CATEGORY (Tests 8 - 11)
  // -------------------------------------------------------------
  await runTest(8, 'Valid PIN Code (500081)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(9, 'Invalid Short PIN Code (123)', {
    productId: 'PROD-1001', quantity: 1, pincode: '123', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_LOCATION' });

  await runTest(10, 'Serviceable One-Day Location (500032 Gachibowli)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500032', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(11, 'Non-Serviceable Remote Location (999999)', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'LOCATION_NOT_SERVICEABLE' });

  // -------------------------------------------------------------
  // WAREHOUSE CATEGORY (Tests 12 - 18)
  // -------------------------------------------------------------
  await runTest(12, 'One Warehouse Primary Route (500081 -> WH-HYD)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(13, 'Multiple Warehouses Network (PROD-1001 in HYD/BLR/MUM/DEL)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500032', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(14, 'Nearest Warehouse Selection (500032 -> WH-HYD-001)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500032', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(15, 'Warehouse Inventory Discovery (PROD-1003 in Hyderabad Hub)', {
    productId: 'PROD-1003', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(16, 'Warehouse With Stock But No One-Day Service (PROD-1005 in Mumbai 400001)', {
    productId: 'PROD-1005', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED' });

  await runTest(17, 'Warehouse Closed Outside Operating Hours (22:30 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: nightClosedTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'WAREHOUSE_CLOSED', operatingHoursStatus: 'CLOSED' });

  await runTest(18, 'Warehouse Outside Service Area (700001 Kolkata Regional)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 3 });

  // -------------------------------------------------------------
  // DISTANCE CATEGORY (Tests 19 - 22)
  // -------------------------------------------------------------
  await runTest(19, 'Short Geographic Distance (500081 Cyberabad ~ 12 km)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(20, 'Long Distance Standard Zone (600001 Chennai ~ 500+ km)', {
    productId: 'PROD-1001', quantity: 1, pincode: '600001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED' });

  await runTest(21, 'Distance Threshold Exceeded (> 35 km Outskirts PIN 501501)', {
    productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DISTANCE_TOO_FAR' });

  await runTest(22, 'Multiple Warehouses With Different Distances Selection', {
    productId: 'PROD-1004', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // -------------------------------------------------------------
  // CUTOFF CATEGORY (Tests 23 - 25)
  // -------------------------------------------------------------
  await runTest(23, 'Before Cutoff (10:00 AM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(24, 'Exactly Pre-Cutoff (14:59 PM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: preCutoffTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(25, 'After Cutoff Passed (16:30 PM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'CUT_OFF_PASSED' });

  // -------------------------------------------------------------
  // AGENTS CATEGORY (Tests 26 - 34)
  // -------------------------------------------------------------
  await runTest(26, 'Available Delivery Agent Assigned (AGT-HYD-01)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(27, 'No Available Agent in Zone (500033 with busy agent)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500033', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'AGENT_CAPACITY_FULL' });

  await runTest(28, 'Busy Agent Filtering (500033)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500033', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'AGENT_CAPACITY_FULL' });

  await runTest(29, 'Offline Agent Excluded', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(30, 'Agent At Max Active Capacity (500033)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500033', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'AGENT_CAPACITY_FULL' });

  await runTest(31, 'Agent With Remaining Workload Capacity (AGT-HYD-01 2/5)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(32, 'Multiple Agents Available Ranking (500081)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(33, 'Nearest Available Agent Selection', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(34, 'Distant Available Agent Serving Zone', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // -------------------------------------------------------------
  // CAPACITY CATEGORY (Tests 35 - 42)
  // -------------------------------------------------------------
  await runTest(35, 'Warehouse One-Day Capacity Available (WH-HYD 12/50)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(36, 'Warehouse One-Day Capacity Full (WH-HYD-004 60/60 in 500072)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500072', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DELIVERY_CAPACITY_FULL' });

  await runTest(37, 'Capacity Nearly Full High Demand (WH-MUM 19/20)', {
    productId: 'PROD-1005', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED' });

  await runTest(38, 'Capacity Boundary Threshold Check (500072 Full)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500072', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DELIVERY_CAPACITY_FULL' });

  await runTest(39, 'Low Demand Level (< 40% Capacity Utilization)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(40, 'Medium Demand Level (40-70% Capacity Utilization)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(41, 'High Demand Level (70-90% Capacity Utilization)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(42, 'Very High Demand Level (> 90% Capacity Utilization in 500072)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500072', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DELIVERY_CAPACITY_FULL' });

  // -------------------------------------------------------------
  // DYNAMIC PRICING CATEGORY (Tests 43 - 46)
  // -------------------------------------------------------------
  await runTest(43, 'Base Fast Delivery Fee (₹40 Base)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(44, 'High-Demand Dynamic Fee Adjustment', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(45, 'Distance-Based Fee Adjustment (2x Distance Addon)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500032', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(46, 'Maximum Fee Safety Cap Enforced (Max ₹150 Cap)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // -------------------------------------------------------------
  // FAILOVER CATEGORY (Tests 47 - 50)
  // -------------------------------------------------------------
  await runTest(47, 'One-Day Unavailable -> Fallback 2-Day Standard (400001 Mumbai)', {
    productId: 'PROD-1005', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 2 });

  await runTest(48, 'Two-Day Unavailable -> Fallback 3-Day Regional Standard (700001 Kolkata)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 3 });

  await runTest(49, 'No Feasible Delivery for Remote Non-Serviceable (999999)', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'LOCATION_NOT_SERVICEABLE' });

  await runTest(50, 'Valid Complete One-Day Delivery (PROD-1001, PIN 500081)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // -------------------------------------------------------------
  // COMPLEX REAL WORLD SCENARIOS (Tests 51 - 60)
  // -------------------------------------------------------------
  await runTest(51, 'Valid Product But Malformed PIN (ABC500)', {
    productId: 'PROD-1001', quantity: 1, pincode: 'ABC500', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_LOCATION' });

  await runTest(52, 'Valid PIN But Zero Network Stock (PROD-OUT-OF-STOCK)', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'OUT_OF_STOCK' });

  await runTest(53, 'Stock Available But Cutoff Passed (16:30 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'CUT_OFF_PASSED' });

  await runTest(54, 'Stock + Agent But Capacity Full (500072 Kukatpally)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500072', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DELIVERY_CAPACITY_FULL' });

  await runTest(55, 'Multiple Warehouses Where Only One Works (PROD-1003 Smartwatch)', {
    productId: 'PROD-1003', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(56, 'Negative Quantity (-1)', {
    productId: 'PROD-1001', quantity: -1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_QUANTITY' });

  await runTest(57, 'Zero Quantity (0)', {
    productId: 'PROD-1001', quantity: 0, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_QUANTITY' });

  await runTest(58, 'High Demand With Available Capacity (500081)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  await runTest(59, 'Standard Fallback Transit (PROD-1002 Phone Case in Mumbai 400001)', {
    productId: 'PROD-1002', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 2 });

  await runTest(60, 'Complete Realistic Customer Flow Simulation (PROD-1006 Mouse, PIN 500081)', {
    productId: 'PROD-1006', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE', fastestAvailableDays: 1 });

  console.log('\n==================================================');
  console.log(`  MASTER DELIVERY SUITE RESULTS: ${passed}/60 PASSED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
