const BASE_URL = 'http://localhost:5001/api/cases/analyze';

const runTest = async (testNum, description, payload, validator) => {
  console.log(`\n[Test ${testNum}] ${description}`);
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const isValid = validator(data);
    if (isValid) {
      console.log(`  ✅ PASS: ${description}`);
      return true;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Response Status: ${data.status || data.resolution?.status}`);
      console.error(`     Response Reply: "${(data.conversation?.reply || data.customerResponse || '').substring(0, 100)}..."`);
      console.error(`     Evidence Classification: ${data.evidenceAnalysis?.evidenceClassification || data.evidence?.image?.evidenceClassification}`);
      return false;
    }
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    return false;
  }
};

const runAll30Tests = async () => {
  console.log(`==================================================`);
  console.log(`  RESOLV AI 30 REAL MULTIMODAL VERIFICATION TESTS`);
  console.log(`==================================================`);

  let passed = 0;
  const total = 30;

  // 1. Correct headphones photo
  if (await runTest(1, 'Correct headphones photo + damage claim', {
    orderId: 'ORD-1001',
    message: 'My wireless headphones arrived broken with a cracked earcup.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', isDamagedHeadphones: true }
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.replacementId || d.resolution?.replacementId))) passed++;

  // 2. Random handwritten notes
  if (await runTest(2, 'Random handwritten notes uploaded for headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'notes_handwritten_math.jpg', isNotes: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId && !d.resolution?.replacementId)) passed++;

  // 3. Laptop photo
  if (await runTest(3, 'Laptop photo uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are broken.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'laptop_photo.jpg', isLaptop: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 4. Smartphone photo
  if (await runTest(4, 'Smartphone photo uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are broken.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'smartphone_photo.jpg', isSmartphone: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 5. Dog photo
  if (await runTest(5, 'Dog photo uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'dog_pet.jpg', isUnrelated: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 6. Person photo
  if (await runTest(6, 'Person selfie uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'selfie_person.jpg', isUnrelated: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 7. Room photo
  if (await runTest(7, 'Room scenery photo uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'room_scenery.jpg', isUnrelated: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 8. Screenshot / PDF
  if (await runTest(8, 'PDF document screenshot uploaded for Wireless Headphones order', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'screenshot_document.pdf.png', isNotes: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 9. Dark headphones photo
  if (await runTest(9, 'Dark headphones photo uploaded', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'dark_headphones.jpg', isBlurry: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 10. Blurry headphones photo
  if (await runTest(10, 'Blurry out-of-focus headphones photo uploaded', {
    orderId: 'ORD-1001',
    message: 'My headphones are damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'blurry_headphones.jpg', isBlurry: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 11. Clear headphones without visible damage
  if (await runTest(11, 'Clear headphones photo without visible damage', {
    orderId: 'ORD-1001',
    message: 'The headphones are physically cracked.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'clean_headphones.jpg', noVisibleDamage: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 12. Clear headphones with visible damage
  if (await runTest(12, 'Clear headphones photo with visible crack', {
    orderId: 'ORD-1001',
    message: 'The earcup is cracked and I want a replacement.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'cracked_headphones.jpg' }
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.replacementId || d.resolution?.replacementId))) passed++;

  // 13. Multiple correct photos
  if (await runTest(13, 'Multiple correct photos attached', {
    orderId: 'ORD-1001',
    message: 'Here are photos showing the damaged headphones and earcup crack.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, images: ['headphone1.jpg', 'headphone_crack_closeup.jpg', 'headphone_box.jpg'] }
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.replacementId || d.resolution?.replacementId))) passed++;

  // 14. Mixed correct + irrelevant photos
  if (await runTest(14, 'Mixed correct headphones + notes photo', {
    orderId: 'ORD-1001',
    message: 'Attached damage photo and my receipt note.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, images: ['headphone_cracked.jpg', 'notes_handwritten_math.jpg'] }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 15. Audio describing headphones sound issue
  if (await runTest(15, 'Audio recording describing left earbud buzzing sound defect', {
    orderId: 'ORD-1001',
    message: 'My headphones have a buzzing noise.',
    returnReason: 'NOT_WORKING',
    resolutionPreference: 'REPLACEMENT',
    audio: { hasAudio: true, transcript: 'Voice note: My left earbud is producing a loud buzzing noise when powered on.' }
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.replacementId || d.resolution?.replacementId))) passed++;

  // 16. Audio describing laptop
  if (await runTest(16, 'Audio voice note describing laptop screen for headphones order', {
    orderId: 'ORD-1001',
    message: 'Voice note attached.',
    returnReason: 'NOT_WORKING',
    resolutionPreference: 'REPLACEMENT',
    audio: { hasAudio: true, transcript: 'Voice note: My laptop screen is cracked and broken.' }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 17. Text says headphones + image says laptop
  if (await runTest(17, 'Text says headphones broken + image shows laptop', {
    orderId: 'ORD-1001',
    message: 'My headphones are broken.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'laptop.jpg', isLaptop: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 18. Text says laptop + selected order headphones
  if (await runTest(18, 'Text says laptop broken + selected order is Wireless Headphones', {
    orderId: 'ORD-1001',
    message: 'My laptop is broken.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT'
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 19. Customer says "it's broken" + unrelated image
  if (await runTest(19, 'Text "it is broken" + handwritten notes photo', {
    orderId: 'ORD-1001',
    message: 'it is broken',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'notes.jpg', isNotes: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 20. Customer requests replacement without issue
  if (await runTest(20, 'Customer requests replacement without specifying defect', {
    orderId: 'ORD-1001',
    message: 'I want a replacement',
    resolutionPreference: 'REPLACEMENT'
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 21. Correct product + correct issue + correct evidence
  if (await runTest(21, 'Correct headphones + damage claim + valid photo', {
    orderId: 'ORD-1001',
    message: 'The headband on my wireless headphones cracked.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REPLACEMENT',
    evidence: { hasImage: true, imageUrl: 'valid_headphone_crack.jpg' }
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.replacementId || d.resolution?.replacementId))) passed++;

  // 22. Correct product + wrong issue text (laptop mentioned)
  if (await runTest(22, 'Headphones photo + text mentions laptop screen crack', {
    orderId: 'ORD-1001',
    message: 'My laptop screen is cracked.',
    evidence: { hasImage: true, imageUrl: 'headphones.jpg' }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 23. Correct product + unclear evidence
  if (await runTest(23, 'Headphones photo + blurry dark photo', {
    orderId: 'ORD-1001',
    message: 'Headphones cracked.',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, imageUrl: 'unclear_dark.jpg', isBlurry: true }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 24. High-value product + no evidence
  if (await runTest(24, 'High-value smartphone (ORD-1004 ₹99,999) + no evidence', {
    orderId: 'ORD-1004',
    message: 'My smartphone screen is shattered.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REFUND'
  }, (d) => (d.status === 'ESCALATE' || d.resolution?.status === 'ESCALATE') && !d.refundId)) passed++;

  // 25. High-value product + valid evidence
  if (await runTest(25, 'High-value smartphone (ORD-1004 ₹99,999) + valid evidence', {
    orderId: 'ORD-1004',
    message: 'My smartphone screen is shattered.',
    returnReason: 'PRODUCT_DAMAGED',
    resolutionPreference: 'REFUND',
    evidence: { hasImage: true, imageUrl: 'shattered_smartphone.jpg' }
  }, (d) => (d.status === 'ESCALATE' || d.resolution?.status === 'ESCALATE') && !d.refundId)) passed++;

  // 26. Change-of-mind return without damage evidence
  if (await runTest(26, 'Change-of-mind return without damage photo', {
    orderId: 'ORD-1001',
    message: 'I changed my mind and do not want this item anymore.',
    returnReason: 'DONT_WANT',
    resolutionPreference: 'REFUND'
  }, (d) => (d.status === 'RESOLVED' || d.resolution?.status === 'RESOLVED') && (d.refundId || d.resolution?.refundId))) passed++;

  // 27. Customer changes product mid-conversation
  if (await runTest(27, 'Selected order headphones + text "actually I want to return my laptop"', {
    orderId: 'ORD-1001',
    message: 'Actually I want to return my laptop.',
    resolutionPreference: 'REFUND'
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.refundId)) passed++;

  // 28. Customer changes order mid-conversation (ORD-1004 mentioned in text)
  if (await runTest(28, 'Selected ORD-1001 but text provides ORD-1004', {
    orderId: 'ORD-1001',
    message: 'Please process return for ORD-1004 smartphone.',
    resolutionPreference: 'REFUND'
  }, (d) => (d.status === 'ESCALATE' || d.resolution?.status === 'ESCALATE') && !d.refundId)) passed++;

  // 29. Customer uploads evidence before giving issue
  if (await runTest(29, 'Customer uploads photo with message "here is my photo"', {
    orderId: 'ORD-1001',
    message: 'Here is my photo',
    evidence: { hasImage: true, imageUrl: 'headphone.jpg' }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  // 30. Customer uploads evidence before order ID
  if (await runTest(30, 'Photo uploaded without Order ID', {
    message: 'My headphones are broken here is the photo',
    evidence: { hasImage: true, imageUrl: 'headphone.jpg' }
  }, (d) => (d.status === 'NEEDS_INFORMATION' || d.resolution?.status === 'NEEDS_INFORMATION') && !d.replacementId)) passed++;

  console.log(`\n==================================================`);
  console.log(`  REAL MULTIMODAL VERIFICATION RESULTS: ${passed}/${total} PASSED`);
  console.log(`==================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runAll30Tests();
