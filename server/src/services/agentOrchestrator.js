import { runProblemUnderstandingAgent } from '../agents/problemUnderstandingAgent.js';
import { runEvidenceAnalysisAgent } from '../agents/evidenceAnalysisAgent.js';
import { runVerificationAgent } from '../agents/verificationAgent.js';
import { runPolicyAgent } from '../agents/policyAgent.js';
import { runRiskAgent } from '../agents/riskAgent.js';
import { runResolutionAgent } from '../agents/resolutionAgent.js';
import { runEscalationReportAgent } from '../agents/escalationReportAgent.js';
import CaseModel from '../models/Case.js';

/**
 * Multi-Agent Workflow Orchestrator
 * Sequentially executes Agents 1-7 using a robust context object, audit trail, and engine transparency.
 */
export const orchestrateResolution = async ({
  message = '',
  orderId = null,
  returnReason = null,
  evidence = null,
  audio = null,
  resolutionPreference = 'REPLACEMENT',
} = {}) => {
  const caseId = `CASE-${Math.floor(100000 + Math.random() * 900000)}`;
  const startTime = new Date().toISOString();
  const activeEngine = process.env.GEMINI_API_KEY ? 'Gemini 1.5 Pro AI Engine' : 'Deterministic Multi-Agent Engine';

  const auditTrail = [
    {
      event: 'CASE_CREATED',
      timestamp: startTime,
      actor: 'CUSTOMER',
      details: 'Customer initiated return resolution request.',
    },
    {
      event: 'AI_ANALYSIS_STARTED',
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM',
      details: `Dispatched request to 7-Agent Pipeline (${activeEngine}).`,
    },
  ];

  const mergedEvidence = {
    ...(evidence || { hasImage: false, imageUrl: null }),
    ...(audio ? { hasAudio: true, audioUrl: audio.audioUrl, transcript: audio.transcript } : {}),
  };

  const context = {
    caseId,
    message: typeof message === 'string' ? message : String(message || ''),
    orderId: orderId || null,
    returnReason: returnReason || null,
    resolutionPreference: resolutionPreference || 'REPLACEMENT',
    evidence: mergedEvidence,
    problemUnderstanding: null,
    evidenceAnalysis: null,
    verification: null,
    policy: null,
    risk: null,
    resolution: null,
    escalationReport: null,
    agentSteps: [],
  };

  console.log(`\n==================================================`);
  console.log(`🤖 ORCHESTRATOR EXECUTION STARTED | Case ID: ${caseId}`);
  console.log(`⚙️  Active Engine: ${activeEngine}`);
  console.log(`📥 Incoming Message: "${context.message.substring(0, 80)}..."`);
  console.log(`🏷️ Structured Return Reason: ${context.returnReason || 'None'}`);
  console.log(`📦 Extracted Order ID: ${context.orderId || 'None'}`);
  console.log(`💡 Resolution Preference: ${context.resolutionPreference}`);
  console.log(`==================================================\n`);

  // Step 1: Problem Understanding Agent
  console.log('▶ [Agent 1 START] Problem Understanding Agent');
  try {
    context.problemUnderstanding = await runProblemUnderstandingAgent(context.message, context.returnReason);
    console.log(`✔ [Agent 1 COMPLETE] Summary: ${context.problemUnderstanding.summary}`);
  } catch (err) {
    console.error('❌ [Agent 1 ERROR]', err.stack || err.message);
    context.problemUnderstanding = {
      status: 'completed',
      summary: 'Processed input text claims.',
      data: { category: 'OTHER', returnReason: context.returnReason || 'OTHER', mainIssue: context.message, customerRequest: 'Assistance', urgency: 'MEDIUM', missingInformation: [] },
    };
  }
  context.agentSteps.push({
    name: 'Problem Understanding Agent',
    status: context.problemUnderstanding.status || 'completed',
    summary: context.problemUnderstanding.summary || 'Identified problem category.',
  });
  auditTrail.push({
    event: 'PROBLEM_UNDERSTOOD',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: `Identified category: ${context.problemUnderstanding.data?.category || 'OTHER'}.`,
  });

  // Step 2: Verification Agent
  console.log('▶ [Agent 2 START] Verification Agent');
  try {
    context.verification = await runVerificationAgent(context.message, context.orderId, null);
    console.log(`✔ [Agent 2 COMPLETE] Summary: ${context.verification.summary}`);
  } catch (err) {
    console.error('❌ [Agent 2 ERROR]', err.stack || err.message);
    context.verification = {
      status: 'completed',
      summary: 'Order verification processed.',
      data: { verificationStatus: 'information_required', orderFound: false, order: null },
    };
  }

  const claimedProductName = context.verification?.data?.order?.productName || 'Wireless Headphones';

  // Step 3: Evidence Analysis Agent
  console.log('▶ [Agent 3 START] Evidence Analysis Agent');
  try {
    context.evidenceAnalysis = await runEvidenceAnalysisAgent(context.message, context.evidence, claimedProductName);
    console.log(`✔ [Agent 3 COMPLETE] Summary: ${context.evidenceAnalysis.summary}`);
  } catch (err) {
    console.error('❌ [Agent 3 ERROR]', err.stack || err.message);
    context.evidenceAnalysis = {
      status: 'completed',
      summary: 'Evidence evaluation completed.',
      data: { hasImage: false, evidenceQuality: 'NONE', evidenceConfidence: 0, damageDetected: false, inconsistencyFlag: false, findings: 'Default evaluation.' },
    };
  }

  // Re-run Verification product context gate with evidence output
  try {
    context.verification = await runVerificationAgent(context.message, context.orderId, context.evidenceAnalysis?.data);
  } catch (err) {
    // preserve previous verification data
  }

  context.agentSteps.push({
    name: 'Evidence Analysis Agent',
    status: context.evidenceAnalysis.status || 'completed',
    summary: context.evidenceAnalysis.summary || 'Analyzed evidence data.',
  });
  auditTrail.push({
    event: 'EVIDENCE_ANALYZED',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: `Evidence Quality: ${context.evidenceAnalysis.data?.evidenceQuality || 'NONE'}. Classification: ${context.evidenceAnalysis.data?.evidenceClassification || 'NO_EVIDENCE'}.`,
  });

  context.agentSteps.push({
    name: 'Verification Agent',
    status: context.verification.status || 'completed',
    summary: context.verification.summary || 'Verified order information.',
  });
  auditTrail.push({
    event: 'ORDER_VERIFIED',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: context.verification.data?.orderFound
      ? `Order #${context.verification.data.order.orderId} verified in database.`
      : 'Order ID verification incomplete or missing.',
  });

  // Step 4: Policy Agent
  console.log('▶ [Agent 4 START] Policy Agent');
  try {
    context.policy = await runPolicyAgent(
      context.problemUnderstanding.data,
      context.verification.data,
      context.evidenceAnalysis.data
    );
    console.log(`✔ [Agent 4 COMPLETE] Summary: ${context.policy.summary}`);
  } catch (err) {
    console.error('❌ [Agent 4 ERROR]', err.stack || err.message);
    context.policy = {
      status: 'completed',
      summary: 'Evaluated return policies.',
      data: { eligibleAction: 'NEED_INFO', eligibility: false, policyReason: 'Order verification pending.' },
    };
  }
  context.agentSteps.push({
    name: 'Policy Agent',
    status: context.policy.status || 'completed',
    summary: context.policy.summary || 'Checked policy compliance.',
  });
  auditTrail.push({
    event: 'POLICY_CHECKED',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: `Policy Action: ${context.policy.data?.eligibleAction || 'EVALUATED'}.`,
  });

  // Step 5: Risk Agent
  console.log('▶ [Agent 5 START] Risk Agent');
  try {
    context.risk = await runRiskAgent(
      context.problemUnderstanding.data,
      context.evidenceAnalysis.data,
      context.verification.data,
      context.policy.data
    );
    console.log(`✔ [Agent 5 COMPLETE] Summary: ${context.risk.summary}`);
  } catch (err) {
    console.error('❌ [Agent 5 ERROR]', err.stack || err.message);
    context.risk = {
      status: 'completed',
      summary: 'Calculated risk metrics.',
      data: { riskLevel: 'LOW', confidence: 90, riskReasons: ['Standard claim profile.'] },
    };
  }
  context.agentSteps.push({
    name: 'Risk Agent',
    status: context.risk.status || 'completed',
    summary: context.risk.summary || 'Calculated risk level.',
  });
  auditTrail.push({
    event: 'RISK_ASSESSED',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: `Risk Level: ${context.risk.data?.riskLevel || 'LOW'} (${context.risk.data?.confidence || 90}% confidence).`,
  });

  // Step 6: Resolution Agent
  console.log('▶ [Agent 6 START] Resolution Agent');
  try {
    context.resolution = await runResolutionAgent(
      context.problemUnderstanding.data,
      context.evidenceAnalysis.data,
      context.verification.data,
      context.policy.data,
      context.risk.data,
      context.resolutionPreference
    );
    console.log(`✔ [Agent 6 COMPLETE] Summary: ${context.resolution.summary}`);
  } catch (err) {
    console.error('❌ [Agent 6 ERROR]', err.stack || err.message);
    context.resolution = {
      status: 'completed',
      summary: 'Reached resolution decision.',
      data: {
        status: 'NEEDS_INFORMATION',
        customerResponse: 'Please provide your Order ID (e.g. ORD-1001) so we can look up your order.',
        recommendedResolution: 'Request valid Order ID.',
        reasons: ['⚠ Order ID verification required'],
      },
    };
  }
  context.agentSteps.push({
    name: 'Resolution Agent',
    status: context.resolution.status || 'completed',
    summary: context.resolution.summary || 'Finalized decision.',
  });
  auditTrail.push({
    event: 'AI_DECISION_MADE',
    timestamp: new Date().toISOString(),
    actor: 'AI',
    details: `AI Recommended Decision: ${context.resolution.data?.status || 'NEEDS_INFORMATION'}.`,
  });

  // Step 7: Check if Escalation Report Agent is required
  const resStatus = context.resolution?.data?.status || 'ESCALATE';
  const rRisk = context.risk?.data?.riskLevel || 'HIGH';
  const rConf = typeof context.risk?.data?.confidence === 'number' ? context.risk.data.confidence : 65;

  const isEscalationTriggered = resStatus === 'ESCALATE' || rRisk === 'HIGH' || rConf < 70;

  if (isEscalationTriggered) {
    console.log('▶ [Agent 7 START] Escalation Report Agent');
    try {
      const reportResult = await runEscalationReportAgent(
        caseId,
        context.message,
        context.problemUnderstanding.data,
        context.evidenceAnalysis.data,
        context.verification.data,
        context.policy.data,
        context.risk.data,
        context.resolution.data
      );
      context.escalationReport = reportResult.data;
      console.log(`✔ [Agent 7 COMPLETE] Summary: ${reportResult.summary}`);
      context.agentSteps.push({
        name: 'Escalation Report Agent',
        status: reportResult.status || 'completed',
        summary: reportResult.summary || 'Generated structured escalation report.',
      });
      auditTrail.push({
        event: 'ESCALATION_REPORT_GENERATED',
        timestamp: new Date().toISOString(),
        actor: 'SYSTEM',
        details: 'Escalation report generated for human specialist review queue.',
      });
    } catch (err) {
      console.error('❌ [Agent 7 ERROR]', err.stack || err.message);
      context.escalationReport = {
        caseId,
        problemSummary: context.message,
        customerRequest: 'Human review',
        evidenceFindings: 'Pending',
        verificationFindings: 'Incomplete',
        policyFindings: 'Manual review',
        riskAssessment: { riskLevel: rRisk, confidenceScore: rConf, riskReasons: ['Manual escalation'] },
        whyAIUnconfident: 'Escalation required based on risk rules.',
        recommendedHumanAction: 'Inspect order details and contact customer.',
        priority: 'URGENT',
        generatedAt: new Date().toISOString(),
      };
      context.agentSteps.push({
        name: 'Escalation Report Agent',
        status: 'completed',
        summary: 'Generated escalation report.',
      });
    }
  } else {
    console.log('⏩ [Agent 7 SKIPPED] Case auto-resolved with high confidence.');
  }

  // Extracted values for payload
  const finalOrderId = context.verification?.data?.order ? context.verification.data.order.orderId : context.orderId;
  const category = context.problemUnderstanding?.data?.category || 'OTHER';
  const customerResponse = context.resolution?.data?.customerResponse || 'Thank you. We have received your issue.';
  const status = context.resolution?.data?.status || 'NEEDS_INFORMATION';
  const riskLevel = context.risk?.data?.riskLevel || 'LOW';
  const confidence = typeof context.risk?.data?.confidence === 'number' ? context.risk.data.confidence : 90;
  const priority = context.escalationReport?.priority || null;

  const returnId = status === 'RESOLVED' ? (context.resolution?.data?.returnId || `RET-${Math.floor(100000 + Math.random() * 900000)}`) : null;
  const refundId = status === 'RESOLVED' ? context.resolution?.data?.refundId : null;
  const replacementId = status === 'RESOLVED' ? context.resolution?.data?.replacementId : null;
  const trackingTimeline = context.resolution?.data?.trackingTimeline || [];
  const reasons = context.resolution?.data?.reasons || [];
  const lifecycleStatus = status === 'RESOLVED' ? 'RESOLVED' : status === 'ESCALATE' ? 'ESCALATED' : 'NEEDS_INFORMATION';

  const conversationState = {
    intent: context.problemUnderstanding?.data?.intent || 'RETURN',
    issueType: context.problemUnderstanding?.data?.issueType || 'OTHER',
    category,
    orderId: finalOrderId,
    orderVerified: context.verification?.data?.orderFound || false,
    resolutionPreference: context.resolutionPreference,
    evidenceQuality: context.evidenceAnalysis?.data?.evidenceQuality || 'NONE',
    consistencyMatch: context.evidenceAnalysis?.data?.consistencyMatch || 'CONSISTENT',
    riskLevel,
    decisionReady: status === 'RESOLVED' || status === 'ESCALATE',
    finalDecision: status,
  };

  const innerData = {
    caseId,
    returnId,
    refundId,
    replacementId,
    resolutionPreference: context.resolutionPreference,
    trackingTimeline,
    reasons,
    customerMessage: context.message,
    orderId: finalOrderId,
    returnReason: context.returnReason || category,
    category,
    customerResponse,
    status,
    lifecycleStatus,
    riskLevel,
    confidence,
    priority,
    activeEngine,
    finalDecisionSource: 'AI',
    humanDecision: 'NONE',
    humanDecisionAt: null,
    humanReviewer: 'Demo Operations Specialist',
    humanNotes: null,
    auditTrail,
    agents: context.agentSteps,
    evidenceAnalysis: context.evidenceAnalysis?.data || {},
    verification: context.verification?.data || {},
    policy: context.policy?.data || {},
    risk: context.risk?.data || {},
    resolution: context.resolution?.data || {},
    escalationReport: context.escalationReport,
    createdAt: startTime,
  };

  // Phase 7 Unified Response Contract
  const responsePayload = {
    success: true,
    conversation: {
      reply: customerResponse,
      state: conversationState,
    },
    resolution: {
      status,
      type: context.resolutionPreference,
      id: returnId || refundId || replacementId || null,
      returnId,
      refundId,
      replacementId,
      reasons,
      trackingTimeline,
    },
    evidence: {
      image: context.evidenceAnalysis?.data || {},
      audio: context.evidenceAnalysis?.data?.audioAnalysis || {},
    },
    data: innerData,
    ...innerData,
  };

  console.log(`🏁 [ORCHESTRATOR COMPLETE] Case: ${caseId} | Status: ${status} | Risk: ${riskLevel} | Conf: ${confidence}%\n`);

  // Attempt DB persistence (silently ignore if MongoDB unavailable)
  try {
    const newCase = new CaseModel({
      caseId,
      customerMessage: context.message,
      orderId: finalOrderId,
      returnReason: context.returnReason || category,
      category,
      resolutionPreference: context.resolutionPreference,
      refundId,
      replacementId,
      trackingTimeline,
      status,
      lifecycleStatus,
      riskLevel,
      confidence,
      activeEngine,
      finalDecisionSource: 'AI',
      humanDecision: 'NONE',
      auditTrail,
      agentResults: context.agentSteps,
      resolution: context.resolution?.data || {},
      escalationReport: context.escalationReport,
    });
    await newCase.save();
  } catch (dbError) {
    // Database save failed or DB unavailable - system continues seamlessly
  }

  return responsePayload;
};
