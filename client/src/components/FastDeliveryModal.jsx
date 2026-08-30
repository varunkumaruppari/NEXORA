import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

const HYD_BOUNDS = {
  minLat: 17.20,
  maxLat: 17.55,
  minLon: 78.28,
  maxLon: 78.60,
};

function getMapPosition(lat, lon) {
  if (lat == null || lon == null) return { x: 50, y: 50 };
  const clampedLat = Math.max(HYD_BOUNDS.minLat, Math.min(HYD_BOUNDS.maxLat, Number(lat)));
  const clampedLon = Math.max(HYD_BOUNDS.minLon, Math.min(HYD_BOUNDS.maxLon, Number(lon)));

  const x = ((clampedLon - HYD_BOUNDS.minLon) / (HYD_BOUNDS.maxLon - HYD_BOUNDS.minLon)) * 100;
  const y = ((HYD_BOUNDS.maxLat - clampedLat) / (HYD_BOUNDS.maxLat - HYD_BOUNDS.minLat)) * 100;

  return {
    x: Math.max(5, Math.min(95, Math.round(x * 10) / 10)),
    y: Math.max(5, Math.min(95, Math.round(y * 10) / 10)),
  };
}

export default function FastDeliveryModal({ isOpen, onClose, product, defaultPincode = '500081', onDeliveryCheckResult = null }) {
  const [pincode, setPincode] = useState(defaultPincode);
  const [address, setAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (isOpen && product) {
      handleCheckDelivery(pincode, address, quantity);
    }
  }, [isOpen, product]);

  const handleMapClick = (lat, lng) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));

    const mapLocObj = {
      latitude: cleanLat,
      longitude: cleanLng,
      source: 'MAP_CLICK',
      address: `Selected Map Location (${cleanLat.toFixed(4)}, ${cleanLng.toFixed(4)})`,
    };

    setSelectedLocation(mapLocObj);
    setErrorMsg(null);
    setResult(null); // Invalidate previous result while checking fresh coordinates
    handleCheckDelivery(pincode, address, quantity, mapLocObj);
  };

  // Real Leaflet + OpenStreetMap Map Tile Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [17.4435, 78.3772],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        // CARTO Voyager Basemap Tile Layer (CARTO Open Basemap specification)
        const cartoTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(cartoTileUrl, {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const layerGroup = markersLayerRef.current;
      if (!map || !layerGroup) return;

      // Register map click listener for Phase 15A Location Selection
      map.off('click');
      map.on('click', (e) => {
        if (e && e.latlng) {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      layerGroup.clearLayers();

      const hubsToRender = result?.allWarehouses || [
        { warehouseId: 'WH-HYD-001', name: 'NEXORA Gachibowli Hub', latitude: 17.4401, longitude: 78.3489, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-002', name: 'NEXORA HITEC City Express', latitude: 17.4435, longitude: 78.3772, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-003', name: 'NEXORA Madhapur Hub', latitude: 17.4483, longitude: 78.3915, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-004', name: 'NEXORA Kukatpally Depot', latitude: 17.4849, longitude: 78.4138, status: 'CONSTRAINED' },
        { warehouseId: 'WH-HYD-005', name: 'NEXORA Secunderabad Hub', latitude: 17.4399, longitude: 78.4983, status: 'UNAVAILABLE' },
        { warehouseId: 'WH-HYD-006', name: 'NEXORA Begumpet Hub', latitude: 17.4448, longitude: 78.4661, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-007', name: 'NEXORA Uppal East Hub', latitude: 17.4057, longitude: 78.5601, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-008', name: 'NEXORA LB Nagar Hub', latitude: 17.3457, longitude: 78.5522, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-009', name: 'NEXORA Mehdipatnam Hub', latitude: 17.3916, longitude: 78.4398, status: 'AVAILABLE' },
        { warehouseId: 'WH-HYD-010', name: 'NEXORA Shamshabad Hub', latitude: 17.2403, longitude: 78.4294, status: 'UNAVAILABLE' },
      ];

      const boundsPoints = [];

      hubsToRender.forEach((hub) => {
        if (!hub.latitude || !hub.longitude) return;
        const isSelected = result?.warehouseId === hub.warehouseId;
        boundsPoints.push([hub.latitude, hub.longitude]);

        const iconHtml = isSelected
          ? `<div style="background:#059669; color:#fff; font-weight:800; font-size:10px; padding:3px 8px; border-radius:8px; border:1px solid #fff; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.6);">🏭 ${hub.name}</div>`
          : `<div style="width:12px; height:12px; border-radius:50%; border:2px solid #020617; background:${
              hub.status === 'AVAILABLE' ? '#10b981' : hub.status === 'CONSTRAINED' ? '#f59e0b' : '#f43f5e'
            }; box-shadow:0 2px 4px rgba(0,0,0,0.5); cursor:pointer;"></div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'leaflet-custom-hub',
          iconSize: isSelected ? [140, 24] : [12, 12],
          iconAnchor: isSelected ? [70, 12] : [6, 6],
        });

        const marker = L.marker([hub.latitude, hub.longitude], { icon: customIcon }).addTo(layerGroup);
        if (!isSelected) {
          marker.bindTooltip(hub.name, {
            direction: 'top',
            offset: [0, -6],
            className: 'bg-slate-900 text-white font-bold text-[10px] px-2 py-1 rounded border border-slate-700 shadow-md',
          });
        }
      });

      // Render Customer Marker (📍 YOU) at exact selected map coordinates or resolved backend coordinates
      const activeCustLat = selectedLocation?.latitude ?? result?.customerLatitude;
      const activeCustLng = selectedLocation?.longitude ?? result?.customerLongitude;

      if (activeCustLat != null && activeCustLng != null) {
        boundsPoints.push([activeCustLat, activeCustLng]);

        const custIcon = L.divIcon({
          html: `<div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);"><div style="background:#f59e0b; color:#020617; font-weight:900; font-size:10px; padding:2px 6px; border-radius:6px; border:1.5px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.7); white-space:nowrap; margin-bottom:2px;">📍 YOU</div><div style="width:14px; height:14px; border-radius:50%; background:#f59e0b; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div></div>`,
          className: 'leaflet-custom-cust',
          iconSize: [60, 36],
          iconAnchor: [30, 36],
        });

        const custMarker = L.marker([activeCustLat, activeCustLng], {
          icon: custIcon,
          zIndexOffset: 1000, // Ensure customer marker renders above warehouse markers and lines
        }).addTo(layerGroup);

        custMarker.bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <div style="font-weight:bold; color:#f59e0b; font-size:12px; margin-bottom:2px;">📍 YOU</div>
            <div style="font-size:10px; color:#94a3b8;">Selected delivery location</div>
            <div style="font-size:10px; color:#cbd5e1; margin-top:4px;">Latitude: <b>${activeCustLat.toFixed(4)}</b></div>
            <div style="font-size:10px; color:#cbd5e1;">Longitude: <b>${activeCustLng.toFixed(4)}</b></div>
          </div>
        `);

        if (result && result.eligible && result.warehouseLatitude != null && result.warehouseLongitude != null) {
          const whLat = result.warehouseLatitude;
          const whLng = result.warehouseLongitude;

          const roadGeom = (result.route?.geometry && result.route.geometry.length > 0)
            ? result.route.geometry
            : (result.routeGeometry && result.routeGeometry.length > 0)
              ? result.routeGeometry
              : [[whLat, whLng], [activeCustLat, activeCustLng]];

          // Render BLUE Real Road Polyline (Phase 15C)
          L.polyline(roadGeom, {
            color: '#3b82f6', // Distinct Vibrant Blue
            weight: 4.5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layerGroup);

          // Determine midpoint for distance badge
          const midIndex = Math.floor(roadGeom.length / 2);
          const midPoint = roadGeom[midIndex] || [(whLat + activeCustLat) / 2, (whLng + activeCustLng) / 2];

          const distText = result.distanceKm < 1 ? `Approx. ${result.distanceKm} km` : `${result.distanceKm} km`;
          const durText = (result.durationMinutes || result.travelTimeMinutes) ? ` • ~${result.durationMinutes || result.travelTimeMinutes} min` : '';

          const badgeIcon = L.divIcon({
            html: `<div style="padding:3px 9px; border-radius:9999px; background:rgba(15,23,42,0.95); border:1.5px solid #3b82f6; font-size:10px; font-weight:900; color:#93c5fd; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.6);">🔵 ${distText}${durText}</div>`,
            className: 'leaflet-custom-badge',
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          });

          L.marker(midPoint, { icon: badgeIcon }).addTo(layerGroup);
        }
      }

      if (boundsPoints.length > 0) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
      }

      setTimeout(() => map?.invalidateSize(), 250);
    } catch (e) {
      console.warn('Leaflet map initialization fallback:', e);
    }
  }, [isOpen, result, selectedLocation]);

  if (!isOpen || !product) return null;

  const handleCheckDelivery = async (pinToCheck = pincode, addressToCheck = address, qtyToCheck = quantity, customLocObj = selectedLocation) => {
    const cleanPin = String(pinToCheck || '').trim();
    if (!cleanPin && !addressToCheck && (!customLocObj || customLocObj.latitude == null)) {
      setErrorMsg('Please select a location on the map or enter a valid 6-digit PIN code.');
      setResult(null);
      return;
    }

    setLoading(true);
    setLoadingStep(1);
    setErrorMsg(null);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 250);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 500);

    try {
      const locationPayload = customLocObj?.latitude != null
        ? customLocObj
        : (addressToCheck ? { address: addressToCheck, pincode: cleanPin } : { pincode: cleanPin });

      const response = await API.post('/delivery/check', {
        productId: product.id || 'PROD-1001',
        quantity: qtyToCheck,
        location: locationPayload,
      });

      if (response.data) {
        setResult(response.data);
        if (response.data.pincode && !customLocObj) {
          setPincode(response.data.pincode);
        }
        if (onDeliveryCheckResult && product?.id) {
          onDeliveryCheckResult(product.id, qtyToCheck, response.data.pincode || cleanPin, response.data);
        }
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
        customerMessage: "Unable to check this location right now. Please try again.",
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
            if (onDeliveryCheckResult && product?.id) {
              onDeliveryCheckResult(product.id, quantity, response.data.pincode || '500081', response.data);
            }
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

          {/* Hyderabad Geographic Fulfillment Network Map Component */}
          <div className="relative h-56 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 z-10 bg-slate-950/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <span className="flex items-center gap-1.5 text-white">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Real Hyderabad Geographic Fulfillment Map
              </span>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Available</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Constrained</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Unavailable</span>
              </div>
            </div>

            {/* Geographic Map Canvas with OpenStreetMap Backdrop & Real Landmarks */}
            <div ref={mapContainerRef} className="relative flex-1 my-1 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden z-0">
              
              {/* Geographic Tile Map Layer */}
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

              {/* Geographic SVG Features: Lakes, ORR Outer Ring Road & Zone Labels */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                {/* Outer Ring Road (ORR) Highway Loop */}
                <ellipse cx="50%" cy="50%" rx="42%" ry="40%" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 3" />
                {/* Hussain Sagar Lake */}
                <ellipse cx="62%" cy="42%" rx="4%" ry="3%" fill="#1e3a8a" opacity="0.6" stroke="#3b82f6" strokeWidth="0.8" />
                {/* Durgam Cheruvu Lake */}
                <ellipse cx="38%" cy="41%" rx="2.5%" ry="2%" fill="#1e3a8a" opacity="0.6" stroke="#3b82f6" strokeWidth="0.8" />
                {/* Geographic Region Labels */}
                <text x="32%" y="38%" fill="#94a3b8" fontSize="9" fontWeight="bold">HITEC City</text>
                <text x="22%" y="48%" fill="#94a3b8" fontSize="9" fontWeight="bold">Gachibowli</text>
                <text x="65%" y="36%" fill="#94a3b8" fontSize="9" fontWeight="bold">Secunderabad</text>
                <text x="75%" y="52%" fill="#94a3b8" fontSize="9" fontWeight="bold">Uppal</text>
                <text x="44%" y="85%" fill="#94a3b8" fontSize="9" fontWeight="bold">Shamshabad</text>
              </svg>

              {/* Connecting Route Line if Result Available */}
              {(() => {
                if (!result || !result.eligible) return null;
                const whPos = getMapPosition(result.warehouseLatitude || 17.4435, result.warehouseLongitude || 78.3772);
                const custPos = getMapPosition(result.customerLatitude || 17.4435, result.customerLongitude || 78.3772);

                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1={`${whPos.x}%`}
                      y1={`${whPos.y}%`}
                      x2={`${custPos.x}%`}
                      y2={`${custPos.y}%`}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      className="animate-pulse"
                    />
                    {/* Route Midpoint Distance Badge */}
                    <foreignObject
                      x={`${(whPos.x + custPos.x) / 2 - 15}%`}
                      y={`${(whPos.y + custPos.y) / 2 - 5}%`}
                      width="30%"
                      height="24"
                    >
                      <div className="flex items-center justify-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/50 text-[10px] font-black text-emerald-300 shadow-md">
                          {result.distanceKm < 1 ? `Approx. ${result.distanceKm} km` : `${result.distanceKm} km`}
                        </span>
                      </div>
                    </foreignObject>
                  </svg>
                );
              })()}

              {/* Render 10 Hyderabad Hub Markers at Real Mercator Geographic Positions */}
              {(() => {
                const hubsToRender = result?.allWarehouses || [
                  { warehouseId: 'WH-HYD-001', name: 'NEXORA Gachibowli Hub', latitude: 17.4401, longitude: 78.3489, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-002', name: 'NEXORA HITEC City Express', latitude: 17.4435, longitude: 78.3772, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-003', name: 'NEXORA Madhapur Hub', latitude: 17.4483, longitude: 78.3915, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-004', name: 'NEXORA Kukatpally Depot', latitude: 17.4849, longitude: 78.4138, status: 'CONSTRAINED' },
                  { warehouseId: 'WH-HYD-005', name: 'NEXORA Secunderabad Hub', latitude: 17.4399, longitude: 78.4983, status: 'UNAVAILABLE' },
                  { warehouseId: 'WH-HYD-006', name: 'NEXORA Begumpet Hub', latitude: 17.4448, longitude: 78.4661, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-007', name: 'NEXORA Uppal East Hub', latitude: 17.4057, longitude: 78.5601, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-008', name: 'NEXORA LB Nagar Hub', latitude: 17.3457, longitude: 78.5522, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-009', name: 'NEXORA Mehdipatnam Hub', latitude: 17.3916, longitude: 78.4398, status: 'AVAILABLE' },
                  { warehouseId: 'WH-HYD-010', name: 'NEXORA Shamshabad Hub', latitude: 17.2403, longitude: 78.4294, status: 'UNAVAILABLE' },
                ];

                return hubsToRender.map((hub) => {
                  const pos = getMapPosition(hub.latitude, hub.longitude);
                  const isSelected = result?.warehouseId === hub.warehouseId;

                  return (
                    <div
                      key={hub.warehouseId}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer ${
                        isSelected ? 'z-30' : 'z-20'
                      }`}
                    >
                      <div
                        className={`rounded-full border-2 border-slate-950 shadow-md transition-all ${
                          isSelected
                            ? 'w-4 h-4 bg-emerald-400 ring-4 ring-emerald-500/40 animate-pulse'
                            : hub.status === 'AVAILABLE'
                            ? 'w-3 h-3 bg-emerald-400'
                            : hub.status === 'CONSTRAINED'
                            ? 'w-3 h-3 bg-amber-400'
                            : 'w-3 h-3 bg-rose-500'
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-[10px] font-bold rounded border whitespace-nowrap shadow-lg ${
                          isSelected
                            ? 'block text-emerald-300 border-emerald-500 z-30'
                            : 'hidden group-hover:block text-white border-slate-700 z-20'
                        }`}
                      >
                        {isSelected ? `⚡ ${hub.name}` : hub.name}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Customer Pin Marker at Exact Validated Coordinates */}
              {(() => {
                if (!result || result.customerLatitude == null) return null;
                const custPos = getMapPosition(result.customerLatitude, result.customerLongitude);

                return (
                  <div
                    style={{ left: `${custPos.x}%`, top: `${custPos.y}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-25 flex items-center space-x-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-lg shadow-amber-500/60 animate-bounce">
                      📍
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/50 shadow">
                      YOU
                    </span>
                  </div>
                );
              })()}
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
                    {loadingStep === 3 && '🛣️ Calculating OSRM road route & agent availability...'}
                  </p>
                </div>
              </div>
            ) : result ? (
              result.eligible ? (
                /* ONE-DAY DELIVERY AVAILABLE SUCCESS BOX (PHASE 15F SUCCESS STATE) */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
                  
                  {/* Badge & Title */}
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black shadow-sm">
                      <Zap className="w-4 h-4 fill-emerald-300 text-emerald-300 animate-pulse" />
                      <span>⚡ ARRIVES TOMORROW</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Location: {result.city || 'Hyderabad'} ({result.pincode})</span>
                  </div>

                  {/* Delivery Promise Specs Grid */}
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
                      <p className="text-sm font-black text-amber-400 mt-1">₹{result.fastDeliveryFee || result.fee || 40}</p>
                    </div>
                  </div>

                  {/* Road Distance, Agent & Demand Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Road Distance</span>
                      <span className="font-semibold text-white">
                        {result.distanceKm < 1 ? `Approx. ${result.distanceKm} km` : `${result.distanceKm} km`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Approx. Travel Time</span>
                      <span className="font-semibold text-white">
                        {result.durationMinutes === 0 ? '0 min' : `~${result.durationMinutes || result.travelTimeMinutes || 15} min`}
                      </span>
                    </div>

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
                        <ShieldCheck className="w-3.5 h-3.5" /> Agent Assigned ({result.agentId || 'AGT-01'})
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
                /* FAST DELIVERY UNAVAILABLE CARD (PHASE 15F INELIGIBLE STATE) */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fast delivery unavailable</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PIN: {result.pincode}</span>
                  </div>

                  {/* Standard Fallback Notice */}
                  {result.deliveryType === 'STANDARD' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <div className="flex items-center space-x-2 text-amber-300 font-bold">
                        <Truck className="w-4 h-4 text-amber-400" />
                        <span>📦 Standard Delivery Available (Arrives in 2-3 Days)</span>
                      </div>
                      {result.estimatedDeliveryDate && (
                        <p className="text-slate-300 text-[11px] pl-6">
                          Estimated delivery date: <strong>{result.estimatedDeliveryDate}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Specific Ineligibility Reason Banner */}
                  <div className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-200">
                        Reason: {result.reasonCode || 'UNAVAILABLE'}
                      </span>
                      <span className="text-slate-400 text-[11px]">{result.customerMessage}</span>
                    </div>
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

