import { orchestrateResolution } from '../services/agentOrchestrator.js';
import CaseModel from '../models/Case.js';

/**
 * Controller to analyze a customer issue through the multi-agent pipeline.
 * @route POST /api/cases/analyze
 */
export const analyzeCase = async (req, res, next) => {
  const { message, orderId, returnReason, evidence, audio, resolutionPreference } = req.body || {};

  console.log(`\n📥 [API Request] POST /api/cases/analyze | OrderID: ${orderId || 'None'} | Reason: ${returnReason || 'None'} | Pref: ${resolutionPreference || 'REPLACEMENT'}`);
  console.log(`   Message snippet: "${(message || '').substring(0, 60)}..."`);

  try {
    const analysisResult = await orchestrateResolution({
      message: message || '',
      orderId: orderId || null,
      returnReason: returnReason || null,
      evidence: evidence || null,
      audio: audio || null,
      resolutionPreference: resolutionPreference || 'REPLACEMENT',
    });

    console.log(`✅ [API Success] Case: ${analysisResult.caseId} | Status: ${analysisResult.status} | Risk: ${analysisResult.riskLevel}`);
    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('❌ [API Error] Case analysis failure:', error.stack || error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze case',
      error: 'An internal error occurred while processing the case analysis.',
    });
  }
};

/**
 * Controller to submit a human override decision on a case.
 * @route POST /api/cases/:id/human-decision
 */
export const submitHumanDecision = async (req, res, next) => {
  const { id } = req.params;
  const { decision, notes, reviewer } = req.body || {};

  console.log(`\n👤 [Human Decision Request] Case ID: ${id} | Decision: ${decision}`);

  if (!['APPROVE', 'DENY', 'REQUEST_MORE_INFO'].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid decision. Must be APPROVE, DENY, or REQUEST_MORE_INFO.',
    });
  }

  const now = new Date().toISOString();
  const reviewerLabel = reviewer || 'Demo Operations Specialist';

  // Map decision to final case status
  let newStatus = 'RESOLVED';
  let newLifecycleStatus = 'CLOSED';

  if (decision === 'APPROVE') {
    newStatus = 'RESOLVED';
    newLifecycleStatus = 'CLOSED';
  } else if (decision === 'DENY') {
    newStatus = 'CLOSED';
    newLifecycleStatus = 'CLOSED';
  } else if (decision === 'REQUEST_MORE_INFO') {
    newStatus = 'NEEDS_INFORMATION';
    newLifecycleStatus = 'HUMAN_REVIEW';
  }

  const auditEntry = {
    event: 'HUMAN_DECISION_MADE',
    timestamp: now,
    actor: 'HUMAN',
    details: `Specialist (${reviewerLabel}) submitted decision: ${decision}. Notes: "${notes || 'No notes provided'}"`,
  };

  try {
    const existingCase = await CaseModel.findOne({ caseId: id });
    if (existingCase) {
      existingCase.humanDecision = decision;
      existingCase.finalDecisionSource = 'HUMAN';
      existingCase.humanDecisionAt = now;
      existingCase.humanReviewer = reviewerLabel;
      existingCase.humanNotes = notes || null;
      existingCase.status = newStatus;
      existingCase.lifecycleStatus = newLifecycleStatus;
      existingCase.auditTrail.push(auditEntry);
      await existingCase.save();

      return res.status(200).json({
        success: true,
        message: `Human decision recorded: ${decision}`,
        data: existingCase,
      });
    }
  } catch (err) {
    console.warn(`[DB Warning] Case ${id} not found in DB. Returning updated object memory representation.`);
  }

  // Standalone memory representation response if DB unavailable
  const updatedData = {
    caseId: id,
    status: newStatus,
    lifecycleStatus: newLifecycleStatus,
    finalDecisionSource: 'HUMAN',
    humanDecision: decision,
    humanDecisionAt: now,
    humanReviewer: reviewerLabel,
    humanNotes: notes || null,
    auditEntry,
  };

  return res.status(200).json({
    success: true,
    message: `Human decision recorded: ${decision}`,
    data: updatedData,
    ...updatedData,
  });
};

/**
 * Controller to fetch a case by ID.
 * @route GET /api/cases/:id
 */
export const getCaseById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const foundCase = await CaseModel.findOne({ caseId: id });
    if (foundCase) {
      return res.status(200).json({
        success: true,
        data: foundCase,
      });
    }
    return res.status(404).json({
      success: false,
      message: `Case ${id} not found`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch case',
      error: err.message,
    });
  }
};

/**
 * Controller to return seeded demo scenarios for hackathon testing.
 * @route GET /api/cases/demo
 */
export const getDemoCases = async (req, res, next) => {
  try {
    const scenario1 = await orchestrateResolution({
      message: 'My wireless headphones arrived broken. The left side is cracked. I want a replacement.',
      orderId: 'ORD-1001',
      returnReason: 'PRODUCT_DAMAGED',
      evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
    });

    const scenario2 = await orchestrateResolution({
      message: 'Received wrong phone case color.',
      orderId: 'ORD-1002',
      returnReason: 'WRONG_PRODUCT',
      evidence: { hasImage: false, imageUrl: null },
    });

    const scenario3 = await orchestrateResolution({
      message: 'Smartwatch heart rate sensor is not working properly.',
      orderId: 'ORD-1003',
      returnReason: 'NOT_WORKING',
      evidence: { hasImage: true, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' },
    });

    const scenario4 = await orchestrateResolution({
      message: 'My premium smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund.',
      orderId: 'ORD-1004',
      returnReason: 'PRODUCT_DAMAGED',
      evidence: { hasImage: false, imageUrl: null },
    });

    return res.status(200).json({
      success: true,
      scenarios: [
        {
          name: 'Scenario 1: Auto-Resolution (ORD-1001 Wireless Headphones ₹4,999)',
          data: scenario1,
        },
        {
          name: 'Scenario 2: Low-Risk Exchange (ORD-1002 Phone Case ₹1,499)',
          data: scenario2,
        },
        {
          name: 'Scenario 3: Technical Defect (ORD-1003 Smartwatch ₹8,499)',
          data: scenario3,
        },
        {
          name: 'Scenario 4: High-Risk Escalation (ORD-1004 Smartphone ₹99,999)',
          data: scenario4,
        },
      ],
    });
  } catch (error) {
    console.error('❌ [API Error] GET /api/cases/demo failure:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load demo cases',
      error: error.message,
    });
  }
};
