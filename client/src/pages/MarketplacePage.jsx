import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MARKETPLACE_CATEGORIES
} from '../data/mockData';
import FastDeliveryModal from '../components/FastDeliveryModal';
import {
  ShoppingBag,
  Package,
  RotateCcw,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sparkles,
  ChevronRight,
  Headphones,
  Smartphone,
  Watch,
  Laptop
} from 'lucide-react';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fastDeliveryProduct, setFastDeliveryProduct] = useState(null);

  // Filter products by category and search
  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 text-center sm:text-left">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen E-Commerce Experience</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Welcome to <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">NEXORA</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Discover flagship tech, electronics, and accessories with instant 1-click order management and autonomous return resolution.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <Link
                  to="/orders"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/30 transition-all group"
                >
                  <Package className="w-4 h-4 text-cyan-300" />
                  <span>View My Orders (4 Active)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/chat"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-xs text-slate-200 glass-panel hover:bg-slate-800/80 transition-all border border-slate-700/60"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>RESOLV AI Return Portal</span>
                </Link>
              </div>
            </div>

            {/* RESOLV AI INTELLIGENCE FEATURE CARD */}
            <div className="w-full sm:w-80 glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3 shadow-xl shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>RESOLV AI Protection</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Don't automate every return. Automate the right returns."
              </p>
              <div className="space-y-1.5 pt-1 border-t border-indigo-500/20 text-[11px] text-slate-300 font-medium">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>• Safe Claims (e.g. ORD-1001)</span>
                  <span className="font-bold">Auto-Approved</span>
                </div>
                <div className="flex items-center justify-between text-rose-400">
                  <span>• High-Risk Claims (e.g. ORD-1004)</span>
                  <span className="font-bold">Human Review</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. MAIN CATALOG SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* HACKATHON QUICK DEMO ENTRY POINTS BANNER */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                Hackathon Demo Order Shortcuts
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Select order to test return flow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_ORDERS.map((order) => (
              <div
                key={order.orderId}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-300">{order.orderId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    {order.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white line-clamp-1">{order.productName}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <span className="font-bold text-slate-200">{order.formattedPrice}</span>
                  <button
                    onClick={() => navigate('/chat', { state: { orderId: order.orderId } })}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Return / Replace</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <span>Explore Products</span>
              <span className="text-xs font-normal text-slate-400">({filteredProducts.length} items)</span>
            </h2>

            {/* Category Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCTS SHOWCASE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col group shadow-lg"
            >
              {/* Product Image Container */}
              <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.badge && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md">
                      {product.badge}
                    </span>
                  )}
                </div>
                {product.discount && (
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/90 text-white shadow-md">
                    {product.discount}
                  </span>
                )}
              </div>

              {/* Product Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-indigo-400">{product.category}</span>
                    <div className="flex items-center space-x-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-bold text-white text-xs">{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.tagline}
                  </p>
                </div>

                {/* Price & Delivery */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-white">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-slate-500 line-through ml-2">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setFastDeliveryProduct(product)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex items-center space-x-1 shadow-sm"
                    >
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>Check Fast Delivery</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {product.orderId ? (
                      <>
                        <Link
                          to={`/orders/${product.orderId}`}
                          className="flex-1 text-center py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors"
                        >
                          View Order
                        </Link>

                        <button
                          onClick={() => navigate('/chat', { state: { orderId: product.orderId } })}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return / Replace</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate('/orders')}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs transition-colors"
                      >
                        In Stock • Add to Cart
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </main>

      {/* FAST DELIVERY CHECKER MODAL */}
      <FastDeliveryModal
        isOpen={!!fastDeliveryProduct}
        onClose={() => setFastDeliveryProduct(null)}
        product={fastDeliveryProduct}
        defaultPincode="500081"
      />

      {/* 3. FOOTER */}
      <footer className="mt-20 border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">
          NEXORA Marketplace • Powered by RESOLV AI Autonomous Returns & Fast Delivery Intelligence
        </p>
        <p className="text-[11px]">
          Demo environment for Hackathon Presentation. Integrated with 7-Agent Backend Engine & Deterministic Fast Delivery Pipeline.
        </p>
      </footer>

    </div>
  );
}
