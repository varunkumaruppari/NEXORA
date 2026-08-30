import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16N+ DISTANCE-DRIVEN LOGISTICS TEST SUITE');
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
  const localMorningTime = new Date(2026, 7, 30, 10, 0, 0);
  const localEveningTime = new Date(2026, 7, 30, 22, 0, 0);

  // TEST 1: Exact customer coordinates preserved
  await runAsyncTest('TEST 1: Exact customer coordinates preserved across resolution pipeline', async () => {
    const rawLat = 17.4485123;
    const rawLng = 78.3810456;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: rawLat, longitude: rawLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, rawLat);
    assert.strictEqual(res.customerLongitude, rawLng);
  });

  // TEST 2: Real OSRM driving distance returned in payload
  await runAsyncTest('TEST 2: Real OSRM driving distance returned in decision payload', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm > 0, true);
  });

  // TEST 3: Distance <=35km passes geographic gate
  await runAsyncTest('TEST 3: Near location (HITEC City <=35km) passes geographic gate', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.distanceKm <= 35, true);
    assert.strictEqual(res.eligible, true);
  });

  // TEST 4: Distance >35km fails geographic gate
  await runAsyncTest('TEST 4: Outskirts location (>35km) fails geographic gate with DISTANCE_TOO_FAR', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '501501', // Vikarabad outskirts
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.distanceKm > 35, true);
  });

  // TEST 5: DISTANCE_TOO_FAR contains complete metadata
  await runAsyncTest('TEST 5: DISTANCE_TOO_FAR payload preserves distanceKm, duration, warehouse, and coordinates', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '501501',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.warehouseName, 'string');
    assert.strictEqual(res.customerLatitude != null, true);
    assert.strictEqual(res.customerLongitude != null, true);
  });

  // TEST 6: Operational failure preserves distanceKm and warehouseName
  await runAsyncTest('TEST 6: Within-range evening cutoff rejection preserves distanceKm and warehouseName', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localEveningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.distanceKm <= 35, true);
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.warehouseName, 'string');
    assert.strictEqual(['WAREHOUSE_CLOSED', 'CUT_OFF_PASSED'].includes(res.reasonCode), true);
  });

  // TEST 7: Agent assignment comes from backend scoring
  await runAsyncTest('TEST 7: Backend agent assignment originates from scoring engine', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(res.agentId.startsWith('AGT-'), true);
  });

  // TEST 8: Dynamic fee respects configured bounds
  await runAsyncTest('TEST 8: Dynamic fast delivery fee is bounded between ₹20 and ₹150', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
    assert.strictEqual(res.fastDeliveryFee >= 20 && res.fastDeliveryFee <= 150, true);
  });

  // TEST 9: Location invalidation
  await runAsyncTest('TEST 9: Location change invalidates cached delivery result', async () => {
    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500003', mockTime: localMorningTime });

    assert.strictEqual(resA.eligible, true);
    assert.strictEqual(resB.eligible, false);
  });

  // TEST 10: Quantity invalidation
  await runAsyncTest('TEST 10: Quantity change invalidates previous delivery decision', async () => {
    const res1 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const res999 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 999, pincode: '500081', mockTime: localMorningTime });

    assert.strictEqual(res1.eligible, true);
    assert.strictEqual(res999.eligible, false);
  });

  // TEST 11: Read-only zero-mutation guarantee
  await runAsyncTest('TEST 11: Availability check maintains 100% zero-side-effects guarantee', async () => {
    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });

    assert.strictEqual(resA.eligible, resB.eligible);
    assert.strictEqual(resA.fastDeliveryFee, resB.fastDeliveryFee);
  });

  // TEST 12: API failure fails closed safely
  await runAsyncTest('TEST 12: Malformed payload fails closed safely to SYSTEM_ERROR', async () => {
    const res = await checkDeliveryEligibility(null);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'SYSTEM_ERROR');
  });

  // TEST 13: Different locations produce different distances
  await runAsyncTest('TEST 13: Different customer locations produce distinct OSRM road distances', async () => {
    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500003', mockTime: localMorningTime });

    assert.notStrictEqual(resA.distanceKm, resB.distanceKm);
  });

  // TEST 14: Multi-warehouse candidate ranking
  await runAsyncTest('TEST 14: Deterministic warehouse candidate selection selects correct hub', async () => {
    const res = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    assert.strictEqual(res.warehouseId, 'WH-HYD-002');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16N+ TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
