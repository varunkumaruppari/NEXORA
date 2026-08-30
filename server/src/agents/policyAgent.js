/**
 * Agent 4: Policy Agent
 * Evaluates e-commerce return, refund, and replacement policies.
 */
export const runPolicyAgent = async (problemData = {}, verificationData = {}, evidenceData = {}) => {
  const category = problemData?.category || 'OTHER';
  const order = verificationData?.order || null;
  const orderFound = verificationData?.orderFound || false;

  if (!orderFound || !order) {
    return {
      status: 'completed',
      summary: 'Policy check pending: Order verification required.',
      data: {
        eligibleAction: 'NEED_INFO',
        eligibility: false,
        policyReason: 'Valid order confirmation is required before applying policy rules.',
      },
    };
  }

  // High-value item threshold policy rule ($500 limit for auto-resolutions)
  if (order.price > 500) {
    return {
      status: 'completed',
      summary: `High-value policy rule triggered ($${order.price} > $500 threshold).`,
      data: {
        eligibleAction: 'MANUAL_REVIEW',
        eligibility: false,
        policyReason: `Item value ($${order.price}) exceeds automated resolution threshold ($500). Requires human authorization.`,
      },
    };
  }

  // Specific category policies
  if (category === 'DAMAGED_PRODUCT') {
    return {
      status: 'completed',
      summary: 'Damaged item policy: Eligible for instant replacement or refund.',
      data: {
        eligibleAction: 'REPLACEMENT',
        eligibility: true,
        policyReason: 'Covered under 30-day transit damage protection guarantee.',
      },
    };
  }

  if (category === 'WRONG_PRODUCT') {
    return {
      status: 'completed',
      summary: 'Wrong item delivered policy: Eligible for express exchange.',
      data: {
        eligibleAction: 'EXCHANGE',
        eligibility: true,
        policyReason: 'Covered under order accuracy fulfillment policy.',
      },
    };
  }

  if (category === 'MISSING_ITEM') {
    return {
      status: 'completed',
      summary: 'Missing item policy: Eligible for replacement item dispatch.',
      data: {
        eligibleAction: 'REPLACEMENT',
        eligibility: true,
        policyReason: 'Covered under package completeness guarantee.',
      },
    };
  }

  return {
    status: 'completed',
    summary: 'Standard return policy applied.',
    data: {
      eligibleAction: 'REFUND',
      eligibility: true,
      policyReason: 'Standard 30-day customer satisfaction return policy.',
    },
  };
};
