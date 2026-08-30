import React, { useState, useEffect } from 'react';
import { Zap, Clock, AlertCircle, RefreshCw, MapPin, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';
import API from '../services/api';

export const DELIVERY_STATES = {
  UNKNOWN: 'UNKNOWN',
  CHECKING: 'CHECKING',
  FAST_AVAILABLE: 'FAST_AVAILABLE',
  FAST_UNAVAILABLE: 'FAST_UNAVAILABLE',
  STANDARD_ONLY: 'STANDARD_ONLY',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DELIVERY_UNAVAILABLE: 'DELIVERY_UNAVAILABLE',
  ERROR: 'ERROR',
};

export default function ProductDeliveryState({
  product,
  quantity = 1,
  customerLocation = null,
  onOpenModal = null,
  onDeliveryCheckResult = null,
  cachedResult = null,
}) {
  const [state, setState] = useState(DELIVERY_STATES.UNKNOWN);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Evaluate out of stock state immediately
  const isOutOfStock = product?.inStock === false || product?.stockCount === 0;

  useEffect(() => {
    if (isOutOfStock) {
      setState(DELIVERY_STATES.OUT_OF_STOCK);
      return;
    }

    // If cached result exists for current product + qty + location, use it
    if (cachedResult) {
      applyBackendResult(cachedResult);
      return;
    }

    // If location is already known and saved, auto check delivery
    if (customerLocation && (customerLocation.pincode || customerLocation.latitude)) {
      performDeliveryCheck(customerLocation);
    } else {
      setState(DELIVERY_STATES.UNKNOWN);
      setResult(null);
    }
  }, [product?.id, quantity, customerLocation?.pincode, customerLocation?.address, isOutOfStock, cachedResult]);

  const applyBackendResult = (res) => {
    setResult(res);
    if (!res || !res.success) {
      if (res?.reasonCode === 'LOCATION_NOT_SERVICEABLE') {
        setState(DELIVERY_STATES.DELIVERY_UNAVAILABLE);
      } else {
        setState(DELIVERY_STATES.FAST_UNAVAILABLE);
      }
      return;
    }

    if (res.eligible) {
      setState(DELIVERY_STATES.FAST_AVAILABLE);
    } else if (res.reasonCode === 'LOCATION_NOT_SERVICEABLE') {
      setState(DELIVERY_STATES.DELIVERY_UNAVAILABLE);
    } else if (res.deliveryType === 'STANDARD') {
      setState(DELIVERY_STATES.STANDARD_ONLY);
    } else {
      setState(DELIVERY_STATES.FAST_UNAVAILABLE);
    }
  };

  const performDeliveryCheck = async (loc = customerLocation) => {
    if (isOutOfStock) return;

    setState(DELIVERY_STATES.CHECKING);
    setErrorMsg(null);

    try {
      const pin = loc?.pincode || '500081';
      const payload = {
        productId: product.id || 'PROD-1001',
        quantity,
        location: loc?.address ? { address: loc.address, pincode: pin } : { pincode: pin },
      };

      const response = await API.post('/delivery/check', payload);

      if (response.data) {
        applyBackendResult(response.data);
        if (onDeliveryCheckResult) {
          onDeliveryCheckResult(product.id, quantity, pin, response.data);
        }
      } else {
        throw new Error('Malformed API response');
      }
    } catch (err) {
      console.warn('Fast delivery API check error:', err.message);
      setState(DELIVERY_STATES.ERROR);
      setErrorMsg('Unable to check fast delivery right now.');
    }
  };

  const handleButtonClick = () => {
    if (state === DELIVERY_STATES.CHECKING) return;

    if (state === DELIVERY_STATES.ERROR) {
      performDeliveryCheck();
      return;
    }

    if (onOpenModal) {
      onOpenModal(product);
    } else {
      performDeliveryCheck();
    }
  };

  // RENDER BASED ON EXPLICIT STATE MODEL
  if (state === DELIVERY_STATES.OUT_OF_STOCK) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>Out of Stock</span>
      </div>
    );
  }

  if (state === DELIVERY_STATES.DELIVERY_UNAVAILABLE) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>Delivery Unavailable</span>
      </div>
    );
  }

  if (state === DELIVERY_STATES.FAST_AVAILABLE) {
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleButtonClick}
          className="inline-flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-all shadow-sm group"
          title="Click to view detailed fulfillment route map"
        >
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>⚡ Arrives Tomorrow</span>
          </div>
          {result?.fastDeliveryFee && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              ₹{result.fastDeliveryFee}
            </span>
          )}
        </button>
        {result?.warehouseName && (
          <span className="text-[10px] text-slate-400 pl-1 font-medium truncate">
            via {result.warehouseName} ({result.distanceKm} km)
          </span>
        )}
      </div>
    );
  }

  if (state === DELIVERY_STATES.FAST_UNAVAILABLE || state === DELIVERY_STATES.STANDARD_ONLY) {
    return (
      <div className="flex items-center space-x-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Fast delivery unavailable</span>
        </div>
        <button
          onClick={handleButtonClick}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-colors"
          title="Check again"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    );
  }

  if (state === DELIVERY_STATES.CHECKING) {
    return (
      <button
        disabled
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-wait opacity-80"
      >
        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>⚡ Checking...</span>
      </button>
    );
  }

  if (state === DELIVERY_STATES.ERROR) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-[11px] text-rose-400 font-medium">{errorMsg}</span>
        <button
          onClick={handleButtonClick}
          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // DEFAULT UNKNOWN STATE: Show "⚡ Check Fast Delivery"
  return (
    <button
      onClick={handleButtonClick}
      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm"
    >
      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span>⚡ Check Fast Delivery</span>
    </button>
  );
}
