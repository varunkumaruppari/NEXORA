import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ShieldCheck, Zap, ArrowRight, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hackathon Foundation Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent leading-tight">
          AI-Powered Multi-Agent E-Commerce Resolution Platform
        </h1>

        <p className="text-lg text-slate-400 font-normal leading-relaxed">
          RESOLV AI automates customer issue resolution using a team of specialized AI agents. Instant automated solutions for confident cases; structured AI escalation reports for human support teams.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-xl shadow-indigo-600/30 transition-all group"
          >
            <MessageSquare className="w-5 h-5 text-cyan-300" />
            <span>Launch Customer Chat</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 glass-panel hover:bg-slate-800/80 transition-all border border-slate-700/60"
          >
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            <span>Open Service Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Customer Panel</h3>
          <p className="text-sm text-slate-400">
            Clean and simple AI chat interface. Upload text and image evidence with zero internal workflow exposure.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multi-Agent Workflow</h3>
          <p className="text-sm text-slate-400">
            Specialized Gemini AI agents analyze issues in real-time before reaching a high-confidence resolution.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Service Panel & Escalation</h3>
          <p className="text-sm text-slate-400">
            Comprehensive dashboard for support teams with risk analysis, agent findings, and structured incident reports.
          </p>
        </div>
      </div>

    </div>
  );
}
