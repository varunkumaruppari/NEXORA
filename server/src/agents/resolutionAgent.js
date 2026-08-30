/**
 * Agent 6: Resolution Agent & Question Selection Engine
 * Synthesizes outputs from Agents 1-5 to enforce the Strict Decision Gate, Product Context Gate,
 * Dynamic Question Selection Engine, and Minimal Question Principle.
 */
export const runResolutionAgent = async (
  problemData = {},
  evidenceData = {},
  verificationData = {},
  policyData = {},
  riskData = {},
  resolutionPreference = 'REPLACEMENT'
) => {
  const intent = problemData?.intent || 'RETURN';
  const category = problemData?.category || 'OTHER';
  const issueType = problemData?.issueType || 'OTHER';
  const mainIssue = (problemData?.mainIssue || '').toLowerCase();
  const inquiryType = problemData?.inquiryType || null;
  const riskLevel = riskData?.riskLevel || 'LOW';
  const confidence = typeof riskData?.confidence === 'number' ? riskData.confidence : 90;

  const orderFound = verificationData?.orderFound || false;
  const order = verificationData?.order || null;
  const productContextMatch = verificationData?.productContextMatch !== false;
  const mentionedProduct = verificationData?.mentionedProduct || null;

  const evidenceClassification = evidenceData?.evidenceClassification || 'NO_EVIDENCE';
  const evidenceQuality = evidenceData?.evidenceQuality || 'NONE';
  const productMatch = evidenceData?.productMatch || 'UNKNOWN';
  const relevance = evidenceData?.relevance || 'UNKNOWN';
  const damageDetected = evidenceData?.damageDetected || false;
  const consistencyMatch = evidenceData?.consistencyMatch || 'CONSISTENT';

  let status = 'RESOLVED';
  let customerResponse = '';
  let recommendedResolution = '';
  const explainableReasons = [];

  const returnId = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
  const refundId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  const replacementId = `REP-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. GREETING GATE
  if (intent === 'GREETING' || category === 'GREETING') {
    return {
      status: 'completed',
      summary: 'Greeting acknowledged. No return decision created.',
      data: {
        status: 'NONE',
        returnId: null,
        refundId: null,
        replacementId: null,
        resolutionPreference: 'UNKNOWN',
        customerResponse: "Hi! 👋 I can help you with a return, refund, or replacement for your NEXORA orders. What issue are you experiencing?",
        recommendedResolution: 'Acknowledge greeting and await customer issue description.',
        reasons: ['Conversational greeting'],
        trackingTimeline: [],
        confidence: 99,
        riskLevel: 'LOW',
      },
    };
  }

  // 2. HUMAN ESCALATION REQUEST GATE
  if (intent === 'HUMAN_ESCALATION' || category === 'HUMAN_ESCALATION') {
    return {
      status: 'completed',
      summary: 'Customer requested human support. Case escalated to specialist.',
      data: {
        status: 'ESCALATE',
        returnId: null,
        refundId: null,
        replacementId: null,
        resolutionPreference: 'HUMAN_REVIEW',
        customerResponse: "I have connected your case with a NEXORA Support Specialist. A human representative will review your order details and contact you shortly.",
        recommendedResolution: 'Assigned case to human support specialist as requested by customer.',
        reasons: ['Customer requested human representative escalation'],
        trackingTimeline: [
          { step: 'Return Request Submitted', date: 'Aug 29', status: 'COMPLETED' },
          { step: 'Specialist Assigned', date: 'Aug 29', status: 'CURRENT' },
          { step: 'Decision Pending', date: 'Pending', status: 'PENDING' },
        ],
        confidence: 90,
        riskLevel: 'MEDIUM',
      },
    };
  }

  // 3. GENERAL INQUIRIES & QUESTIONS GATE (Pickup, Refund timing, Tracking, Policy)
  if (intent === 'GENERAL_QUESTION' || category === 'GENERAL_QUESTION') {
    let replyText = "NEXORA offers a hassle-free 30-day return & replacement guarantee on most eligible orders. You can request an instant refund or express replacement right here by sharing your order details.";

    if (inquiryType === 'PICKUP') {
      replyText = "Pickup is automatically scheduled for the next business day after your return is approved. Our courier partner will pick up the item directly from your delivery address.";
    } else if (inquiryType === 'REFUND_TIMING') {
      replyText = "Refunds are processed within 24 hours after item pickup or verification. The credit will reflect in your original payment method within 2-3 business days.";
    } else if (inquiryType === 'REPLACEMENT_TIMING') {
      replyText = "Express replacement items ship within 24 hours of approval. You will receive a courier tracking link as soon as the replacement package leaves our fulfillment hub.";
    } else if (inquiryType === 'STATUS') {
      replyText = "You can view your active return progress right here in your order timeline or under 'My Orders'. Approved returns show real-time pickup and dispatch status.";
    }

    return {
      status: 'completed',
      summary: `Answered customer inquiry regarding ${inquiryType || 'general policy'}.`,
      data: {
        status: 'NONE',
        returnId: null,
        refundId: null,
        replacementId: null,
        resolutionPreference: 'UNKNOWN',
        customerResponse: replyText,
        recommendedResolution: `Answer customer inquiry regarding ${inquiryType || 'return policy'}.`,
        reasons: [`Conversational inquiry: ${inquiryType || 'GENERAL_POLICY'}`],
        trackingTimeline: [],
        confidence: 99,
        riskLevel: 'LOW',
      },
    };
  }

  // Synthesize Explainable Reasons for Operations Command Center
  if (orderFound && order) {
    explainableReasons.push(`✓ Order verified (#${order.orderId})`);
  } else {
    explainableReasons.push(`⚠ Order ID not verified in account database`);
  }

  if (productContextMatch) {
    explainableReasons.push(`✓ Product context match verified (${order?.productName || 'Order Item'})`);
  } else {
    explainableReasons.push(`⚠ Product context mismatch: Customer mentioned '${mentionedProduct}' for ${order?.productName}`);
  }

  if (policyData?.eligibility) {
    explainableReasons.push(`✓ Eligible under 30-day return policy guarantee`);
  } else if (policyData?.eligibleAction === 'MANUAL_REVIEW') {
    explainableReasons.push(`⚠ Product value exceeds automated threshold`);
  }

  if (evidenceClassification === 'VALID_PRODUCT_EVIDENCE') {
    explainableReasons.push(`✓ High-quality supporting evidence verified`);
  } else if (evidenceClassification === 'WRONG_PRODUCT_EVIDENCE') {
    explainableReasons.push(`⚠ Evidence photo shows wrong product`);
  } else if (evidenceClassification === 'UNRELATED_EVIDENCE') {
    explainableReasons.push(`⚠ Evidence image is unrelated to product/order`);
  } else if (evidenceClassification === 'UNCLEAR_EVIDENCE') {
    explainableReasons.push(`⚠ Unclear / low-quality evidence provided`);
  } else if (evidenceClassification === 'INSUFFICIENT_EVIDENCE') {
    explainableReasons.push(`⚠ Evidence photo does not show reported damage`);
  } else {
    explainableReasons.push(`⚠ No supporting photo evidence attached`);
  }

  // 4. DYNAMIC QUESTION SELECTION ENGINE & STRICT APPROVAL GATE
  if (orderFound && !productContextMatch) {
    status = 'NEEDS_INFORMATION';
    const selectedProd = order ? order.productName : 'this order';
    const MentionedLabel = mentionedProduct || 'another item';
    customerResponse = `I can help with your ${selectedProd} return, but you mentioned a ${MentionedLabel}. The selected order is for ${selectedProd}. Could you confirm whether you're reporting an issue with these ${selectedProd.toLowerCase()} or another order?`;
    recommendedResolution = `Block automatic resolution due to product mismatch (${MentionedLabel} vs ${selectedProd}). Request customer clarification.`;
  } else if (!orderFound) {
    status = 'NEEDS_INFORMATION';
    customerResponse = 'I can help with that. Could you provide your Order ID (e.g., ORD-1001) so I can check your order details?';
    recommendedResolution = 'Request valid Order ID from customer.';
  } else if (riskLevel === 'HIGH' || confidence < 70) {
    // High-risk items (e.g. ORD-1004 ₹99,999 Premium Smartphone) always escalate to Human Review
    status = 'ESCALATE';
    customerResponse = "Your return request for Order #" + (order ? order.orderId : 'N/A') + " requires additional review by our support team. A specialist has been assigned to review your request.";
    recommendedResolution = `Escalate high-value/uncertain order ${order ? order.orderId : 'N/A'} for specialist review.`;
  } else if (evidenceClassification === 'CONTRADICTORY_EVIDENCE') {
    // Contradictory evidence uploaded (e.g. valid photo + laptop photo, or text vs photo contradiction)
    status = 'NEEDS_INFORMATION';
    const prodName = order ? order.productName : 'Wireless Headphones';
    customerResponse = `The uploaded evidence appears to contradict your report or contains conflicting items. Please upload a clear, consistent photo of your ${prodName} showing the issue.`;
    recommendedResolution = 'Reject contradictory photo evidence. Request consistent product damage photo.';
  } else if (evidenceClassification === 'UNRELATED_EVIDENCE') {
    // Unrelated image uploaded (handwritten notes, dog, room, scenery, etc.)
    status = 'NEEDS_INFORMATION';
    const prodName = order ? order.productName : 'Wireless Headphones';
    customerResponse = `I received your photo, but it doesn't appear to show the ${prodName} or the reported issue. Please upload a clear photo showing the ${prodName} and the damage you're reporting.`;
    recommendedResolution = 'Reject unrelated image evidence (notes/scenery). Request product damage photo.';
  } else if (evidenceClassification === 'WRONG_PRODUCT_EVIDENCE') {
    // Wrong product image uploaded (laptop photo when order is Wireless Headphones)
    status = 'NEEDS_INFORMATION';
    const prodName = order ? order.productName : 'Wireless Headphones';
    customerResponse = `I received your photo, but it appears to show a different product than your ${prodName} order. Please upload a photo of your ${prodName}.`;
    recommendedResolution = 'Reject wrong product photo. Request photo of actual ordered item.';
  } else if (evidenceData?.hasAudio && (evidenceData?.audioAnalysis?.audioEvidenceRelevance === 'UNCLEAR' || evidenceData?.audioAnalysis?.audioEvidenceRelevance === 'IRRELEVANT' || !evidenceData?.audioAnalysis?.soundIssueDetected) && evidenceClassification !== 'VALID_PRODUCT_EVIDENCE') {
    // Unclear audio, background noise, hello assistant, or irrelevant audio transcript
    status = 'NEEDS_INFORMATION';
    const prodName = order ? order.productName : 'Wireless Headphones';
    customerResponse = `I listened to your voice recording, but couldn't clearly verify the issue with your ${prodName}. Could you please describe the problem in detail or upload a clear photo of the issue?`;
    recommendedResolution = 'Reject unclear audio recording. Request clear issue description or photo evidence.';
  } else if (evidenceClassification === 'UNCLEAR_EVIDENCE') {
    // Dark / Blurry photo uploaded
    status = 'NEEDS_INFORMATION';
    customerResponse = "I can't clearly verify the product or damage from this image. Please upload a clearer photo with the affected area visible.";
    recommendedResolution = 'Reject blurry/dark photo evidence. Request clear photo.';
  } else if (evidenceClassification === 'INSUFFICIENT_EVIDENCE' && (category === 'DAMAGED_PRODUCT' || issueType === 'PRODUCT_DAMAGED')) {
    // Product visible, but damage not visible
    status = 'NEEDS_INFORMATION';
    const prodName = order ? order.productName : 'Wireless Headphones';
    customerResponse = `I can see the ${prodName}, but I can't clearly verify the reported damage from this photo. Please upload a closer photo showing the damaged area.`;
    recommendedResolution = 'Request closer photo showing visible damage on product.';
  } else if (mainIssue === 'it is broken' || mainIssue === 'broken' || mainIssue === 'damaged' || mainIssue === 'it\'s broken') {
    // Ambiguous claim gate
    status = 'NEEDS_INFORMATION';
    customerResponse = `Could you confirm what is not working with your ${order ? order.productName : 'item'}?`;
    recommendedResolution = 'Request specific defect description for ambiguous claim.';
  } else if ((mainIssue.includes('here is my photo') || mainIssue.includes('attached photo') || mainIssue === 'photo' || mainIssue.includes('photo of my headphones') || mainIssue.includes('photo of my product')) && issueType !== 'DONT_WANT' && !problemData.returnReason) {
    status = 'NEEDS_INFORMATION';
    const prodName = order ? `${order.productName} (₹${order.price?.toLocaleString() || order.price})` : 'your item';
    customerResponse = `I received your photo, but could you confirm what issue you are experiencing with your ${prodName}?`;
    recommendedResolution = 'Request defect issue description when photo is uploaded without issue claim.';
  } else if (
    (category === 'RETURN_REFUND' || category === 'OTHER' || issueType === 'OTHER' || !problemData.returnReason || problemData.returnReason === 'RETURN_REFUND' || mainIssue.includes('want a replacement') || mainIssue.includes('want to return')) &&
    issueType !== 'DONT_WANT' &&
    category !== 'DONT_WANT' &&
    category !== 'DAMAGED_PRODUCT' &&
    issueType !== 'PRODUCT_DAMAGED' &&
    category !== 'NOT_WORKING' &&
    category !== 'WRONG_PRODUCT' &&
    category !== 'MISSING_ITEM' &&
    !evidenceData?.hasImage &&
    !evidenceData?.hasAudio
  ) {
    // INCOMPLETE RETURN REQUEST GATE (Step 3): Ask what problem occurred with the product
    status = 'NEEDS_INFORMATION';
    const prodName = order ? `${order.productName} (₹${order.price?.toLocaleString() || order.price})` : 'your item';
    customerResponse = `Sure, I can help with your return for ${prodName}. What seems to be the problem?`;
    recommendedResolution = 'Request specific issue reason when return request is incomplete.';
  } else if ((issueType === 'PRODUCT_DAMAGED' || category === 'DAMAGED_PRODUCT') && evidenceClassification !== 'VALID_PRODUCT_EVIDENCE') {
    // STRICT APPROVAL GATE: Damaged item claims require valid product damage photo evidence
    status = 'NEEDS_INFORMATION';
    customerResponse = `Please upload a clear photo showing the damage to your ${order ? order.productName : 'item'} so we can process your replacement or refund.`;
    recommendedResolution = 'Request valid photo evidence for damaged item claim.';
  } else {
    // ALL STRICT SAFETY GATES PASSED -> APPROVE
    status = 'RESOLVED';
    const prodName = order ? order.productName : 'item';
    const ordId = order ? order.orderId : 'N/A';
    const isRefund = resolutionPreference === 'REFUND' || issueType === 'DONT_WANT';

    if (isRefund) {
      customerResponse = `Great news! Your refund request for ${prodName} (Order ${ordId}) has been approved. Refund ID: ${refundId}. Pickup will be scheduled automatically.`;
      recommendedResolution = `Approved refund authorization for ${prodName}.`;
    } else {
      customerResponse = `Great news! Your replacement request for ${prodName} (Order ${ordId}) has been approved. Replacement ID: ${replacementId}. Replacement shipment is ready for dispatch.`;
      recommendedResolution = `Approved replacement shipment for ${prodName}.`;
    }
  }

  // Tracking Timeline construction
  let trackingTimeline = [];
  if (status === 'RESOLVED') {
    const isRefund = resolutionPreference === 'REFUND' || issueType === 'DONT_WANT';
    trackingTimeline = isRefund
      ? [
          { step: 'Return Requested', date: 'Aug 29', status: 'COMPLETED' },
          { step: 'Pickup Scheduled', date: 'Aug 30', status: 'COMPLETED' },
          { step: 'Item Received at Hub', date: 'Sep 01', status: 'PENDING' },
          { step: 'Refund Processed', date: 'Sep 02', status: 'PENDING' },
        ]
      : [
          { step: 'Return Requested', date: 'Aug 29', status: 'COMPLETED' },
          { step: 'Pickup Scheduled', date: 'Aug 30', status: 'COMPLETED' },
          { step: 'Replacement Dispatched', date: 'Sep 01', status: 'PENDING' },
          { step: 'Delivered', date: 'Sep 03', status: 'PENDING' },
        ];
  } else if (status === 'ESCALATE') {
    trackingTimeline = [
      { step: 'Return Request Submitted', date: 'Aug 29', status: 'COMPLETED' },
      { step: 'Specialist Review Started', date: 'Aug 29', status: 'CURRENT' },
      { step: 'Decision Pending', date: 'Pending', status: 'PENDING' },
    ];
  }

  return {
    status: 'completed',
    summary: `Resolution decision reached: ${status}`,
    data: {
      status,
      returnId: status === 'RESOLVED' ? returnId : null,
      refundId: status === 'RESOLVED' && (resolutionPreference === 'REFUND' || issueType === 'DONT_WANT') ? refundId : null,
      replacementId: status === 'RESOLVED' && resolutionPreference !== 'REFUND' && issueType !== 'DONT_WANT' ? replacementId : null,
      resolutionPreference,
      customerResponse,
      recommendedResolution,
      reasons: explainableReasons,
      trackingTimeline,
      confidence,
      riskLevel,
    },
  };
};
