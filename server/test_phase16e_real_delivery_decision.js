import assert from 'assert';
import { checkDeliveryEligibility, REASON_MESSAGES } from './src/services/deliveryEligibilityService.js';
import { DELIVERY_AGENTS, PRODUCT_INVENTORY } from './src/data/deliveryData.js';

console.log('==================================================');
console.log('  NEXORA PHASE 16E REAL DELIVERY DECISION TEST SUITE');
console.log('==================================================\n');

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
  const localLateTime = new Date(2026, 7, 30, 17, 0, 0); // 5:00 PM local time

  // 1. Valid Product & Quantity & Location -> Successful Evaluation
  await runAsyncTest('Valid Product, Quantity & HITEC Location -> Eligible One-Day Delivery', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true, 'Delivery should be eligible for 500081 at 10:00 AM');
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
    assert.strictEqual(res.reasonCode, 'ONE_DAY_AVAILABLE');
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.distanceKm, 'number');
  });

  // 2. Invalid Product Rejection
  await runAsyncTest('Invalid Product ID -> PRODUCT_NOT_FOUND Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-INVALID-999',
      quantity: 1,
      pincode: '500081',
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'PRODUCT_NOT_FOUND');
  });

  // 3. Invalid Quantity Rejection (0 or negative)
  await runAsyncTest('Invalid Quantity (0) -> INVALID_QUANTITY Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 0,
      pincode: '500081',
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'INVALID_QUANTITY');
  });

  // 4. Unserviceable Location Rejection
  await runAsyncTest('Unserviceable PIN (999999) -> LOCATION_NOT_SERVICEABLE Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '999999',
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'LOCATION_NOT_SERVICEABLE');
  });

  // 5. Insufficient Stock Rejection
  await runAsyncTest('Excessive Order Quantity -> INSUFFICIENT_STOCK Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 99999,
      pincode: '500081',
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'INSUFFICIENT_STOCK');
  });

  // 6. Cutoff Time Passed Rejection
  await runAsyncTest('Order Time After 15:00 Cutoff -> CUT_OFF_PASSED Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: new Date(2026, 7, 30, 16, 30, 0), // 4:30 PM local (after 15:00 cutoff, before 20:00 closing)
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'CUT_OFF_PASSED');
  });

  // 7. Distance > 35 km Rejection
  await runAsyncTest('Map Click Location Outside 35 km -> DISTANCE_TOO_FAR Rejection', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 16.5000, longitude: 77.5000, source: 'MAP_CLICK' }, // Remote location ~120km away
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
  });

  // 8. Read-Only Verification (No Stock Mutation)
  await runAsyncTest('Read-Only Check Does NOT Mutate Product Stock', async () => {
    const initialStock = PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock || 0;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    const currentStock = PRODUCT_INVENTORY['PROD-1001']?.warehouses?.['WH-HYD-001']?.stock || 0;
    assert.strictEqual(currentStock, initialStock, 'Stock must remain completely unmutated by availability check');
  });

  // 9. Read-Only Verification (No Agent Workload Mutation)
  await runAsyncTest('Read-Only Check Does NOT Mutate Agent Active Deliveries', async () => {
    const agent = DELIVERY_AGENTS[0];
    const initialDeliveries = agent.activeDeliveries;

    await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(agent.activeDeliveries, initialDeliveries, 'Agent activeDeliveries must remain unmutated');
  });

  // 10. Selected Warehouse Consistency
  await runAsyncTest('Decision Payload Warehouse Consistency', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.warehouseName, 'string');
    assert.strictEqual(res.warehouseId.startsWith('WH-HYD-'), true);
  });

  // 11. Customer Location Coordinates Consistency
  await runAsyncTest('Decision Payload Map-Click Customer Coordinates Consistency', async () => {
    const custLoc = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: custLoc,
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, 17.4485);
    assert.strictEqual(res.customerLongitude, 78.3810);
  });

  // 12. Real Route Distance & Duration Payload Integration
  await runAsyncTest('Decision Payload Real OSRM Route Distance & Duration Integration', async () => {
    const custLoc = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: custLoc,
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(res.distanceKm >= 0, true);
    assert.strictEqual(res.durationMinutes >= 0, true);
  });

  console.log('\n==================================================');
  console.log(`  PHASE 16E TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('==================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
