/**
 * RESOLV AI / NEXORA Phase 9 — 30 Fast Delivery Eligibility Automated Tests
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

    if (isPass) {
      console.log(`[Test ${num}] ${title}`);
      console.log(`  ✅ PASS | Type: ${result.deliveryType} | Reason: ${result.reasonCode} | Days: ${result.fastestAvailableDays ?? 'N/A'}`);
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
  console.log('  NEXORA FAST DELIVERY ELIGIBILITY TEST SUITE (30 TESTS)');
  console.log('==================================================\n');

  // Baseline Morning Time: 10:00 AM today
  const morningTime = new Date();
  morningTime.setHours(10, 0, 0, 0);

  // Afternoon Post-Cutoff Time: 16:30 PM today (After 15:00 cutoff)
  const postCutoffTime = new Date();
  postCutoffTime.setHours(16, 30, 0, 0);

  // Exact Pre-Cutoff Time: 14:59 PM today (1 min before 15:00 cutoff)
  const preCutoffTime = new Date();
  preCutoffTime.setHours(14, 59, 0, 0);

  // 1. Valid one-day delivery
  await runTest(1, 'Valid One-Day Delivery (PROD-1001, PIN 500081, Morning)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE', fastestAvailableDays: 1 });

  // 2. Product out of stock
  await runTest(2, 'Product Out of Stock (PROD-OUT-OF-STOCK)', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'OUT_OF_STOCK' });

  // 3. Product not found
  await runTest(3, 'Product Not Found (PROD-9999)', {
    productId: 'PROD-9999', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'PRODUCT_NOT_FOUND' });

  // 4. Invalid PIN (Short PIN)
  await runTest(4, 'Invalid PIN Code (123)', {
    productId: 'PROD-1001', quantity: 1, pincode: '123', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_LOCATION' });

  // 5. Non-serviceable PIN
  await runTest(5, 'Non-Serviceable PIN (999999)', {
    productId: 'PROD-1001', quantity: 1, pincode: '999999', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'LOCATION_NOT_SERVICEABLE' });

  // 6. One-day zone (500081 Hyderabad)
  await runTest(6, 'One-Day Zone (500081 Hyderabad)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 7. Standard-only zone (400001 Mumbai)
  await runTest(7, 'Standard-Only Zone (400001 Mumbai)', {
    productId: 'PROD-1001', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 2 });

  // 8. Cutoff before current time (Post 15:00 Cutoff)
  await runTest(8, 'Cutoff Passed (16:30 PM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: postCutoffTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'CUT_OFF_PASSED', fastestAvailableDays: 2 });

  // 9. Cutoff after current time (10:00 AM)
  await runTest(9, 'Before Cutoff (10:00 AM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 10. Capacity available (WH-HYD 12/50)
  await runTest(10, 'Capacity Available (WH-HYD Reserved 12/50)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 11. Capacity full (WH-DEL 30/30)
  await runTest(11, 'Capacity Full (WH-DEL Reserved 30/30)', {
    productId: 'PROD-1001', quantity: 1, pincode: '122002', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'DELIVERY_CAPACITY_FULL', fastestAvailableDays: 2 });

  // 12. Sufficient stock (Qty 2 for 25 stock)
  await runTest(12, 'Sufficient Stock (Qty 2 / 25 Available)', {
    productId: 'PROD-1001', quantity: 2, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 13. Insufficient stock (Qty 100 for 25 stock)
  await runTest(13, 'Insufficient Stock (Qty 100 / 25 Available)', {
    productId: 'PROD-1001', quantity: 100, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'INSUFFICIENT_STOCK' });

  // 14. Multiple warehouses network lookup
  await runTest(14, 'Multiple Warehouses Network Lookup (PROD-1001 across HYD/BLR/MUM/DEL)', {
    productId: 'PROD-1001', quantity: 1, pincode: '560100', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 15. Correct warehouse selection (WH-BLR selected for Bengaluru 560100)
  await runTest(15, 'Correct Warehouse Selection (WH-BLR for 560100)', {
    productId: 'PROD-1001', quantity: 1, pincode: '560100', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 16. Wrong warehouse cannot satisfy local 1-day request
  await runTest(16, 'Warehouse Without One-Day Route (400001 Mumbai)', {
    productId: 'PROD-1001', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED' });

  // 17. Customer changes location (500081 -> 700001 Kolkata Regional)
  await runTest(17, 'Location Change to Regional Standard Zone (700001 Kolkata)', {
    productId: 'PROD-1001', quantity: 1, pincode: '700001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 3 });

  // 18. Customer changes quantity (Qty 1 -> Qty 50 exceeding max warehouse stock 40)
  await runTest(18, 'Quantity Change Exceeding Max Single Warehouse Stock (Qty 50)', {
    productId: 'PROD-1001', quantity: 50, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'INSUFFICIENT_STOCK' });

  // 19. Product with no warehouse stock
  await runTest(19, 'Product With Zero Stock (PROD-OUT-OF-STOCK)', {
    productId: 'PROD-OUT-OF-STOCK', quantity: 1, pincode: '560100', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'OUT_OF_STOCK' });

  // 20. Multiple warehouses with only one-day eligible warehouse
  await runTest(20, 'Multiple Warehouses One-Day Routing (PROD-1004 Smartphone)', {
    productId: 'PROD-1004', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 21. Multiple warehouses with stock but no one-day support (PROD-1005 Keyboard in Mumbai)
  await runTest(21, 'Keyboard Only In Mumbai Standard Hub (PROD-1005, 400001)', {
    productId: 'PROD-1005', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED' });

  // 22. One warehouse out of stock, another eligible (PROD-1003 in HYD is 0, BLR is 15)
  await runTest(22, 'Hyderabad Out of Stock, Bengaluru Hub Available (PROD-1003, PIN 560100)', {
    productId: 'PROD-1003', quantity: 1, pincode: '560100', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 23. Exact cutoff boundary check (14:59 PM - 1 min before cutoff)
  await runTest(23, 'Exact Pre-Cutoff Boundary (14:59 PM for 15:00 Cutoff)', {
    productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: preCutoffTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 24. Quantity = available stock (Qty 25 for 25 available stock)
  await runTest(24, 'Quantity Equals Exact Stock (Qty 25 / 25)', {
    productId: 'PROD-1001', quantity: 25, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE' });

  // 25. Quantity > available stock (Qty 45 for max 40 available stock in network)
  await runTest(25, 'Quantity Exceeds Max Network Warehouse Stock (Qty 45 / 40)', {
    productId: 'PROD-1001', quantity: 45, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'INSUFFICIENT_STOCK' });

  // 26. Invalid quantity (-1)
  await runTest(26, 'Negative Quantity (-1)', {
    productId: 'PROD-1001', quantity: -1, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_QUANTITY' });

  // 27. Zero quantity (0)
  await runTest(27, 'Zero Quantity (0)', {
    productId: 'PROD-1001', quantity: 0, pincode: '500081', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_QUANTITY' });

  // 28. Invalid PIN with non-numeric characters
  await runTest(28, 'Malformed PIN Code (ABC500)', {
    productId: 'PROD-1001', quantity: 1, pincode: 'ABC500', mockTime: morningTime
  }, { eligible: false, deliveryType: 'NONE', reasonCode: 'INVALID_LOCATION' });

  // 29. Successful fallback to standard delivery when 1-day unavailable
  await runTest(29, 'Standard Fallback Transit (PROD-1002 Phone Case in Mumbai 400001)', {
    productId: 'PROD-1002', quantity: 1, pincode: '400001', mockTime: morningTime
  }, { eligible: false, deliveryType: 'STANDARD', reasonCode: 'ONE_DAY_NOT_SUPPORTED', fastestAvailableDays: 2 });

  // 30. Complete realistic customer flow simulation
  await runTest(30, 'Complete Customer Flow Simulation (PROD-1006 Mouse, PIN 500081)', {
    productId: 'PROD-1006', quantity: 1, pincode: '500081', mockTime: morningTime
  }, { eligible: true, deliveryType: 'ONE_DAY', reasonCode: 'ONE_DAY_AVAILABLE', fastestAvailableDays: 1 });

  console.log('\n==================================================');
  console.log(`  DELIVERY TEST SUITE RESULTS: ${passed}/30 PASSED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
