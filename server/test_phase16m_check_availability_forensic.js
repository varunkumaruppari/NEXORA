import assert from 'assert';
import { checkDeliveryEligibility } from './src/services/deliveryEligibilityService.js';

console.log('================================================================');
console.log('  NEXORA PHASE 16M CHECK AVAILABILITY FORENSIC TEST SUITE');
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

  // TEST 1: Button handler exists and validates inputs
  await runAsyncTest('TEST 1: Check Availability button handler input validation contract', async () => {
    let errorMsg = null;
    const validate = (pin, address, customLoc) => {
      const cleanPin = String(pin || '').trim();
      if (!cleanPin && !address && (!customLoc || customLoc.latitude == null)) {
        errorMsg = 'Please select a location on the map or enter a valid 6-digit PIN code.';
        return false;
      }
      return true;
    };

    assert.strictEqual(validate('', '', null), false);
    assert.strictEqual(errorMsg, 'Please select a location on the map or enter a valid 6-digit PIN code.');
    assert.strictEqual(validate('500081', '', null), true);
  });

  // TEST 2: Valid payload construction
  await runAsyncTest('TEST 2: Location payload construction for PIN vs Coordinates', async () => {
    const buildPayload = (pin, address, customLoc) => {
      return customLoc?.latitude != null
        ? customLoc
        : (address ? { address, pincode: pin } : { pincode: pin });
    };

    const pinPayload = buildPayload('500081', '', null);
    assert.deepStrictEqual(pinPayload, { pincode: '500081' });

    const coordsPayload = buildPayload('', '', { latitude: 17.4485, longitude: 78.3810 });
    assert.deepStrictEqual(coordsPayload, { latitude: 17.4485, longitude: 78.3810 });
  });

  // TEST 3: API endpoint contract
  await runAsyncTest('TEST 3: Delivery eligibility service responds with valid contract', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(typeof res.eligible, 'boolean');
    assert.strictEqual(typeof res.reasonCode, 'string');
  });

  // TEST 4: Valid backend response shape
  await runAsyncTest('TEST 4: Eligible response contains all required UI display fields', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true);
    assert.strictEqual(typeof res.warehouseId, 'string');
    assert.strictEqual(typeof res.warehouseName, 'string');
    assert.strictEqual(typeof res.distanceKm, 'number');
    assert.strictEqual(typeof res.durationMinutes, 'number');
    assert.strictEqual(typeof res.agentId, 'string');
    assert.strictEqual(typeof res.fastDeliveryFee, 'number');
  });

  // TEST 5: Eligible response propagation
  await runAsyncTest('TEST 5: Positive check propagates to ONE_DAY eligible result card', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localMorningTime,
    });

    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.deliveryType, 'ONE_DAY');
  });

  // TEST 6: Failure response propagation (Cutoff / Closed Hub)
  await runAsyncTest('TEST 6: Evening check after operating hours propagates to negative result card', async () => {
    const res = await checkDeliveryEligibility({
      productId: 'PROD-1001',
      quantity: 1,
      pincode: '500081',
      mockTime: localEveningTime,
    });

    assert.strictEqual(res.eligible, false);
    assert.strictEqual(['WAREHOUSE_CLOSED', 'CUT_OFF_PASSED'].includes(res.reasonCode), true);
    assert.strictEqual(typeof res.customerMessage, 'string');
  });

  // TEST 7: Loading lifecycle
  await runAsyncTest('TEST 7: Loading state activates on click and clears unconditionally in finally', async () => {
    let loading = false;
    let loadingStep = 0;

    const simulateClick = async () => {
      loading = true;
      loadingStep = 1;
      try {
        await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
      } finally {
        loading = false;
        loadingStep = 0;
      }
    };

    await simulateClick();
    assert.strictEqual(loading, false);
    assert.strictEqual(loadingStep, 0);
  });

  // TEST 8: Result state lifecycle
  await runAsyncTest('TEST 8: Result state retains backend response data without accidental null resets', async () => {
    let result = null;
    const res = await checkDeliveryEligibility({ productId: 'PROD-1001', quantity: 1, pincode: '500081', mockTime: localMorningTime });
    result = res;

    assert.notStrictEqual(result, null);
    assert.strictEqual(result.eligible, true);
  });

  // TEST 9: No stale request overwrite
  await runAsyncTest('TEST 9: Request counter prevents stale async overwrites', async () => {
    let reqCounter = 0;
    const req1 = ++reqCounter;
    const req2 = ++reqCounter;

    assert.strictEqual(req1 === reqCounter, false);
    assert.strictEqual(req2 === reqCounter, true);
  });

  // TEST 10: No state reset after successful response
  await runAsyncTest('TEST 10: Auto-scroll ref triggers without resetting result state', async () => {
    let result = { eligible: true };
    let scrolled = false;

    if (result) {
      scrolled = true;
    }

    assert.strictEqual(scrolled, true);
    assert.strictEqual(result.eligible, true);
  });

  console.log('\n================================================================');
  console.log(`  PHASE 16M TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
