import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  MessageSquare,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Search,
  ShoppingCart,
  Sparkles,
  Bot
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/marketplace')) return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  NEXORA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-600/30 border border-indigo-500/40 text-cyan-300">
                  MARKETPLACE
                </span>
              </div>
              <div className="hidden sm:flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                <span>Powered by</span>
                <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                  <Bot className="w-3 h-3 inline" /> RESOLV AI
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Search Preview Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search products, categories, or order IDs (e.g. ORD-1001)..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                readOnly
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* Marketplace Home */}
            <Link
              to="/"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>

            {/* My Orders */}
            <Link
              to="/orders"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/orders')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4 text-cyan-400" />
              <span>My Orders</span>
            </Link>

            {/* Customer Chat / AI Resolution */}
            <Link
              to="/chat"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/chat')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Return Resolution</span>
              <span className="lg:hidden">Return</span>
            </Link>

            {/* Service Dashboard */}
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/dashboard')
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-rose-400" />
              <span className="hidden xl:inline">Ops Dashboard</span>
            </Link>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Cart Icon Visual */}
            <button
              aria-label="Shopping Cart"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 relative transition-all"
              title="Cart (1 Item)"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center">
                1
              </span>
            </button>

            {/* Login */}
            <Link
              to="/login"
              className="hidden lg:flex items-center space-x-1 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>

          </div>

        </div>
      </div>
    </nav>
  );
}
