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

const runProductContextGateTests = async () => {
  console.log('\n==================================================');
  console.log('  RESOLV AI PRODUCT-CONTEXT CONSISTENCY GATE SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 12;

  // TEST 1: Headphones order + "my headphones are broken" -> VALID
  console.log('[Test 1] Headphones Order (ORD-1001) + "my headphones are broken"');
  const t1 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken and damaged.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status1 = t1.data?.resolution?.status || t1.data?.status;
  if (status1 === 'RESOLVED') {
    console.log('  ✅ PASS: Valid headphone return approved.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status1}`);
  }

  // TEST 2: Headphones order + "my laptop is broken" -> NEEDS_INFORMATION (BLOCKED)
  console.log('\n[Test 2] Headphones Order (ORD-1001) + "my laptop is broken"');
  const t2 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My laptop is broken.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
  });
  const status2 = t2.data?.resolution?.status || t2.data?.status;
  const reply2 = t2.data?.conversation?.reply || t2.data?.customerResponse;
  const refId2 = t2.data?.resolution?.refundId || t2.data?.refundId;
  const repId2 = t2.data?.resolution?.replacementId || t2.data?.replacementId;
  if (status2 === 'NEEDS_INFORMATION' && !refId2 && !repId2 && reply2.includes('laptop')) {
    console.log(`  ✅ PASS: Product mismatch blocked! Reply: "${reply2}"`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status2}, RefID: ${refId2}, RepID: ${repId2}`);
  }

  // TEST 3: Headphones order + "it is broken" -> NEEDS_INFORMATION (Ambiguous)
  console.log('\n[Test 3] Headphones Order (ORD-1001) + "it is broken"');
  const t3 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'it is broken',
    orderId: 'ORD-1001',
  });
  const status3 = t3.data?.resolution?.status || t3.data?.status;
  if (status3 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Ambiguous claim requested clarification.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status3}`);
  }

  // TEST 4: Headphones order + "I want a replacement" -> NEEDS_INFORMATION (No prior context)
  console.log('\n[Test 4] Headphones Order (ORD-1001) + "I want a replacement"');
  const t4 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'I want a replacement',
    orderId: 'ORD-1001',
    resolutionPreference: 'REPLACEMENT',
  });
  const status4 = t4.data?.resolution?.status || t4.data?.status;
  if (status4 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Preference without issue description requested issue context.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status4}`);
  }

  // TEST 5: Headphones order + damage + valid headphone photo -> RESOLVED
  console.log('\n[Test 5] Headphones Order + Damage + Valid Headphone Photo');
  const t5 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones arrived cracked.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status5 = t5.data?.resolution?.status || t5.data?.status;
  if (status5 === 'RESOLVED') {
    console.log('  ✅ PASS: Valid headphone photo approved.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status5}`);
  }

  // TEST 6: Headphones order + damage + laptop photo -> NEEDS_INFORMATION (BLOCKED)
  console.log('\n[Test 6] Headphones Order + Damage + Laptop Photo');
  const t6 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isUnrelated: true },
  });
  const status6 = t6.data?.resolution?.status || t6.data?.status;
  if (status6 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Unrelated laptop photo blocked!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status6}`);
  }

  // TEST 7: Headphones order + voice note headphone issue -> VALID
  console.log('\n[Test 7] Headphones Order + Voice Note Headphone Issue');
  const t7 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'I recorded a voice note about my headphones.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'headphones_voice.mp3', transcript: 'My left earbud stopped working yesterday.' },
  });
  const status7 = t7.data?.resolution?.status || t7.data?.status;
  if (status7 === 'RESOLVED') {
    console.log('  ✅ PASS: Valid headphone voice note approved.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status7}`);
  }

  // TEST 8: Headphones order + voice note laptop issue -> NEEDS_INFORMATION (BLOCKED)
  console.log('\n[Test 8] Headphones Order + Voice Note Laptop Issue');
  const t8 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Voice note attached.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'laptop_voice.mp3', transcript: 'My laptop screen is cracked.' },
  });
  const status8 = t8.data?.resolution?.status || t8.data?.status;
  if (status8 === 'NEEDS_INFORMATION') {
    console.log('  ✅ PASS: Voice note laptop mismatch blocked!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status8}`);
  }

  // TEST 9: General Question -> NONE
  console.log('\n[Test 9] General Question ("How does the return process work?")');
  const t9 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'How does the return process work?',
    orderId: 'ORD-1001',
  });
  const status9 = t9.data?.resolution?.status || t9.data?.status;
  if (status9 === 'NONE') {
    console.log('  ✅ PASS: General question answered without creating return case.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status9}`);
  }

  // TEST 10: Greeting -> NONE
  console.log('\n[Test 10] Greeting ("hi")');
  const t10 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'hi',
    orderId: 'ORD-1001',
  });
  const status10 = t10.data?.resolution?.status || t10.data?.status;
  if (status10 === 'NONE') {
    console.log('  ✅ PASS: Greeting acknowledged without approval.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status10}`);
  }

  // TEST 11: Multi-turn: "My headphones are damaged" -> "I want replacement" -> VALID
  console.log('\n[Test 11] Multi-turn Valid Conversation');
  const t11 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged. I want a replacement.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const status11 = t11.data?.resolution?.status || t11.data?.status;
  if (status11 === 'RESOLVED') {
    console.log('  ✅ PASS: Multi-turn valid headphone return approved.');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status11}`);
  }

  // TEST 12: Multi-turn: "My laptop is broken" -> "I want replacement" -> MUST NOT APPROVE HEADPHONES
  console.log('\n[Test 12] Multi-turn Laptop Mismatch Conversation');
  const t12 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My laptop is broken. I want a replacement.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
  });
  const status12 = t12.data?.resolution?.status || t12.data?.status;
  const refId12 = t12.data?.resolution?.refundId || t12.data?.refundId;
  const repId12 = t12.data?.resolution?.replacementId || t12.data?.replacementId;
  if (status12 === 'NEEDS_INFORMATION' && !refId12 && !repId12) {
    console.log('  ✅ PASS: Multi-turn laptop mismatch MUST NOT approve headphone return!');
    passed++;
  } else {
    console.error(`  ❌ FAIL: Status: ${status12}, RefID: ${refId12}, RepID: ${repId12}`);
  }

  console.log('\n==================================================');
  console.log(`  PRODUCT-CONTEXT GATE TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('==================================================\n');
};

runProductContextGateTests();
