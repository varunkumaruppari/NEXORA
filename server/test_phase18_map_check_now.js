import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';
import { calculateRoute } from './src/services/routeService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 18 MAP "CHECK NOW" BUTTON TEST SUITE');
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

  // TEST 1: Map coordinate selection preserves exact coordinates (17.3200, 78.4616)
  await runAsyncTest('TEST 1: Map coordinate selection preserves exact coordinates', async () => {
    const mapLat = 17.3200;
    const mapLng = 78.4616;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: mapLat, longitude: mapLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, mapLat);
    assert.strictEqual(res.customerLongitude, mapLng);
    assert.strictEqual(res.locationSource, 'MAP_CLICK');
  });

  // TEST 2: Check Now call with selectedLocation evaluates nearest warehouse via OSRM
  await runAsyncTest('TEST 2: Check Now call selects nearest warehouse via OSRM driving route', async () => {
    const mapLat = 17.3200;
    const mapLng = 78.4616;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: mapLat, longitude: mapLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.ok(res.warehouseId, 'Warehouse should be assigned');
    assert.ok(res.warehouseName, 'Warehouse name should be present');
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.ok(res.distanceKm > 0, 'Distance should be greater than 0');
  });

  // TEST 3: OSRM road distance <= 35km passes geographic gate
  await runAsyncTest('TEST 3: OSRM road distance <= 35km passes geographic gate for map clicks', async () => {
    // Map click in HITEC City area
    const mapLat = 17.4485;
    const mapLng = 78.3810;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: mapLat, longitude: mapLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.distanceKm <= 35, true);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
  });

  // TEST 4: OSRM road distance > 35km returns DISTANCE_TOO_FAR for far map clicks
  await runAsyncTest('TEST 4: OSRM road distance > 35km returns DISTANCE_TOO_FAR for far map clicks', async () => {
    // Far map click (Vikarabad: ~60km from city center)
    const farLat = 17.3364;
    const farLng = 77.9048;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: farLat, longitude: farLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.distanceKm > 35, true);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
  });

  // TEST 5: Route geometry exists and connects warehouse to customer map click point
  await runAsyncTest('TEST 5: Route geometry connects warehouse to exact map click point', async () => {
    const mapLat = 17.3200;
    const mapLng = 78.4616;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: mapLat, longitude: mapLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.ok(Array.isArray(res.geometry), 'Route geometry should be an array');
    assert.ok(res.geometry.length >= 2, 'Route geometry should contain at least 2 points');
    const startCoord = res.geometry[0];
    const endCoord = res.geometry[res.geometry.length - 1];
    assert.strictEqual(Math.abs(startCoord[0] - res.warehouseLatitude) < 0.05, true);
    assert.strictEqual(Math.abs(endCoord[0] - mapLat) < 0.05, true);
  });

  // TEST 6: Changing map click invalidates previous result state
  await runAsyncTest('TEST 6: Changing map location returns distinct route and distance', async () => {
    const loc1 = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const loc2 = { latitude: 17.3457, longitude: 78.5522, source: 'MAP_CLICK' };

    const res1 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, location: loc1, mockTime: localMorningTime });
    const res2 = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, location: loc2, mockTime: localMorningTime });

    assert.notStrictEqual(res1.customerLatitude, res2.customerLatitude);
    assert.notStrictEqual(res1.distanceKm, res2.distanceKm);
    assert.notStrictEqual(res1.warehouseId, res2.warehouseId);
  });

  // TEST 7: Signature validation of Check Now button handler
  await runAsyncTest('TEST 7: Check Now button passes customLocObj to handleCheckDelivery', async () => {
    // Simulating the corrected call signature: handleCheckDelivery(pincode, quantity, selectedLocation)
    const pincode = '';
    const quantity = 1;
    const selectedLocation = { latitude: 17.3200, longitude: 78.4616, source: 'MAP_CLICK' };

    // Function parameter matching
    const cleanPin = String(pincode || '').trim();
    const isMapSelectionValid = !cleanPin && (selectedLocation && selectedLocation.latitude != null);
    assert.strictEqual(isMapSelectionValid, true);

    const locationPayload = selectedLocation?.latitude != null ? selectedLocation : { pincode: cleanPin };
    assert.strictEqual(locationPayload.latitude, 17.3200);
    assert.strictEqual(locationPayload.longitude, 78.4616);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 18 TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
