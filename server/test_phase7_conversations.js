import http from 'http';

const requestJSON = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runPhase7Tests = async () => {
  console.log('\n==================================================');
  console.log('  RESOLV AI PHASE 7 CONVERSATION & MULTIMODAL TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 16;

  // TEST 1 — GREETING GATE
  console.log('[Test 1] Greeting ("hi")');
  const t1 = await requestJSON('POST', '/api/cases/analyze', { message: 'hi' });
  const status1 = t1.data?.resolution?.status || t1.data?.status;
  const reply1 = t1.data?.conversation?.reply || t1.data?.customerResponse;
  if (status1 === 'NONE' && reply1.includes('Hi!')) {
    console.log('  ✅ PASS: Decision = NONE, friendly greeting returned.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status1}, Reply: "${reply1}"`);
  }

  // TEST 2 — GENERAL QUESTION GATE
  console.log('\n[Test 2] General Question ("How do returns work?")');
  const t2 = await requestJSON('POST', '/api/cases/analyze', { message: 'How do returns work?' });
  const status2 = t2.data?.resolution?.status || t2.data?.status;
  if (status2 === 'NONE') {
    console.log('  ✅ PASS: Decision = NONE, conversational info returned.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status2}`);
  }

  // TEST 3 — INCOMPLETE RETURN
  console.log('\n[Test 3] Incomplete Return ("I want to return this.")');
  const t3 = await requestJSON('POST', '/api/cases/analyze', { message: 'I want to return this.' });
  const status3 = t3.data?.resolution?.status || t3.data?.status;
  if (status3 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Needs information requested.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status3}`);
  }

  // TEST 4 — DAMAGE CLAIM
  console.log('\n[Test 4] Damage Claim ("My headphones are damaged.")');
  const t4 = await requestJSON('POST', '/api/cases/analyze', { message: 'My headphones are damaged.', orderId: 'ORD-1001' });
  const status4 = t4.data?.resolution?.status || t4.data?.status;
  if (status4 === 'NEEDS_INFORMATION' || status4 === 'RESOLVED') {
    console.log(`  ✅ PASS: Understood damage claim. Status: ${status4}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status4}`);
  }

  // TEST 5 — DAMAGE + REPLACEMENT + VALID PHOTO
  console.log('\n[Test 5] Damage + Replacement + Valid Photo (ORD-1001)');
  const t5 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My wireless headphones arrived broken. The left side is cracked. I want a replacement.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status5 = t5.data?.resolution?.status || t5.data?.status;
  const repId5 = t5.data?.resolution?.replacementId || t5.data?.replacementId;
  if (status5 === 'RESOLVED' && repId5) {
    console.log(`  ✅ PASS: Replacement Approved! Replacement ID: ${repId5}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status5}, RepID: ${repId5}`);
  }

  // TEST 6 — DAMAGE + REFUND + VALID PHOTO
  console.log('\n[Test 6] Damage + Refund + Valid Photo (ORD-1001)');
  const t6 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones arrived broken. I want my money back.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REFUND',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status6 = t6.data?.resolution?.status || t6.data?.status;
  const refId6 = t6.data?.resolution?.refundId || t6.data?.refundId;
  if (status6 === 'RESOLVED' && refId6) {
    console.log(`  ✅ PASS: Refund Approved! Refund ID: ${refId6}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status6}, RefID: ${refId6}`);
  }

  // TEST 7 — WRONG PRODUCT CLAIM
  console.log('\n[Test 7] Wrong Product Claim');
  const t7 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'You sent me the wrong product.',
    orderId: 'ORD-1002',
    returnReason: 'WRONG_PRODUCT',
  });
  const status7 = t7.data?.resolution?.status || t7.data?.status;
  if (status7 === 'RESOLVED' || status7 === 'NEEDS_INFORMATION') {
    console.log(`  ✅ PASS: Handled wrong product claim. Status: ${status7}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status7}`);
  }

  // TEST 8 — MISSING ACCESSORY CLAIM
  console.log('\n[Test 8] Missing Accessory Claim');
  const t8 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The charger is missing from the box.',
    orderId: 'ORD-1001',
    returnReason: 'MISSING_ITEM',
  });
  const status8 = t8.data?.resolution?.status || t8.data?.status;
  if (status8 === 'RESOLVED' || status8 === 'NEEDS_INFORMATION') {
    console.log(`  ✅ PASS: Handled missing item claim. Status: ${status8}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status8}`);
  }

  // TEST 9 — NOT WORKING CLAIM
  console.log('\n[Test 9] Defective Product Claim ("My left earbud does not work.")');
  const t9 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My left earbud does not work.',
    orderId: 'ORD-1001',
    returnReason: 'NOT_WORKING',
  });
  const status9 = t9.data?.resolution?.status || t9.data?.status;
  if (status9 === 'RESOLVED' || status9 === 'NEEDS_INFORMATION') {
    console.log(`  ✅ PASS: Handled defective product claim. Status: ${status9}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status9}`);
  }

  // TEST 10 — CHANGE OF MIND
  console.log('\n[Test 10] Change of Mind ("I don\'t want this anymore.")');
  const t10 = await requestJSON('POST', '/api/cases/analyze', {
    message: "I don't want this anymore.",
    orderId: 'ORD-1001',
    returnReason: 'DONT_WANT',
    resolutionPreference: 'REFUND',
  });
  const status10 = t10.data?.resolution?.status || t10.data?.status;
  if (status10 === 'RESOLVED') {
    console.log('  ✅ PASS: Change of mind return authorized without requiring damage photo!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status10}`);
  }

  // TEST 11 — AUDIO VOICE EVIDENCE
  console.log('\n[Test 11] Audio Voice Evidence Processing');
  const t11 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The speaker makes a weird buzzing noise. I recorded it.',
    orderId: 'ORD-1001',
    returnReason: 'NOT_WORKING',
    audio: { hasAudio: true, audioUrl: 'test_audio.mp3', transcript: 'Audio recording: abnormal buzzing sound detected' },
  });
  const status11 = t11.data?.resolution?.status || t11.data?.status;
  if (status11 === 'RESOLVED') {
    console.log('  ✅ PASS: Audio evidence processed and approved!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status11}`);
  }

  // TEST 12 — HIGH QUALITY IMAGE VERIFICATION
  console.log('\n[Test 12] High Quality Image Verification');
  const t12 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The screen is cracked.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status12 = t12.data?.resolution?.status || t12.data?.status;
  if (status12 === 'RESOLVED') {
    console.log('  ✅ PASS: High quality photo verified.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status12}`);
  }

  // TEST 13 — BAD / BLURRY IMAGE
  console.log('\n[Test 13] Bad / Blurry Image Verification');
  const t13 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The screen is cracked. Here is a blurry image.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isBlurry: true },
  });
  const status13 = t13.data?.resolution?.status || t13.data?.status;
  const reply13 = t13.data?.conversation?.reply || t13.data?.customerResponse;
  if (status13 === 'NEEDS_INFORMATION' && (reply13.includes('clearer image') || reply13.includes('clearer photo'))) {
    console.log('  ✅ PASS: Honest AI rejected blurry image and asked for a clearer photo!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status13}, Reply: "${reply13}"`);
  }

  // TEST 14 — UNRELATED / WRONG IMAGE
  console.log('\n[Test 14] Unrelated / Wrong Image Verification');
  const t14 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My phone screen is cracked.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isUnrelated: true },
  });
  const status14 = t14.data?.resolution?.status || t14.data?.status;
  if (status14 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Honest AI rejected unrelated image!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status14}`);
  }

  // TEST 15 — HIGH VALUE ORD-1004 (₹99,999) WITHOUT PHOTO
  console.log('\n[Test 15] High Value Item ORD-1004 (₹99,999) Without Photo');
  const t15 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My phone arrived damaged. I want a refund.',
    orderId: 'ORD-1004',
    evidence: { hasImage: false },
  });
  const status15 = t15.data?.resolution?.status || t15.data?.status;
  if (status15 === 'ESCALATE') {
    console.log('  ✅ PASS: High-value item without photo correctly escalated to Human Review!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status15}`);
  }

  // TEST 16 — COMPLETE LOW-RISK DEMO ORD-1001 (₹4,999)
  console.log('\n[Test 16] Complete Low-Risk Demo (ORD-1001 ₹4,999)');
  const t16 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My wireless headphones arrived damaged. I want a replacement.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status16 = t16.data?.resolution?.status || t16.data?.status;
  if (status16 === 'RESOLVED') {
    console.log('  ✅ PASS: Complete low-risk demo auto-resolved!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status16}`);
  }

  console.log('\n==================================================');
  console.log(`  PHASE 7 CONVERSATION TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('==================================================\n');
};

runPhase7Tests();
