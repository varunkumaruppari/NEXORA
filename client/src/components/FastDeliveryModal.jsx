import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  MapPin,
  Clock,
  PackageCheck,
  AlertCircle,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import API from '../services/api';

const SAMPLE_PINCODES = [
  { pin: '500081', city: 'Hyderabad', tag: '1-Day Eligible' },
  { pin: '560100', city: 'Bengaluru', tag: '1-Day Eligible' },
  { pin: '400001', city: 'Mumbai', tag: 'Standard 2-Day' },
  { pin: '122002', city: 'Gurugram', tag: 'Capacity Tested' },
  { pin: '700001', city: 'Kolkata', tag: 'Regional 3-Day' },
  { pin: '999999', city: 'Remote', tag: 'Non-Serviceable' },
];

export default function FastDeliveryModal({ isOpen, onClose, product, defaultPincode = '500081' }) {
  const [pincode, setPincode] = useState(defaultPincode);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      handleCheckDelivery(pincode, quantity);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleCheckDelivery = async (pinToCheck = pincode, qtyToCheck = quantity) => {
    const cleanPin = String(pinToCheck || '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit PIN code.');
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await API.post('/delivery/check', {
        productId: product.id || 'PROD-1001',
        quantity: qtyToCheck,
        location: { pincode: cleanPin },
      });

      if (response.data) {
        setResult(response.data);
      } else {
        throw new Error('Malformed API response');
      }
    } catch (err) {
      console.warn('Delivery API error, displaying engine error message:', err.message);
      setResult({
        success: false,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'ENGINE_ERROR',
        customerMessage: "Sorry, we couldn't check delivery availability right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (samplePin) => {
    setPincode(samplePin);
    handleCheckDelivery(samplePin, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                NEXORA Fast Delivery Intelligence
              </h2>
              <p className="text-xs text-slate-400">Deterministic Real-Time Delivery Feasibility Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Product Summary */}
          <div className="flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-xl border border-slate-700/80 shadow"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                {product.category || 'Tech'}
              </span>
              <h3 className="text-sm font-bold text-white truncate mt-1">{product.name}</h3>
              <p className="text-xs font-semibold text-emerald-400">₹{product.price?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Location & Quantity Input Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Enter Delivery Location & Quantity
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* PIN Code Input */}
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Quantity Input */}
              <div className="w-full sm:w-28 flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-400 mr-2 font-medium">Qty:</span>
                <select
                  value={quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setQuantity(q);
                    handleCheckDelivery(pincode, q);
                  }}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none w-full"
                >
                  {[1, 2, 3, 4, 5, 10].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Check Button */}
              <button
                onClick={() => handleCheckDelivery(pincode, quantity)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-slate-950" />}
                <span>Check Now</span>
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

            {/* Quick Sample PIN Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Test Locations:</span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PINCODES.map((item) => (
                  <button
                    key={item.pin}
                    onClick={() => handleSelectSample(item.pin)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      pincode === item.pin
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {item.city} ({item.pin})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Availability Result Box */}
          <div className="space-y-4 pt-2">
            {loading ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 py-10">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-300">
                  Verifying warehouse inventory, serviceability & cutoff times...
                </p>
              </div>
            ) : result ? (
              result.eligible ? (
                /* ONE-DAY DELIVERY AVAILABLE SUCCESS BOX */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
                  
                  {/* Badge & Title */}
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <Zap className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                      <span>1-DAY DELIVERY AVAILABLE</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PIN: {result.pincode}</span>
                  </div>

                  {/* Delivery Promise Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>Estimated Arrival</span>
                      </div>
                      <p className="text-base font-black text-white mt-1">{result.formattedArrival || 'Tomorrow'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Order Cutoff Time</span>
                      </div>
                      <p className="text-base font-black text-amber-300 mt-1">Before {result.cutoffFormatted || '3:00 PM'}</p>
                    </div>
                  </div>

                  {/* Fulfillment Warehouse Info */}
                  {result.warehouseInfo && (
                    <div className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                      <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Fulfilled by <strong>{result.warehouseInfo.warehouseName}</strong></span>
                    </div>
                  )}

                  {/* Customer Explanation */}
                  <div className="flex items-start space-x-2 text-xs text-emerald-200/90 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{result.customerMessage}</span>
                  </div>
                </div>
              ) : (
                /* ONE-DAY UNAVAILABLE BOX */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
                  
                  {/* Badge */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {result.deliveryType === 'STANDARD' ? 'STANDARD DELIVERY READY (2-3 DAYS)' : 'DELIVERY UNAVAILABLE'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PIN: {result.pincode}</span>
                  </div>

                  {/* Standard Transit Estimate if available */}
                  {result.estimatedDeliveryDate && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
                        <Truck className="w-4 h-4 text-cyan-400" />
                        <span>Fastest Available Delivery:</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {result.fastestAvailableDays ? `${result.fastestAvailableDays} Days (${result.estimatedDeliveryDate})` : result.estimatedDeliveryDate}
                      </span>
                    </div>
                  )}

                  {/* Customer Explanation */}
                  <div className="flex items-start space-x-2.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{result.customerMessage}</span>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deterministic Warehouse Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-semibold text-xs text-slate-300 glass-panel hover:bg-slate-800 transition-all border border-slate-700/60"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
