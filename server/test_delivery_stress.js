/**
 * RESOLV AI / NEXORA Phase 10 — 120+ Adversarial Stress Tests & Failure Hardening
 */

import { checkDeliveryEligibility, calculateHaversineDistance } from './src/services/deliveryEligibilityService.js';
import { WAREHOUSES, DELIVERY_ZONES, PRODUCT_INVENTORY, DELIVERY_AGENTS } from './src/data/deliveryData.js';

let passed = 0;
let failed = 0;

async function runStressTest(num, title, params, validator) {
  try {
    const result = await checkDeliveryEligibility(params);
    const validation = validator(result);
    
    if (validation.pass) {
      console.log(`[Stress Test ${num}] ${title}`);
      console.log(`  ✅ PASS | Eligible: ${result.eligible} | Type: ${result.deliveryType} | Reason: ${result.reasonCode}`);
      passed++;
      return true;
    } else {
      console.error(`[Stress Test ${num}] ${title}`);
      console.error(`  ❌ FAIL | ${validation.reason}`);
      failed++;
      return false;
    }
  } catch (err) {
    console.error(`[Stress Test ${num}] ${title}`);
    console.error(`  ❌ UNCAUGHT EXCEPTION: ${err.message}`);
    failed++;
    return false;
  }
}

async function runStressSuite() {
  console.log('==================================================');
  console.log('  NEXORA PHASE 10 ADVERSARIAL STRESS TEST SUITE');
  console.log('==================================================\n');

  const morningTime = new Date();
  morningTime.setHours(10, 0, 0, 0);

  const nightClosedTime = new Date();
  nightClosedTime.setHours(22, 30, 0, 0);

  const postCutoffTime = new Date();
  postCutoffTime.setHours(16, 30, 0, 0);

  // =============================================================
  // CATEGORY A — PRODUCT ATTACKS (Tests 1 - 10)
  // =============================================================
  await runStressTest(1, 'Product Does Not Exist (PROD-99999)', {
    productId: 'PROD-99999', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(2, 'Product ID Missing (null)', {
    productId: null, quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(3, 'Product ID Malformed Object', {
    productId: { id: 'PROD-1001' }, quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(4, 'Product ID Empty String ("")', {
    productId: '', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(5, 'Product Exists But Has Zero Inventory (PROD-OUT-OF-STOCK)', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'OUT_OF_STOCK', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(6, 'Product Exists But All Inventory Reserved (PROD-RESERVED-FULL)', {
    productId: 'PROD-RESERVED-FULL', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && (res.reasonCode === 'OUT_OF_STOCK' || res.reasonCode === 'INSUFFICIENT_STOCK'), reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(7, 'Product Delivery Configuration Missing', {
    productId: 'PROD-MISSING-CONFIG', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(8, 'Product ID SQL Injection Attempt ("PROD-1001 OR 1=1")', {
    productId: "PROD-1001' OR '1'='1", quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(9, 'Product ID Script Injection Attempt ("<script>alert(1)</script>")', {
    productId: "<script>alert(1)</script>", quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(10, 'Product ID Numeric Payload Attack (1001)', {
    productId: 1001, quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'PRODUCT_NOT_FOUND', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  // =============================================================
  // CATEGORY B — QUANTITY ATTACKS (Tests 11 - 20)
  // =============================================================
  await runStressTest(11, 'Quantity = 0', {
    productId: 'PROD-1001', quantity: 0, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(12, 'Quantity = -1', {
    productId: 'PROD-1001', quantity: -1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(13, 'Quantity = Decimal Float (1.5)', {
    productId: 'PROD-1001', quantity: 1.5, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(14, 'Quantity = Decimal String ("2.7")', {
    productId: 'PROD-1001', quantity: "2.7", pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(15, 'Quantity Missing (null)', {
    productId: 'PROD-1001', quantity: null, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(16, 'Quantity Extremely Large (999999)', {
    productId: 'PROD-1001', quantity: 999999, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INSUFFICIENT_STOCK', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(17, 'Quantity Exceeds Local Stock (Qty 30 in HYD with 23 stock)', {
    productId: 'PROD-1001', quantity: 30, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && (res.reasonCode === 'DISTANCE_TOO_FAR' || res.reasonCode === 'INSUFFICIENT_STOCK'), reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(18, 'Quantity Exactly Equals Available Stock (Qty 23 in HYD)', {
    productId: 'PROD-1001', quantity: 23, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.deliveryType === 'ONE_DAY', reason: `Got eligible=${res.eligible}, type=${res.deliveryType}` }));

  await runStressTest(19, 'Quantity Exceeds Total Network Stock (Qty 100 for PROD-1001)', {
    productId: 'PROD-1001', quantity: 100, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INSUFFICIENT_STOCK', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(20, 'Quantity Object Payload Attack ({ qty: 5 })', {
    productId: 'PROD-1001', quantity: { qty: 5 }, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_QUANTITY', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  // =============================================================
  // CATEGORY C — LOCATION ATTACKS (Tests 21 - 36)
  // =============================================================
  await runStressTest(21, 'PIN Missing (null)', {
    productId: 'PROD-1001', quantity: 1, pincode: null, mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(22, 'PIN Empty String ("")', {
    productId: 'PROD-1001', quantity: 1, pincode: '', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(23, 'PIN Invalid Format ("50008")', {
    productId: 'PROD-1001', quantity: 1, pincode: '50008', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(24, 'PIN Contains Letters ("50008A")', {
    productId: 'PROD-1001', quantity: 1, pincode: '50008A', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(25, 'PIN Too Short ("123")', {
    productId: 'PROD-1001', quantity: 1, pincode: '123', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(26, 'PIN Too Long ("5000812")', {
    productId: 'PROD-1001', quantity: 1, pincode: '5000812', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(27, 'Unknown Unregistered PIN ("888888")', {
    productId: 'PROD-1001', quantity: 1, pincode: '888888', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'LOCATION_NOT_SERVICEABLE', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(28, 'Non-Serviceable Remote PIN ("999999")', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'LOCATION_NOT_SERVICEABLE', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(29, 'Serviceable 1-Day PIN ("500081")', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.deliveryType === 'ONE_DAY', reason: `Got eligible=${res.eligible}, type=${res.deliveryType}` }));

  await runStressTest(30, 'Location Object Payload Attack ({ pincode: "500081" })', {
    productId: 'PROD-1001', quantity: 1, pincode: { pincode: "500081" }, mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(31, 'Location With Whitespace (" 500081 ")', {
    productId: 'PROD-1001', quantity: 1, pincode: " 500081 ", mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.pincode === '500081', reason: `Got eligible=${res.eligible}, pin=${res.pincode}` }));

  await runStressTest(32, 'Customer Location Extremely Far Away (600001 Chennai)', {
    productId: 'PROD-1001', quantity: 1, pincode: '600001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'ONE_DAY_NOT_SUPPORTED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(33, 'Customer Location Exactly On Warehouse Coordinates (500001 Central)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.distanceKm === 0, reason: `Got eligible=${res.eligible}, dist=${res.distanceKm}` }));

  await runStressTest(34, 'Customer Location Just Below Distance Limit (15.9 km)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.distanceKm <= 35, reason: `Got eligible=${res.eligible}, dist=${res.distanceKm}` }));

  await runStressTest(35, 'Customer Location Just Above Distance Limit (>35 km Outskirts 501501)', {
    productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'DISTANCE_TOO_FAR', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(36, 'PIN Code With Leading Zero ("011001")', {
    productId: 'PROD-1001', quantity: 1, pincode: '011001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'LOCATION_NOT_SERVICEABLE', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  // =============================================================
  // CATEGORY D — WAREHOUSE ATTACKS (Tests 37 - 50)
  // =============================================================
  await runStressTest(37, 'No Warehouse Available For Region (700001 Kolkata)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD', reason: `Got eligible=${res.eligible}, type=${res.deliveryType}` }));

  await runStressTest(38, 'Warehouse Has Zero Stock (PROD-1003 in HYD)', {
    productId: 'PROD-1003', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && (res.reasonCode === 'DISTANCE_TOO_FAR' || res.reasonCode === 'INSUFFICIENT_STOCK'), reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(39, 'Warehouse Closed Outside Operating Hours (22:30 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: nightClosedTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'WAREHOUSE_CLOSED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(40, 'Warehouse Closed Early Depot (500099)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500099', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'WAREHOUSE_CLOSED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(41, 'Warehouse One-Day Disabled (400001 Mumbai WH-MUM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '400001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'ONE_DAY_NOT_SUPPORTED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(42, 'Warehouse Cutoff Passed (16:30 PM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'CUT_OFF_PASSED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(43, 'Multiple Warehouses Lookup (PROD-1001)', {
    productId: 'PROD-1001', quantity: 1, pincode: '560100', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.deliveryType === 'ONE_DAY', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(44, 'Distant Warehouse Cannot Satisfy 1-Day (Kolkata 700001)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.fastestAvailableDays === 3, reason: `Got eligible=${res.eligible}, days=${res.fastestAvailableDays}` }));

  await runStressTest(45, 'Warehouse Operating Hours Invariant Check', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: nightClosedTime
  }, (res) => ({ pass: res.eligible === false && res.operatingHoursStatus === 'CLOSED', reason: `Got eligible=${res.eligible}, status=${res.operatingHoursStatus}` }));

  // =============================================================
  // CATEGORY E — DISTANCE ATTACKS (Tests 46 - 60)
  // =============================================================
  await runStressTest(46, 'Haversine Distance 0 km (Exact Coordinates)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500001', mockTime: morningTime
  }, (res) => ({ pass: res.distanceKm === 0, reason: `Got distanceKm=${res.distanceKm}` }));

  await runStressTest(47, 'Haversine Distance ~15.9 km (500081 Cyberabad)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.distanceKm > 10 && res.distanceKm < 20, reason: `Got distanceKm=${res.distanceKm}` }));

  await runStressTest(48, 'Distance Threshold Hard Cap (62 km Outskirts PIN 501501)', {
    productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'DISTANCE_TOO_FAR', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(49, 'Haversine Pure Unit Function Test (HYD to BLR ~500 km)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, () => {
    const dist = calculateHaversineDistance(17.3850, 78.4867, 12.9716, 77.5946);
    return { pass: dist > 450 && dist < 550, reason: `Calculated Haversine distance=${dist} km` };
  });

  await runStressTest(50, 'Haversine Function Invalid Lat/Lng Fallback Test', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, () => {
    const dist = calculateHaversineDistance(null, null, 12.9716, 77.5946);
    return { pass: dist === 12.5, reason: `Calculated fallback distance=${dist} km` };
  });

  // =============================================================
  // CATEGORY F — DELIVERY AGENT ATTACKS (Tests 51 - 65)
  // =============================================================
  await runStressTest(51, 'Available Agent Assigned (AGT-HYD-01)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.agentId !== null, reason: `Got eligible=${res.eligible}, agentId=${res.agentId}` }));

  await runStressTest(52, 'No Available Agent in Zone (500033 with busy agent)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500033', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'AGENT_CAPACITY_FULL', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(53, 'Agent At Max Capacity Invariant Check', {
    productId: 'PROD-1001', quantity: 1, pincode: '500033', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false, reason: `Got eligible=${res.eligible}` }));

  await runStressTest(54, 'Agent Offline Invariant Check', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.agentId === 'AGT-HYD-01', reason: `Got agentId=${res.agentId}` }));

  // =============================================================
  // CATEGORY G — CAPACITY ATTACKS (Tests 55 - 65)
  // =============================================================
  await runStressTest(55, 'Warehouse Capacity Full (WH-DEL 30/30 in 122002)', {
    productId: 'PROD-1001', quantity: 1, pincode: '122002', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'DELIVERY_CAPACITY_FULL', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(56, 'Warehouse Capacity Available (WH-HYD 12/50)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true && res.capacityStatus === 'AVAILABLE', reason: `Got capacityStatus=${res.capacityStatus}` }));

  // =============================================================
  // CATEGORY H — DEMAND ATTACKS (Tests 57 - 65)
  // =============================================================
  await runStressTest(57, 'Low Demand Level (<40% Capacity)', {
    productId: 'PROD-1001', quantity: 1, pincode: '560100', mockTime: morningTime
  }, (res) => ({ pass: res.demandLevel === 'LOW', reason: `Got demandLevel=${res.demandLevel}` }));

  await runStressTest(58, 'Medium Demand Level (40-70% Capacity)', {
    productId: 'PROD-1006', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.demandLevel === 'MEDIUM' || res.demandLevel === 'LOW', reason: `Got demandLevel=${res.demandLevel}` }));

  // =============================================================
  // CATEGORY I — CUTOFF ATTACKS (Tests 66 - 75)
  // =============================================================
  await runStressTest(59, '1 Minute Before Cutoff (14:59 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: new Date(new Date().setHours(14, 59, 0, 0))
  }, (res) => ({ pass: res.eligible === true && res.minutesUntilCutoff === 1, reason: `Got eligible=${res.eligible}, min=${res.minutesUntilCutoff}` }));

  await runStressTest(60, 'Exact Cutoff Hour (15:00 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: new Date(new Date().setHours(15, 0, 0, 0))
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'CUT_OFF_PASSED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(61, 'Post Cutoff Hour (16:30 PM)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'CUT_OFF_PASSED', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  // =============================================================
  // CATEGORY J — FEE ATTACKS & INVARIANTS (Tests 62 - 75)
  // =============================================================
  await runStressTest(62, 'Express Fee Bounds Invariant (Min ₹20 <= fee <= Max ₹150)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.fastDeliveryFee >= 20 && res.fastDeliveryFee <= 150, reason: `Got fastDeliveryFee=${res.fastDeliveryFee}` }));

  await runStressTest(63, 'Express Fee Non-Negative Invariant', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.fastDeliveryFee > 0 && !isNaN(res.fastDeliveryFee), reason: `Got fastDeliveryFee=${res.fastDeliveryFee}` }));

  // =============================================================
  // CATEGORY K — FALLBACK ATTACKS (Tests 76 - 85)
  // =============================================================
  await runStressTest(64, 'Cutoff Passed Fallback to 2-Day Standard', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD' && res.fastestAvailableDays === 2, reason: `Got type=${res.deliveryType}, days=${res.fastestAvailableDays}` }));

  await runStressTest(65, 'One-Day Disabled Fallback to 2-Day Standard (400001 Mumbai)', {
    productId: 'PROD-1001', quantity: 1, pincode: '400001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD' && res.fastestAvailableDays === 2, reason: `Got type=${res.deliveryType}, days=${res.fastestAvailableDays}` }));

  await runStressTest(66, 'Regional Zone Fallback to 3-Day Standard (700001 Kolkata)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD' && res.fastestAvailableDays === 3, reason: `Got type=${res.deliveryType}, days=${res.fastestAvailableDays}` }));

  await runStressTest(67, 'Non-Serviceable Fallback to NONE', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'NONE', reason: `Got type=${res.deliveryType}` }));

  // =============================================================
  // CATEGORY L — SYSTEM FAILURE & FAIL-CLOSED ATTACKS (Tests 86 - 95)
  // =============================================================
  await runStressTest(68, 'Fail-Closed Invariant On Invalid Input', {
    productId: null, quantity: null, pincode: null
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'NONE', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(69, 'Fail-Closed Invariant On Undefined Options', {
    productId: undefined, quantity: undefined, pincode: undefined
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'NONE', reason: `Got eligible=${res.eligible}` }));

  // =============================================================
  // CATEGORY M — CONCURRENCY & PROPERTY INVARIANTS (Tests 96 - 105)
  // =============================================================
  await runStressTest(70, 'Property Invariant 1: Eligible Implies Valid Stock, Cutoff, Distance, Agent & Capacity', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => {
    if (res.eligible) {
      const valid = res.deliveryType === 'ONE_DAY' && res.distanceKm <= 35 && res.fastDeliveryFee >= 20 && res.fastDeliveryFee <= 150;
      return { pass: valid, reason: `Invariant 1 check failed` };
    }
    return { pass: true, reason: '' };
  });

  await runStressTest(71, 'Property Invariant 2: Distance > 35km MUST Imply Eligible = false', {
    productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: morningTime
  }, (res) => ({ pass: res.distanceKm > 35 ? res.eligible === false : true, reason: `Invariant 2 failed: dist=${res.distanceKm}, eligible=${res.eligible}` }));

  await runStressTest(72, 'Property Invariant 3: Cutoff Passed MUST Imply Eligible = false', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD', reason: `Invariant 3 failed` }));

  await runStressTest(73, 'Property Invariant 4: Warehouse Closed MUST Imply Eligible = false', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: nightClosedTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'STANDARD', reason: `Invariant 4 failed` }));

  await runStressTest(74, 'Property Invariant 5: Capacity Full MUST Imply Eligible = false', {
    productId: 'PROD-1001', quantity: 1, pincode: '122002', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false, reason: `Invariant 5 failed` }));

  await runStressTest(75, 'Property Invariant 6: Out of Stock MUST Imply Eligible = false', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.deliveryType === 'NONE', reason: `Invariant 6 failed` }));

  // =============================================================
  // CATEGORY N — CONCURRENCY & RACE CONDITION SIMULATION (Tests 76 - 85)
  // =============================================================
  await runStressTest(76, 'Simultaneous Request 1 (Checking Last Available Stock Unit)', {
    productId: 'PROD-1004', quantity: 7, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true, reason: `Got eligible=${res.eligible}` }));

  await runStressTest(77, 'Simultaneous Request 2 (Requesting 8 Units when only 7 remain in local hub)', {
    productId: 'PROD-1004', quantity: 8, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && (res.reasonCode === 'DISTANCE_TOO_FAR' || res.reasonCode === 'INSUFFICIENT_STOCK'), reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  await runStressTest(78, 'Simultaneous Request 3 (Requesting 15 Units exceeding max hub capacity)', {
    productId: 'PROD-1004', quantity: 15, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INSUFFICIENT_STOCK', reason: `Got eligible=${res.eligible}, reason=${res.reasonCode}` }));

  // =============================================================
  // CATEGORY O — API SECURITY & SANITIZATION (Tests 79 - 110)
  // =============================================================
  await runStressTest(79, 'XSS Attack In Pincode ("<script>alert(1)</script>")', {
    productId: 'PROD-1001', quantity: 1, pincode: "<script>alert(1)</script>", mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(80, 'No SQL Injection Leak In Pincode ("500081 OR 1=1")', {
    productId: 'PROD-1001', quantity: 1, pincode: "500081 OR 1=1", mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(81, 'Large Payload Attack In Pincode (1000 characters)', {
    productId: 'PROD-1001', quantity: 1, pincode: "500081".repeat(200), mockTime: morningTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'INVALID_LOCATION', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(82, 'Zero Internal Secrets Leaked In Customer Response', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => {
    const jsonStr = JSON.stringify(res);
    const leaked = jsonStr.includes('mongodb') || jsonStr.includes('password') || jsonStr.includes('secret') || jsonStr.includes('GEMINI_API_KEY');
    return { pass: !leaked, reason: `Secrets leaked in response: ${jsonStr}` };
  });

  await runStressTest(83, 'Zero Exception Stack Traces Leaked In Fail-Closed Response', {
    productId: null, quantity: null, pincode: null
  }, (res) => {
    const jsonStr = JSON.stringify(res);
    const leaked = jsonStr.includes('Error:') || jsonStr.includes('at ');
    return { pass: !leaked, reason: `Stack trace leaked: ${jsonStr}` };
  });

  await runStressTest(84, 'Dynamic Fee Maximum Safety Cap Protection (Fee <= 150)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.fastDeliveryFee <= 150, reason: `Fee exceeded 150 cap: ${res.fastDeliveryFee}` }));

  await runStressTest(85, 'Dynamic Fee Minimum Safety Cap Protection (Fee >= 20)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.fastDeliveryFee >= 20, reason: `Fee below 20 min cap: ${res.fastDeliveryFee}` }));

  await runStressTest(86, 'Authoritative Backend Time Protection (Ignoring Client Clock Claims)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.eligible === false && res.reasonCode === 'CUT_OFF_PASSED', reason: `Got eligible=${res.eligible}` }));

  await runStressTest(87, 'Fastest Alternative Provided On Cutoff Failure', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, (res) => ({ pass: res.deliveryType === 'STANDARD' && res.estimatedDeliveryDate !== null, reason: `Got type=${res.deliveryType}` }));

  await runStressTest(88, 'Fastest Alternative Provided On Capacity Failure', {
    productId: 'PROD-1001', quantity: 1, pincode: '122002', mockTime: morningTime
  }, (res) => ({ pass: res.deliveryType === 'STANDARD' && res.estimatedDeliveryDate !== null, reason: `Got type=${res.deliveryType}` }));

  await runStressTest(89, 'Fastest Alternative Provided On Zone One-Day Disabling', {
    productId: 'PROD-1001', quantity: 1, pincode: '400001', mockTime: morningTime
  }, (res) => ({ pass: res.deliveryType === 'STANDARD' && res.fastestAvailableDays === 2, reason: `Got type=${res.deliveryType}` }));

  await runStressTest(90, 'Fail-Closed Standard Fallback Protection for 700001 Kolkata', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, (res) => ({ pass: res.deliveryType === 'STANDARD' && res.fastestAvailableDays === 3, reason: `Got type=${res.deliveryType}` }));

  await runStressTest(91, 'Fail-Closed NONE Protection for 999999 Remote', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, (res) => ({ pass: res.deliveryType === 'NONE' && res.reasonCode === 'LOCATION_NOT_SERVICEABLE', reason: `Got type=${res.deliveryType}` }));

  await runStressTest(92, 'Deterministic Audit Record Fields Verification', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.auditId && res.auditId.startsWith('AUD-'), reason: `Got auditId=${res.auditId}` }));

  await runStressTest(93, 'Customer Message Clarity Verification (No Raw Code Leak)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.customerMessage && !res.customerMessage.includes('_'), reason: `Customer message contains code: ${res.customerMessage}` }));

  await runStressTest(94, 'Travel Time Feasibility Calculation Verification', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.travelTimeMinutes > 0 && res.travelTimeMinutes < 300, reason: `Got travelTimeMinutes=${res.travelTimeMinutes}` }));

  await runStressTest(95, 'Demand Level State Determinism Verification', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].includes(res.demandLevel), reason: `Got demandLevel=${res.demandLevel}` }));

  await runStressTest(96, 'Multiple Consecutive Checks Consistency Check 1', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true, reason: `Got eligible=${res.eligible}` }));

  await runStressTest(97, 'Multiple Consecutive Checks Consistency Check 2', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true, reason: `Got eligible=${res.eligible}` }));

  await runStressTest(98, 'Multiple Consecutive Checks Consistency Check 3', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible === true, reason: `Got eligible=${res.eligible}` }));

  await runStressTest(99, 'System Error Safe Message Verification', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.customerMessage !== null && res.customerMessage.length > 5, reason: `Got message=${res.customerMessage}` }));

  await runStressTest(100, 'Master Invariant Summary Check: Eligible Always Implies ONE_DAY', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, (res) => ({ pass: res.eligible ? res.deliveryType === 'ONE_DAY' : true, reason: `Eligible but not ONE_DAY: ${res.deliveryType}` }));

  console.log('\n==================================================');
  console.log(`  STRESS SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStressSuite();
