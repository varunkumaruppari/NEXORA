import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
  },
  customerMessage: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    default: null,
  },
  returnReason: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    default: 'OTHER',
  },
  resolutionPreference: {
    type: String,
    enum: ['REFUND', 'REPLACEMENT', 'AUTO'],
    default: 'REPLACEMENT',
  },
  refundId: {
    type: String,
    default: null,
  },
  replacementId: {
    type: String,
    default: null,
  },
  returnStatus: {
    type: String,
    default: 'RETURN_REQUESTED',
  },
  trackingTimeline: {
    type: Array,
    default: [],
  },
  eligibilityStatus: {
    type: Boolean,
    default: true,
  },
  eligibilityReason: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['RESOLVED', 'NEEDS_INFORMATION', 'ESCALATE', 'CLOSED'],
    required: true,
  },
  lifecycleStatus: {
    type: String,
    default: 'SUBMITTED',
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  activeEngine: {
    type: String,
    default: 'Deterministic Multi-Agent Engine',
  },
  finalDecisionSource: {
    type: String,
    enum: ['AI', 'HUMAN'],
    default: 'AI',
  },
  humanDecision: {
    type: String,
    enum: ['NONE', 'APPROVE', 'DENY', 'REQUEST_MORE_INFO'],
    default: 'NONE',
  },
  humanDecisionAt: {
    type: Date,
    default: null,
  },
  humanReviewer: {
    type: String,
    default: 'Demo Operations Specialist',
  },
  humanNotes: {
    type: String,
    default: null,
  },
  auditTrail: {
    type: Array,
    default: [],
  },
  agentResults: {
    type: Array,
    default: [],
  },
  resolution: {
    type: Object,
    default: {},
  },
  escalationReport: {
    type: Object,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);
