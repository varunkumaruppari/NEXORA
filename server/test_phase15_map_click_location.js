/**
 * NEXORA Phase 15A + 15B — Map Click Location Selection & Backend Location Handoff Test Suite
 * Verifies all 14 Map Click, Coordinate Validation, Location Source, and Eligibility Handoff Invariants
 */

import { checkDeliveryEligibility, calculateHaversineDistance } from './src/services/deliveryEligibilityService.js';
import { geocodeLocation, isValidCoordinate } from './src/services/locationService.js';
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

async function runPhase15MapClickTestSuite() {
  console.log('==================================================');
  console.log('  NEXORA PHASE 15A + 15B MAP CLICK TEST SUITE');
  console.log('==================================================\n');

  const morningTime = new Date();
  morningTime.setHours(10, 0, 0, 0);

  // TEST 1: Valid map coordinates
  console.log('[Test 1] Valid Map Coordinates Geocoding & Validation');
  const validGeo = await geocodeLocation({ latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' });
  assert(
    validGeo.success && validGeo.latitude === 17.4485 && validGeo.longitude === 78.3810 && validGeo.source === 'MAP_CLICK',
    'Valid map click coordinates (17.4485, 78.3810) correctly geocoded with source MAP_CLICK',
    `Geo=${JSON.stringify(validGeo)}`
  );

  // TEST 2: Invalid latitude out of bounds
  console.log('[Test 2] Invalid Latitude Out of Bounds (-90 to 90)');
  const invLat = isValidCoordinate(95.0, 78.3810);
  const geoInvLat = await geocodeLocation({ latitude: 95.0, longitude: 78.3810, source: 'MAP_CLICK' });
  assert(invLat === false && geoInvLat.success === false && geoInvLat.reason === 'INVALID_LOCATION', 'Latitude > 90 correctly rejected as INVALID_LOCATION');

  // TEST 3: Invalid longitude out of bounds
  console.log('[Test 3] Invalid Longitude Out of Bounds (-180 to 180)');
  const invLon = isValidCoordinate(17.4485, 200.0);
  const geoInvLon = await geocodeLocation({ latitude: 17.4485, longitude: 200.0, source: 'MAP_CLICK' });
  assert(invLon === false && geoInvLon.success === false && geoInvLon.reason === 'INVALID_LOCATION', 'Longitude > 180 correctly rejected as INVALID_LOCATION');

  // TEST 4: Null coordinates
  console.log('[Test 4] Null / Undefined Coordinates Handling');
  const geoNull = await geocodeLocation({ latitude: null, longitude: null });
  assert(geoNull.success === false, 'Null latitude/longitude correctly rejected without crash');

  // TEST 5: String injection / malformed coordinates
  console.log('[Test 5] Malformed String Coordinate Injection Prevention');
  const geoBadStr = await geocodeLocation({ latitude: 'SELECT * FROM users', longitude: 'NaN' });
  assert(geoBadStr.success === false, 'SQL injection / NaN coordinate string correctly rejected');

  // TEST 6: Map click location reaches backend delivery eligibility engine
  console.log('[Test 6] Map Click Location Handoff to Delivery Engine');
  const resMapClick = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' },
    mockTime: morningTime,
  });
  assert(
    resMapClick.success && resMapClick.customerLatitude === 17.4485 && resMapClick.customerLongitude === 78.3810 && resMapClick.locationSource === 'MAP_CLICK',
    'Delivery engine receives exact map click coordinates and returns customer location details',
    `Res=${JSON.stringify({ lat: resMapClick.customerLatitude, lon: resMapClick.customerLongitude, src: resMapClick.locationSource })}`
  );

  // TEST 7: Customer marker coordinates match click location
  console.log('[Test 7] Customer Marker Coordinates Integrity');
  assert(
    resMapClick.customerLatitude === 17.4485 && resMapClick.customerLongitude === 78.3810,
    'Returned customer coordinates match clicked location without snapping to warehouse or PIN centroid'
  );

  // TEST 8: Second map click updates location coordinates
  console.log('[Test 8] Second Map Click Location Update');
  const resMapClick2 = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4401, longitude: 78.3489, source: 'MAP_CLICK' },
    mockTime: morningTime,
  });
  assert(
    resMapClick2.customerLatitude === 17.4401 && resMapClick2.customerLongitude === 78.3489,
    'Second map click at Gachibowli (17.4401, 78.3489) returns fresh updated coordinates',
    `Got ${resMapClick2.customerLatitude}, ${resMapClick2.customerLongitude}`
  );

  // TEST 9: Location result invalidation (different coordinates yield location-specific results)
  console.log('[Test 9] Location Specificity & Result Invalidation');
  assert(
    resMapClick.warehouseId === 'WH-HYD-002' && resMapClick2.warehouseId === 'WH-HYD-001',
    'Different map locations route to their respective nearest/optimal fulfillment hubs (HITEC City vs Gachibowli)',
    `Loc1Wh=${resMapClick.warehouseId}, Loc2Wh=${resMapClick2.warehouseId}`
  );

  // TEST 10: Warehouse information corresponds to new location
  console.log('[Test 10] Warehouse Info Response Structure');
  assert(
    resMapClick2.warehouseId && resMapClick2.warehouseName && typeof resMapClick2.warehouseLatitude === 'number',
    'Response payload includes complete warehouse metadata for map rendering',
    `WhName=${resMapClick2.warehouseName}`
  );

  // TEST 11: Existing PIN flow still works
  console.log('[Test 11] Backward Compatibility — Standard PIN Code Flow (500081)');
  const resPin = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: morningTime });
  assert(resPin.eligible === true && resPin.warehouseId === 'WH-HYD-002', 'PIN 500081 flow functions with 100% backward compatibility');

  // TEST 12: Existing GPS flow still works
  console.log('[Test 12] Backward Compatibility — Browser GPS Flow');
  const resGps = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { latitude: 17.4435, longitude: 78.3772, address: 'GPS Current Location' },
    mockTime: morningTime,
  });
  assert(resGps.eligible === true && resGps.customerLatitude === 17.4435, 'Browser GPS flow functions cleanly');

  // TEST 13: Existing Address flow still works
  console.log('[Test 13] Backward Compatibility — Address Text Flow');
  const resAddr = await checkDeliveryEligibility({
    productId: 'PROD-1001',
    quantity: 1,
    location: { address: 'Mindspace IT Park, HITEC City, Hyderabad' },
    mockTime: morningTime,
  });
  assert(resAddr.eligible === true && resAddr.pincode === '500081', 'Address text flow functions cleanly');

  // TEST 14: Distance & Travel Duration calculation remains accurate
  console.log('[Test 14] Backend Distance Engine Consistency');
  assert(
    typeof resMapClick.distanceKm === 'number' && resMapClick.distanceKm > 0 && resMapClick.travelTimeMinutes > 0,
    'Backend distance and duration calculation computed deterministically for map click location',
    `Dist=${resMapClick.distanceKm}km, Mins=${resMapClick.travelTimeMinutes}`
  );

  console.log('\n==================================================');
  console.log(`  PHASE 15 MAP CLICK TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase15MapClickTestSuite();
