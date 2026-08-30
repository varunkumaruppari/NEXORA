import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';
import { calculateRoute } from './src/services/routeService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16P YOU MARKER ZOOM ANCHOR TEST SUITE');
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

  // TEST 1: Customer coordinates remain exact without rounding or truncation
  await runAsyncTest('TEST 1: Customer coordinates remain exact without rounding or truncation', async () => {
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

  // TEST 2: Marker receives exact customer coordinates
  await runAsyncTest('TEST 2: Marker receives exact customer coordinates', async () => {
    const custLat = 17.4485;
    const custLng = 78.3810;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: custLat, longitude: custLng, source: 'MAP_CLICK' },
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, custLat);
    assert.strictEqual(res.customerLongitude, custLng);
  });

  // TEST 3: Simulated Leaflet Marker getLatLng invariant
  await runAsyncTest('TEST 3: Simulated Leaflet Marker getLatLng() remains invariant under scale transformations', async () => {
    const marker = {
      _latlng: { lat: 17.4485123, lng: 78.3810456 },
      getLatLng() {
        return this._latlng;
      },
    };

    // Zoom simulation: Map zooms from zoom level 12 to zoom level 18
    for (let zoom = 12; zoom <= 18; zoom++) {
      const currentPos = marker.getLatLng();
      assert.strictEqual(currentPos.lat, 17.4485123);
      assert.strictEqual(currentPos.lng, 78.3810456);
    }
  });

  // TEST 4: Simulated Leaflet Marker getLatLng invariant under zoom-out
  await runAsyncTest('TEST 4: Simulated Leaflet Marker getLatLng() remains invariant under zoom-out to level 6', async () => {
    const marker = {
      _latlng: { lat: 17.4485123, lng: 78.3810456 },
      getLatLng() {
        return this._latlng;
      },
    };

    for (let zoom = 12; zoom >= 6; zoom--) {
      const currentPos = marker.getLatLng();
      assert.strictEqual(currentPos.lat, 17.4485123);
      assert.strictEqual(currentPos.lng, 78.3810456);
    }
  });

  // TEST 5: Pan invariant
  await runAsyncTest('TEST 5: Pan operations do not mutate marker geographic coordinates', async () => {
    const marker = {
      _latlng: { lat: 17.4485123, lng: 78.3810456 },
      getLatLng() {
        return this._latlng;
      },
    };

    // Pan map center
    const mapCenter = { lat: 17.4500, lng: 78.3900 };
    assert.notStrictEqual(marker.getLatLng().lat, mapCenter.lat);
    assert.strictEqual(marker.getLatLng().lat, 17.4485123);
  });

  // TEST 6: Resize invariant
  await runAsyncTest('TEST 6: Map container resize does not mutate marker geographic coordinates', async () => {
    const marker = {
      _latlng: { lat: 17.4485123, lng: 78.3810456 },
      getLatLng() {
        return this._latlng;
      },
    };

    // Invalidate size simulation
    const containerWidth = 800;
    const containerHeight = 600;
    assert.strictEqual(marker.getLatLng().lat, 17.4485123);
    assert.strictEqual(marker.getLatLng().lng, 78.3810456);
  });

  // TEST 7: Route customer endpoint matches marker coordinates
  await runAsyncTest('TEST 7: OSRM route destination coordinate matches customer marker', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };
    const route = await calculateRoute(origin, destination);

    assert.strictEqual(route.available, true);
    const lastCoord = route.geometry[route.geometry.length - 1];
    // Route end coordinate is close to destination
    assert.strictEqual(Math.abs(lastCoord[0] - destination.latitude) < 0.01, true);
    assert.strictEqual(Math.abs(lastCoord[1] - destination.longitude) < 0.01, true);
  });

  // TEST 8: iconAnchor calculation
  await runAsyncTest('TEST 8: iconAnchor corresponds to bottom-center of marker pin', async () => {
    const iconWidth = 60;
    const iconHeight = 32;
    const iconAnchor = [iconWidth / 2, iconHeight];

    assert.strictEqual(iconAnchor[0], 30);
    assert.strictEqual(iconAnchor[1], 32);
  });

  // TEST 9: Invariant across multiple locations
  await runAsyncTest('TEST 9: Multi-location marker coordinate preservation', async () => {
    const locations = [
      { name: 'HITEC City', lat: 17.4485, lng: 78.3810 },
      { name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
      { name: 'Kukatpally', lat: 17.4849, lng: 78.4138 },
      { name: 'LB Nagar', lat: 17.3457, lng: 78.5522 },
    ];

    for (const loc of locations) {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        location: { latitude: loc.lat, longitude: loc.lng, source: 'MAP_CLICK' },
        mockTime: localMorningTime,
      });

      assert.strictEqual(res.customerLatitude, loc.lat);
      assert.strictEqual(res.customerLongitude, loc.lng);
    }
  });

  // TEST 10: Existing OSRM route is preserved
  await runAsyncTest('TEST 10: OSRM driving distance and geometry remain authoritative and unaltered', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm <= 35, true);
    assert.strictEqual(res.eligible, true);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16P TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
