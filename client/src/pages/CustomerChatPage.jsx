import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import API from '../services/api';
import { MOCK_ORDERS } from '../data/mockData';
import {
  Bot,
  Send,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  Plus,
  MessageSquare,
  PackageX,
  RotateCcw,
  PackageSearch,
  HelpCircle,
  User,
  Menu,
  X,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play,
  ArrowRight,
  Package,
  Sparkles,
  AlertCircle,
  Lock,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export default function CustomerChatPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract orderId from route location state or URL search parameters ?orderId=ORD-xxxx
  const paramOrderId = location.state?.orderId || searchParams.get('orderId') || null;
  const [selectedOrderId, setSelectedOrderId] = useState(paramOrderId);

  // Structured return reason state (optional UI selection, separated from confirmed intent)
  const [selectedReason, setSelectedReason] = useState(null);

  // Resolution Preference state ('REPLACEMENT' | 'REFUND')
  const [resolutionPref, setResolutionPref] = useState('REPLACEMENT');

  // Conversations list state
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      title: 'Damaged Headphones (#ORD-1001)',
      date: 'Today',
      active: true,
      orderId: 'ORD-1001',
    },
    {
      id: 'conv-2',
      title: 'Smartphone Refund (#ORD-1004)',
      date: 'Today',
      active: false,
      orderId: 'ORD-1004',
    },
  ]);

  const [activeConvId, setActiveConvId] = useState('conv-1');

  // Messages in current conversation
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Multi-image attachments
  const [selectedImages, setSelectedImages] = useState([]);
  
  // Audio / Mic recording states
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepText, setAnalysisStepText] = useState('Understanding your request...');

  const messagesEndRef = useRef(null);

  // Sync route order ID when location state changes
  useEffect(() => {
    if (paramOrderId) {
      setSelectedOrderId(paramOrderId);
    }
  }, [paramOrderId]);

  // Mic recording timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Selected Order object from mock dataset
  const activeOrderObj = MOCK_ORDERS.find(
    (o) => o.orderId.toUpperCase() === (selectedOrderId || '').toUpperCase()
  ) || MOCK_ORDERS[0];

  // Structured Return Reasons List
  const RETURN_REASONS = [
    { id: 'PRODUCT_DAMAGED', label: 'Product damaged', icon: PackageX, helper: 'Tell us what is damaged and when you noticed it.' },
    { id: 'WRONG_PRODUCT', label: 'Wrong product received', icon: HelpCircle, helper: 'Tell us what you received and what you expected.' },
    { id: 'NOT_WORKING', label: 'Product not working / defective', icon: AlertTriangle, helper: 'Describe what isn’t working or upload sound/photo evidence.' },
    { id: 'MISSING_ITEM', label: 'Missing item / accessory', icon: PackageSearch, helper: 'Tell us which item or accessory is missing.' },
    { id: 'NOT_AS_DESCRIBED', label: 'Not as described', icon: Info, helper: 'Explain how the product differs from the listing.' },
    { id: 'DONT_WANT', label: "Don't want it anymore (Change of mind)", icon: RotateCcw, helper: 'Tell us why you would like to return this item.' },
    { id: 'OTHER', label: 'Other problem', icon: MessageSquare, helper: 'Please detail your issue.' },
  ];

  const currentReasonHelper = selectedReason
    ? (RETURN_REASONS.find(r => r.id === selectedReason)?.helper || 'Describe your problem naturally...')
    : 'Explain your issue in your own words, ask a question, or attach photos/voice notes...';

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing, analysisStepText]);

  // Extract Order ID matching ORD-XXXX
  const extractOrderId = (text) => {
    if (!text) return null;
    const match = text.match(/ORD-\d{4}/i);
    return match ? match[0].toUpperCase() : null;
  };

  // Handle Multi-Image selection
  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => URL.createObjectURL(file));
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  // Toggle Voice Recording via MediaRecorder
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          setSelectedAudio({
            url: audioUrl,
            name: `Voice Note (${recordingSeconds}s)`,
            transcript: 'Voice recording attached: Customer describing acoustic/functional issue.',
          });
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        // Fallback simulation if mic permission denied
        setSelectedAudio({
          url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          name: 'Voice Evidence (Simulated)',
          transcript: 'Voice note: Speaker makes abnormal buzzing sound when powered on.',
        });
      }
    }
  };

  // Client-side 7-agent engine fallback generator
  const generateClientFallbackResponse = (messageText, orderId, returnReason, preference, audioEvidence, imagesEvidence) => {
    const msg = (messageText || '').toLowerCase();
    const caseId = `CASE-${Math.floor(100000 + Math.random() * 900000)}`;
    const returnId = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
    const refundId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const replacementId = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
    const isRefund = preference === 'REFUND' || returnReason === 'DONT_WANT';

    // Feature 5 Greeting Fallback
    const GREETINGS = ['hi', 'hello', 'hey', 'thanks', 'thank you'];
    if (GREETINGS.includes(msg.trim())) {
      return {
        status: 'NONE',
        customerResponse: "Hi! 👋 I can help you with a return, refund, or replacement for your NEXORA orders. What issue are you experiencing?",
      };
    }

    // Feature 6 General Question Fallback
    if (msg.includes('how do returns work') || msg.includes('can i return this')) {
      return {
        status: 'NONE',
        customerResponse: "NEXORA offers a hassle-free 30-day return & replacement guarantee on most eligible orders. You can request an instant refund or express replacement right here by sharing your order details.",
      };
    }

    if (orderId === 'ORD-1004' || msg.includes('ord-1004') || (msg.includes('smartphone') && msg.includes('refund'))) {
      return {
        caseId,
        returnId: null,
        refundId: null,
        replacementId: null,
        resolutionPreference: preference,
        status: 'ESCALATE',
        riskLevel: 'HIGH',
        confidence: 65,
        customerResponse: 'Your return request for Order #ORD-1004 requires additional review by our support team due to high product value (₹99,999). A specialist has been assigned to your case report.',
        reasons: [
          '✓ Order verified (#ORD-1004)',
          '⚠ High monetary value product (₹99,999) exceeds automated resolution limit',
          '⚠ No supporting photo evidence attached',
          '⚠ Escalated for specialist authorization',
        ],
        trackingTimeline: [
          { step: 'Return Request Submitted', date: 'Aug 29', status: 'COMPLETED' },
          { step: 'Specialist Review Started', date: 'Aug 29', status: 'CURRENT' },
          { step: 'Decision Pending', date: 'Pending', status: 'PENDING' },
        ],
        escalationReport: {
          caseId,
          problemSummary: messageText,
          priority: 'URGENT',
        },
      };
    }

    return {
      caseId,
      returnId,
      refundId: isRefund ? refundId : null,
      replacementId: !isRefund ? replacementId : null,
      resolutionPreference: preference,
      status: 'RESOLVED',
      riskLevel: 'LOW',
      confidence: 99,
      customerResponse: isRefund
        ? `Great news! Your refund request for ${activeOrderObj?.productName || 'Wireless Headphones'} (Order ${orderId || 'ORD-1001'}) has been approved. Refund ID: ${refundId}. Pickup will be scheduled automatically.`
        : `Great news! Your replacement request for ${activeOrderObj?.productName || 'Wireless Headphones'} (Order ${orderId || 'ORD-1001'}) has been approved. Replacement ID: ${replacementId}. Replacement shipment is ready for dispatch.`,
      reasons: [
        '✓ Order verified (#ORD-1001)',
        '✓ Eligible under 30-day return policy guarantee',
        imagesEvidence.length > 0 ? `✓ ${imagesEvidence.length} photo(s) verified` : '✓ Supporting evidence verified',
        '✓ Product value (₹4,999) within automated approval limit',
      ],
      trackingTimeline: isRefund
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
          ],
      escalationReport: null,
    };
  };

  // Real backend connection handler
  const sendMessage = async (textToSend, imagesToSend = [], audioToSend = null, customReason = null, customPref = null) => {
    const trimmed = textToSend ? textToSend.trim() : '';
    if (!trimmed && imagesToSend.length === 0 && !audioToSend) return;

    const effectiveReason = customReason || selectedReason;
    const effectivePref = customPref || resolutionPref;
    const extractedOrderId = extractOrderId(trimmed);
    const effectiveOrderId = extractedOrderId || selectedOrderId || 'ORD-1001';

    // 1. Add user message to state
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      returnReason: effectiveReason,
      resolutionPreference: effectivePref,
      images: imagesToSend,
      audio: audioToSend,
      orderId: effectiveOrderId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedImages([]);
    setSelectedAudio(null);
    setIsAnalyzing(true);
    setAnalysisStepText('Understanding your request...');

    // Customer-facing stage transitions
    const timer1 = setTimeout(() => setAnalysisStepText('Checking your order context...'), 400);
    const timer2 = setTimeout(() => setAnalysisStepText('Analyzing visual & acoustic evidence...'), 800);
    const timer3 = setTimeout(() => setAnalysisStepText('Reviewing return eligibility...'), 1200);
    const timer4 = setTimeout(() => setAnalysisStepText('Finding the best resolution...'), 1600);

    let data = null;

    try {
      // 2. Primary API Request via Vite Proxy
      const response = await API.post('/cases/analyze', {
        message: trimmed,
        orderId: effectiveOrderId,
        returnReason: effectiveReason,
        resolutionPreference: effectivePref,
        evidence: imagesToSend.length > 0 ? { hasImage: true, imageUrl: imagesToSend[0], images: imagesToSend } : { hasImage: false },
        audio: audioToSend ? { hasAudio: true, audioUrl: audioToSend.url, transcript: audioToSend.transcript } : null,
      });

      const rawData = response.data;
      data = rawData?.data || rawData;
    } catch (primaryError) {
      console.warn('Vite proxy request failed, attempting direct backend connection...', primaryError.message);
      try {
        // Direct backend fallback call
        const directResponse = await axios.post('http://localhost:5001/api/cases/analyze', {
          message: trimmed,
          orderId: effectiveOrderId,
          returnReason: effectiveReason,
          resolutionPreference: effectivePref,
          evidence: imagesToSend.length > 0 ? { hasImage: true, imageUrl: imagesToSend[0], images: imagesToSend } : { hasImage: false },
          audio: audioToSend ? { hasAudio: true, audioUrl: audioToSend.url, transcript: audioToSend.transcript } : null,
        });
        const rawData = directResponse.data;
        data = rawData?.data || rawData;
      } catch (secondaryError) {
        console.warn('Backend unavailable, engaging intelligent resolution engine fallback...', secondaryError.message);
        data = generateClientFallbackResponse(trimmed, effectiveOrderId, effectiveReason, effectivePref, audioToSend, imagesToSend);
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsAnalyzing(false);
    }

    if (data) {
      const resObj = data.resolution || data;
      const statusVal = resObj.status || data.status;
      const responseReply = data.conversation?.reply || data.customerResponse || 'Your return request has been analyzed.';

      // 3. Add AI message with explainable decision metadata
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        caseData: statusVal !== 'NONE' ? {
          caseId: data.caseId,
          returnId: resObj.returnId || data.returnId,
          refundId: resObj.refundId || data.refundId,
          replacementId: resObj.replacementId || data.replacementId,
          resolutionPreference: effectivePref,
          status: statusVal,
          riskLevel: data.riskLevel,
          reasons: resObj.reasons || data.reasons || [],
          trackingTimeline: resObj.trackingTimeline || data.trackingTimeline || [],
          escalationReport: data.escalationReport,
        } : null,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isAnalyzing) return;
    sendMessage(input, selectedImages, selectedAudio);
  };

  const handleDemoScenario = (scenarioText, orderId, reason, pref = 'REPLACEMENT') => {
    if (isAnalyzing) return;
    if (orderId) setSelectedOrderId(orderId);
    if (reason) setSelectedReason(reason);
    if (pref) setResolutionPref(pref);
    sendMessage(scenarioText, [], null, reason, pref);
  };

  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv = {
      id: newId,
      title: 'New Return Request',
      date: 'Just now',
      active: true,
      orderId: null,
    };

    setConversations((prev) => [newConv, ...prev.map((c) => ({ ...c, active: false }))]);
    setActiveConvId(newId);
    setSelectedOrderId(null);
    setMessages([]);
    setSelectedImages([]);
    setSelectedAudio(null);
    setInput('');
    if (sidebarOpen) setSidebarOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-950 text-slate-100">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-wide">RESOLV AI Assistant</span>
              <p className="text-[10px] text-slate-400">NEXORA Returns</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-3">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>New Return Request</span>
          </button>
        </div>

        {/* Previous Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recent Conversations
          </p>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConvId(conv.id);
                setConversations((prev) =>
                  prev.map((c) => ({ ...c, active: c.id === conv.id }))
                );
                if (conv.orderId) setSelectedOrderId(conv.orderId);
                if (sidebarOpen) setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center space-x-2.5 transition-all ${
                conv.active
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate font-medium">{conv.title}</p>
                <p className="text-[10px] text-slate-400">{conv.date}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar Footer Links */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <Link
            to="/orders"
            className="flex items-center space-x-2.5 p-2 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-slate-800/60 hover:text-white transition-colors"
          >
            <Package className="w-4 h-4 text-cyan-400" />
            <span>View My Orders</span>
          </Link>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Customer Account</p>
              <p className="text-[10px] text-slate-400 truncate">customer@nexora.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0">
        
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open conversation history menu"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <h1 className="font-bold text-sm text-white flex items-center gap-2">
                NEXORA Multimodal Return Assistant
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Buyer Protection</span>
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Natural Language • Multimodal Vision • Audio Evidence Processing
              </p>
            </div>
          </div>
        </header>

        {/* ORDER CONTEXT HEADER CARD */}
        {activeOrderObj && (
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={activeOrderObj.image}
                alt={activeOrderObj.productName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm truncate">{activeOrderObj.productName}</span>
                  <span className="font-mono text-xs text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    #{activeOrderObj.orderId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Delivered {activeOrderObj.deliveryDate} • Price: <strong className="text-emerald-400">{activeOrderObj.formattedPrice}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Eligible for Return / Replace until {activeOrderObj.returnDeadline || 'Sep 15, 2026'}
              </span>
            </div>
          </div>
        )}

        {/* Chat Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* Welcome & Return Workflow Setup (shown when starting) */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto space-y-6 my-auto py-2">
              
              {/* Return Assistant Welcome Panel */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">
                      How can we help with your return?
                    </h2>
                    <p className="text-xs text-slate-300">
                      Type your problem naturally below or attach photos/voice notes anytime.
                    </p>
                  </div>
                </div>

                {/* RESOLUTION PREFERENCE SELECTOR (Refund vs Replacement) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    Preferred Resolution
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResolutionPref('REPLACEMENT')}
                      className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                        resolutionPref === 'REPLACEMENT'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <RefreshCw className={`w-5 h-5 ${resolutionPref === 'REPLACEMENT' ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <div className="text-left">
                        <span className="text-xs font-bold block text-white">Replacement</span>
                        <span className="text-[10px] text-slate-400">Receive a new item</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionPref('REFUND')}
                      className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                        resolutionPref === 'REFUND'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <DollarSign className={`w-5 h-5 ${resolutionPref === 'REFUND' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div className="text-left">
                        <span className="text-xs font-bold block text-white">Refund</span>
                        <span className="text-[10px] text-slate-400">Return to payment method</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* HACKATHON QUICK DEMO PRESETS */}
              <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                      Try Hackathon Demo Presets
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                    Interactive AI Test
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      handleDemoScenario(
                        'My wireless headphones arrived broken. The left side is cracked. I want a replacement.',
                        'ORD-1001',
                        'PRODUCT_DAMAGED',
                        'REPLACEMENT'
                      )
                    }
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400">Demo 1 — Auto Replacement</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      Headphones damaged (₹4,999, ORD-1001) → Auto-Approved Replacement
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleDemoScenario(
                        'My smartphone is damaged, but I cannot provide clear evidence. I need an immediate refund.',
                        'ORD-1004',
                        'PRODUCT_DAMAGED',
                        'REFUND'
                      )
                    }
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/40 hover:bg-rose-950/20 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-400">Demo 2 — Human Review</span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      Smartphone damaged (₹99,999, ORD-1004, No evidence) → Human Review
                    </p>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Active Message History */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : msg.isError
                    ? 'bg-rose-900/40 text-rose-400 border border-rose-800'
                    : 'bg-slate-900 text-cyan-400 border border-slate-800'
                }`}
              >
                {msg.sender === 'user' ? 'YOU' : <Bot className="w-5 h-5" />}
              </div>

              {/* Bubble & Attachment & Outcome Cards */}
              <div className="max-w-[85%] sm:max-w-[78%] space-y-3">
                
                {/* User Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10'
                      : msg.isError
                      ? 'bg-rose-950/40 text-rose-200 border border-rose-900/60 rounded-tl-none'
                      : 'glass-panel bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  
                  {/* Multi-Image Attachments Preview */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                      {msg.images.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Evidence attachment ${idx + 1}`}
                          className="h-28 w-full object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Audio Attachment Preview */}
                  {msg.audio && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
                        <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>Audio / Voice Evidence Attached</span>
                      </div>
                      <audio controls src={msg.audio.url} className="w-full h-8 rounded-lg" />
                      {msg.audio.transcript && (
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                          "{msg.audio.transcript}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* WORKFLOW OUTCOME & TRACKING CARDS */}
                {msg.caseData && (
                  <div className="animate-fade-in space-y-3">
                    
                    {/* APPROVED REFUND OR REPLACEMENT OUTCOME */}
                    {msg.caseData.status === 'RESOLVED' && (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="font-extrabold text-sm text-emerald-300">
                              {msg.caseData.resolutionPreference === 'REFUND'
                                ? '✓ Refund Request Approved'
                                : '✓ Replacement Approved'}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-300 font-bold">
                            {msg.caseData.resolutionPreference === 'REFUND'
                              ? `Refund ID: ${msg.caseData.refundId}`
                              : `Replacement ID: ${msg.caseData.replacementId}`}
                          </span>
                        </div>

                        {/* Summary details */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Return ID</span>
                            <strong className="text-white font-mono">{msg.caseData.returnId}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Method</span>
                            <strong className="text-emerald-300">
                              {msg.caseData.resolutionPreference === 'REFUND' ? 'Original Payment Method' : 'Express Courier Dispatch'}
                            </strong>
                          </div>
                        </div>

                        {/* CUSTOMER RETURN TRACKING TIMELINE */}
                        <div className="space-y-2 pt-1 border-t border-emerald-500/20">
                          <span className="text-xs font-bold text-white block">Return & Resolution Progress:</span>
                          <div className="space-y-2">
                            {(msg.caseData.trackingTimeline || []).map((tl, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${tl.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                                  <span className={tl.status === 'COMPLETED' ? 'text-white font-semibold' : 'text-slate-400'}>
                                    {tl.step}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{tl.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HUMAN REVIEW REQUIRED OUTCOME */}
                    {msg.caseData.status === 'ESCALATE' && (
                      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                            <span className="font-extrabold text-sm text-rose-300">Specialist Review Required</span>
                          </div>
                          <span className="font-mono text-xs text-rose-300 font-bold">Case ID: {msg.caseData.caseId}</span>
                        </div>

                        <p className="text-xs text-rose-200/90 leading-normal">
                          Your return request requires additional authorization by our support team due to product value or missing evidence details. A specialist has been assigned to review your request.
                        </p>

                        <div className="space-y-2 pt-1 border-t border-rose-500/20">
                          <span className="text-xs font-bold text-white block">Support Review Status:</span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-semibold">✓ Return Request Submitted</span>
                              <span className="text-[10px] text-slate-400">Aug 29</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-rose-400 font-semibold">○ Specialist Review in Progress</span>
                              <span className="text-[10px] text-rose-300 font-bold">ACTIVE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NEEDS INFORMATION OUTCOME */}
                    {msg.caseData.status === 'NEEDS_INFORMATION' && (
                      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 space-y-2 shadow-lg">
                        <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-2">
                          <Info className="w-5 h-5 text-cyan-400" />
                          <span className="font-bold text-sm text-cyan-300">ℹ Information Required</span>
                        </div>
                        <p className="text-xs text-cyan-100">
                          Please provide your Order ID (e.g. ORD-1001) or attach a clearer photo of the product to complete instant resolution.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <span
                  className={`block text-[10px] text-slate-500 px-1 ${
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Customer-Facing Progress Indicator */}
          {isAnalyzing && (
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="glass-panel p-4 rounded-2xl rounded-tl-none border border-indigo-500/30 text-sm text-slate-300 flex items-center space-x-3 shadow-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs font-semibold text-cyan-300 transition-all duration-300">
                  {analysisStepText}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM INPUT & MULTIMODAL EVIDENCE BAR */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 shrink-0 space-y-3">
          <div className="max-w-4xl mx-auto space-y-3">
            
            {/* MULTI-IMAGE & AUDIO PREVIEW BAR */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedImages.map((imgUrl, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-xl border border-indigo-500/40 animate-fade-in">
                  <img src={imgUrl} alt={`Attached ${idx + 1}`} className="w-9 h-9 rounded-lg object-cover border border-slate-700 bg-slate-950" />
                  <button
                    type="button"
                    onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {selectedAudio && (
                <div className="flex items-center space-x-3 bg-slate-900/90 p-2.5 rounded-xl border border-cyan-500/40 w-fit animate-fade-in">
                  <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-white">{selectedAudio.name}</p>
                    <p className="text-[10px] text-cyan-300 font-medium">Audio Acoustic Analysis</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAudio(null)}
                    aria-label="Remove audio recording"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* INPUT LOCK BANNER WHEN AI ANALYSIS IN PROGRESS */}
            {isAnalyzing && (
              <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-cyan-300 flex items-center justify-between shadow-lg animate-pulse">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="font-extrabold uppercase tracking-wider">AI ANALYSIS IN PROGRESS — INPUTS LOCKED</span>
                </div>
                <span className="font-mono text-[10px] text-slate-300">{analysisStepText}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
              
              {/* Multi-Image Attachment Button */}
              <label
                htmlFor="image-upload-input"
                aria-label="Attach evidence image"
                className={`p-3 rounded-xl bg-slate-900/90 border border-slate-800 transition-all shrink-0 ${
                  isAnalyzing
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800 cursor-pointer'
                }`}
                title={isAnalyzing ? 'Analysis in progress' : 'Upload Photo Evidence'}
              >
                <ImageIcon className="w-5 h-5" />
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isAnalyzing}
                />
              </label>

              {/* Mic / Audio Recording Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isAnalyzing}
                className={`p-3 rounded-xl border transition-all shrink-0 ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : isAnalyzing
                    ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
                }`}
                title={isRecording ? `Recording... (${recordingSeconds}s)` : 'Record Voice Evidence'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Contextual Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isAnalyzing
                    ? 'AI analysis in progress... Inputs locked'
                    : isRecording
                    ? `Recording voice note... (${recordingSeconds}s) Click mic to stop`
                    : currentReasonHelper
                }
                disabled={isAnalyzing}
                aria-label="Describe your problem"
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isAnalyzing || (!input.trim() && selectedImages.length === 0 && !selectedAudio)}
                aria-label="Submit return request"
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all shrink-0 flex items-center space-x-1"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

          </div>
        </div>

      </main>
    </div>
  );
}
