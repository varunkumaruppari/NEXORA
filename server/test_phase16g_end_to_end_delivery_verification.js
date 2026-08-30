import assert from 'assert';
import { checkDeliveryEligibility, REASON_MESSAGES } from './src/services/deliveryEligibilityService.js';
import { DELIVERY_AGENTS, PRODUCT_INVENTORY, WAREHOUSES } from './src/data/deliveryData.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16G E2E DELIVERY VERIFICATION & DECISION TRACE');
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

  // 1. Successful One-Day Delivery End-to-End Decision Trace
  await runAsyncTest('Complete E2E Trace: Coordinates -> Hub -> Route -> Agent -> Fee -> Eligible', async () => {
    const inputLocation = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: inputLocation,
      mockTime: localMorningTime,
    });

    // 1. Coordinates Trace Alignment
    assert.strictEqual(res.customerLatitude, inputLocation.latitude, 'Customer latitude must match input exact latitude');
    assert.strictEqual(res.customerLongitude, inputLocation.longitude, 'Customer longitude must match input exact longitude');

    // 2. Warehouse Identity Alignment
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(res.warehouseInfo.warehouseId, res.warehouseId);
    assert.strictEqual(res.warehouseInfo.latitude, res.warehouseLatitude);
    assert.strictEqual(res.warehouseInfo.longitude, res.warehouseLongitude);

    // 3. OSRM Route Metric Alignment
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(res.distanceKm <= 35, true);

    // 4. Agent & Pricing Alignment
    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(res.agent.agentId, res.agentId);
    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
    assert.strictEqual(res.pricing.finalFee, res.fastDeliveryFee);

    // 5. Final Decision Alignment
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
    assert.strictEqual(res.reasonCode, 'ONE_DAY_AVAILABLE');
  });

  // 2. Far-Location Failure Scenario (>35 km)
  await runAsyncTest('E2E Far Location (>35km) -> DISTANCE_TOO_FAR Rejection Trace', async () => {
    const inputLocation = { latitude: 16.5000, longitude: 77.5000, source: 'MAP_CLICK' }; // Remote location ~120km away
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: inputLocation,
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.deliveryType, 'STANDARD');
    assert.strictEqual(res.distanceKm > 35, true);
  });

  // 3. Agent Unavailable Scenario Trace
  await runAsyncTest('E2E Agent Offline -> NO_AVAILABLE_AGENT Rejection Trace', async () => {
    // Temporarily set agents for WH-HYD-002 offline
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
      // Restore original statuses
      DELIVERY_AGENTS.forEach((a, i) => { a.status = originalStatuses[i]; });
    }
  });

  // 4. Agent Capacity Full Scenario Trace
  await runAsyncTest('E2E Agent Full Workload -> AGENT_CAPACITY_FULL Rejection Trace', async () => {
    // Temporarily set all agents to capacity
    const originalDeliveries = DELIVERY_AGENTS.map(a => a.activeDeliveries);
    DELIVERY_AGENTS.forEach(a => {
      a.status = 'AVAILABLE';
      a.activeDeliveries = a.capacity; // Workload full
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
      // Restore original deliveries
      DELIVERY_AGENTS.forEach((a, i) => { a.activeDeliveries = originalDeliveries[i]; });
    }
  });

  // 5. Stock Failure Scenario Trace
  await runAsyncTest('E2E Stock Deficit -> INSUFFICIENT_STOCK Rejection Trace', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 99999,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'INSUFFICIENT_STOCK');
  });

  // 6. Read-Only Verification (Zero State Mutation)
  await runAsyncTest('E2E Read-Only Verification -> Zero Side-Effects Guarantee', async () => {
    const initialStock = PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock || 0;
    const initialAgentDeliveries = DELIVERY_AGENTS[0].activeDeliveries;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock, initialStock);
    assert.strictEqual(DELIVERY_AGENTS[0].activeDeliveries, initialAgentDeliveries);
  });

  // 7. Location Change Invalidation Concept
  await runAsyncTest('E2E Location Change Invalidation Trace', async () => {
    const locA = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const locB = { latitude: 17.3457, longitude: 78.5522, source: 'MAP_CLICK' };

    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, location: locA, mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, location: locB, mockTime: localMorningTime });

    assert.notStrictEqual(resA.customerLatitude, resB.customerLatitude);
    assert.notStrictEqual(resA.warehouseId, resB.warehouseId);
  });

  // 8. Quantity Change Invalidation Trace
  await runAsyncTest('E2E Quantity Change Invalidation Trace', async () => {
    const res1 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const res2 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 99999, pincode: '500081', mockTime: localMorningTime });

    assert.strictEqual(res1.eligible, true);
    assert.strictEqual(res2.eligible, false);
    assert.strictEqual(res2.reasonCode, 'INSUFFICIENT_STOCK');
  });

  // 9. Fail-Closed Protection for Malformed Payload
  await runAsyncTest('E2E Malformed Payload Fail-Closed Trace', async () => {
    const res = await checkDeliveryEligibility(null);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'SYSTEM_ERROR');
  });

  // 10. Metric Alignment Verification
  await runAsyncTest('E2E Full Metric & Identity Alignment Verification', async () => {
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
  console.log(`  PHASE 16G TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
