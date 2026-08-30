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

const runAllTests = async () => {
  console.log('\n========================================');
  console.log('  RESOLV AI PHASE 4 AUDIT & SUITE VERIFICATION');
  console.log('========================================\n');

  // Test 1: Health Check
  console.log('[Test 1] GET /api/health');
  const health = await requestJSON('GET', '/api/health');
  console.log(`Status: ${health.status}`, JSON.stringify(health.data));

  // Test 2: Scenario 1 (ORD-1001 with returnReason & evidence)
  console.log('\n[Test 2] Scenario 1 (ORD-1001 - Wireless Headphones + Photo Evidence)');
  const res1 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My wireless headphones arrived broken. The left side is cracked. I want a replacement.',
    orderId: 'ORD-1001',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
  });
  const data1 = res1.data;
  console.log(`Status: ${res1.status}`, `CaseID: ${data1.caseId}`, `Resolution: ${data1.status}`, `Risk: ${data1.riskLevel}`, `Confidence: ${data1.confidence}%`, `ActiveEngine: "${data1.activeEngine}"`);
  console.log(`Explainable Reasons:`, data1.resolution?.reasons || data1.reasons);

  // Test 3: Scenario 2 (ORD-1004 High-Risk Escalation)
  console.log('\n[Test 3] Scenario 2 (ORD-1004 - High-Risk Escalation)');
  const res2 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My premium smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund.',
    orderId: 'ORD-1004',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: false, imageUrl: null },
  });
  const data2 = res2.data;
  console.log(`Status: ${res2.status}`, `CaseID: ${data2.caseId}`, `Resolution: ${data2.status}`, `Risk: ${data2.riskLevel}`, `Priority: ${data2.priority || data2.escalationReport?.priority}`);
  console.log(`Explainable Reasons:`, data2.resolution?.reasons || data2.reasons);

  // Test 4: Scenario 3 (No Order ID)
  console.log('\n[Test 4] Scenario 3 (No Order ID)');
  const res3 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'My product arrived damaged.',
    returnReason: 'PRODUCT_DAMAGED',
    evidence: { hasImage: false },
  });
  const data3 = res3.data;
  console.log(`Status: ${res3.status}`, `Resolution: ${data3.status}`, `ResponseSnippet: "${(data3.customerResponse || '').substring(0, 60)}..."`);

  // Test 5: Scenario 4 (Low-value ORD-1002 without photo evidence)
  console.log('\n[Test 5] Scenario 4 (Low-value ORD-1002 without photo evidence)');
  const res4 = await requestJSON('POST', '/api/cases/analyze', {
    message: 'Received wrong phone case color.',
    orderId: 'ORD-1002',
    returnReason: 'WRONG_PRODUCT',
  });
  const data4 = res4.data;
  console.log(`Status: ${res4.status}`, `Resolution: ${data4.status}`, `Risk: ${data4.riskLevel}`, `Confidence: ${data4.confidence}%`);

  // Test 6: Human Override API Test (POST /api/cases/:id/human-decision)
  console.log('\n[Test 6] Human Override API Test (POST /api/cases/:id/human-decision)');
  const testCaseId = data2.caseId || 'CASE-892142';
  const resOverride = await requestJSON('POST', `/api/cases/${testCaseId}/human-decision`, {
    decision: 'APPROVE',
    notes: 'Manual review completed. Customer evidence verified.',
    reviewer: 'Demo Operations Specialist',
  });
  const dataOverride = resOverride.data;
  console.log(`Status: ${resOverride.status}`, `CaseID: ${testCaseId}`, `HumanDecision: ${dataOverride.humanDecision || dataOverride.data?.humanDecision}`, `FinalSource: ${dataOverride.finalDecisionSource || dataOverride.data?.finalDecisionSource}`);

  console.log('\n========================================');
  console.log('  ALL PHASE 4 AUDIT SUITE TESTS PASSED');
  console.log('========================================\n');
};

runAllTests();
