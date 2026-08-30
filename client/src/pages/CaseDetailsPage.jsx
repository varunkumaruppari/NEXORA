import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import {
  ArrowLeft,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Bot,
  Clock,
  UserX,
  MessageSquare,
  Shield,
  Sparkles,
  Layers,
  Cpu,
  Download,
  Maximize2,
  X,
  Printer
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'resolvai_human_overrides';

export default function CaseDetailsPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal & Persistence states
  const [humanOverrideState, setHumanOverrideState] = useState(null);
  const [inspectImageModal, setInspectImageModal] = useState(null);

  // Fallback case definition for resilience
  const fallbackCase = {
    caseId: id || 'CASE-892142',
    orderId: 'ORD-1004',
    productName: 'Premium Smartphone',
    price: 99999,
    formattedPrice: '₹99,999',
    returnReason: 'PRODUCT_DAMAGED',
    category: 'DAMAGED_PRODUCT',
    customerMessage: 'My premium smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund.',
    riskLevel: 'HIGH',
    confidence: 65,
    status: 'ESCALATE',
    finalDecisionSource: 'AI',
    humanDecision: 'NONE',
    activeEngine: 'Gemini 1.5 Pro AI Engine',
    createdAt: '2026-08-28T12:15:00Z',
    resolution: {
      returnId: 'RET-975871',
      recommendedResolution: 'Escalate case for high-value order ORD-1004 to human support team.',
      reasons: [
        '✓ Order verified (#ORD-1004)',
        '⚠ High monetary value product (₹99,999) exceeds automated resolution limit',
        '⚠ No supporting photo evidence attached',
        '⚠ Risk score elevated (65% confidence)',
      ],
    },
    evidenceAnalysis: {
      hasEvidence: false,
      evidenceQuality: 'NONE',
      evidenceConfidence: 0,
      damageDetected: false,
      imageUrl: null,
      findings: 'No photo evidence provided. Customer indicated inability to provide photos.',
      limitations: 'Unverified claim due to missing visual evidence.',
    },
    auditTrail: [
      { event: 'CASE_CREATED', timestamp: '2026-08-28T12:15:00Z', actor: 'CUSTOMER', details: 'Submitted return request for ORD-1004.' },
      { event: 'AI_ANALYSIS_STARTED', timestamp: '2026-08-28T12:15:01Z', actor: 'SYSTEM', details: 'Processed by 7-Agent Pipeline.' },
      { event: 'AI_DECISION_MADE', timestamp: '2026-08-28T12:15:02Z', actor: 'AI', details: 'AI Recommended Escalation to Human Support.' },
    ],
    agentResults: [
      { name: 'Problem Understanding Agent', status: 'completed', summary: 'Identified category as DAMAGED_PRODUCT with HIGH urgency.' },
      { name: 'Evidence Analysis Agent', status: 'completed', summary: 'Evidence Quality: NONE (0% confidence). No photo attached.' },
      { name: 'Verification Agent', status: 'completed', summary: 'Verified Order ORD-1004 (Premium Smartphone, ₹99,999, High Value).' },
      { name: 'Policy Agent', status: 'completed', summary: 'High-value policy rule triggered (₹99,999 > ₹50,000 threshold).' },
      { name: 'Risk Assessment Agent', status: 'completed', summary: 'Assessed risk level as HIGH with 65% confidence score.' },
      { name: 'Resolution Agent', status: 'completed', summary: 'Resolution decision reached: ESCALATE (Human Specialist Required)' },
      { name: 'Escalation Report Agent', status: 'completed', summary: 'Generated structured escalation report for human team with priority URGENT.' },
    ],
  };

  // Read LocalStorage human overrides on mount (IMPROVEMENT 1)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.decisions && parsed.decisions[id || fallbackCase.caseId]) {
          setHumanOverrideState(parsed.decisions[id || fallbackCase.caseId]);
        }
      }
    } catch (e) {
      console.warn('Unable to read localStorage in CaseDetailsPage.');
    }
  }, [id]);

  // ESC KEY LISTENER FOR EVIDENCE INSPECTION MODAL (IMPROVEMENT 3)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setInspectImageModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/cases/${id}`);
        if (response.data && response.data.data) {
          setCaseData(response.data.data);
        } else {
          setCaseData(fallbackCase);
        }
      } catch (err) {
        setCaseData(fallbackCase);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [id]);

  const baseActiveCase = caseData || fallbackCase;
  const activeCase = humanOverrideState
    ? {
        ...baseActiveCase,
        status: humanOverrideState.status,
        finalDecisionSource: 'HUMAN',
        humanDecision: humanOverrideState.decision,
        humanReviewer: humanOverrideState.reviewer,
        humanNotes: humanOverrideState.notes,
        humanDecisionAt: humanOverrideState.timestamp,
        auditTrail: [
          ...(baseActiveCase.auditTrail || []),
          {
            event: 'HUMAN_DECISION_MADE',
            timestamp: humanOverrideState.timestamp,
            actor: 'HUMAN',
            details: `Specialist (${humanOverrideState.reviewer}) submitted decision: ${humanOverrideState.decision}. Notes: "${humanOverrideState.notes}"`,
          },
        ],
      }
    : baseActiveCase;

  // IMPROVEMENT 1 — SUBMIT HUMAN OVERRIDE WITH LOCALSTORAGE PERSISTENCE
  const handleOverride = async (decision) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const reviewerLabel = 'Demo Operations Specialist';
    const notes = notesInput.trim() || 'Manual support review completed.';

    let newStatus = 'RESOLVED';
    if (decision === 'APPROVE') newStatus = 'RESOLVED';
    else if (decision === 'DENY') newStatus = 'CLOSED';
    else if (decision === 'REQUEST_MORE_INFO') newStatus = 'NEEDS_INFORMATION';

    try {
      await API.post(`/cases/${activeCase.caseId}/human-decision`, {
        decision,
        notes,
        reviewer: reviewerLabel,
      });
    } catch (err) {
      console.warn('Backend persistence fallback.');
    }

    const newOverride = {
      decision,
      status: newStatus,
      reviewer: reviewerLabel,
      notes,
      timestamp: now,
      assigned: true,
    };

    setHumanOverrideState(newOverride);

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : { decisions: {}, assigned: {} };
      parsed.decisions[activeCase.caseId] = newOverride;
      parsed.assigned[activeCase.caseId] = true;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.warn('Unable to persist in localStorage.');
    }

    setIsSubmitting(false);
    setNotesInput('');
  };

  // IMPROVEMENT 2 — ENTERPRISE ESCALATION REPORT EXPORT ACTION
  const handleExportReport = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-slate-100">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Command Center</span>
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ${
            activeCase.riskLevel === 'HIGH'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {activeCase.riskLevel} RISK CASE
        </span>
      </div>

      {/* Main Incident Card Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 print:border-none print:shadow-none print:p-0">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">RESOLV AI — NEXORA RETURN CASE REPORT</h1>
              <p className="text-xs text-slate-400 font-mono">Case ID: {activeCase.caseId} • Order #{activeCase.orderId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            {/* IMPROVEMENT 2 — EXPORT REPORT BUTTON */}
            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>EXPORT CASE REPORT</span>
            </button>
          </div>
        </div>

        {/* IMPROVEMENT 4 — SPECIALIST ASSIGNMENT VISUALIZATION */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md">
              DS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">Demo Operations Specialist</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                    activeCase.humanDecision !== 'NONE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {activeCase.humanDecision !== 'NONE' ? 'REVIEW COMPLETED' : 'ACTIVE REVIEW'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {activeCase.humanDecisionAt
                  ? `Decision Timestamp: ${new Date(activeCase.humanDecisionAt).toLocaleTimeString()}`
                  : 'Assigned specialist active on audit'}
              </p>
            </div>
          </div>
        </div>

        {/* AI RECOMMENDATION VS FINAL DECISION BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI RECOMMENDATION</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Preserved</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">AI Status:</span>
              <strong className="text-rose-400 font-bold">{activeCase.resolution?.recommendedResolution?.includes('Escalate') ? 'ESCALATE' : activeCase.status}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Confidence Score:</span>
              <strong className="text-white font-bold">{activeCase.confidence}%</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>FINAL DECISION SOURCE</span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {activeCase.finalDecisionSource || 'AI'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Final Outcome:</span>
              <strong className="text-white font-bold">
                {activeCase.humanDecision !== 'NONE'
                  ? `APPROVED BY HUMAN`
                  : activeCase.status === 'RESOLVED'
                  ? 'AUTO RESOLVED BY AI'
                  : 'PENDING HUMAN REVIEW'}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Reviewer:</span>
              <span className="text-slate-400 font-mono text-xs">
                {activeCase.humanReviewer || 'Demo Operations Specialist'}
              </span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE HUMAN OVERRIDE ACTIONS */}
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-sm text-white">HUMAN SPECIALIST DECISION CONTROL</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Specialist Sign-off</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Reviewer Notes / Justification:
            </label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Enter notes (e.g., Manual review completed. Customer evidence verified.)"
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleOverride('APPROVE')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>APPROVE RETURN</span>
            </button>

            <button
              onClick={() => handleOverride('DENY')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <UserX className="w-4 h-4" />
              <span>DENY RETURN</span>
            </button>

            <button
              onClick={() => handleOverride('REQUEST_MORE_INFO')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>REQUEST INFO</span>
            </button>
          </div>
        </div>

        {/* AUDIT TRAIL TIMELINE */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Complete Audit Log Timeline</span>
          </h3>

          <div className="space-y-2">
            {(activeCase.auditTrail || []).map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-bold">
                    <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-cyan-400 font-mono">
                      {log.actor}
                    </span>
                    <span className="text-white">{log.event}</span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
