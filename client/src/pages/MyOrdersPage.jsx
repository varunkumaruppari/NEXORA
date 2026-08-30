import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_ORDERS } from '../data/mockData';
import {
  Package,
  CheckCircle2,
  RotateCcw,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Filter,
  Bot
} from 'lucide-react';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'DELIVERED' && order.status === 'Delivered') ||
      (filterStatus === 'RETURNABLE' && order.returnEligibility);
    const matchesSearch =
      !searchQuery ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER & NAV BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <Link to="/" className="hover:text-white transition-colors">NEXORA Marketplace</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-semibold">My Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <Package className="w-7 h-7 text-indigo-400" />
              <span>My Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your purchases and initiate instant AI-powered returns or replacements.
            </p>
          </div>

          {/* RESOLV AI HELP BANNER */}
          <div className="glass-panel p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center space-x-3 text-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Need Return Help?</p>
              <p className="text-[11px] text-slate-300">RESOLV AI analyzes and resolves returns in seconds.</p>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. ORD-1001) or product..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'RETURNABLE', label: 'Return Eligible' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden hover:border-indigo-500/40 transition-all duration-300 shadow-xl"
            >
              {/* Order Card Top Bar */}
              <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Order Placed</span>
                    <span className="font-semibold text-slate-200">{order.orderDate}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Amount</span>
                    <span className="font-bold text-white">{order.formattedPrice}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Ship To</span>
                    <span className="font-semibold text-slate-200">{order.customerName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-indigo-300 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    ID: {order.orderId}
                  </span>
                </div>
              </div>

              {/* Order Content Body */}
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Product Thumbnail & Details */}
                <div className="flex items-start space-x-4 flex-1">
                  <img
                    src={order.image}
                    alt={order.productName}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
                  />

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{order.status} on {order.deliveryDate}</span>
                      </span>
                    </div>

                    <h2 className="font-bold text-base text-white hover:text-cyan-300 transition-colors">
                      {order.productName}
                    </h2>

                    <p className="text-xs text-slate-400">
                      Qty: {order.quantity} • Price: <span className="font-bold text-white">{order.formattedPrice}</span>
                    </p>

                    {/* Return eligibility status badge */}
                    {order.returnEligibility && (
                      <div className="flex items-center space-x-1.5 text-xs text-cyan-300 pt-1 font-medium">
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Eligible for Return / Replacement until {order.returnDeadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-56 shrink-0 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="w-full text-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>View Order Details</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <button
                    onClick={() => navigate('/chat', { state: { orderId: order.orderId } })}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 group"
                  >
                    <RotateCcw className="w-4 h-4 text-cyan-300 group-hover:rotate-45 transition-transform" />
                    <span>Return / Replace</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
