import http from 'http';

const PORT = 5001;

function requestJSON(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body || {});
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getClass(res) {
  return (
    res.data?.evidence?.image?.evidenceClassification ||
    res.data?.evidenceAnalysis?.evidenceClassification ||
    res.data?.data?.evidenceAnalysis?.evidenceClassification ||
    res.data?.evidenceData?.evidenceClassification ||
    'NO_EVIDENCE'
  );
}

async function runMultimodalStressTest() {
  console.log('==================================================');
  console.log('  RESOLV AI PHASE 8 MULTIMODAL STRESS TEST SUITE  ');
  console.log('==================================================\n');

  let passedCount = 0;
  let failedCount = 0;
  const testResults = [];

  const recordResult = (testName, inputSnippet, expectedClass, apiRes, expectedStatus, notes = '') => {
    const actualClass = getClass(apiRes);
    const actualStatus = apiRes.data?.resolution?.status || apiRes.data?.status || 'UNKNOWN';
    const returnId = apiRes.data?.resolution?.returnId || apiRes.data?.returnId || null;
    const refundId = apiRes.data?.resolution?.refundId || apiRes.data?.refundId || null;
    const replacementId = apiRes.data?.resolution?.replacementId || apiRes.data?.replacementId || null;

    const statusPass = actualStatus === expectedStatus;
    const classPass = !expectedClass || expectedClass === 'ANY' || actualClass === expectedClass;
    const finalPass = statusPass && classPass;

    if (finalPass) passedCount++;
    else failedCount++;

    testResults.push({
      testName,
      inputSnippet,
      expectedClass,
      actualClass,
      expectedStatus,
      actualStatus,
      returnId,
      refundId,
      replacementId,
      pass: finalPass,
      notes,
    });

    const icon = finalPass ? '✅ PASS' : '❌ FAIL';
    console.log(`[${testResults.length}] ${testName}`);
    console.log(`    Input: "${inputSnippet}"`);
    console.log(`    Class: Expected=${expectedClass || 'N/A'}, Actual=${actualClass}`);
    console.log(`    Status: Expected=${expectedStatus}, Actual=${actualStatus}`);
    console.log(`    IDs: Return=${returnId || 'null'}, Refund=${refundId || 'null'}, Rep=${replacementId || 'null'}`);
    console.log(`    Result: ${icon}${notes ? ' (' + notes + ')' : ''}\n`);
  };

  // ==================================================
  // CATEGORY A: 30 MULTIMODAL EVIDENCE IMAGE SCENARIOS
  // ==================================================

  // 1. Clear damaged headphones
  const t1 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones headband is cracked.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', isDamaged: true },
  });
  recordResult('Valid 1: Clear Damaged Headphones', 'headband cracked + photo', 'VALID_PRODUCT_EVIDENCE', t1, 'RESOLVED');

  // 2. Clear cracked headphones
  const t2 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The left earcup has a deep crack.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REFUND',
    evidence: { hasImage: true, imageUrl: 'cracked_headphones.png', isDamaged: true },
  });
  recordResult('Valid 2: Clear Cracked Headphones', 'left earcup crack + photo', 'VALID_PRODUCT_EVIDENCE', t2, 'RESOLVED');

  // 3. Clear broken earcup
  const t3 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Broken earcup hinge.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'broken_earcup.jpg', isDamaged: true },
  });
  recordResult('Valid 3: Clear Broken Earcup', 'hinge broken + photo', 'VALID_PRODUCT_EVIDENCE', t3, 'RESOLVED');

  // 4. Clear damaged headband
  const t4 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headband snapped in half during normal use.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'damaged_headband.jpg', isDamaged: true },
  });
  recordResult('Valid 4: Clear Damaged Headband', 'headband snapped + photo', 'VALID_PRODUCT_EVIDENCE', t4, 'RESOLVED');

  // 5. Clear defective-product evidence
  const t5 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Defective product - power port fractured.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DEFECTIVE',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'defective_headphones.jpg', isDamaged: true },
  });
  recordResult('Valid 5: Clear Defective Product Evidence', 'power port broken + photo', 'VALID_PRODUCT_EVIDENCE', t5, 'RESOLVED');

  // 6. Laptop photo for headphones order
  const t6 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isLaptop: true },
  });
  recordResult('Wrong Product 1: Laptop Photo for Headphones Order', 'headphones damaged + laptop photo', 'WRONG_PRODUCT_EVIDENCE', t6, 'NEEDS_INFORMATION');

  // 7. Smartphone photo for headphones order
  const t7 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isSmartphone: true },
  });
  recordResult('Wrong Product 2: Smartphone Photo for Headphones Order', 'headphones broken + smartphone photo', 'WRONG_PRODUCT_EVIDENCE', t7, 'NEEDS_INFORMATION');

  // 8. Shoes photo for headphones order
  const t8 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones arrived damaged.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isShoes: true },
  });
  recordResult('Wrong Product 3: Shoes Photo for Headphones Order', 'headphones damaged + shoes photo', 'WRONG_PRODUCT_EVIDENCE', t8, 'NEEDS_INFORMATION');

  // 9. Television photo for headphones order
  const t9 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'The headphones are cracked.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isTV: true },
  });
  recordResult('Wrong Product 4: Television Photo for Headphones Order', 'headphones cracked + TV photo', 'WRONG_PRODUCT_EVIDENCE', t9, 'NEEDS_INFORMATION');

  // 10. Washing Machine photo for headphones order
  const t10 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones headband broken.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, isWashingMachine: true },
  });
  recordResult('Wrong Product 5: Washing Machine Photo for Headphones Order', 'headband broken + washing machine photo', 'WRONG_PRODUCT_EVIDENCE', t10, 'NEEDS_INFORMATION');

  // 11. Dog photo
  const t11 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isDog: true },
  });
  recordResult('Unrelated 1: Dog Photo', 'headphones broken + dog photo', 'UNRELATED_EVIDENCE', t11, 'NEEDS_INFORMATION');

  // 12. Person / Selfie photo
  const t12 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones defective.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isPerson: true },
  });
  recordResult('Unrelated 2: Person Photo', 'headphones defective + selfie photo', 'UNRELATED_EVIDENCE', t12, 'NEEDS_INFORMATION');

  // 13. Room photo
  const t13 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are cracked.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isRoom: true },
  });
  recordResult('Unrelated 3: Room Photo', 'headphones cracked + room photo', 'UNRELATED_EVIDENCE', t13, 'NEEDS_INFORMATION');

  // 14. Car photo
  const t14 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones broken.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isCar: true },
  });
  recordResult('Unrelated 4: Car Photo', 'headphones broken + car photo', 'UNRELATED_EVIDENCE', t14, 'NEEDS_INFORMATION');

  // 15. Food photo
  const t15 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isFood: true },
  });
  recordResult('Unrelated 5: Food Photo', 'headphones damaged + pizza photo', 'UNRELATED_EVIDENCE', t15, 'NEEDS_INFORMATION');

  // 16. Trees / Scenery photo
  const t16 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isScenery: true },
  });
  recordResult('Unrelated 6: Trees / Scenery Photo', 'headphones damaged + landscape photo', 'UNRELATED_EVIDENCE', t16, 'NEEDS_INFORMATION');

  // 17. Handwritten notes
  const t17 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isNotes: true },
  });
  recordResult('Unrelated 7: Handwritten Notes', 'headphones damaged + notes image', 'UNRELATED_EVIDENCE', t17, 'NEEDS_INFORMATION');

  // 18. Mathematics page
  const t18 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isMath: true },
  });
  recordResult('Unrelated 8: Mathematics Page', 'headphones damaged + math equations', 'UNRELATED_EVIDENCE', t18, 'NEEDS_INFORMATION');

  // 19. PDF / Document screenshot
  const t19 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Headphones damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isDocument: true },
  });
  recordResult('Unrelated 9: PDF / Document Screenshot', 'headphones damaged + document.pdf', 'UNRELATED_EVIDENCE', t19, 'NEEDS_INFORMATION');

  // 20. Extremely blurry image
  const t20 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isBlurry: true },
  });
  recordResult('Unclear 1: Blurry Image', 'headphones damaged + blurry photo', 'UNCLEAR_EVIDENCE', t20, 'NEEDS_INFORMATION');

  // 21. Very dark image
  const t21 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isDark: true },
  });
  recordResult('Unclear 2: Very Dark Image', 'headphones damaged + dark photo', 'UNCLEAR_EVIDENCE', t21, 'NEEDS_INFORMATION');

  // 22. Product too far away
  const t22 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isFarAway: true },
  });
  recordResult('Unclear 3: Product Too Far Away', 'headphones damaged + far away photo', 'UNCLEAR_EVIDENCE', t22, 'NEEDS_INFORMATION');

  // 23. Product mostly hidden
  const t23 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isHidden: true },
  });
  recordResult('Unclear 4: Product Mostly Hidden', 'headphones damaged + hidden product photo', 'UNCLEAR_EVIDENCE', t23, 'NEEDS_INFORMATION');

  // 24. Severe glare
  const t24 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isGlare: true },
  });
  recordResult('Unclear 5: Severe Glare', 'headphones damaged + glare photo', 'UNCLEAR_EVIDENCE', t24, 'NEEDS_INFORMATION');

  // 25. Correct headphones visible but no damage
  const t25 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, noVisibleDamage: true },
  });
  recordResult('Insufficient 1: Intact Headphones (No Visible Damage)', 'headphones damaged + intact photo', 'INSUFFICIENT_EVIDENCE', t25, 'NEEDS_INFORMATION');

  // 26. Headphones photo where damaged area is hidden
  const t26 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, damageHidden: true },
  });
  recordResult('Insufficient 2: Damaged Area Hidden', 'headphones damaged + damage hidden photo', 'INSUFFICIENT_EVIDENCE', t26, 'NEEDS_INFORMATION');

  // 27. Packaging damaged but product not visibly damaged
  const t27 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones arrived damaged.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, boxDamagedOnly: true },
  });
  recordResult('Insufficient 3: Packaging Damaged Only', 'headphones damaged + box damaged photo', 'INSUFFICIENT_EVIDENCE', t27, 'NEEDS_INFORMATION');

  // 28. Multi-Image: Valid Headphones + Laptop Photo (Contradictory)
  const t28 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are cracked.',
    orderId: 'ORD-1001',
    evidence: {
      images: [
        { url: 'damaged_headphones.jpg', isDamaged: true },
        { url: 'laptop.jpg', isLaptop: true },
      ],
    },
  });
  recordResult('Contradictory / Multi-Image 1: Headphones + Laptop Photo', 'headphones photo + laptop photo', 'CONTRADICTORY_EVIDENCE', t28, 'NEEDS_INFORMATION');

  // 29. Multi-Image: Valid Headphones + Dog Photo (Contradictory)
  const t29 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken.',
    orderId: 'ORD-1001',
    evidence: {
      images: [
        { url: 'damaged_headphones.jpg', isDamaged: true },
        { url: 'dog.jpg', isDog: true },
      ],
    },
  });
  recordResult('Contradictory / Multi-Image 2: Headphones + Dog Photo', 'headphones photo + dog photo', 'CONTRADICTORY_EVIDENCE', t29, 'NEEDS_INFORMATION');

  // 30. Multi-Image: Two Unrelated Images
  const t30 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken.',
    orderId: 'ORD-1001',
    evidence: {
      images: [
        { url: 'notes.jpg', isNotes: true },
        { url: 'dog.jpg', isDog: true },
      ],
    },
  });
  recordResult('Contradictory / Multi-Image 3: Multiple Unrelated Images', 'notes photo + dog photo', 'UNRELATED_EVIDENCE', t30, 'NEEDS_INFORMATION');

  // ==================================================
  // CATEGORY B: 10 PRODUCT-CONTEXT SCENARIOS
  // ==================================================

  // 31. ORD-1001 + "My headphones are broken"
  const t31 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are broken.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, isDamaged: true },
  });
  recordResult('Product Context 1: ORD-1001 + "headphones"', 'ORD-1001 + "My headphones are broken"', 'VALID_PRODUCT_EVIDENCE', t31, 'RESOLVED');

  // 32. ORD-1001 + "My earbuds are not working"
  const t32 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My earbuds are not working.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DEFECTIVE',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, isDamaged: true },
  });
  recordResult('Product Context 2: ORD-1001 + "earbuds"', 'ORD-1001 + "My earbuds are not working"', 'VALID_PRODUCT_EVIDENCE', t32, 'RESOLVED');

  // 33. ORD-1001 + "My headset headband cracked"
  const t33 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headset headband cracked.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, isDamaged: true },
  });
  recordResult('Product Context 3: ORD-1001 + "headset"', 'ORD-1001 + "My headset headband cracked"', 'VALID_PRODUCT_EVIDENCE', t33, 'RESOLVED');

  // 34. ORD-1001 + "My laptop is broken"
  const t34 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My laptop is broken.',
    orderId: 'ORD-1001',
  });
  recordResult('Product Context 4: ORD-1001 + "laptop" Mismatch', 'ORD-1001 + "My laptop is broken"', 'NO_EVIDENCE', t34, 'NEEDS_INFORMATION');

  // 35. ORD-1001 + "My phone screen shattered"
  const t35 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My phone screen shattered.',
    orderId: 'ORD-1001',
  });
  recordResult('Product Context 5: ORD-1001 + "phone" Mismatch', 'ORD-1001 + "My phone screen shattered"', 'NO_EVIDENCE', t35, 'NEEDS_INFORMATION');

  // 36. ORD-1001 + "My TV won't turn on"
  const t36 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My TV won\'t turn on.',
    orderId: 'ORD-1001',
  });
  recordResult('Product Context 6: ORD-1001 + "TV" Mismatch', 'ORD-1001 + "My TV won\'t turn on"', 'NO_EVIDENCE', t36, 'NEEDS_INFORMATION');

  // 37. ORD-1001 + "My washing machine is leaking"
  const t37 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My washing machine is leaking.',
    orderId: 'ORD-1001',
  });
  recordResult('Product Context 7: ORD-1001 + "washing machine" Mismatch', 'ORD-1001 + "My washing machine is leaking"', 'NO_EVIDENCE', t37, 'NEEDS_INFORMATION');

  // 38. ORD-1001 + "My shoes don't fit"
  const t38 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My shoes don\'t fit.',
    orderId: 'ORD-1001',
  });
  recordResult('Product Context 8: ORD-1001 + "shoes" Mismatch', 'ORD-1001 + "My shoes don\'t fit"', 'NO_EVIDENCE', t38, 'NEEDS_INFORMATION');

  // 39. ORD-1001 + Photo of headphones
  const t39 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Here is the photo of my headphones.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isDamaged: true },
  });
  recordResult('Product Context 9: Photo of Headphones (Match)', 'ORD-1001 + headphone photo', 'VALID_PRODUCT_EVIDENCE', t39, 'NEEDS_INFORMATION');

  // 40. ORD-1001 + Photo of laptop
  const t40 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Here is the photo of my product.',
    orderId: 'ORD-1001',
    evidence: { hasImage: true, isLaptop: true },
  });
  recordResult('Product Context 10: Photo of Laptop (Mismatch)', 'ORD-1001 + laptop photo', 'WRONG_PRODUCT_EVIDENCE', t40, 'NEEDS_INFORMATION');

  // ==================================================
  // CATEGORY C: 10 CONVERSATION SCENARIOS
  // ==================================================

  // 41. Greeting ("hello")
  const t41 = await requestJSON('POST', '/api/cases/analyze', { message: 'hello' });
  recordResult('Conversation 1: Greeting', 'hello', 'NO_EVIDENCE', t41, 'NONE');

  // 42. Policy inquiry ("what is your return policy?")
  const t42 = await requestJSON('POST', '/api/cases/analyze', { message: 'what is your return policy?' });
  recordResult('Conversation 2: Policy Inquiry', 'what is your return policy?', 'NO_EVIDENCE', t42, 'NONE');

  // 43. Incomplete request ("I want to return")
  const t43 = await requestJSON('POST', '/api/cases/analyze', { message: 'I want to return my Wireless Headphones.', orderId: 'ORD-1001' });
  recordResult('Conversation 3: Incomplete Return Request', 'I want to return my Wireless Headphones', 'NO_EVIDENCE', t43, 'NEEDS_INFORMATION');

  // 44. Stated preference only ("I want a replacement")
  const t44 = await requestJSON('POST', '/api/cases/analyze', { message: 'I want a replacement', orderId: 'ORD-1001', resolutionPreference: 'REPLACEMENT' });
  recordResult('Conversation 4: Preference Stated Without Issue', 'I want a replacement', 'NO_EVIDENCE', t44, 'NEEDS_INFORMATION');

  // 45. Ambiguous claim ("it is broken")
  const t45 = await requestJSON('POST', '/api/cases/analyze', { message: 'it is broken', orderId: 'ORD-1001' });
  recordResult('Conversation 5: Ambiguous Claim', 'it is broken', 'NO_EVIDENCE', t45, 'NEEDS_INFORMATION');

  // 46. Photo uploaded without text claim
  const t46 = await requestJSON('POST', '/api/cases/analyze', { message: 'here is my photo', orderId: 'ORD-1001', evidence: { hasImage: true, isDamaged: true } });
  recordResult('Conversation 6: Photo Uploaded Without Text Claim', 'here is my photo + photo', 'VALID_PRODUCT_EVIDENCE', t46, 'NEEDS_INFORMATION');

  // 47. Damaged claim + handwritten notes photo
  const t47 = await requestJSON('POST', '/api/cases/analyze', { message: 'My headphones are damaged.', orderId: 'ORD-1001', returnReason: 'PRODUCT_DAMAGED', evidence: { hasImage: true, isNotes: true } });
  recordResult('Conversation 7: Damaged Claim + Notes Photo', 'headphones damaged + notes image', 'UNRELATED_EVIDENCE', t47, 'NEEDS_INFORMATION');

  // 48. Damaged claim + laptop photo
  const t48 = await requestJSON('POST', '/api/cases/analyze', { message: 'My headphones are damaged.', orderId: 'ORD-1001', returnReason: 'PRODUCT_DAMAGED', evidence: { hasImage: true, isLaptop: true } });
  recordResult('Conversation 8: Damaged Claim + Laptop Photo', 'headphones damaged + laptop photo', 'WRONG_PRODUCT_EVIDENCE', t48, 'NEEDS_INFORMATION');

  // 49. High-value ORD-1004 (₹99,999) without photo
  const t49 = await requestJSON('POST', '/api/cases/analyze', { message: 'My smartphone screen is cracked.', orderId: 'ORD-1004', returnReason: 'PRODUCT_DAMAGED', resolutionPreference: 'REPLACEMENT' });
  recordResult('Conversation 9: High-Value Order Escalation', 'ORD-1004 (₹99,999) damaged without photo', 'NO_EVIDENCE', t49, 'ESCALATE');

  // 50. Valid return flow completion
  const t50 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones arrived with a cracked headband.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, isDamaged: true },
  });
  recordResult('Conversation 10: Valid Return Flow Completion', 'ORD-1001 damaged + headband crack photo', 'VALID_PRODUCT_EVIDENCE', t50, 'RESOLVED');

  // ==================================================
  // CATEGORY D: 6 AUDIO SCENARIOS
  // ==================================================

  // 51. Audio: "My headphones are broken" (Valid audio)
  const t51 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'I recorded a voice note about my headphones.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DEFECTIVE',
    resolutionPreference: 'REPLACEMENT',
    audio: { hasAudio: true, audioUrl: 'headphone_issue.mp3', transcript: 'My headphones make a loud buzzing sound and left earcup has static.' },
  });
  recordResult('Audio 1: Valid Headphone Issue Audio', 'voice note: buzzing noise in headphones', 'NO_EVIDENCE', t51, 'RESOLVED');

  // 52. Audio: "My laptop is broken" (Mismatch audio)
  const t52 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Voice note attached.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'laptop_issue.mp3', transcript: 'My laptop screen is cracked and won\'t boot.' },
  });
  recordResult('Audio 2: Mismatch Audio Transcript', 'voice note mentioning laptop for headphones order', 'NO_EVIDENCE', t52, 'NEEDS_INFORMATION');

  // 53. Audio: Unclear speech / noise
  const t53 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Voice recording.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'muffled.mp3', transcript: '[muffled background noise and static]' },
  });
  recordResult('Audio 3: Unclear Speech / Background Noise', 'muffled audio transcript', 'NO_EVIDENCE', t53, 'NEEDS_INFORMATION');

  // 54. Audio: Voice recording attached without issue details
  const t54 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Voice note attached.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'hello.mp3', transcript: 'Hello assistant.' },
  });
  recordResult('Audio 4: Audio Without Issue Description', 'audio saying "Hello assistant"', 'NO_EVIDENCE', t54, 'NEEDS_INFORMATION');

  // 55. Audio: Text says headphones, audio transcript says laptop
  const t55 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones are damaged.',
    orderId: 'ORD-1001',
    audio: { hasAudio: true, audioUrl: 'contradiction.mp3', transcript: 'My laptop keyboard is broken.' },
  });
  recordResult('Audio 5: Audio Contradicting Text Claim', 'text: headphones damaged, audio: laptop keyboard broken', 'NO_EVIDENCE', t55, 'NEEDS_INFORMATION');

  // 56. Valid Audio + Valid Photo
  const t56 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My headphones left earbud is broken. Voice note and photo attached.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, isDamaged: true },
    audio: { hasAudio: true, audioUrl: 'earbud.mp3', transcript: 'Left earbud has a fracture and static noise.' },
  });
  recordResult('Audio 6: Valid Audio + Valid Photo Combo', 'voice note + damaged photo', 'VALID_PRODUCT_EVIDENCE', t56, 'RESOLVED');

  // ==================================================
  // SUMMARY REPORTING
  // ==================================================

  console.log('==================================================');
  console.log('  MULTIMODAL STRESS TEST RESULTS SUMMARY  ');
  console.log('==================================================');
  console.log(`  TOTAL TESTS EXECUTED : ${testResults.length}`);
  console.log(`  PASSED               : ${passedCount}`);
  console.log(`  FAILED               : ${failedCount}`);
  console.log(`  SUCCESS RATE         : ${((passedCount / testResults.length) * 100).toFixed(1)}%`);
  console.log('==================================================\n');

  if (failedCount > 0) {
    console.error('❌ STRESS TEST SUITE ENCOUNTERED FAILURES!');
    process.exit(1);
  } else {
    console.log('✅ ALL 56 MULTIMODAL STRESS TESTS PASSED PERFECTLY!');
  }
}

runMultimodalStressTest().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
