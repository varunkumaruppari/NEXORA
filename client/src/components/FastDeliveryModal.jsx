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
  Navigation,
  Compass
} from 'lucide-react';
import API from '../services/api';

const SAMPLE_PINCODES = [
  { pin: '500081', city: 'HITEC City', tag: '1-Day Eligible' },
  { pin: '500032', city: 'Gachibowli', tag: '1-Day Eligible' },
  { pin: '500072', city: 'Kukatpally', tag: 'Capacity Tested' },
  { pin: '500003', city: 'Secunderabad', tag: 'Standard 2-Day' },
  { pin: '500039', city: 'Uppal', tag: '1-Day Eligible' },
  { pin: '999999', city: 'Remote', tag: 'Non-Serviceable' },
];

const HYD_HUBS_MAP = [
  { id: 'WH-HYD-001', name: 'Gachibowli Hub', x: 25, y: 45, status: 'AVAILABLE' },
  { id: 'WH-HYD-002', name: 'HITEC City Hub', x: 35, y: 42, status: 'AVAILABLE' },
  { id: 'WH-HYD-003', name: 'Madhapur Hub', x: 42, y: 40, status: 'AVAILABLE' },
  { id: 'WH-HYD-004', name: 'Kukatpally Depot', x: 45, y: 25, status: 'CONSTRAINED' },
  { id: 'WH-HYD-005', name: 'Secunderabad Hub', x: 68, y: 38, status: 'UNAVAILABLE' },
  { id: 'WH-HYD-006', name: 'Begumpet Hub', x: 58, y: 36, status: 'AVAILABLE' },
  { id: 'WH-HYD-007', name: 'Uppal East Hub', x: 80, y: 48, status: 'AVAILABLE' },
  { id: 'WH-HYD-008', name: 'LB Nagar Hub', x: 78, y: 68, status: 'AVAILABLE' },
  { id: 'WH-HYD-009', name: 'Mehdipatnam Hub', x: 48, y: 58, status: 'AVAILABLE' },
  { id: 'WH-HYD-010', name: 'Shamshabad Hub', x: 46, y: 88, status: 'UNAVAILABLE' },
];

export default function FastDeliveryModal({ isOpen, onClose, product, defaultPincode = '500081' }) {
  const [pincode, setPincode] = useState(defaultPincode);
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      handleCheckDelivery(pincode, address, quantity);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleCheckDelivery = async (pinToCheck = pincode, addressToCheck = address, qtyToCheck = quantity) => {
    const cleanPin = String(pinToCheck || '').trim();
    if (!cleanPin && !addressToCheck) {
      setErrorMsg('Please enter a valid 6-digit PIN code or address.');
      setResult(null);
      return;
    }

    setLoading(true);
    setLoadingStep(1);
    setErrorMsg(null);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 250);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 500);

    try {
      const response = await API.post('/delivery/check', {
        productId: product.id || 'PROD-1001',
        quantity: qtyToCheck,
        location: addressToCheck ? { address: addressToCheck, pincode: cleanPin } : { pincode: cleanPin },
      });

      if (response.data) {
        setResult(response.data);
      } else {
        throw new Error('Malformed API response');
      }
    } catch (err) {
      console.warn('Delivery API error:', err.message);
      setResult({
        success: false,
        eligible: false,
        deliveryType: 'NONE',
        reasonCode: 'ENGINE_ERROR',
        customerMessage: "Sorry, we couldn't check delivery availability right now. Please try again.",
      });
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoLocating(false);
        const { latitude, longitude } = position.coords;
        setLoading(true);
        try {
          const response = await API.post('/delivery/check', {
            productId: product.id || 'PROD-1001',
            quantity,
            location: { latitude, longitude, address: 'Current GPS Location, Hyderabad' },
          });
          if (response.data) {
            setResult(response.data);
            if (response.data.pincode) setPincode(response.data.pincode);
          }
        } catch (err) {
          setErrorMsg('Failed to verify GPS location.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setGeoLocating(false);
        setErrorMsg('Location permission denied or unavailable. Please enter PIN code manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectSample = (samplePin) => {
    setPincode(samplePin);
    setAddress('');
    handleCheckDelivery(samplePin, '', quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                NEXORA Hyderabad Fast Delivery Intelligence
              </h2>
              <p className="text-xs text-slate-400">10 Hyderabad Hubs + Real Maps & Route Intelligence</p>
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
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* Product Summary */}
          <div className="flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-slate-700/80 shadow"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                {product.category || 'Tech'}
              </span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">{product.name}</h3>
              <p className="text-xs font-semibold text-emerald-400">₹{product.price?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Location & Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Where should we deliver?
              </label>

              <button
                onClick={handleUseMyLocation}
                disabled={geoLocating || loading}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {geoLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>📍 Use My Location</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* PIN Code */}
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit PIN"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Address / Landmark */}
              <div className="relative col-span-1 sm:col-span-2">
                <Compass className="absolute left-3 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address or Landmark (e.g. HITEC City)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Quantity Selection */}
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-400 font-medium">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setQuantity(q);
                    handleCheckDelivery(pincode, address, q);
                  }}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 10].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleCheckDelivery(pincode, address, quantity)}
                disabled={loading}
                className="px-6 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-slate-950" />}
                <span>Check Availability</span>
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

            {/* Quick Sample Location Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Sample Zones:</span>
              {SAMPLE_PINCODES.map((item) => (
                <button
                  key={item.pin}
                  onClick={() => handleSelectSample(item.pin)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all ${
                    pincode === item.pin
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.city} ({item.pin})
                </button>
              ))}
            </div>
          </div>

          {/* Hyderabad Fulfillment Map Component */}
          <div className="relative h-44 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-white">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                NEXORA Hyderabad Fulfillment Network Map
              </span>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Constrained</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Unavailable</span>
              </div>
            </div>

            {/* Map Canvas Background Grid */}
            <div className="relative flex-1 my-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

              {/* Connecting Route Line if Result Available */}
              {result && result.eligible && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="35%" y1="42%" x2="55%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                </svg>
              )}

              {/* Render 10 Hyderabad Hub Markers */}
              {HYD_HUBS_MAP.map((hub) => (
                <div
                  key={hub.id}
                  style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-slate-950 shadow-md ${
                      hub.status === 'AVAILABLE'
                        ? 'bg-emerald-400'
                        : hub.status === 'CONSTRAINED'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  ></div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-[10px] font-bold text-white rounded border border-slate-700 whitespace-nowrap shadow-lg z-20">
                    {hub.name}
                  </div>
                </div>
              ))}

              {/* Customer Pin Marker */}
              {result && (
                <div style={{ left: '55%', top: '50%' }} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center space-x-1">
                  <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[9px] shadow-lg shadow-amber-500/50 animate-bounce">
                    📍
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/40">YOU</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Availability Result Box */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 py-8">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">⚡ Calculating Real-Time Feasibility...</p>
                  <p className="text-[11px] text-slate-400">
                    {loadingStep === 1 && '📍 Checking location coordinates...'}
                    {loadingStep === 2 && '🏭 Finding best feasible Hyderabad fulfillment hub...'}
                    {loadingStep === 3 && '🛣️ Calculating road route & agent availability...'}
                  </p>
                </div>
              </div>
            ) : result ? (
              result.eligible ? (
                /* ONE-DAY DELIVERY AVAILABLE SUCCESS BOX */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
                  
                  {/* Badge & Title */}
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <Zap className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                      <span>⚡ 1-DAY DELIVERY AVAILABLE</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Location: {result.city || 'Hyderabad'} ({result.pincode})</span>
                  </div>

                  {/* Delivery Promise Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Arrives</span>
                      </div>
                      <p className="text-sm font-black text-white mt-1">{result.estimatedDeliveryDate || 'Tomorrow'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cutoff</span>
                      </div>
                      <p className="text-sm font-black text-amber-300 mt-1">Before {result.cutoffFormatted || '3:00 PM'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Fast Delivery Fee</span>
                      </div>
                      <p className="text-sm font-black text-amber-400 mt-1">₹{result.fastDeliveryFee || 40}</p>
                    </div>
                  </div>

                  {/* Distance, Agent & Demand Intelligence Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    {result.distanceKm !== undefined && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Road Distance</span>
                        <span className="font-semibold text-white">Approx. {result.distanceKm} km</span>
                      </div>
                    )}
                    {result.durationMinutes !== undefined && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Approx. Travel Time</span>
                        <span className="font-semibold text-white">~{result.durationMinutes} mins</span>
                      </div>
                    )}
                    {result.demandLevel && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Hub Demand</span>
                        <span className={`font-semibold ${result.demandLevel === 'HIGH' || result.demandLevel === 'VERY_HIGH' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {result.demandLevel} DEMAND
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fulfillment Hub Info */}
                  {result.warehouseName && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Fulfilled by: <strong>{result.warehouseName}</strong></span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Feasible Agent Assigned
                      </span>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="flex items-start space-x-2 text-xs text-emerald-200/90 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{result.customerMessage}</span>
                  </div>
                </div>
              ) : (
                /* ONE-DAY UNAVAILABLE BOX */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {result.deliveryType === 'STANDARD' ? '1-DAY DELIVERY UNAVAILABLE (FASTEST: 2-3 DAYS)' : 'DELIVERY UNAVAILABLE'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PIN: {result.pincode}</span>
                  </div>

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
            <span>NEXORA Deterministic Logistics Engine</span>
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

