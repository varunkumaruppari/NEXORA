import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-6">
        <Bot className="w-8 h-8" />
      </div>
      <h1 className="text-6xl font-black text-white">404</h1>
      <p className="text-xl font-bold text-slate-200 mt-2">Page Not Found</p>
      <p className="text-sm text-slate-400 max-w-sm mt-2">
        The requested URL or page resource does not exist on RESOLV AI platform.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
