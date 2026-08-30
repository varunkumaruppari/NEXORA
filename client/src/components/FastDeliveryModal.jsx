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

export default function FastDeliveryModal({ isOpen, onClose, product, defaultPincode = '', onDeliveryCheckResult = null }) {
  const [pincode, setPincode] = useState('');
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

  const [activeRoute, setActiveRoute] = useState(null);
  const [routeState, setRouteState] = useState('IDLE'); // 'IDLE' | 'ROUTING' | 'SUCCESS' | 'ERROR'

  const locationReqId = useRef(0);
  const routeReqId = useRef(0);

  const isValidCoordinate = (lat, lng) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const calculateProximityKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getCandidateWarehouse = (custLat, custLng, warehouses) => {
    if (!isValidCoordinate(custLat, custLng) || !Array.isArray(warehouses) || warehouses.length === 0) {
      return null;
    }

    const validCandidates = warehouses.filter(
      (w) => w && isValidCoordinate(Number(w.latitude), Number(w.longitude))
    );

    if (validCandidates.length === 0) return null;

    const ranked = validCandidates.map((w) => {
      const prox = calculateProximityKm(custLat, custLng, Number(w.latitude), Number(w.longitude));
      return { warehouse: w, proximityKm: prox };
    });

    ranked.sort((a, b) => {
      if (Math.abs(a.proximityKm - b.proximityKm) > 0.0001) {
        return a.proximityKm - b.proximityKm;
      }
      return String(a.warehouse.warehouseId).localeCompare(String(b.warehouse.warehouseId));
    });

    return ranked[0].warehouse;
  };

  // Clean initial state on modal open: NO default location, NO 📍 YOU marker, NO auto-check
  useEffect(() => {
    if (isOpen) {
      locationReqId.current += 1;
      routeReqId.current += 1;
      setSelectedLocation(null);
      setResult(null);
      setActiveRoute(null);
      setRouteState('IDLE');
      setErrorMsg(null);
      setPincode(defaultPincode || '');
      setAddress('');
      setQuantity(1);
    }
  }, [isOpen, product?.id, defaultPincode]);

  // Phase 16D Real OSRM Road Route Engine Trigger
  useEffect(() => {
    if (!selectedLocation || result) {
      setActiveRoute(null);
      setRouteState('IDLE');
      return;
    }

    const custLat = Number(selectedLocation.latitude);
    const custLng = Number(selectedLocation.longitude);
    if (!isValidCoordinate(custLat, custLng)) return;

    const candidate = getCandidateWarehouse(custLat, custLng, [
      { warehouseId: 'WH-HYD-001', name: 'NEXORA Gachibowli Hub', latitude: 17.4401, longitude: 78.3489 },
      { warehouseId: 'WH-HYD-002', name: 'NEXORA HITEC City Express', latitude: 17.4435, longitude: 78.3772 },
      { warehouseId: 'WH-HYD-003', name: 'NEXORA Madhapur Hub', latitude: 17.4483, longitude: 78.3915 },
      { warehouseId: 'WH-HYD-004', name: 'NEXORA Kukatpally Depot', latitude: 17.4849, longitude: 78.4138 },
      { warehouseId: 'WH-HYD-005', name: 'NEXORA Secunderabad Hub', latitude: 17.4399, longitude: 78.4983 },
      { warehouseId: 'WH-HYD-006', name: 'NEXORA Begumpet Hub', latitude: 17.4448, longitude: 78.4661 },
      { warehouseId: 'WH-HYD-007', name: 'NEXORA Uppal East Hub', latitude: 17.4057, longitude: 78.5601 },
      { warehouseId: 'WH-HYD-008', name: 'NEXORA LB Nagar Hub', latitude: 17.3457, longitude: 78.5522 },
      { warehouseId: 'WH-HYD-009', name: 'NEXORA Mehdipatnam Hub', latitude: 17.3916, longitude: 78.4398 },
      { warehouseId: 'WH-HYD-010', name: 'NEXORA Shamshabad Hub', latitude: 17.2403, longitude: 78.4294 },
    ]);

    if (!candidate) return;

    routeReqId.current += 1;
    const currentRouteReqId = routeReqId.current;

    setRouteState('ROUTING');

    API.post('/delivery/route', {
      origin: { latitude: candidate.latitude, longitude: candidate.longitude },
      destination: { latitude: custLat, longitude: custLng },
    })
      .then((res) => {
        if (currentRouteReqId !== routeReqId.current) return;
        if (res.data && res.data.available && Array.isArray(res.data.geometry) && res.data.geometry.length >= 2) {
          setActiveRoute(res.data);
          setRouteState('SUCCESS');
        } else {
          setActiveRoute(null);
          setRouteState('ERROR');
        }
      })
      .catch((err) => {
        if (currentRouteReqId !== routeReqId.current) return;
        setActiveRoute(null);
        setRouteState('ERROR');
      });
  }, [selectedLocation, result]);

  const handlePincodeChange = (newPin) => {
    locationReqId.current += 1;
    routeReqId.current += 1;
    setPincode(newPin);
    setSelectedLocation(null);
    setResult(null);
    setActiveRoute(null);
    setRouteState('IDLE');
    setErrorMsg(null);
  };

  const handleAddressChange = (newAddress) => {
    locationReqId.current += 1;
    routeReqId.current += 1;
    setAddress(newAddress);
    setSelectedLocation(null);
    setResult(null);
    setActiveRoute(null);
    setRouteState('IDLE');
    setErrorMsg(null);
  };

  const handleMapClick = (lat, lng) => {
    if (!isValidCoordinate(lat, lng)) return;

    locationReqId.current += 1;
    routeReqId.current += 1;
    const currentReqId = locationReqId.current;

    const mapLocObj = {
      latitude: lat,
      longitude: lng,
      source: 'MAP_CLICK',
      address: `Selected Map Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      requestId: currentReqId,
    };

    setSelectedLocation(mapLocObj);
    setErrorMsg(null);
    setResult(null); // Invalidate previous result; user must click Check Availability
    setActiveRoute(null);
    setRouteState('IDLE');
  };

  // Cleanup Leaflet map instance on modal unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Leaflet map cleanup error:', e);
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Real Leaflet + OpenStreetMap Map Tile Initialization & Rendering
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Leaflet map removal error:', e);
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        // Reset container DOM pointer if previously assigned to prevent duplicate init crash
        if (mapContainerRef.current._leaflet_id) {
          mapContainerRef.current._leaflet_id = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [17.4435, 78.3772],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

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
      const activeCustLat = selectedLocation?.latitude ?? result?.customerLatitude;
      const activeCustLng = selectedLocation?.longitude ?? result?.customerLongitude;

      // Phase 16C Candidate Warehouse Determination
      let candidateWh = null;
      if (activeCustLat != null && activeCustLng != null) {
        candidateWh = getCandidateWarehouse(Number(activeCustLat), Number(activeCustLng), hubsToRender);
      }
      const activeSelectedWhId = result?.warehouseId || candidateWh?.warehouseId;

      // Phase 16D Unified Route Data Object (from backend result OR active OSRM route)
      const routeData = result?.eligible
        ? {
            distanceKm: result.distanceKm,
            durationMinutes: result.durationMinutes || result.travelTimeMinutes,
            geometry: (result.route?.geometry && result.route.geometry.length > 0)
              ? result.route.geometry
              : result.routeGeometry,
            warehouseLatitude: result.warehouseLatitude,
            warehouseLongitude: result.warehouseLongitude,
          }
        : (activeRoute && activeRoute.available && candidateWh)
          ? {
              distanceKm: activeRoute.distanceKm,
              durationMinutes: activeRoute.durationMinutes,
              geometry: activeRoute.geometry,
              warehouseLatitude: candidateWh.latitude,
              warehouseLongitude: candidateWh.longitude,
            }
          : null;

      if (routeData && activeCustLat != null && activeCustLng != null && routeData.warehouseLatitude != null && routeData.warehouseLongitude != null) {
        const whLat = Number(routeData.warehouseLatitude);
        const whLng = Number(routeData.warehouseLongitude);

        const rawRoadGeom = (routeData.geometry && routeData.geometry.length > 0)
          ? routeData.geometry
          : [[whLat, whLng], [activeCustLat, activeCustLng]];

        const roadGeom = rawRoadGeom.filter(
          (pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])
        );

        if (roadGeom.length >= 2) {
          L.polyline(roadGeom, {
            color: '#2563eb',
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: undefined,
          }).addTo(layerGroup);

          const midIndex = Math.floor(roadGeom.length / 2);
          const midPoint = roadGeom[midIndex] || [(whLat + activeCustLat) / 2, (whLng + activeCustLng) / 2];

          const distText = routeData.distanceKm < 1 ? `Approx. ${routeData.distanceKm} km` : `${routeData.distanceKm} km`;
          const durText = routeData.durationMinutes ? ` • ~${routeData.durationMinutes} min` : '';

          const badgeIcon = L.divIcon({
            html: `<div style="padding:4px 10px; border-radius:9999px; background:rgba(15,23,42,0.95); border:1.5px solid #2563eb; font-size:11px; font-weight:900; color:#93c5fd; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.7); display:flex; align-items:center; gap:4px;">🔵 ${distText}${durText}</div>`,
            className: 'leaflet-custom-badge',
            iconSize: [140, 26],
            iconAnchor: [70, 13],
          });

          L.marker(midPoint, { icon: badgeIcon, zIndexOffset: 1200 }).addTo(layerGroup);
        }

        boundsPoints.push([whLat, whLng]);
        boundsPoints.push([activeCustLat, activeCustLng]);
        roadGeom.forEach(([rLat, rLng]) => boundsPoints.push([rLat, rLng]));
      }

      hubsToRender.forEach((hub) => {
        if (!hub.latitude || !hub.longitude) return;
        const isSelected = activeSelectedWhId === hub.warehouseId;
        if (!routeData && (!result || !result.eligible)) {
          boundsPoints.push([hub.latitude, hub.longitude]);
        }

        const iconHtml = isSelected
          ? `<div style="background:#059669; color:#fff; font-weight:800; font-size:11px; padding:4px 10px; border-radius:8px; border:2px solid #fff; box-shadow:0 4px 12px rgba(0,0,0,0.8); display:flex; align-items:center; gap:4px;">🏭 ${result?.warehouseName || hub.name}</div>`
          : `<div style="width:12px; height:12px; border-radius:50%; border:2px solid #020617; background:${
              hub.status === 'AVAILABLE' ? '#10b981' : hub.status === 'CONSTRAINED' ? '#f59e0b' : '#ef4444'
            }; box-shadow:0 2px 4px rgba(0,0,0,0.6); cursor:pointer;"></div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'leaflet-custom-hub',
          iconSize: isSelected ? [160, 26] : [12, 12],
          iconAnchor: isSelected ? [80, 13] : [6, 6],
        });

        const marker = L.marker([hub.latitude, hub.longitude], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1500 : 500,
        }).addTo(layerGroup);

        if (!isSelected) {
          marker.bindTooltip(hub.name, {
            direction: 'top',
            offset: [0, -6],
            className: 'bg-slate-900 text-white font-bold text-[10px] px-2 py-1 rounded border border-slate-700 shadow-md',
          });
        }
      });

      // Render Customer Marker (📍 YOU) at exact customer coordinates with highest z-index
      if (activeCustLat != null && activeCustLng != null && isValidCoordinate(Number(activeCustLat), Number(activeCustLng))) {
        const cleanCustLat = Number(activeCustLat);
        const cleanCustLng = Number(activeCustLng);

        if (!result || !result.eligible) {
          boundsPoints.push([cleanCustLat, cleanCustLng]);
        }

        const custIcon = L.divIcon({
          html: `<div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);"><div style="background:#f59e0b; color:#020617; font-weight:900; font-size:11px; padding:3px 8px; border-radius:8px; border:2px solid #fff; box-shadow:0 4px 14px rgba(0,0,0,0.8); white-space:nowrap; margin-bottom:2px;">📍 YOU</div><div style="width:14px; height:14px; border-radius:50%; background:#f59e0b; border:2px solid #fff; box-shadow:0 0 12px #f59e0b;"></div></div>`,
          className: 'leaflet-custom-cust',
          iconSize: [60, 36],
          iconAnchor: [30, 36],
        });

        const custMarker = L.marker([cleanCustLat, cleanCustLng], {
          icon: custIcon,
          zIndexOffset: 2000,
        }).addTo(layerGroup);

        custMarker.bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <div style="font-weight:bold; color:#f59e0b; font-size:12px; margin-bottom:2px;">📍 YOU (${selectedLocation?.source || 'LOCATION'})</div>
            <div style="font-size:10px; color:#94a3b8;">${selectedLocation?.address || 'Selected delivery location'}</div>
            <div style="font-size:10px; color:#cbd5e1; margin-top:4px;">Latitude: <b>${cleanCustLat.toFixed(6)}</b></div>
            <div style="font-size:10px; color:#cbd5e1;">Longitude: <b>${cleanCustLng.toFixed(6)}</b></div>
          </div>
        `);
      }

      if (boundsPoints.length > 0) {
        const paddingAmount = result && result.eligible ? [50, 50] : [35, 35];
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: paddingAmount, maxZoom: 15 });
      }

      setTimeout(() => map?.invalidateSize(), 200);
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
        if (response.data.customerLatitude != null && response.data.customerLongitude != null) {
          const resLat = Number(response.data.customerLatitude);
          const resLng = Number(response.data.customerLongitude);
          if (isValidCoordinate(resLat, resLng)) {
            setSelectedLocation({
              latitude: resLat,
              longitude: resLng,
              source: response.data.locationSource || 'PIN',
              address: addressToCheck || `Resolved Location (${response.data.pincode || cleanPin})`,
              requestId: locationReqId.current,
            });
          }
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
    setResult(null);

    locationReqId.current += 1;
    const currentReqId = locationReqId.current;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        if (currentReqId !== locationReqId.current) return;

        const { latitude, longitude } = position.coords;
        if (!isValidCoordinate(latitude, longitude)) {
          setErrorMsg('Invalid GPS coordinates received.');
          return;
        }

        const gpsLocObj = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: 'GPS',
          address: 'Current GPS Location, Hyderabad',
          requestId: currentReqId,
        };
        setSelectedLocation(gpsLocObj);
      },
      (err) => {
        setGeoLocating(false);
        if (currentReqId !== locationReqId.current) return;
        setErrorMsg('Location permission denied or unavailable. Please enter PIN code manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectSample = (samplePin) => {
    locationReqId.current += 1;
    setPincode(samplePin);
    setAddress('');
    setSelectedLocation(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 shrink-0">
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

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-6">
          
          <div className="flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <img
              src={product?.image || ''}
              alt={product?.name || 'Product'}
              className="w-14 h-14 object-cover rounded-xl border border-slate-700/80 shadow"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                {product?.category || 'Tech'}
              </span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">{product?.name}</h3>
              <p className="text-xs font-semibold text-emerald-400">₹{product?.price?.toLocaleString('en-IN')}</p>
            </div>
          </div>

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
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit PIN"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="relative col-span-1 sm:col-span-2">
                <Compass className="absolute left-3 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Address or Landmark (e.g. HITEC City)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-400 font-medium">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value));
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

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Sample Zones:</span>
              {SAMPLE_PINCODES.map((item) => (
                <button
                  key={item.pin}
                  onClick={() => handleSelectSample(item.pin)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all ${
                    pincode === item.pin && result
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.city} ({item.pin})
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-48 sm:h-52 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-2 flex flex-col justify-between shadow-inner shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 z-10 bg-slate-950/90 px-2.5 py-1 rounded-lg backdrop-blur-sm">
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

            <div ref={mapContainerRef} className="relative flex-1 w-full h-full bg-slate-950 rounded-xl overflow-hidden z-0" />
          </div>

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
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
                  
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black shadow-sm">
                      <Zap className="w-4 h-4 fill-emerald-300 text-emerald-300 animate-pulse" />
                      <span>⚡ ARRIVES TOMORROW</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Location: {result.city || 'Hyderabad'} ({result.pincode})</span>
                  </div>

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

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs space-y-2">
                    <span className="text-[11px] uppercase font-bold text-emerald-400 block tracking-wider">
                      ✓ WHY ONE-DAY DELIVERY IS AVAILABLE
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-300">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Stock Available</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hub Open</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Real OSRM Route</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Range (&le;35 km)</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Agent Available</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Agent Capacity</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hub Capacity</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Before Cutoff</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs text-emerald-200/90 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{result.customerMessage}</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fast delivery unavailable</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PIN: {result.pincode}</span>
                  </div>

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
            ) : !selectedLocation ? (
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 py-6">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white">Select Your Delivery Location</p>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Enter your 6-digit PIN code, landmark address, use GPS, or click directly on the map above to verify 1-day fast delivery feasibility.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-xs">{selectedLocation.address || 'Selected Location'}</p>
                    <p className="text-[11px] text-slate-400">Click Check Availability to evaluate route</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCheckDelivery(pincode, address, quantity, selectedLocation)}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Check Now</span>
                </button>
              </div>
            )}
          </div>
        </div>

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
