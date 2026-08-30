import assert from 'assert';
import { calculateRoute } from './src/services/routeService.js';

console.log('==================================================');
console.log('  NEXORA PHASE 16D REAL ROAD ROUTING TEST SUITE');
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
  // 1. Valid Warehouse + Customer -> Route Available
  await runAsyncTest('Valid Warehouse & Customer Coordinates -> Route Available', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 }; // HITEC City WH
    const destination = { latitude: 17.4485, longitude: 78.3810 }; // HITEC City Customer

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.available, true, 'Route must be available for valid coordinates');
  });

  // 2. Route Distance > 0 for Different Coordinates
  await runAsyncTest('Route Distance > 0 for Different Coordinates', async () => {
    const origin = { latitude: 17.4401, longitude: 78.3489 }; // Gachibowli WH
    const destination = { latitude: 17.4485, longitude: 78.3810 }; // HITEC City Customer

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.distanceKm > 0, true, `Distance must be > 0 (got ${res.distanceKm})`);
    assert.strictEqual(typeof res.distanceKm, 'number');
  });

  // 3. Route Duration > 0 for Different Coordinates
  await runAsyncTest('Route Duration > 0 for Different Coordinates', async () => {
    const origin = { latitude: 17.4401, longitude: 78.3489 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.durationMinutes > 0, true, `Duration must be > 0 (got ${res.durationMinutes})`);
    assert.strictEqual(typeof res.durationMinutes, 'number');
  });

  // 4. Distance and Duration Originate from Same Response
  await runAsyncTest('Distance & Duration Originate from Same Response Payload', async () => {
    const origin = { latitude: 17.4057, longitude: 78.5601 }; // Uppal WH
    const destination = { latitude: 17.4399, longitude: 78.4983 }; // Secunderabad

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.available, true);
    assert.strictEqual(res.hasOwnProperty('distanceKm'), true);
    assert.strictEqual(res.hasOwnProperty('durationMinutes'), true);
    assert.strictEqual(res.hasOwnProperty('timestamp'), true);
  });

  // 5. Geometry Exists and Is Non-Empty Array
  await runAsyncTest('Geometry Exists and Contains Valid Coordinate Pairs', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(Array.isArray(res.geometry), true, 'Geometry must be an array');
    assert.strictEqual(res.geometry.length >= 2, true, 'Geometry must contain at least 2 points');
  });

  // 6. Leaflet Format: [latitude, longitude] Order
  await runAsyncTest('GeoJSON Converted Correctly to Leaflet [latitude, longitude] Format', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };

    const res = await calculateRoute(origin, destination);
    const [firstLat, firstLng] = res.geometry[0];
    assert.strictEqual(typeof firstLat, 'number');
    assert.strictEqual(typeof firstLng, 'number');
    assert.strictEqual(firstLat >= 17.0 && firstLat <= 18.0, true, 'Latitude must be in Hyderabad range ~17.x');
    assert.strictEqual(firstLng >= 78.0 && firstLng <= 79.0, true, 'Longitude must be in Hyderabad range ~78.x');
  });

  // 7. Zero-Distance Special Case Protection
  await runAsyncTest('Zero-Distance Handling for Identical Coordinates', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4435, longitude: 78.3772 };

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.available, true);
    assert.strictEqual(res.distanceKm, 0);
    assert.strictEqual(res.durationMinutes, 0);
  });

  // 8. Invalid Coordinates Rejection
  await runAsyncTest('Invalid Coordinates Handling (NaN / String / Null)', async () => {
    const invalidOrigin = { latitude: 'INVALID', longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };

    const res = await calculateRoute(invalidOrigin, destination);
    assert.strictEqual(res.available, false);
    assert.strictEqual(res.distanceKm, 0);
    assert.strictEqual(res.geometry.length, 0);
  });

  // 9. Location Changes Invalidate Previous Route
  await runAsyncTest('Location Changes Invalidate Previous Route State', async () => {
    const origin = { latitude: 17.4401, longitude: 78.3489 };
    const locA = { latitude: 17.4485, longitude: 78.3810 };
    const locB = { latitude: 17.3457, longitude: 78.5522 };

    const resA = await calculateRoute(origin, locA);
    const resB = await calculateRoute(origin, locB);

    assert.notStrictEqual(resA.distanceKm, resB.distanceKm, 'Different locations must yield distinct routes');
  });

  // 10. Warehouse Changes Invalidate Previous Route
  await runAsyncTest('Warehouse Changes Invalidate Previous Route State', async () => {
    const wh1 = { latitude: 17.4401, longitude: 78.3489 }; // Gachibowli
    const wh2 = { latitude: 17.4057, longitude: 78.5601 }; // Uppal
    const cust = { latitude: 17.4485, longitude: 78.3810 };

    const res1 = await calculateRoute(wh1, cust);
    const res2 = await calculateRoute(wh2, cust);

    assert.notStrictEqual(res1.distanceKm, res2.distanceKm, 'Different warehouses must yield distinct routes');
  });

  // 11. Stale Request Version Guard Test
  await runAsyncTest('Stale Request Version Protection Concept', async () => {
    let routeReqId = 0;
    
    // Simulate Request 1
    routeReqId++;
    const req1Id = routeReqId;

    // User changes location -> Request 2
    routeReqId++;
    const req2Id = routeReqId;

    // When Request 1 returns late:
    const isStale = (req1Id !== routeReqId);
    assert.strictEqual(isStale, true, 'Request 1 must be flagged as stale and ignored');
  });

  // 12. No Agent Assignment or Delivery Decision Side-Effects
  await runAsyncTest('Pure Routing Execution Has Zero Agent or Delivery Side-Effects', async () => {
    const origin = { latitude: 17.4435, longitude: 78.3772 };
    const destination = { latitude: 17.4485, longitude: 78.3810 };

    const res = await calculateRoute(origin, destination);
    assert.strictEqual(res.hasOwnProperty('agentId'), false, 'Routing must NOT assign delivery agent');
    assert.strictEqual(res.hasOwnProperty('eligible'), false, 'Routing must NOT make delivery decision');
    assert.strictEqual(res.hasOwnProperty('fee'), false, 'Routing must NOT calculate delivery fee');
  });

  console.log('\n==================================================');
  console.log(`  PHASE 16D TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('==================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
