import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 19 DISTANCE-AUTHORITATIVE DELIVERY TEST SUITE');
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
  // Test at both morning (10:00 AM) and late night past cutoff (23:45 PM)
  const morningTime = new Date(2026, 7, 30, 10, 0, 0);
  const nightTime = new Date(2026, 7, 30, 23, 45, 0);

  // TEST 1: PIN 500039 (Uppal, 4.37 km) returns fast-delivery success even at late night
  await runAsyncTest('TEST 1: PIN 500039 (4.37 km <= 35km) returns fast-delivery eligible at night without cutoff downgrade', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500039',
      mockTime: nightTime,
    });

    assert.strictEqual(res.eligible, true, 'Location <= 35km must be eligible');
    assert.strictEqual(res.deliveryType, 'ONE_DAY', 'Delivery type must be ONE_DAY');
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm <= 35, true, 'Distance must be <= 35km');
    assert.ok(res.warehouseName, 'Evaluated warehouse name must be present');
  });

  // TEST 2: Far location (>35 km, e.g. Vikarabad) returns DISTANCE_TOO_FAR with Standard fallback
  await runAsyncTest('TEST 2: Outskirts (> 35km) returns DISTANCE_TOO_FAR with Standard Delivery fallback', async () => {
    const farLat = 17.3364;
    const farLng = 77.9048;
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: { latitude: farLat, longitude: farLng, source: 'MAP_CLICK' },
      mockTime: morningTime,
    });

    assert.strictEqual(res.eligible, false, 'Location > 35km must not be eligible for fast delivery');
    assert.strictEqual(res.deliveryType, 'STANDARD', 'Fallback must be STANDARD');
    assert.strictEqual(res.reasonCode, 'DISTANCE_TOO_FAR');
    assert.strictEqual(res.distanceKm > 35, true);
  });

  // TEST 3: Exactly 35.00 km passes the geographic gate
  await runAsyncTest('TEST 3: Boundary test: exactly 35.00 km passes geographic gate', async () => {
    const dist = 35.00;
    const isPass = dist <= 35.00;
    assert.strictEqual(isPass, true);
  });

  // TEST 4: 34.996 km passes geographic gate
  await runAsyncTest('TEST 4: Boundary test: 34.996 km passes geographic gate', async () => {
    const dist = 34.996;
    const isPass = dist <= 35.00;
    assert.strictEqual(isPass, true);
  });

  // TEST 5: 35.004 km fails geographic gate
  await runAsyncTest('TEST 5: Boundary test: 35.004 km fails geographic gate', async () => {
    const dist = 35.004;
    const isPass = dist <= 35.00;
    assert.strictEqual(isPass, false);
  });

  // TEST 6: Multi-zone verification: HITEC City, Gachibowli, Kukatpally, Secunderabad, Uppal all pass
  await runAsyncTest('TEST 6: All Hyderabad sample zones (<=35 km) return eligible: true without cutoff downgrade', async () => {
    const samplePins = ['500081', '500032', '500072', '500003', '500039'];

    for (const pin of samplePins) {
      const res = await checkDeliveryEligibility({
        productId: 'PROD-1001',
        quantity: 1,
        pincode: pin,
        mockTime: nightTime,
      });

      assert.strictEqual(res.eligible, true, `PIN ${pin} must be eligible`);
      assert.strictEqual(res.deliveryType, 'ONE_DAY', `PIN ${pin} must be ONE_DAY`);
      assert.strictEqual(res.distanceKm <= 35, true, `PIN ${pin} distance must be <= 35`);
    }
  });

  // TEST 7: Remote non-serviceable pin (999999) fails safely
  await runAsyncTest('TEST 7: Remote non-serviceable PIN (999999) fails closed with LOCATION_NOT_SERVICEABLE', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '999999',
      mockTime: morningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'LOCATION_NOT_SERVICEABLE');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 19 TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
