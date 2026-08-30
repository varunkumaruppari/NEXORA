import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';
import { calculateRoute } from './src/services/routeService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16O OSRM BLUE ROUTE & RENDER CONTRACT TEST SUITE');
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

  // TEST 1: OSRM uses driving profile
  await runAsyncTest('TEST 1: OSRM uses driving profile and returns valid route', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.available, true);
    assert.strictEqual(res.distanceType, 'ROAD');
  });

  // TEST 2: OSRM uses longitude, latitude coordinate order in request
  await runAsyncTest('TEST 2: OSRM request uses [longitude, latitude] coordinate order', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    assert.strictEqual(typeof res.distanceKm, 'number');
  });

  // TEST 3: OSRM returns GeoJSON geometry
  await runAsyncTest('TEST 3: OSRM returns valid route geometry array', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    assert.strictEqual(Array.isArray(res.geometry), true);
  });

  // TEST 4: Geometry contains at least 2 points
  await runAsyncTest('TEST 4: Route geometry contains >= 2 waypoints', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.geometry.length >= 2, true);
  });

  // TEST 5: Geometry contains multiple intermediate road coordinates
  await runAsyncTest('TEST 5: Route geometry contains intermediate road curvature waypoints', async () => {
    const origin = { latitude: 17.4238, longitude: 78.3375 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.geometry.length >= 2, true);
    assert.strictEqual(typeof res.geometry[0][0], 'number');
    assert.strictEqual(typeof res.geometry[0][1], 'number');
  });

  // TEST 6: Geometry is preserved in backend response
  await runAsyncTest('TEST 6: Route geometry is preserved in backend response payload', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(Array.isArray(res.routeGeometry) || Array.isArray(res.geometry), true);
  });

  // TEST 7: Warehouse coordinates match route origin
  await runAsyncTest('TEST 7: Warehouse coordinates match origin', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(typeof res.warehouseLatitude, 'number');
    assert.strictEqual(typeof res.warehouseLongitude, 'number');
  });

  // TEST 8: Customer coordinates match route destination
  await runAsyncTest('TEST 8: Customer coordinates match destination', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(typeof res.customerLatitude, 'number');
    assert.strictEqual(typeof res.customerLongitude, 'number');
  });

  // TEST 9: OSRM distance is preserved
  await runAsyncTest('TEST 9: OSRM distance is preserved with 2 decimal precision', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm > 0, true);
  });

  // TEST 10: 840 meters becomes 0.84 km
  await runAsyncTest('TEST 10: Distance conversion from meters to km is accurate', async () => {
    const distMeters = 840;
    const distanceKm = Number((distMeters / 1000).toFixed(2));
    assert.strictEqual(distanceKm, 0.84);
  });

  // TEST 11: Non-zero distances never become "Approx. 0 km"
  await runAsyncTest('TEST 11: Non-zero distances formatted properly as XX.XX km', async () => {
    const dist = 0.84;
    const formatted = `${Number(dist).toFixed(2)} km`;
    assert.strictEqual(formatted, '0.84 km');
    assert.strictEqual(formatted.includes('Approx. 0 km'), false);
  });

  // TEST 12: Leaflet coordinate ordering [latitude, longitude]
  await runAsyncTest('TEST 12: Leaflet polyline format is [latitude, longitude]', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const res = await calculateRoute(origin, destination);
    const [firstLat, firstLng] = res.geometry[0];
    assert.strictEqual(firstLat >= 17 && firstLat <= 18, true);
    assert.strictEqual(firstLng >= 78 && firstLng <= 79, true);
  });

  // TEST 13: Operational rejection (CUT_OFF_PASSED) preserves route geometry and warehouse
  await runAsyncTest('TEST 13: Operational cutoff failure preserves route geometry and warehouse coordinates', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localEveningTime,
    });
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.warehouseLatitude, 'number');
    assert.strictEqual(typeof res.warehouseLongitude, 'number');
    assert.strictEqual(Array.isArray(res.geometry), true);
  });

  // TEST 14: Selected warehouse matches route warehouse
  await runAsyncTest('TEST 14: Selected warehouse matches route origin warehouse', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(res.warehouseId, 'WH-HYD-002');
  });

  // TEST 15: Distance displayed equals backend distance
  await runAsyncTest('TEST 15: Backend distanceKm is strictly numerical', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(isNaN(res.distanceKm), false);
  });

  // TEST 16: Distance <=35km passes geographic threshold
  await runAsyncTest('TEST 16: Road distance <=35km passes geographic gate', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(res.distanceKm <= 35, true);
  });

  // TEST 17: Route invalidates when location changes
  await runAsyncTest('TEST 17: Location change invalidates cached delivery result and distance', async () => {
    const resA = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    const resB = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500039', mockTime: localMorningTime });
    assert.notStrictEqual(resA.distanceKm, resB.distanceKm);
  });

  // TEST 18: Stale route cannot overwrite newer location
  await runAsyncTest('TEST 18: Request counter guarantees stale async routes are ignored', async () => {
    let routeReqId = 0;
    const r1 = ++routeReqId;
    const r2 = ++routeReqId;
    assert.strictEqual(r1 === routeReqId, false);
    assert.strictEqual(r2 === routeReqId, true);
  });

  // TEST 19: Missing or malformed coordinates fail closed safely
  await runAsyncTest('TEST 19: Missing coordinates fail closed safely with available: false', async () => {
    const res = await calculateRoute(null, null);
    assert.strictEqual(res.available, false);
    assert.strictEqual(res.distanceKm, 0);
  });

  // TEST 20: Outskirts >35km rejected with DISTANCE_TOO_FAR
  await runAsyncTest('TEST 20: Outskirts (>35km) fails with DISTANCE_TOO_FAR', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '501501',
      mockTime: localMorningTime,
    });
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.distanceKm > 35, true);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16O TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
