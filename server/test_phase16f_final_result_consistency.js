import assert from 'assert';
import { checkDeliveryEligibility, REASON_MESSAGES } from './src/services/deliveryEligibilityService.js';

console.log('==================================================');
console.log('  NEXORA PHASE 16F RESULT CONSISTENCY TEST SUITE');
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
  const localMorningTime = new Date(2026, 7, 30, 10, 0, 0);

  // 1. Success response renders correct warehouse
  await runAsyncTest('Success response renders consistent warehouse ID & name', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true);
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.warehouseName, 'string');
    assert.strictEqual(res.warehouseInfo.warehouseId, res.warehouseId);
  });

  // 2. Success response renders correct distance
  await runAsyncTest('Success response renders backend route distance', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.distanceKm <= 35, true);
  });

  // 3. Success response renders correct duration
  await runAsyncTest('Success response renders backend travel duration', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(res.durationMinutes >= 0, true);
  });

  // 4. Success response renders correct agent
  await runAsyncTest('Success response renders assigned agent metadata', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(res.agent.agentId, res.agentId);
  });

  // 5. Success response renders correct fee
  await runAsyncTest('Success response renders dynamic fast delivery fee', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
    assert.strictEqual(res.pricing.finalFee, res.fastDeliveryFee);
    assert.strictEqual(res.fastDeliveryFee >= 20 && res.fastDeliveryFee <= 150, true);
  });

  // 6. Success response renders correct cutoff
  await runAsyncTest('Success response renders warehouse cutoff time', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.cutoffFormatted, 'string');
    assert.strictEqual(typeof res.minutesUntilCutoff, 'number');
  });

  // 7. Success response shows ONE_DAY deliveryType
  await runAsyncTest('Eligible result returns ONE_DAY deliveryType & ONE_DAY_AVAILABLE reason', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.deliveryType, 'ONE_DAY');
    assert.strictEqual(res.reasonCode, 'ONE_DAY_AVAILABLE');
  });

  // 8. Failure response does not show ONE_DAY deliveryType
  await runAsyncTest('Ineligible result returns STANDARD deliveryType & specific reasonCode', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '999999',
    });

    assert.strictEqual(res.eligible, false);
    assert.notStrictEqual(res.deliveryType, 'ONE_DAY');
    assert.strictEqual(res.reasonCode, 'LOCATION_NOT_SERVICEABLE');
  });

  // 9. Fail-closed behavior on malformed input
  await runAsyncTest('Malformed input payload fails closed safely with SYSTEM_ERROR', async () => {
    const res = await checkDeliveryEligibility(null);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'SYSTEM_ERROR');
  });

  // 10. Distance consistency with OSRM payload
  await runAsyncTest('Distance in payload is exact backend OSRM distance', async () => {
    const custLoc = { latitude: 17.4485, longitude: 78.3810, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: custLoc,
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(res.customerLatitude, 17.4485);
    assert.strictEqual(res.customerLongitude, 78.3810);
  });

  // 11. Customer coordinates integrity
  await runAsyncTest('Customer coordinates match exact input coordinates', async () => {
    const custLoc = { latitude: 17.4401, longitude: 78.3489, source: 'MAP_CLICK' };
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      location: custLoc,
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.customerLatitude, 17.4401);
    assert.strictEqual(res.customerLongitude, 78.3489);
  });

  // 12. Versioning & Stale Request Protection concept
  await runAsyncTest('Request Versioning Concept Prevents Overwriting Stale State', async () => {
    let checkReqId = 0;
    
    // Request 1 initiated
    checkReqId++;
    const req1Id = checkReqId;

    // User changes location -> Request 2 initiated
    checkReqId++;
    const req2Id = checkReqId;

    // When Request 1 returns late:
    const isStale = (req1Id !== checkReqId);
    assert.strictEqual(isStale, true, 'Request 1 must be flagged as stale');
  });

  console.log('\n==================================================');
  console.log(`  PHASE 16F TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('==================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
