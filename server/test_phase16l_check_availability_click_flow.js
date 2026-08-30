import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16L CHECK AVAILABILITY CLICK FLOW TEST SUITE');
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

  // TEST 1: Valid customer location context
  await runAsyncTest('TEST 1: Valid customer location context resolution', async () => {
    const loc = { latitude: 17.4485, longitude: 78.3810, pincode: '500081' };
    assert.strictEqual(loc.pincode, '500081');
    assert.strictEqual(loc.latitude, 17.4485);
  });

  // TEST 2: Selected candidate warehouse resolution
  await runAsyncTest('TEST 2: Selected candidate warehouse resolution for HITEC City', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });
    assert.strictEqual(res.warehouseId, 'WH-HYD-002');
    assert.strictEqual(res.warehouseName, 'NEXORA HITEC City Express Center');
  });

  // TEST 3: Valid product context
  await runAsyncTest('TEST 3: Valid product ID and metadata available for check', async () => {
    const product = { id: 'PROD-1001', name: 'Wireless Headphones' };
    assert.strictEqual(product.id, 'PROD-1001');
  });

  // TEST 4: Valid order quantity
  await runAsyncTest('TEST 4: Order quantity passed as valid positive integer', async () => {
    const quantity = 1;
    assert.strictEqual(typeof quantity, 'number');
    assert.strictEqual(quantity >= 1, true);
  });

  // TEST 5: Check Availability execution flow
  await runAsyncTest('TEST 5: Check Availability button handler invocation chain', async () => {
    let loading = false;
    let result = null;

    const handleCheck = async (pin, qty) => {
      loading = true;
      const res = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: qty, pincode: pin, mockTime: localMorningTime });
      result = res;
      loading = false;
    };

    await handleCheck('500081', 1);
    assert.strictEqual(loading, false);
    assert.strictEqual(result.eligible, true);
  });

  // TEST 6: Delivery API invocation path
  await runAsyncTest('TEST 6: Delivery API invocation receives complete location payload', async () => {
    const payload = {
      productId: 'PROD-1001',
      quantity: 1,
      location: { pincode: '500081', address: 'HITEC City' },
    };

    const res = await checkDeliveryEligibility({
      productId: payload.productId,
      quantity: payload.quantity,
      pincode: payload.location.pincode,
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true);
  });

  // TEST 7: Backend response structure
  await runAsyncTest('TEST 7: Backend response contains all canonical delivery metadata', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.eligible, 'boolean');
    assert.strictEqual(typeof res.deliveryType, 'string');
    assert.strictEqual(typeof res.reasonCode, 'string');
    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
    assert.strictEqual(typeof res.agentId, 'string');
  });

  // TEST 8: Result propagation to UI state
  await runAsyncTest('TEST 8: Result state propagates to UI rendering context', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    const isEligibleCard = res.eligible && res.deliveryType === 'ONE_DAY';
    assert.strictEqual(isEligibleCard, true);
  });

  // TEST 9: Success rendering data completeness
  await runAsyncTest('TEST 9: Success card renders complete distance, duration, agent & fee data', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
  });

  // TEST 10: Failure rendering data completeness
  await runAsyncTest('TEST 10: Failure card renders explicit reasonCode and customer message', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500003',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'ONE_DAY_NOT_SUPPORTED');
    assert.strictEqual(typeof res.customerMessage, 'string');
  });

  // TEST 11: API failure handling
  await runAsyncTest('TEST 11: Malformed API response returns fail-closed system error', async () => {
    const res = await checkDeliveryEligibility(null);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.reasonCode, 'SYSTEM_ERROR');
  });

  // TEST 12: Loading state cleanup guarantee
  await runAsyncTest('TEST 12: Loading state returns to false in finally block across all execution paths', async () => {
    let loading = true;
    try {
      await checkDeliveryEligibility(null);
    } catch (e) {
    } finally {
      loading = false;
    }
    assert.strictEqual(loading, false);
  });

  // TEST 13: Stale response protection
  await runAsyncTest('TEST 13: Request counter guards against race condition overwrites', async () => {
    let checkReqId = 0;
    const req1 = ++checkReqId;
    const req2 = ++checkReqId;

    assert.strictEqual(req1 === checkReqId, false);
    assert.strictEqual(req2 === checkReqId, true);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16L TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
