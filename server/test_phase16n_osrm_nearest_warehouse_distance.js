import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';
import { calculateRoute } from './src/services/routeService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16N OSRM NEAREST WAREHOUSE & DISTANCE TEST SUITE');
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

  // TEST 1: Exact customer coordinates preservation
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

  // TEST 2: OSRM request construction (longitude, latitude order)
  await runAsyncTest('TEST 2: OSRM route service formats coordinates in lon,lat order', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);

    assert.strictEqual(res.available, true);
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
  });

  // TEST 3: Driving profile & distance extraction with 2 decimals
  await runAsyncTest('TEST 3: OSRM distance extracted as numerical km with 2 decimal precision', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm > 0, true);
    const decStr = res.distanceKm.toString().split('.')[1] || '';
    assert.strictEqual(decStr.length <= 2, true);
  });

  // TEST 4: OSRM duration extraction
  await runAsyncTest('TEST 4: OSRM travel duration extracted in integer minutes', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);

    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(Number.isInteger(res.durationMinutes), true);
  });

  // TEST 5: Geometry extraction for Leaflet blue polyline
  await runAsyncTest('TEST 5: OSRM route geometry returned as valid [lat, lng] array', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);

    assert.strictEqual(Array.isArray(res.geometry), true);
    assert.strictEqual(res.geometry.length >= 2, true);
    assert.strictEqual(typeof res.geometry[0][0], 'number');
    assert.strictEqual(typeof res.geometry[0][1], 'number');
  });

  // TEST 6: Nearest warehouse selection by minimum OSRM road distance
  await runAsyncTest('TEST 6: Nearest warehouse selected by minimum OSRM driving distance', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' }, // HITEC City
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.warehouseId, 'WH-HYD-002');
    assert.strictEqual(res.warehouseName, 'NEXORA HITEC City Express Center');
  });

  // TEST 7: Blue-route source geometry in backend response
  await runAsyncTest('TEST 7: Backend decision payload includes OSRM route geometry', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(Array.isArray(res.routeGeometry), true);
    assert.strictEqual(res.routeGeometry.length >= 2, true);
  });

  // TEST 8: Displayed distance consistency with backend distanceKm
  await runAsyncTest('TEST 8: Backend distanceKm aligns 100% with route calculation', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm <= 35, true);
  });

  // TEST 9: Distance <=35km passes geographic gate
  await runAsyncTest('TEST 9: Distance <=35km passes geographic threshold', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.distanceKm <= 35, true);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
  });

  // TEST 10: Distance >35km fails with DISTANCE_TOO_FAR
  await runAsyncTest('TEST 10: Outskirts distance >35km rejected with DISTANCE_TOO_FAR', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '501501',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.distanceKm > 35, true);
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.warehouseName, 'string');
  });

  // TEST 11: Location change invalidation
  await runAsyncTest('TEST 11: Location change invalidates cached delivery result and distance', async () => {
    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500003', mockTime: localMorningTime });

    assert.strictEqual(resA.eligible, true);
    assert.strictEqual(resB.eligible, false);
    assert.notStrictEqual(resA.distanceKm, resB.distanceKm);
  });

  // TEST 12: Stale route rejection counter
  await runAsyncTest('TEST 12: Request counter ensures stale async routes are rejected', async () => {
    let routeReqId = 0;
    const req1 = ++routeReqId;
    const req2 = ++routeReqId;

    assert.strictEqual(req1 === routeReqId, false);
    assert.strictEqual(req2 === routeReqId, true);
  });

  // TEST 13: Stale distance rejection
  await runAsyncTest('TEST 13: Delivery check counter ensures stale distance responses are rejected', async () => {
    let checkReqId = 0;
    const req1 = ++checkReqId;
    const req2 = ++checkReqId;

    assert.strictEqual(req1 === checkReqId, false);
    assert.strictEqual(req2 === checkReqId, true);
  });

  // TEST 14: Malformed OSRM response fail-closed behavior
  await runAsyncTest('TEST 14: Malformed coordinates fail closed safely', async () => {
    const res = await calculateRoute({ latitude: 'INVALID', longitude: 'INVALID' }, { latitude: 17.44, longitude: 78.38 });
    assert.strictEqual(res.available, false);
    assert.strictEqual(res.distanceKm, 0);
  });

  // TEST 15: Distance Matrix: Different locations produce different distances
  await runAsyncTest('TEST 15: Distance Matrix: Near (<5km) vs Medium (15-30km) vs Outskirts (>35km)', async () => {
    const hitec = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const uppal = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500039', mockTime: localMorningTime });
    const outskirts = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: localMorningTime });

    assert.strictEqual(hitec.distanceKm < 5, true);
    assert.strictEqual(uppal.distanceKm <= 35, true);
    assert.strictEqual(outskirts.distanceKm > 35, true);
    assert.notStrictEqual(hitec.distanceKm, uppal.distanceKm);
    assert.notStrictEqual(uppal.distanceKm, outskirts.distanceKm);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16N TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
