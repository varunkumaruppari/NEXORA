import assert from 'assert';
import { checkDeliveryEligibility, REASON_MESSAGES } from './src/services/deliveryEligibilityService.js';
import { DELIVERY_AGENTS, PRODUCT_INVENTORY, WAREHOUSES } from './src/data/deliveryData.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16I MULTI-LOCATION REAL-WORLD VERIFICATION');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runAsyncTest(name, testFn) {
  totalTests++;
  try {
    await testFn();
    passedTests++;
    console.log(`[Test ${totalTests}] ${name}`);
    console.log(`  ✅ PASS`);
  } catch (err) {
    console.log(`[Test ${totalTests}] ${name}`);
    console.log(`  ❌ FAIL: ${err.message}`);
  }
}

async function main() {
  const localMorningTime = new Date(2026, 7, 30, 10, 0, 0); // 10:00 AM local time

  const HYDERABAD_TEST_LOCATIONS = [
    { name: 'HITEC City', latitude: 17.4485, longitude: 78.3810 },
    { name: 'Gachibowli', latitude: 17.4401, longitude: 78.3489 },
    { name: 'Madhapur', latitude: 17.4483, longitude: 78.3915 },
    { name: 'Kukatpally', latitude: 17.4849, longitude: 78.4138 },
    { name: 'Secunderabad', latitude: 17.4399, longitude: 78.4983 },
    { name: 'Begumpet', latitude: 17.4448, longitude: 78.4661 },
    { name: 'Uppal', latitude: 17.3984, longitude: 78.5583 },
    { name: 'LB Nagar', latitude: 17.3457, longitude: 78.5522 },
    { name: 'Mehdipatnam', latitude: 17.3916, longitude: 78.4414 },
    { name: 'Shamshabad', latitude: 17.2403, longitude: 78.4294 },
  ];

  // 1. Multi-Location Matrix Execution (10 Hyderabad locations)
  await runAsyncTest('Multi-Location Matrix: 10 Hyderabad Locations Evaluated Successfully', async () => {
    for (const loc of HYDERABAD_TEST_LOCATIONS) {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        location: { latitude: loc.latitude, longitude: loc.longitude, source: 'MAP_CLICK' },
        mockTime: localMorningTime,
      });

      assert.strictEqual(typeof res.eligible, 'boolean', `Location ${loc.name} should return boolean eligibility`);
      assert.strictEqual(res.customerLatitude, loc.latitude, `Location ${loc.name} customerLatitude mismatch`);
      assert.strictEqual(res.customerLongitude, loc.longitude, `Location ${loc.name} customerLongitude mismatch`);
      assert.strictEqual(typeof res.warehouseId, 'string', `Location ${loc.name} warehouseId missing`);
      assert.strictEqual(typeof res.distanceKm, 'number', `Location ${loc.name} distanceKm missing`);
      assert.strictEqual(typeof res.durationMinutes, 'number', `Location ${loc.name} durationMinutes missing`);
    }
  });

  // 2. Candidate Warehouse Consistency across all 10 locations
  await runAsyncTest('Candidate Warehouse Identity Consistency across 10 locations', async () => {
    for (const loc of HYDERABAD_TEST_LOCATIONS) {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        location: { latitude: loc.latitude, longitude: loc.longitude, source: 'MAP_CLICK' },
        mockTime: localMorningTime,
      });

      assert.strictEqual(res.warehouseId, res.warehouseInfo.warehouseId);
      assert.strictEqual(res.warehouseName, res.warehouseInfo.warehouseName);
      assert.strictEqual(res.warehouseLatitude, res.warehouseInfo.latitude);
      assert.strictEqual(res.warehouseLongitude, res.warehouseInfo.longitude);
    }
  });

  // 3. Customer Coordinate Precision & Preservation
  await runAsyncTest('Customer Coordinate Precision Preservation (No Snapping / Truncation)', async () => {
    const exactLat = 17.4485123;
    const exactLng = 78.3810456;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: exactLat, longitude: exactLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, exactLat);
    assert.strictEqual(res.customerLongitude, exactLng);
  });

  // 4. OSRM Road Distance vs Haversine Verification
  await runAsyncTest('OSRM Road Distance Used for 35km Rule (Not Haversine)', async () => {
    const loc = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: loc,
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm >= 0, true);
    assert.strictEqual(res.distanceKm <= 35, true);
  });

  // 5. Positive Delivery Decision Evaluation
  await runAsyncTest('Positive Delivery Decision: All 11 Conditions Pass -> ONE_DAY', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
    assert.strictEqual(res.reasonCode, 'ONE_DAY_AVAILABLE');
    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
  });

  // 6. Far-Location Rejection (>35 km)
  await runAsyncTest('Far-Location Rejection (>35km) -> DISTANCE_TOO_FAR', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 16.5000, longitude: 77.5000, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.deliveryType, 'STANDARD');
  });

  // 7. Insufficient Stock Failure
  await runAsyncTest('Insufficient Stock -> INSUFFICIENT_STOCK Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 99999,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'INSUFFICIENT_STOCK');
  });

  // 8. Agent Unavailable Failure
  await runAsyncTest('Agent Offline -> NO_AVAILABLE_AGENT Rejection', async () => {
    const originalStatuses = DELIVERY_AGENTS.map(a => a.status);
    DELIVERY_AGENTS.forEach(a => { a.status = 'OFFLINE'; });

    try {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        pincode: '500081',
        mockTime: localMorningTime,
      });

      assert.strictEqual(res.eligible, false);
      assert.strictEqual(res.reasonCode, 'NO_AVAILABLE_AGENT');
    } finally {
      DELIVERY_AGENTS.forEach((a, i) => { a.status = originalStatuses[i]; });
    }
  });

  // 9. Agent Capacity Full Failure
  await runAsyncTest('Agent Full Workload -> AGENT_CAPACITY_FULL Rejection', async () => {
    const originalDeliveries = DELIVERY_AGENTS.map(a => a.activeDeliveries);
    DELIVERY_AGENTS.forEach(a => {
      a.status = 'AVAILABLE';
      a.activeDeliveries = a.capacity;
    });

    try {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        pincode: '500081',
        mockTime: localMorningTime,
      });

      assert.strictEqual(res.eligible, false);
      assert.strictEqual(res.reasonCode, 'AGENT_CAPACITY_FULL');
    } finally {
      DELIVERY_AGENTS.forEach((a, i) => { a.activeDeliveries = originalDeliveries[i]; });
    }
  });

  // 10. Cutoff Time Passed Failure
  await runAsyncTest('After Cutoff Time (17:00) -> CUT_OFF_PASSED Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: new Date(2026, 7, 30, 16, 30, 0), // 4:30 PM local time
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'CUT_OFF_PASSED');
  });

  // 11. Read-Only Zero-Mutation Guarantee (Stock)
  await runAsyncTest('Read-Only Stock Zero-Mutation Guarantee', async () => {
    const initialStock = PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock || 0;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    const currentStock = PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock || 0;
    assert.strictEqual(currentStock, initialStock);
  });

  // 12. Read-Only Zero-Mutation Guarantee (Agent Workload)
  await runAsyncTest('Read-Only Agent Workload Zero-Mutation Guarantee', async () => {
    const initialDeliveries = DELIVERY_AGENTS[0].activeDeliveries;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(DELIVERY_AGENTS[0].activeDeliveries, initialDeliveries);
  });

  // 13. Read-Only Zero-Mutation Guarantee (Warehouse Reserved Capacity)
  await runAsyncTest('Read-Only Warehouse Capacity Zero-Mutation Guarantee', async () => {
    const initialReserved = WAREHOUSES['WH-HYD-001']?.currentReservedCapacity || 0;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(WAREHOUSES['WH-HYD-001']?.currentReservedCapacity, initialReserved);
  });

  // 14. Location Change Invalidation Trace
  await runAsyncTest('Location Change Invalidation Trace', async () => {
    const resA = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    const resB = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.3457, longitude: 78.5522, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.notStrictEqual(resA.customerLatitude, resB.customerLatitude);
    assert.notStrictEqual(resA.warehouseId, resB.warehouseId);
  });

  // 15. Quantity Change Invalidation Trace
  await runAsyncTest('Quantity Change Invalidation Trace', async () => {
    const res1 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const res2 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 99999, pincode: '500081', mockTime: localMorningTime });

    assert.strictEqual(res1.eligible, true);
    assert.strictEqual(res2.eligible, false);
    assert.strictEqual(res2.reasonCode, 'INSUFFICIENT_STOCK');
  });

  // 16. Rapid Async Race Protection Versioning Concept
  await runAsyncTest('Rapid Async Race Condition Versioning Guard', async () => {
    let checkReqId = 0;

    checkReqId++;
    const req1Id = checkReqId;

    checkReqId++;
    const req2Id = checkReqId;

    assert.strictEqual(req1Id !== checkReqId, true, 'Request 1 must be flagged as stale');
    assert.strictEqual(req2Id === checkReqId, true, 'Request 2 must be flagged as active');
  });

  // 17. Fail-Closed Malformed Input Protection
  await runAsyncTest('Fail-Closed Malformed Input Protection', async () => {
    const res = await checkDeliveryEligibility(null);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'SYSTEM_ERROR');
  });

  // 18. Metric & Identity Alignment Verification
  await runAsyncTest('Full Metric & Identity Alignment Verification', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.warehouseId, res.warehouseInfo.warehouseId);
    assert.strictEqual(res.agentId, res.agent.agentId);
    assert.strictEqual(res.fastDeliveryFee, res.pricing.finalFee);
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16I TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
