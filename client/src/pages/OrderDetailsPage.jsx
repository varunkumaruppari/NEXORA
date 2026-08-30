import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_PRODUCTS } from '../data/mockData';
import FastDeliveryModal from '../components/FastDeliveryModal';
import {
  Package,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  ChevronRight,
  Bot,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Find order in mock dataset or fallback to ORD-1001
  const order = MOCK_ORDERS.find(
    (o) => o.orderId.toUpperCase() === (orderId || '').toUpperCase()
  ) || MOCK_ORDERS[0];

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // Associated product specs
  const matchedProduct = MOCK_PRODUCTS.find((p) => p.name === order.productName) || MOCK_PRODUCTS[0];
  const productSpecs = matchedProduct?.specs || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER & NAV BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Link to="/" className="hover:text-white transition-colors">NEXORA</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link to="/orders" className="hover:text-white transition-colors">My Orders</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-semibold font-mono">{order.orderId}</span>
            </div>
            
            <div className="flex items-center space-x-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Order Details
              </h1>
              <span className="font-mono text-xs font-bold text-indigo-300 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                #{order.orderId}
              </span>
            </div>
            <p className="text-xs text-slate-400">Placed on {order.orderDate}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              aria-label="Download Invoice visual action"
              onClick={() => alert(`Invoice for ${order.orderId} generated.`)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Download Invoice</span>
            </button>
          </div>
        </div>

        {/* 1. ORDER TIMELINE TRACKER */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>Delivery Tracking Timeline</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative pt-2">
            {order.timeline.map((step, idx) => (
              <div key={idx} className="relative flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </div>
                  <span className="font-bold text-xs text-white">{step.title}</span>
                </div>
                <span className="text-[11px] text-slate-400 pl-8">{step.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. MAIN GRID: PRODUCT DETAILS + RETURN CTA PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7 COLUMNS: PRODUCT CARD & ADDRESS & PAYMENT */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Product Item Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Item</h2>
              
              <div className="flex items-start space-x-4">
                <img
                  src={order.image}
                  alt={order.productName}
                  className="w-24 h-24 rounded-xl object-cover border border-slate-800 bg-slate-900 shrink-0"
                />

                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white">{order.productName}</h3>
                  <p className="text-xs text-slate-400">Qty: {order.quantity}</p>
                  <p className="text-xl font-extrabold text-white">{order.formattedPrice}</p>
                </div>
              </div>

              {/* Specs Breakdown */}
              {Object.keys(productSpecs).length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(productSpecs).map(([key, val]) => (
                    <div key={key} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{key}</span>
                      <span className="font-medium text-slate-200 text-xs">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping & Payment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Shipping Address Card */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Shipping Address</span>
                  </div>
                  <button
                    onClick={() => setIsDeliveryModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex items-center space-x-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Check 1-Day Delivery</span>
                  </button>
                </div>
                <p className="font-bold text-sm text-white">{order.shippingAddress.name || order.customerName}</p>
                <p className="text-xs text-slate-300">{order.shippingAddress.street}</p>
                <p className="text-xs text-slate-300">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p className="text-xs text-slate-400 pt-1">Phone: {order.shippingAddress.phone}</p>
              </div>

              {/* Payment Summary Card */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Payment Summary</span>
                </div>
                
                <div className="space-y-1.5 pt-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Item Price:</span>
                    <span className="font-semibold text-white">{order.formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-semibold text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (GST):</span>
                    <span className="font-semibold text-white">Included</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800 text-sm">
                    <span>Total Paid:</span>
                    <span className="text-cyan-300">{order.formattedPrice}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">{order.paymentSummary.paymentMethod}</p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT 5 COLUMNS: RESOLV AI RETURN & REPLACEMENT PORTAL BOX */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 to-slate-900/90 space-y-5 shadow-2xl">
              
              <div className="flex items-center space-x-3 border-b border-indigo-500/30 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">RESOLV AI Return Center</h3>
                  <p className="text-xs text-cyan-300 font-medium">Autonomous Case Resolution</p>
                </div>
              </div>

              {/* Return Eligibility Status */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eligible for Return / Replacement</span>
                  </div>
                  <p className="text-slate-300 text-[11px] pl-6">
                    Return window open until <strong className="text-white">{order.returnDeadline}</strong> ({order.returnWindowDays} Days Warranty).
                  </p>
                </div>

                {order.orderId === 'ORD-1004' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>High-Value Authorization Notice</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Items above ₹50,000 threshold undergo AI risk verification and human support review.
                    </p>
                  </div>
                )}
              </div>

              {/* Big CTA Button */}
              <button
                onClick={() => navigate('/chat', { state: { orderId: order.orderId } })}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 group"
              >
                <RotateCcw className="w-4 h-4 text-cyan-200 group-hover:rotate-90 transition-transform" />
                <span>Return or Replace Item</span>
              </button>

              <div className="text-[11px] text-slate-400 text-center space-y-1 pt-1">
                <p>⚡ Powered by RESOLV AI 7-Agent Engine</p>
                <p>Instant approval for low-risk issues • Automated return labels</p>
              </div>

            </div>

            {/* Back to Orders Link */}
            <div className="text-center">
              <Link
                to="/orders"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to My Orders</span>
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* FAST DELIVERY MODAL */}
      <FastDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        product={matchedProduct}
        defaultPincode={order.shippingAddress?.pincode || '500081'}
      />
    </div>
  );
}
