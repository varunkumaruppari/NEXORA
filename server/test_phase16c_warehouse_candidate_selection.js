import assert from 'assert';

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR PHASE 16C TESTING
// -------------------------------------------------------------
function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function calculateProximityKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCandidateWarehouse(custLat, custLng, warehouses) {
  if (!isValidCoordinate(custLat, custLng) || !Array.isArray(warehouses) || warehouses.length === 0) {
    return null;
  }

  const validCandidates = warehouses.filter(
    (w) => w && isValidCoordinate(Number(w.latitude), Number(w.longitude))
  );

  if (validCandidates.length === 0) return null;

  const ranked = validCandidates.map((w) => {
    const prox = calculateProximityKm(custLat, custLng, Number(w.latitude), Number(w.longitude));
    return { warehouse: w, proximityKm: prox };
  });

  ranked.sort((a, b) => {
    if (Math.abs(a.proximityKm - b.proximityKm) > 0.0001) {
      return a.proximityKm - b.proximityKm;
    }
    return String(a.warehouse.warehouseId).localeCompare(String(b.warehouse.warehouseId));
  });

  return ranked[0].warehouse;
}

const SAMPLE_HYD_WAREHOUSES = [
  { warehouseId: 'WH-HYD-001', name: 'NEXORA Gachibowli Hub', latitude: 17.4401, longitude: 78.3489, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-002', name: 'NEXORA HITEC City Express Center', latitude: 17.4435, longitude: 78.3772, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-003', name: 'NEXORA Madhapur Hub', latitude: 17.4483, longitude: 78.3915, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-004', name: 'NEXORA Kukatpally Depot', latitude: 17.4849, longitude: 78.4138, status: 'CONSTRAINED' },
  { warehouseId: 'WH-HYD-005', name: 'NEXORA Secunderabad Hub', latitude: 17.4399, longitude: 78.4983, status: 'UNAVAILABLE' },
  { warehouseId: 'WH-HYD-006', name: 'NEXORA Begumpet Hub', latitude: 17.4448, longitude: 78.4661, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-007', name: 'NEXORA Uppal East Hub', latitude: 17.4057, longitude: 78.5601, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-008', name: 'NEXORA LB Nagar Hub', latitude: 17.3457, longitude: 78.5522, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-009', name: 'NEXORA Mehdipatnam Hub', latitude: 17.3916, longitude: 78.4398, status: 'AVAILABLE' },
  { warehouseId: 'WH-HYD-010', name: 'NEXORA Shamshabad Hub', latitude: 17.2403, longitude: 78.4294, status: 'UNAVAILABLE' },
];

console.log('==================================================');
console.log('  NEXORA PHASE 16C WAREHOUSE SELECTION TEST SUITE');
console.log('==================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`[Test ${totalTests}] ${name}`);
    console.log(`  ✅ PASS`);
  } catch (err) {
    console.log(`[Test ${totalTests}] ${name}`);
    console.log(`  ❌ FAIL: ${err.message}`);
  }
}

// -------------------------------------------------------------
// TEST CASES
// -------------------------------------------------------------
runTest('No Customer Location -> Null Selected Warehouse', () => {
  const result = getCandidateWarehouse(null, null, SAMPLE_HYD_WAREHOUSES);
  assert.strictEqual(result, null, 'Candidate warehouse should be null when customer location is null');
});

runTest('HITEC City Location -> WH-HYD-002 Candidate Selected', () => {
  const result = getCandidateWarehouse(17.4435, 78.3772, SAMPLE_HYD_WAREHOUSES);
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.warehouseId, 'WH-HYD-002');
});

runTest('Gachibowli Location -> WH-HYD-001 Candidate Selected', () => {
  const result = getCandidateWarehouse(17.4401, 78.3489, SAMPLE_HYD_WAREHOUSES);
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.warehouseId, 'WH-HYD-001');
});

runTest('Uppal Location -> WH-HYD-007 Candidate Selected', () => {
  const result = getCandidateWarehouse(17.4057, 78.5601, SAMPLE_HYD_WAREHOUSES);
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.warehouseId, 'WH-HYD-007');
});

runTest('Invalid Customer Latitude (> 90) -> Null Candidate', () => {
  const result = getCandidateWarehouse(100, 78.3772, SAMPLE_HYD_WAREHOUSES);
  assert.strictEqual(result, null);
});

runTest('Invalid Warehouse Candidate Data Handling (NaN Coordinates)', () => {
  const malformedWarehouses = [
    { warehouseId: 'WH-BAD-01', latitude: 'INVALID', longitude: 78.3772 },
    { warehouseId: 'WH-HYD-002', latitude: 17.4435, longitude: 78.3772 },
  ];
  const result = getCandidateWarehouse(17.4435, 78.3772, malformedWarehouses);
  assert.strictEqual(result.warehouseId, 'WH-HYD-002');
});

runTest('Deterministic Tie-Breaking (Identical Proximity -> Ascending ID)', () => {
  const equidistantWarehouses = [
    { warehouseId: 'WH-HYD-003', latitude: 17.4483, longitude: 78.3915 },
    { warehouseId: 'WH-HYD-002', latitude: 17.4483, longitude: 78.3915 },
  ];
  const result = getCandidateWarehouse(17.4483, 78.3915, equidistantWarehouses);
  assert.strictEqual(result.warehouseId, 'WH-HYD-002', 'Tie breaker must choose WH-HYD-002 before WH-HYD-003');
});

runTest('Customer Location Change Recalculates Warehouse Candidate', () => {
  const first = getCandidateWarehouse(17.4401, 78.3489, SAMPLE_HYD_WAREHOUSES);
  assert.strictEqual(first.warehouseId, 'WH-HYD-001');

  const second = getCandidateWarehouse(17.3457, 78.5522, SAMPLE_HYD_WAREHOUSES);
  assert.strictEqual(second.warehouseId, 'WH-HYD-008');
});

runTest('Proximity Calculation Returns Pure Numeric Distance', () => {
  const prox = calculateProximityKm(17.4401, 78.3489, 17.4435, 78.3772);
  assert.strictEqual(typeof prox, 'number');
  assert.strictEqual(Number.isFinite(prox), true);
  assert.strictEqual(prox > 0, true);
});

runTest('All 10 Hyderabad Warehouses Validated & Searchable', () => {
  SAMPLE_HYD_WAREHOUSES.forEach((wh) => {
    assert.strictEqual(isValidCoordinate(wh.latitude, wh.longitude), true);
  });
});

console.log('\n==================================================');
console.log(`  PHASE 16C TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
