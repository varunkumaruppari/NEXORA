/**
 * Agent 5: Risk Agent
 * Computes risk level (LOW, MEDIUM, HIGH) and confidence score (0-100) based on product value,
 * evidence quality, order verification, policy rules, and neutral risk indicators.
 */
export const runRiskAgent = async (problemData = {}, evidenceData = {}, verificationData = {}, policyData = {}) => {
  let score = 95; // Default high confidence baseline
  let riskLevel = 'LOW';
  const riskReasons = [];

  const order = verificationData?.order || null;
  const orderFound = verificationData?.orderFound || false;
  const evidenceQuality = evidenceData?.evidenceQuality || 'NONE';

  // Rule 1: Missing Order Verification
  if (!orderFound) {
    score -= 35;
    riskReasons.push('Order verification incomplete: Order ID not found in account database.');
  }

  // Rule 2: High Value Product (e.g., ORD-1004 ₹99,999 / $1,199)
  const itemPrice = order ? (order.price || 0) : 0;
  const isHighValue = order?.isHighValue || itemPrice > 500 || itemPrice > 50000;

  if (isHighValue) {
    score -= 30;
    riskLevel = 'HIGH';
    const formattedVal = itemPrice > 5000 ? `₹${itemPrice.toLocaleString('en-IN')}` : `$${itemPrice}`;
    riskReasons.push(`High monetary value product (${formattedVal}) exceeds automated threshold.`);
  }

  // Rule 3: Evidence Availability & Quality Impact
  if (evidenceQuality === 'NONE') {
    if (isHighValue) {
      score -= 25;
      riskReasons.push('Insufficient visual evidence attached for high-value claim verification.');
    } else {
      score -= 15; // Low-value items deduct fewer points
      riskReasons.push('No visual photo evidence attached. Resolution evaluated via policy guidelines.');
    }
  } else if (evidenceQuality === 'LOW') {
    score -= 15;
    riskReasons.push('Evidence quality low or uncertain. Additional verification recommended.');
  } else if (evidenceQuality === 'HIGH') {
    score += 5; // Reward high quality verified evidence
    riskReasons.push('High-quality supporting photo evidence verified.');
  }

  // Rule 4: Policy Manual Review Flag
  if (policyData?.eligibleAction === 'MANUAL_REVIEW') {
    riskLevel = 'HIGH';
    score = Math.min(score, 65);
    if (policyData.policyReason && !riskReasons.includes(policyData.policyReason)) {
      riskReasons.push(policyData.policyReason);
    }
  }

  // Final Risk Classification
  if (riskLevel !== 'HIGH') {
    if (score < 70) {
      riskLevel = 'HIGH';
    } else if (score < 85) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
  }

  // Ensure bounds
  const confidence = Math.max(10, Math.min(99, score));

  return {
    status: 'completed',
    summary: `Assessed risk level as ${riskLevel} with ${confidence}% confidence score.`,
    data: {
      riskLevel,
      confidence,
      riskReasons: riskReasons.length > 0 ? riskReasons : ['Low risk profile. Verified order claim satisfied.'],
    },
  };
};
