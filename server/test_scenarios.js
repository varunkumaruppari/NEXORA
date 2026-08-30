import http from 'http';

const postJSON = (path, data) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('--- TEST 1: SCENARIO 1 (ORD-1001 - Wireless Headphones) ---');
  const res1 = await postJSON('/api/cases/analyze', {
    message: 'My wireless headphones arrived broken. The left side is cracked. I want a replacement. Order ID ORD-1001',
    orderId: 'ORD-1001',
  });
  console.log(JSON.stringify(res1, null, 2));

  console.log('\n--- TEST 2: SCENARIO 2 (ORD-1004 - High-Risk Escalation) ---');
  const res2 = await postJSON('/api/cases/analyze', {
    message: 'My premium smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund. Order ID ORD-1004',
    orderId: 'ORD-1004',
  });
  console.log(JSON.stringify(res2, null, 2));
};

runTests();
