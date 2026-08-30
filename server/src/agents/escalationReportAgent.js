/**
 * Agent 7: Escalation Report Agent
 * Generates a comprehensive, structured incident analysis report for human support agents.
 */
export const runEscalationReportAgent = async (
  caseId = '',
  customerMessage = '',
  problemData = {},
  evidenceData = {},
  verificationData = {},
  policyData = {},
  riskData = {},
  resolutionData = {}
) => {
  const order = verificationData?.order || null;
  const riskLevel = riskData?.riskLevel || 'HIGH';
  const confidence = typeof riskData?.confidence === 'number' ? riskData.confidence : 65;
  const riskReasons = Array.isArray(riskData?.riskReasons) ? riskData.riskReasons : ['Case flagged for manual review.'];

  const report = {
    caseId,
    problemSummary: problemData?.mainIssue || customerMessage || 'Customer reported an issue requiring assistance.',
    customerRequest: problemData?.customerRequest || 'Resolution assistance',
    evidenceFindings: evidenceData?.summary || 'Evidence pending verification.',
    verificationFindings: verificationData?.summary || 'Order lookup incomplete.',
    policyFindings: policyData?.policyReason || policyData?.summary || 'Standard evaluation.',
    riskAssessment: {
      riskLevel,
      confidenceScore: confidence,
      riskReasons,
    },
    whyAIUnconfident:
      riskLevel === 'HIGH'
        ? `Case flagged as HIGH risk due to: ${riskReasons.join('; ')}.`
        : `AI confidence score (${confidence}%) fell below auto-resolution threshold (70%).`,
    recommendedHumanAction:
      policyData?.eligibleAction === 'MANUAL_REVIEW'
        ? `Review high-value claim ($${order ? order.price : 'N/A'}) and manually authorize refund/replacement.`
        : 'Contact customer to inspect physical evidence or verify identity before issuing refund.',
    priority: riskLevel === 'HIGH' ? 'URGENT' : 'HIGH',
    generatedAt: new Date().toISOString(),
  };

  return {
    status: 'completed',
    summary: `Generated structured escalation report for human team with priority ${report.priority}.`,
    data: report,
  };
};
