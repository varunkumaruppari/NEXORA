/**
 * Agent 3: Verification Agent & Product-Context Consistency Gate
 * Cross-references customer claims against mock order database AND performs
 * semantic product matching between customer claims/evidence and selected order details.
 */

const MOCK_ORDERS = {
  'ORD-1001': {
    orderId: 'ORD-1001',
    customerName: 'Alex Rivera',
    productName: 'Wireless Headphones',
    category: 'AUDIO',
    price: 150.0,
    status: 'Delivered',
    deliveryDate: '2026-08-27',
    eligibleForReplacement: true,
    isHighValue: false,
    historyRisk: 'LOW',
    synonyms: ['headphones', 'headphone', 'earbuds', 'earbud', 'earphones', 'headset', 'audio', 'sound'],
  },
  'ORD-1002': {
    orderId: 'ORD-1002',
    customerName: 'Sarah Chen',
    productName: 'Phone Case',
    category: 'ACCESSORIES',
    price: 30.0,
    status: 'Delivered',
    deliveryDate: '2026-08-26',
    eligibleForReplacement: true,
    isHighValue: false,
    historyRisk: 'LOW',
    synonyms: ['case', 'cover', 'phone case', 'protector', 'accessory'],
  },
  'ORD-1003': {
    orderId: 'ORD-1003',
    customerName: 'Marcus Vance',
    productName: 'Smartwatch',
    category: 'WEARABLES',
    price: 250.0,
    status: 'Delivered',
    deliveryDate: '2026-08-25',
    eligibleForReplacement: true,
    isHighValue: false,
    historyRisk: 'LOW',
    synonyms: ['watch', 'smartwatch', 'band', 'wearable', 'fitness tracker'],
  },
  'ORD-1004': {
    orderId: 'ORD-1004',
    customerName: 'Jordan Blake',
    productName: 'Premium Smartphone',
    category: 'MOBILE',
    price: 1199.0,
    status: 'Delivered',
    deliveryDate: '2026-08-28',
    eligibleForReplacement: false, // Requires human authorization due to value
    isHighValue: true,
    historyRisk: 'HIGH',
    synonyms: ['phone', 'smartphone', 'mobile', 'device', 'screen', 'cellphone'],
  },
};

export const runVerificationAgent = async (customerMessage = '', providedOrderId = null, evidenceData = null) => {
  const safeMessage = typeof customerMessage === 'string' ? customerMessage : String(customerMessage || '');
  const msg = safeMessage.toLowerCase();
  let orderId = providedOrderId;

  const match = safeMessage.match(/ORD-\d{4}/i);
  if (match) {
    orderId = match[0].toUpperCase();
  }

  if (!orderId || !MOCK_ORDERS[orderId]) {
    if (orderId && !MOCK_ORDERS[orderId]) {
      return {
        status: 'completed',
        summary: `Order ID ${orderId} not found in system database.`,
        data: {
          verificationStatus: 'not_found',
          orderFound: false,
          order: null,
          productContextMatch: false,
        },
      };
    }

    return {
      status: 'completed',
      summary: 'No valid Order ID detected in customer input.',
      data: {
        verificationStatus: 'information_required',
        orderFound: false,
        order: null,
        productContextMatch: false,
      },
    };
  }

  const order = MOCK_ORDERS[orderId];

  // PRODUCT-CONTEXT CONSISTENCY GATE
  let productContextMatch = true;
  let mismatchReason = null;
  let mentionedProduct = null;

  // Unrelated Product Keywords list (distinct product categories)
  const UNRELATED_PRODUCTS = [
    { word: 'laptop', label: 'laptop' },
    { word: 'computer', label: 'computer' },
    { word: 'macbook', label: 'laptop' },
    { word: 'washing machine', label: 'washing machine' },
    { word: 'refrigerator', label: 'refrigerator' },
    { word: 'fridge', label: 'refrigerator' },
    { word: 'television', label: 'TV' },
    { word: 'tv', label: 'TV' },
    { word: 'shoes', label: 'shoes' },
    { word: 'shirt', label: 'shirt' },
    { word: 'dress', label: 'dress' },
    { word: 'car', label: 'car vehicle' },
  ];

  // Check if customer explicitly mentions an unrelated product in text
  for (const item of UNRELATED_PRODUCTS) {
    if (msg.includes(item.word)) {
      const synonyms = order.synonyms || [];
      const matchesSynonym = synonyms.some((s) => s.includes(item.word) || item.word.includes(s));
      if (!matchesSynonym) {
        productContextMatch = false;
        mentionedProduct = item.label;
        mismatchReason = `Customer mentioned '${item.label}', but selected order #${order.orderId} is for '${order.productName}'`;
        break;
      }
    }
  }

  // Check Audio Transcript Context Match
  if (evidenceData && evidenceData.audioAnalysis && evidenceData.audioAnalysis.audioTranscript) {
    const transcript = evidenceData.audioAnalysis.audioTranscript.toLowerCase();
    for (const item of UNRELATED_PRODUCTS) {
      if (transcript.includes(item.word)) {
        const synonyms = order.synonyms || [];
        const matchesSynonym = synonyms.some((s) => s.includes(item.word) || item.word.includes(s));
        if (!matchesSynonym) {
          productContextMatch = false;
          mentionedProduct = item.label;
          mismatchReason = `Voice recording mentioned '${item.label}', but selected order #${order.orderId} is for '${order.productName}'`;
          break;
        }
      }
    }
  }

  // Check Image Evidence Product Context Match
  if (evidenceData && (evidenceData.evidenceClassification === 'WRONG_PRODUCT_EVIDENCE' || evidenceData.productMatch === 'MISMATCH' || evidenceData.isUnrelated || evidenceData.evidenceQuality === 'NOT_RELEVANT')) {
    productContextMatch = false;
    mentionedProduct = evidenceData.detectedProduct || 'a different product';
    mismatchReason = `Uploaded photo shows ${evidenceData.detectedProduct || 'a different product'}, which does not match '${order.productName}' in selected order`;
  }

  const summaryText = productContextMatch
    ? `Verified Order ${order.orderId} (${order.productName}, $${order.price}). Product context match confirmed.`
    : `Order ${order.orderId} verified, BUT product context mismatch detected: ${mismatchReason}.`;

  return {
    status: 'completed',
    summary: summaryText,
    data: {
      verificationStatus: 'verified',
      orderFound: true,
      order,
      productContextMatch,
      mentionedProduct,
      mismatchReason,
    },
  };
};
