import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { MOCK_ORDERS } from '../data/mockData';
import {
  LayoutDashboard,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Search,
  Bot,
  Brain,
  FileSearch,
  Database,
  Scale,
  Zap,
  FileSpreadsheet,
  UserCheck,
  Bell,
  Activity,
  Layers,
  BarChart3,
  Settings,
  AlertTriangle,
  User,
  Menu,
  X,
  Play,
  Check,
  Shield,
  ArrowRight,
  Clock,
  CheckSquare,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  GitCompare,
  Lock,
  FileText,
  UserX,
  Sparkles,
  MessageSquare,
  Maximize2,
  Download
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'resolvai_human_overrides';

export default function ServiceDashboardPage() {
  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation tab state: 'Overview', 'Priority Queue', 'Comparison Mode', 'Analytics', 'Audit Matrix'
  const [activeNav, setActiveNav] = useState('Overview');

  // Cases state loaded from API or fallback
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Local & LocalStorage state for specialist assignment and human decision overrides
  const [assignedCases, setAssignedCases] = useState({});
  const [humanDecisions, setHumanDecisions] = useState({});
  const [reviewerNotesInput, setReviewerNotesInput] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // IMPROVEMENT 3 — EVIDENCE IMAGE INSPECTION MODAL STATE
  const [inspectImageModal, setInspectImageModal] = useState(null);

  // Embedded Fallback Demo Data for instant resilience if API is offline
  const fallbackCases = [
    {
      caseId: 'CASE-892141',
      customerMessage: 'My wireless headphones arrived broken. The left side is cracked. I want a replacement.',
      orderId: 'ORD-1001',
      productName: 'Wireless Headphones',
      price: 4999,
      formattedPrice: '₹4,999',
      returnReason: 'PRODUCT_DAMAGED',
      category: 'DAMAGED_PRODUCT',
      status: 'RESOLVED',
      lifecycleStatus: 'RESOLVED',
      riskLevel: 'LOW',
      confidence: 99,
      activeEngine: 'Gemini 1.5 Pro AI Engine',
      finalDecisionSource: 'AI',
      humanDecision: 'NONE',
      createdAt: '2026-08-28T12:00:00Z',
      customerResponse: 'Great news! We have approved a replacement for your Wireless Headphones (Order ORD-1001). Return ID: RET-108498.',
      resolution: {
        returnId: 'RET-108498',
        recommendedResolution: 'Approved replacement shipment for Wireless Headphones.',
        reasons: [
          '✓ Order verified (#ORD-1001)',
          '✓ Eligible under 30-day damage protection guarantee',
          '✓ High-quality supporting photo evidence verified',
          '✓ Product value (₹4,999) within automated approval limit',
          '✓ Risk within automated threshold (99% confidence)',
        ],
      },
      evidenceAnalysis: {
        hasEvidence: true,
        evidenceQuality: 'HIGH',
        evidenceConfidence: 91,
        damageDetected: textDamageCheck('broken cracked'),
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        findings: 'Uploaded image evidence verified. Physical defect / fracture structure confirmed.',
        limitations: 'Visual analysis verified via optical evidence classifier.',
      },
      auditTrail: [
        { event: 'CASE_CREATED', timestamp: '2026-08-28T12:00:00Z', actor: 'CUSTOMER', details: 'Submitted return request.' },
        { event: 'AI_ANALYSIS_STARTED', timestamp: '2026-08-28T12:00:01Z', actor: 'SYSTEM', details: 'Dispatched to 7-Agent Pipeline.' },
        { event: 'AI_DECISION_MADE', timestamp: '2026-08-28T12:00:02Z', actor: 'AI', details: 'AI Auto-Approved replacement.' },
      ],
      agents: [
        { name: 'Problem Understanding Agent', status: 'completed', summary: 'Identified category as DAMAGED_PRODUCT with MEDIUM urgency.' },
        { name: 'Evidence Analysis Agent', status: 'completed', summary: 'Evidence Quality: HIGH (91% confidence). Damage verified.' },
        { name: 'Verification Agent', status: 'completed', summary: 'Verified Order ORD-1001 (Wireless Headphones, ₹4,999, Delivered).' },
        { name: 'Policy Agent', status: 'completed', summary: 'Damaged item policy: Eligible for instant replacement or refund.' },
        { name: 'Risk Assessment Agent', status: 'completed', summary: 'Assessed risk level as LOW with 99% confidence score.' },
        { name: 'Resolution Agent', status: 'completed', summary: 'Resolution decision reached: RESOLVED (Auto-Replacement Authorized)' },
      ],
      escalationReport: null,
    },
    {
      caseId: 'CASE-892142',
      customerMessage: 'My premium smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund.',
      orderId: 'ORD-1004',
      productName: 'Premium Smartphone',
      price: 99999,
      formattedPrice: '₹99,999',
      returnReason: 'PRODUCT_DAMAGED',
      category: 'DAMAGED_PRODUCT',
      status: 'ESCALATE',
      lifecycleStatus: 'ESCALATED',
      riskLevel: 'HIGH',
      confidence: 65,
      activeEngine: 'Gemini 1.5 Pro AI Engine',
      finalDecisionSource: 'AI',
      humanDecision: 'NONE',
      createdAt: '2026-08-28T12:15:00Z',
      customerResponse: 'Your return request for Order #ORD-1004 requires additional review by our support team due to high product value (₹99,999).',
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
        { event: 'CASE_CREATED', timestamp: '2026-08-28T12:15:00Z', actor: 'CUSTOMER', details: 'Submitted refund request.' },
        { event: 'AI_ANALYSIS_STARTED', timestamp: '2026-08-28T12:15:01Z', actor: 'SYSTEM', details: 'Dispatched to 7-Agent Pipeline.' },
        { event: 'AI_DECISION_MADE', timestamp: '2026-08-28T12:15:02Z', actor: 'AI', details: 'AI Recommended Escalation to Human Team.' },
      ],
      agents: [
        { name: 'Problem Understanding Agent', status: 'completed', summary: 'Identified category as DAMAGED_PRODUCT with HIGH urgency.' },
        { name: 'Evidence Analysis Agent', status: 'completed', summary: 'Evidence Quality: NONE (0% confidence). No photo attached.' },
        { name: 'Verification Agent', status: 'completed', summary: 'Verified Order ORD-1004 (Premium Smartphone, ₹99,999, High Value).' },
        { name: 'Policy Agent', status: 'completed', summary: 'High-value policy rule triggered (₹99,999 > ₹50,000 threshold).' },
        { name: 'Risk Assessment Agent', status: 'completed', summary: 'Assessed risk level as HIGH with 65% confidence score.' },
        { name: 'Resolution Agent', status: 'completed', summary: 'Resolution decision reached: ESCALATE (Human Specialist Required)' },
        { name: 'Escalation Report Agent', status: 'completed', summary: 'Generated structured escalation report for human team with priority URGENT.' },
      ],
      escalationReport: {
        caseId: 'CASE-892142',
        problemSummary: 'Customer received damaged Premium Smartphone (₹99,999). No clear evidence attached.',
        customerRequest: 'Immediate refund request',
        evidenceFindings: 'No visual photo evidence attached.',
        verificationFindings: 'Order ORD-1004 verified. High monetary value (₹99,999.00). Delivered recently.',
        policyFindings: 'Exceeds automated refund ceiling threshold. Requires human authorization.',
        riskAssessment: {
          riskLevel: 'HIGH',
          confidenceScore: 65,
          riskReasons: ['High monetary value product (₹99,999.00). Exceeds automated limit.', 'Insufficient visual evidence.'],
        },
        whyAIEscalated: 'Case flagged as HIGH risk due to item value exceeding threshold and missing image evidence.',
        recommendedHumanAction: 'Inspect customer order history and request photo proof before manually authorizing refund.',
        priority: 'URGENT',
      },
    },
    {
      caseId: 'CASE-892143',
      customerMessage: 'Received wrong phone case color.',
      orderId: 'ORD-1002',
      productName: 'Premium Phone Case',
      price: 1499,
      formattedPrice: '₹1,499',
      returnReason: 'WRONG_PRODUCT',
      category: 'WRONG_PRODUCT',
      status: 'RESOLVED',
      lifecycleStatus: 'RESOLVED',
      riskLevel: 'LOW',
      confidence: 95,
      activeEngine: 'Gemini 1.5 Pro AI Engine',
      finalDecisionSource: 'AI',
      humanDecision: 'NONE',
      createdAt: '2026-08-28T12:30:00Z',
      customerResponse: 'An express exchange for your Premium Phone Case (Order ORD-1002) has been authorized.',
      resolution: {
        returnId: 'RET-449201',
        recommendedResolution: 'Initiate item exchange for Premium Phone Case.',
        reasons: [
          '✓ Order verified (#ORD-1002)',
          '✓ Covered under order accuracy fulfillment policy',
          '✓ Low monetary value product (₹1,499)',
          '✓ Risk within automated threshold (95% confidence)',
        ],
      },
      evidenceAnalysis: {
        hasEvidence: false,
        evidenceQuality: 'NONE',
        evidenceConfidence: 0,
        damageDetected: false,
        imageUrl: null,
        findings: 'Low-value claim. Auto-resolved under fulfillment accuracy policy.',
        limitations: 'Self-reported item mismatch.',
      },
      auditTrail: [
        { event: 'CASE_CREATED', timestamp: '2026-08-28T12:30:00Z', actor: 'CUSTOMER', details: 'Submitted exchange request.' },
        { event: 'AI_DECISION_MADE', timestamp: '2026-08-28T12:30:01Z', actor: 'AI', details: 'AI Auto-Approved Exchange.' },
      ],
      agents: [
        { name: 'Problem Understanding Agent', status: 'completed', summary: 'Identified category as WRONG_PRODUCT.' },
        { name: 'Evidence Analysis Agent', status: 'completed', summary: 'Evidence Quality: NONE. Policy permits low-value exchange.' },
        { name: 'Verification Agent', status: 'completed', summary: 'Verified Order ORD-1002 (Phone Case, ₹1,499).' },
        { name: 'Policy Agent', status: 'completed', summary: 'Fulfillment error policy: Eligible for express exchange.' },
        { name: 'Risk Assessment Agent', status: 'completed', summary: 'Assessed risk level as LOW with 95% confidence score.' },
        { name: 'Resolution Agent', status: 'completed', summary: 'Resolution decision reached: RESOLVED (Express Exchange Authorized)' },
      ],
      escalationReport: null,
    },
  ];

  function textDamageCheck(str) {
    return str.includes('broken') || str.includes('cracked');
  }

  // IMPROVEMENT 1 — READ LOCALSTORAGE PERSISTED OVERRIDES ON MOUNT
  useEffect(() => {
    try {
      const savedOverrides = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedOverrides) {
        const parsed = JSON.parse(savedOverrides);
        setHumanDecisions(parsed.decisions || {});
        setAssignedCases(parsed.assigned || {});
      }
    } catch (e) {
      console.warn('Unable to read localStorage human overrides.');
    }
  }, []);

  // ESC KEY LISTENER FOR EVIDENCE INSPECTION MODAL (IMPROVEMENT 3)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setInspectImageModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch demo data from GET /api/cases/demo
  useEffect(() => {
    const fetchDemoData = async () => {
      setLoading(true);
      try {
        const response = await API.get('/cases/demo');
        if (response.data && response.data.scenarios) {
          const loadedCases = response.data.scenarios.map((sc) => sc.data);
          setCases(loadedCases);
          setIsLiveApi(true);
          if (loadedCases.length > 0) {
            setSelectedCaseId(loadedCases[0].caseId);
          }
        } else {
          setCases(fallbackCases);
          setIsLiveApi(false);
          setSelectedCaseId(fallbackCases[0].caseId);
        }
      } catch (err) {
        console.warn('Backend API offline or error. Using fallback demo dataset.');
        setCases(fallbackCases);
        setIsLiveApi(false);
        setSelectedCaseId(fallbackCases[0].caseId);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  // Selected Case Object (with local & localStorage human override state merged)
  const baseSelectedCase = cases.find((c) => c.caseId === selectedCaseId) || cases[0] || fallbackCases[0];
  const overrideData = humanDecisions[baseSelectedCase?.caseId];
  const isAssigned = assignedCases[baseSelectedCase?.caseId] || (overrideData && overrideData.assigned);

  const selectedCase = overrideData
    ? {
        ...baseSelectedCase,
        status: overrideData.status,
        finalDecisionSource: 'HUMAN',
        humanDecision: overrideData.decision,
        humanReviewer: overrideData.reviewer,
        humanNotes: overrideData.notes,
        humanDecisionAt: overrideData.timestamp,
        auditTrail: [
          ...(baseSelectedCase.auditTrail || []),
          {
            event: 'HUMAN_DECISION_MADE',
            timestamp: overrideData.timestamp,
            actor: 'HUMAN',
            details: `Specialist (${overrideData.reviewer}) submitted decision: ${overrideData.decision}. Notes: "${overrideData.notes}"`,
          },
        ],
      }
    : baseSelectedCase;

  // Filtered cases
  const filteredCases = cases.map(c => humanDecisions[c.caseId] ? { ...c, status: humanDecisions[c.caseId].status } : c).filter((c) => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'RESOLVED' && c.status === 'RESOLVED') ||
      (filterStatus === 'ESCALATE' && c.status === 'ESCALATE');
    const matchesSearch =
      !searchQuery ||
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.orderId && c.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.customerMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // STEP 3: DERIVED DYNAMIC KPI CALCULATIONS
  const totalCasesCount = cases.length;
  const autoResolvedCount = cases.filter((c) => c.status === 'RESOLVED').length;
  const escalatedCount = cases.filter((c) => c.status === 'ESCALATE').length;
  const automationRate = totalCasesCount > 0 ? Math.round((autoResolvedCount / totalCasesCount) * 100) : 75;
  const escalationRate = totalCasesCount > 0 ? Math.round((escalatedCount / totalCasesCount) * 100) : 25;

  // STEP 5: DERIVED RISK DISTRIBUTION
  const lowRiskCount = cases.filter((c) => c.riskLevel === 'LOW').length;
  const medRiskCount = cases.filter((c) => c.riskLevel === 'MEDIUM').length;
  const highRiskCount = cases.filter((c) => c.riskLevel === 'HIGH').length;

  // PRIORITY ESCALATION QUEUE (SORTED BY HIGH RISK & VALUE)
  const priorityQueueCases = [...cases].sort((a, b) => {
    if (a.riskLevel === 'HIGH' && b.riskLevel !== 'HIGH') return -1;
    if (a.riskLevel !== 'HIGH' && b.riskLevel === 'HIGH') return 1;
    const priceA = a.price || (a.orderId === 'ORD-1004' ? 99999 : 4999);
    const priceB = b.price || (b.orderId === 'ORD-1004' ? 99999 : 4999);
    return priceB - priceA;
  });

  // IMPROVEMENT 4 — HANDLES SPECIALIST ASSIGNMENT WITH LOCALSTORAGE PERSISTENCE
  const handleAssignSpecialist = (caseId) => {
    const updatedAssigned = { ...assignedCases, [caseId]: true };
    setAssignedCases(updatedAssigned);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        decisions: humanDecisions,
        assigned: updatedAssigned,
      }));
    } catch (e) {
      console.warn('Unable to persist assignment in localStorage.');
    }
  };

  // IMPROVEMENT 1 — SUBMIT HUMAN OVERRIDE DECISION WITH LOCALSTORAGE PERSISTENCE
  const handleHumanOverride = async (caseId, decision) => {
    setIsSubmittingOverride(true);
    const now = new Date().toISOString();
    const reviewerLabel = 'Demo Operations Specialist';
    const notes = reviewerNotesInput.trim() || 'Manual support review completed.';

    let newStatus = 'RESOLVED';
    if (decision === 'APPROVE') newStatus = 'RESOLVED';
    else if (decision === 'DENY') newStatus = 'CLOSED';
    else if (decision === 'REQUEST_MORE_INFO') newStatus = 'NEEDS_INFORMATION';

    try {
      await API.post(`/cases/${caseId}/human-decision`, {
        decision,
        notes,
        reviewer: reviewerLabel,
      });
    } catch (err) {
      console.warn('Backend persistence unavailable. Applying local state & localStorage persistence.');
    }

    const updatedDecisions = {
      ...humanDecisions,
      [caseId]: {
        decision,
        status: newStatus,
        reviewer: reviewerLabel,
        notes,
        timestamp: now,
        assigned: true,
      },
    };

    const updatedAssigned = { ...assignedCases, [caseId]: true };

    setHumanDecisions(updatedDecisions);
    setAssignedCases(updatedAssigned);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        decisions: updatedDecisions,
        assigned: updatedAssigned,
      }));
    } catch (e) {
      console.warn('Unable to persist human decision in localStorage.');
    }

    setIsSubmittingOverride(false);
    setReviewerNotesInput('');
  };

  // 7 Agent Definitions mapping for visual workflow
  const get7AgentList = (currentCase) => {
    return [
      {
        id: 1,
        name: 'Problem Understanding Agent',
        icon: Brain,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[0]?.summary || `Identified category as ${currentCase?.category || 'DAMAGED_PRODUCT'}.`,
      },
      {
        id: 2,
        name: 'Evidence Analysis Agent',
        icon: FileSearch,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[1]?.summary || `Evidence Quality: ${currentCase?.evidenceAnalysis?.evidenceQuality || 'NONE'}. Findings evaluated.`,
      },
      {
        id: 3,
        name: 'Verification Agent',
        icon: Database,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[2]?.summary || `Verified order ${currentCase?.orderId || 'ORD-1001'} details.`,
      },
      {
        id: 4,
        name: 'Policy Agent',
        icon: Scale,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[3]?.summary || 'Evaluated return and replacement policy rules.',
      },
      {
        id: 5,
        name: 'Risk Assessment Agent',
        icon: ShieldAlert,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[4]?.summary || `Calculated ${currentCase?.riskLevel || 'LOW'} risk score (${currentCase?.confidence || 95}% confidence).`,
      },
      {
        id: 6,
        name: 'Resolution Agent',
        icon: Zap,
        status: 'COMPLETED',
        summary: currentCase?.agents?.[5]?.summary || `Finalized decision: ${currentCase?.status}.`,
      },
      {
        id: 7,
        name: 'Escalation Report Agent',
        icon: FileSpreadsheet,
        status: currentCase?.status === 'ESCALATE' || currentCase?.humanDecision !== 'NONE' ? 'ACTIVATED' : 'SKIPPED',
        summary:
          currentCase?.status === 'ESCALATE'
            ? 'Activated: Generated structured escalation report for human specialist.'
            : 'Skipped: High confidence auto-resolution met. No human escalation required.',
      },
    ];
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-slate-950 text-slate-100">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">RESOLV.AI</span>
              <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Enterprise Ops</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'Overview', name: 'Overview', icon: LayoutDashboard },
            { id: 'Priority Queue', name: 'Priority Review Queue', icon: AlertTriangle, badge: escalatedCount.toString() },
            { id: 'Comparison Mode', name: 'AI Comparison Mode', icon: GitCompare, badge: 'Judge View' },
            { id: 'Analytics', name: 'Risk & Override Analytics', icon: BarChart3 },
            { id: 'Audit Matrix', name: 'AI Audit Matrix', icon: Cpu },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (sidebarOpen) setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === item.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <item.icon className={`w-4 h-4 ${activeNav === item.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-cyan-300 font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Status */}
        <div className="p-3 border-t border-slate-800/80 space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium text-[11px]">AI Engine</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Operations Lead</p>
              <p className="text-[10px] text-slate-400 truncate">admin@nexora.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN COMMAND CENTER CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* HEADER */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base text-white flex items-center gap-2">
                RESOLV AI — ENTERPRISE RETURN INTELLIGENCE
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono font-semibold">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{selectedCase.activeEngine || 'Gemini 1.5 Pro AI Engine'}</span>
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Trust, Auditability & Human Override Platform
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isLiveApi ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <strong className={isLiveApi ? 'text-emerald-400' : 'text-amber-400'}>
                {isLiveApi ? 'LIVE API DATA' : 'DEMO MODE'}
              </strong>
            </span>

            <button
              aria-label="Notifications"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
            </button>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* JUDGE DEMONSTRATION VIEW — AI DECISION COMPARISON MODE */}
          {activeNav === 'Comparison Mode' || activeNav === 'Overview' ? (
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950 space-y-6 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-500/30 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <GitCompare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                      AI DECISION COMPARISON MODE
                      <span className="text-xs font-bold text-cyan-300 px-2 py-0.5 rounded bg-indigo-600/30 border border-indigo-500/40 uppercase">
                        Judge Demonstration View
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Comparing Autonomous Auto-Resolution vs. High-Risk Human Review & Override
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-cyan-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  "Don't automate every return. Automate the right returns."
                </div>
              </div>

              {/* SIDE BY SIDE COMPARISON CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT: LOW RISK RETURN (ORD-1001) */}
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="font-extrabold text-sm text-emerald-400">🟢 LOW-RISK RETURN</span>
                    </div>
                    <span className="font-mono text-xs text-emerald-300 font-bold">ORD-1001</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Product:</span>
                      <strong className="text-white">Wireless Headphones</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Value:</span>
                      <strong className="text-emerald-400 font-bold">₹4,999</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Evidence Quality:</span>
                      <strong className="text-emerald-300">HIGH (Photo Verified)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Risk Level:</span>
                      <strong className="text-emerald-400">LOW RISK (99% Conf)</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    ✓ FINAL DECISION: AUTO RESOLVED BY AI
                  </div>
                </div>

                {/* RIGHT: HIGH RISK RETURN (ORD-1004) */}
                <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="font-extrabold text-sm text-rose-400">🔴 HIGH-RISK RETURN</span>
                    </div>
                    <span className="font-mono text-xs text-rose-300 font-bold">ORD-1004</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Product:</span>
                      <strong className="text-white">Premium Smartphone</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Value:</span>
                      <strong className="text-rose-400 font-bold">₹99,999</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Evidence Quality:</span>
                      <strong className="text-rose-300">NONE / Insufficient</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>AI Recommendation:</span>
                      <strong className="text-rose-400">ESCALATE (65% Conf)</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center text-xs font-bold text-rose-300 uppercase tracking-wider">
                    {humanDecisions['CASE-892142'] ? (
                      <span className="text-emerald-300">✓ FINAL DECISION: {humanDecisions['CASE-892142'].decision} BY HUMAN</span>
                    ) : (
                      <span>⚠ HUMAN REVIEW & OVERRIDE AVAILABLE</span>
                    )}
                  </div>
                </div>

              </div>

              {/* DEMO TAGLINE BANNER */}
              <div className="text-center pt-2 border-t border-indigo-500/20">
                <p className="text-sm font-extrabold text-white tracking-wide">
                  "Same return workflow. Different evidence, value, and risk. Different AI decision."
                </p>
              </div>

            </div>
          ) : null}

          {/* EXECUTIVE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Return Cases</span>
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-white">{totalCasesCount}</h3>
                <span className="text-[11px] font-semibold text-cyan-400">Derived from dataset</span>
              </div>
              <p className="text-[11px] text-slate-400">Active return claims in queue</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">AI Auto-Resolved</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-white">{autoResolvedCount}</h3>
                <span className="text-[11px] font-bold text-emerald-400">{automationRate}% Auto Rate</span>
              </div>
              <p className="text-[11px] text-slate-400">Zero human intervention required</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Human Escalations</span>
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-white">{escalatedCount}</h3>
                <span className="text-[11px] font-bold text-rose-400">{escalationRate}% Escalation</span>
              </div>
              <p className="text-[11px] text-slate-400">Escalated for human authorization</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Human Override Activity</span>
                <UserCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-white">{Object.keys(humanDecisions).length}</h3>
                <span className="text-[11px] font-bold text-cyan-300">Audited Decisions</span>
              </div>
              <p className="text-[11px] text-slate-400">AI Recommendation $\rightarrow$ Human Override</p>
            </div>
          </div>

          {/* MAIN GRID: CASE QUEUE (LEFT 5 COLUMNS) + CASE INTELLIGENCE & HUMAN OVERRIDE PANEL (RIGHT 7 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* PRIORITY ESCALATION QUEUE (LEFT 5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white text-base flex items-center gap-2">
                    <span>Priority Review Queue</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                      {priorityQueueCases.filter(c => c.status === 'ESCALATE').length} Urgent
                    </span>
                  </h2>
                  <span className="text-xs text-slate-400">{filteredCases.length} cases</span>
                </div>

                {/* Filter & Search Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search case ID or order..."
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['ALL', 'RESOLVED', 'ESCALATE'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          filterStatus === st
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Case Cards List */}
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {priorityQueueCases.map((c) => {
                    const localOverride = humanDecisions[c.caseId];
                    const displayStatus = localOverride ? localOverride.status : c.status;

                    return (
                      <div
                        key={c.caseId}
                        onClick={() => setSelectedCaseId(c.caseId)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                          c.caseId === selectedCaseId
                            ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-300">{c.caseId}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              displayStatus === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {localOverride ? `HUMAN: ${localOverride.decision}` : displayStatus}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                          {c.customerMessage}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>Order: <strong className="text-slate-300 font-mono">{c.orderId || 'N/A'}</strong></span>
                          <span>Confidence: <strong className="text-white">{c.confidence}%</strong></span>
                          <span
                            className={`font-semibold ${
                              c.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {c.riskLevel} Risk
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DETAILED CASE INTELLIGENCE & HUMAN OVERRIDE PANEL (RIGHT 7 COLUMNS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Header Banner for Selected Case */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-extrabold text-indigo-300">{selectedCase.caseId}</span>
                      <span className="text-xs text-slate-400 font-mono">Order #{selectedCase.orderId}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">{selectedCase.customerMessage}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        selectedCase.finalDecisionSource === 'HUMAN'
                          ? 'bg-indigo-500/20 text-cyan-300 border border-indigo-500/40'
                          : selectedCase.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {selectedCase.finalDecisionSource === 'HUMAN'
                        ? `HUMAN DECISION: ${selectedCase.humanDecision}`
                        : selectedCase.status === 'RESOLVED'
                        ? 'AUTO-RESOLVED BY AI'
                        : 'HUMAN REVIEW REQUIRED'}
                    </span>
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
                            selectedCase.humanDecision !== 'NONE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isAssigned
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {selectedCase.humanDecision !== 'NONE'
                            ? 'REVIEW COMPLETED'
                            : isAssigned
                            ? 'ACTIVE REVIEW'
                            : 'UNASSIGNED'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {selectedCase.humanDecisionAt
                          ? `Decision Timestamp: ${new Date(selectedCase.humanDecisionAt).toLocaleTimeString()}`
                          : isAssigned
                          ? 'Assigned & actively auditing case'
                          : 'Requires specialist review authorization'}
                      </p>
                    </div>
                  </div>

                  {!isAssigned && selectedCase.status === 'ESCALATE' && (
                    <button
                      onClick={() => handleAssignSpecialist(selectedCase.caseId)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-xs shadow-md flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign to Specialist</span>
                    </button>
                  )}
                </div>

                {/* IMPROVEMENT 3 — EVIDENCE IMAGE INSPECTION BUTTON & THUMBNAIL */}
                {selectedCase.evidenceAnalysis?.imageUrl ? (
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedCase.evidenceAnalysis.imageUrl}
                        alt="Evidence thumbnail"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-950 cursor-pointer"
                        onClick={() => setInspectImageModal(selectedCase)}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">Visual Evidence Attached</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Quality: {selectedCase.evidenceAnalysis.evidenceQuality || 'HIGH'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {selectedCase.evidenceAnalysis.findings || 'Image metadata & structural defect verified.'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectImageModal(selectedCase)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 font-semibold text-xs border border-indigo-500/40 flex items-center space-x-1.5 transition-all shrink-0"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect Evidence</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>No visual photo evidence attached to this return request.</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Quality: NONE</span>
                  </div>
                )}

                {/* AI RECOMMENDATION VS HUMAN DECISION CARD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* AI RECOMMENDATION (PRESERVED PERMANENTLY) */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>AI RECOMMENDATION</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Preserved</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Status:</span>
                      <strong className={selectedCase.status === 'RESOLVED' ? 'text-emerald-400' : 'text-rose-400'}>
                        {selectedCase.resolution?.recommendedResolution?.includes('Escalate') ? 'ESCALATE' : selectedCase.status}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Risk Score:</span>
                      <strong className="text-white">{selectedCase.riskLevel} ({selectedCase.confidence}%)</strong>
                    </div>
                  </div>

                  {/* FINAL DECISION */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>FINAL DECISION SOURCE</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 font-bold">
                        {selectedCase.finalDecisionSource || 'AI'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Decision:</span>
                      <strong className="text-white font-bold">
                        {selectedCase.humanDecision !== 'NONE'
                          ? `APPROVED BY HUMAN`
                          : selectedCase.status === 'RESOLVED'
                          ? 'AUTO RESOLVED BY AI'
                          : 'PENDING HUMAN REVIEW'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Reviewer:</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {selectedCase.humanReviewer || 'Demo Operations Specialist'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* INTERACTIVE HUMAN OVERRIDE PANEL */}
                {selectedCase.status === 'ESCALATE' || selectedCase.humanDecision !== 'NONE' ? (
                  <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-extrabold text-sm text-white">HUMAN SPECIALIST OVERRIDE ACTIONS</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Audited Handoff Control</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Optional Specialist Notes / Justification:
                      </label>
                      <textarea
                        value={reviewerNotesInput}
                        onChange={(e) => setReviewerNotesInput(e.target.value)}
                        placeholder="e.g. Evidence manually verified with customer. Authorizing replacement."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Human Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleHumanOverride(selectedCase.caseId, 'APPROVE')}
                        disabled={isSubmittingOverride}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>APPROVE RETURN</span>
                      </button>

                      <button
                        onClick={() => handleHumanOverride(selectedCase.caseId, 'DENY')}
                        disabled={isSubmittingOverride}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <UserX className="w-4 h-4" />
                        <span>DENY RETURN</span>
                      </button>

                      <button
                        onClick={() => handleHumanOverride(selectedCase.caseId, 'REQUEST_MORE_INFO')}
                        disabled={isSubmittingOverride}
                        className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>REQUEST INFO</span>
                      </button>
                    </div>

                    {/* Display recorded notes if human decision submitted */}
                    {selectedCase.humanNotes && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Recorded Reviewer Note:</span>
                        <p className="italic">"{selectedCase.humanNotes}"</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* COMPLETE AUDIT TRAIL TIMELINE */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Complete Case Audit Trail</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Sequential Event Log</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(selectedCase.auditTrail || []).map((log, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2 font-bold">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-cyan-400 font-mono">
                              {log.actor}
                            </span>
                            <span className="text-white">{log.event}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7 AGENTS VISUAL WORKFLOW LIST */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>7 AI Agents Workflow Pipeline</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Sequential Multi-Agent Audit</span>
                  </div>

                  {/* 7 Agent Cards */}
                  <div className="space-y-2.5">
                    {get7AgentList(selectedCase).map((agent) => {
                      const IconComponent = agent.icon;
                      const isActivated = agent.status === 'ACTIVATED';
                      const isSkipped = agent.status === 'SKIPPED';

                      return (
                        <div
                          key={agent.id}
                          className={`p-3 rounded-xl border transition-all duration-300 flex items-start space-x-3 shadow-md ${
                            isActivated
                              ? 'bg-rose-950/30 border-rose-500/50 shadow-rose-500/10'
                              : isSkipped
                              ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                              : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              isActivated
                                ? 'bg-rose-600 text-white'
                                : isSkipped
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center space-x-2">
                                <span className="text-[10px] font-mono text-slate-500">0{agent.id}.</span>
                                <span>{agent.name}</span>
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  isActivated
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : isSkipped
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {agent.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                              {agent.summary}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* IMPROVEMENT 3 — EVIDENCE IMAGE INSPECTION MODAL */}
      {inspectImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 max-w-2xl w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Maximize2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white">Visual Evidence Deep Inspection</h3>
              </div>
              <button
                onClick={() => setInspectImageModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <img
                  src={inspectImageModal.evidenceAnalysis?.imageUrl}
                  alt="Full evidence view"
                  className="w-full h-64 rounded-2xl object-cover border border-slate-700 bg-slate-900 shadow-md"
                />
                <span className="text-[10px] text-slate-400 block font-mono text-center">
                  Target Case ID: {inspectImageModal.caseId}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Evidence Quality Rating</span>
                  <span className="font-bold text-emerald-400 block text-sm">
                    {inspectImageModal.evidenceAnalysis?.evidenceQuality || 'HIGH'} (Confidence: {inspectImageModal.evidenceAnalysis?.evidenceConfidence || 91}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Damage Status</span>
                  <span className="font-bold text-white block">
                    {inspectImageModal.evidenceAnalysis?.damageDetected ? '✓ Defect Structural Fracture Confirmed' : 'No Damage Detected'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Inspection Findings</span>
                  <p className="text-slate-300 text-[11px]">
                    {inspectImageModal.evidenceAnalysis?.findings || 'Uploaded image verified against image classification dataset.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectImageModal(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
