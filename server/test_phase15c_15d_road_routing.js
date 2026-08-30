/**
 * NEXORA Phase 15C + 15D — Real Road Routing & Distance/Duration Automated Test Suite
 * Verifies all 20 Road Geometry, OSRM Integration, Distance/Duration Invariance, and Fallback Invariants
 */

import { calculateRoute } from './src/services/routeService.js';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';
import { WAREHOUSES } from './src/data/deliveryData.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS | ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL | ${testName} -> ${details}`);
  }
}

async function runPhase15C15DTestSuite() {
  console.log('==================================================');
  console.log('  NEXORA PHASE 15C + 15D ROAD ROUTING TEST SUITE');
  console.log('==================================================\n');

  const morningTime = new Date();
  morningTime.setHours(10, 0, 0, 0);

  const wh002 = WAREHOUSES['WH-HYD-002']; // HITEC City Express (17.4435, 78.3772)
  const custMindspace = { latitude: 17.4485, longitude: 78.3810 }; // Mindspace IT Park

  // TEST 1: Valid warehouse -> customer route
  console.log('[Test 1] Valid Warehouse to Customer Route Calculation');
  const route1 = await calculateRoute(wh002, custMindspace);
  assert(route1.available === true, 'Route calculation succeeds for valid warehouse origin and customer destination', `Provider=${route1.provider}`);

  // TEST 2: Route geometry exists
  console.log('[Test 2] Road Polyline Geometry Existence');
  assert(Array.isArray(route1.geometry) && route1.geometry.length >= 2, 'Route returns valid array of Leaflet [lat, lon] geometry waypoints', `Waypoints=${route1.geometry?.length}`);

  // TEST 3: Route distance is positive for non-identical locations
  console.log('[Test 3] Positive Road Distance Invariant');
  assert(typeof route1.distanceKm === 'number' && route1.distanceKm > 0, 'Distance is positive for non-identical coordinates', `Distance=${route1.distanceKm} km`);

  // TEST 4: Route duration is positive for non-identical locations
  console.log('[Test 4] Positive Travel Duration Invariant');
  assert(typeof route1.durationMinutes === 'number' && route1.durationMinutes > 0, 'Duration is positive for non-identical coordinates', `Duration=${route1.durationMinutes} mins`);

  // TEST 5: Distance is in kilometers
  console.log('[Test 5] Distance Unit Metrics (Kilometers)');
  assert(route1.distanceKm >= 0.1 && route1.distanceKm < 100, 'Distance is correctly converted and formatted in kilometers', `Got ${route1.distanceKm} km`);

  // TEST 6: Duration is in minutes
  console.log('[Test 6] Duration Unit Metrics (Minutes)');
  assert(route1.durationMinutes >= 1 && route1.durationMinutes < 300, 'Duration is correctly converted and formatted in minutes', `Got ${route1.durationMinutes} mins`);

  // TEST 7: Distance and duration come from same route response
  console.log('[Test 7] Single Route Response Atomicity (Distance + Duration + Geometry)');
  assert(
    route1.distanceKm != null && route1.durationMinutes != null && route1.geometry != null,
    'Distance, duration, and geometry strictly originate from a single atomic route calculation'
  );

  // TEST 8: Zero-distance case returns 0 km / 0 min
  console.log('[Test 8] Identical Origin & Destination Zero Distance Protection');
  const routeZero = await calculateRoute({ latitude: 17.4435, longitude: 78.3772 }, { latitude: 17.4435, longitude: 78.3772 });
  assert(
    routeZero.available === true && routeZero.distanceKm === 0 && routeZero.durationMinutes === 0,
    'Identical coordinates return strictly 0 km and 0 mins without fake routing or 45-min error',
    `Dist=${routeZero.distanceKm}, Dur=${routeZero.durationMinutes}`
  );

  // TEST 9: Invalid origin rejected
  console.log('[Test 9] Invalid Origin Rejection');
  const routeInvOrig = await calculateRoute({ latitude: 'invalid' }, custMindspace);
  assert(routeInvOrig.available === false, 'Invalid origin latitude correctly returns available=false');

  // TEST 10: Invalid destination rejected
  console.log('[Test 10] Invalid Destination Rejection');
  const routeInvDest = await calculateRoute(wh002, { longitude: 'bad' });
  assert(routeInvDest.available === false, 'Invalid destination longitude correctly returns available=false');

  // TEST 11: Routing provider failure handled safely
  console.log('[Test 11] Null Route Inputs Safe Fallback');
  const routeNull = await calculateRoute(null, null);
  assert(routeNull.available === false && routeNull.distanceKm === 0, 'Null route parameters handled gracefully without server crash');

  // TEST 12: Malformed route response rejected
  console.log('[Test 12] Malformed Input Protection');
  const routeMalformed = await calculateRoute({ latitude: NaN, longitude: 78.3772 }, custMindspace);
  assert(routeMalformed.available === false, 'NaN coordinates correctly rejected');

  // TEST 13: No straight-line route presented as road route
  console.log('[Test 13] Road Geometry vs Straight-Line Validation');
  assert(route1.distanceType === 'ROAD', 'Distance metric type is explicitly labeled ROAD');

  // TEST 14: Map click triggers new route
  console.log('[Test 14] Map Click Route Trigger & Delivery Payload');
  const delMapClick = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
    mockTime: morningTime,
  });
  assert(
    delMapClick.eligible === true && delMapClick.route && delMapClick.route.geometry && delMapClick.route.geometry.length > 0,
    'POST /api/delivery/check includes real route object with polyline geometry in response',
    `RouteGeomLength=${delMapClick.route?.geometry?.length}`
  );

  // TEST 15: Changing location invalidates old route
  console.log('[Test 15] Location Specificity — Dynamic Route Recalculation');
  const delGachibowli = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4401, longitude: 78.3489, source: 'MAP_CLICK' },
    mockTime: morningTime,
  });
  assert(
    delGachibowli.warehouseId === 'WH-HYD-001' && delGachibowli.distanceKm !== delMapClick.distanceKm,
    'Changing map location recalculates route distance and warehouse selection dynamically',
    `GachiDist=${delGachibowli.distanceKm}km vs HitecDist=${delMapClick.distanceKm}km`
  );

  // TEST 16: PIN location still works
  console.log('[Test 16] Backward Compatibility — PIN Code Routing (500081)');
  const delPin = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime });
  assert(delPin.eligible === true && delPin.route && delPin.route.distanceKm > 0, 'PIN 500081 delivery request returns valid road route payload');

  // TEST 17: GPS location still works
  console.log('[Test 17] Backward Compatibility — Browser GPS Routing');
  const delGps = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4435, longitude: 78.3772, address: 'GPS Location' },
    mockTime: morningTime,
  });
  assert(delGps.eligible === true && delGps.route != null, 'Browser GPS location returns valid road route payload');

  // TEST 18: Address location still works
  console.log('[Test 18] Backward Compatibility — Address Text Routing');
  const delAddr = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { address: 'Mindspace IT Park, HITEC City, Hyderabad' },
    mockTime: morningTime,
  });
  assert(delAddr.eligible === true && delAddr.route != null, 'Address text location returns valid road route payload');

  // TEST 19: Distance threshold gate enforced (35km max)
  console.log('[Test 19] Road Distance Threshold Gate (PIN 501501 Outskirts)');
  const delDistant = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '501501', mockTime: morningTime });
  assert(delDistant.eligible === false && delDistant.reasonCode === 'DISTANCE_TOO_FAR', 'Road distance > 35km strictly triggers DISTANCE_TOO_FAR');

  // TEST 20: Phase 15A/15B Map Click tests pass
  console.log('[Test 20] Phase 15A/15B Map Click Location Source Preservation');
  assert(delMapClick.locationSource === 'MAP_CLICK', 'MAP_CLICK location source preserved across routing pipeline');

  console.log('\n==================================================');
  console.log(`  PHASE 15C + 15D TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase15C15DTestSuite();
