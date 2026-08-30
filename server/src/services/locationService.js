/**
 * RESOLV AI / NEXORA Location & Geocoding Service
 * Performs address normalization, PIN validation, and Google Geocoding with deterministic fallback
 */

import { DELIVERY_ZONES } from '../data/deliveryData.js';

const geocodeCache = new Map();

/**
 * Validates geographic coordinate bounds (-90 <= lat <= 90, -180 <= lon <= 180)
 */
export function isValidCoordinate(lat, lon) {
  if (lat === null || lon === null || lat === undefined || lon === undefined) return false;
  const numLat = Number(lat);
  const numLon = Number(lon);
  return (
    !isNaN(numLat) &&
    !isNaN(numLon) &&
    Number.isFinite(numLat) &&
    Number.isFinite(numLon) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLon >= -180 &&
    numLon <= 180
  );
}

/**
 * Geocodes an input location object { pincode, address, latitude, longitude }
 */
export async function geocodeLocation(locationInput) {
  if (!locationInput) {
    return { success: false, reason: 'MISSING_LOCATION' };
  }

  // Handle direct lat/lng GPS input from browser geolocation
  if (locationInput.latitude !== undefined && locationInput.longitude !== undefined) {
    const lat = Number(locationInput.latitude);
    const lon = Number(locationInput.longitude);
    if (isValidCoordinate(lat, lon)) {
      return {
        success: true,
        latitude: lat,
        longitude: lon,
        pincode: locationInput.pincode ? String(locationInput.pincode).trim() : '500081',
        formattedAddress: locationInput.address || 'Current GPS Location, Hyderabad',
        source: 'BROWSER_GPS',
      };
    }
  }

  // Normalize PIN code input
  const rawPincode = typeof locationInput === 'object' ? locationInput?.pincode : locationInput;
  const cleanPin = (rawPincode || '').toString().trim();

  // Check cache first to minimize external API costs
  const cacheKey = `GEO-${cleanPin}-${locationInput?.address || ''}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 1. If Google Maps API key is configured, attempt Google Geocoding API
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey && (cleanPin || locationInput?.address)) {
    try {
      const query = cleanPin ? `${cleanPin}, Hyderabad, India` : `${locationInput.address}, Hyderabad, India`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const first = data.results[0];
        const lat = first.geometry.location.lat;
        const lon = first.geometry.location.lng;

        if (isValidCoordinate(lat, lon)) {
          const result = {
            success: true,
            latitude: lat,
            longitude: lon,
            pincode: cleanPin || '500081',
            formattedAddress: first.formatted_address,
            source: 'GOOGLE_GEOCODING_API',
          };
          geocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('⚠️ [Google Geocoding API Fallback]', err.message);
    }
  }

  // Address string parsing: extract 6-digit PIN if present in address text (e.g. "HITEC City 500081")
  const addressText = typeof locationInput === 'object' ? locationInput?.address : locationInput;

  // Sanitize malicious strings (XSS, SQL injection, script tags, or non-location garbage)
  if (typeof addressText === 'string') {
    if (/<[^>]*>/i.test(addressText) || /script/i.test(addressText) || /OR\s+1=1/i.test(addressText) || addressText.length > 200) {
      return { success: false, reason: 'INVALID_LOCATION' };
    }
  }

  const pinMatch = (addressText || '').toString().match(/\b(5\d{5})\b/);
  const derivedPin = pinMatch ? pinMatch[1] : (cleanPin && /^\d{6}$/.test(cleanPin) ? cleanPin : null);

  // 2. Deterministic Hyderabad Geocoder Table Fallback
  if (derivedPin && DELIVERY_ZONES[derivedPin]) {
    const z = DELIVERY_ZONES[derivedPin];
    const result = {
      success: true,
      latitude: z.latitude,
      longitude: z.longitude,
      pincode: derivedPin,
      city: z.city,
      formattedAddress: `${z.zoneName}, ${z.city}, ${z.state} - ${z.pincode}`,
      source: 'NEXORA_HYD_GEOCODER_TABLE',
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // Generic address string fallback for Hyderabad (only for valid location text containing Hyderabad/Telangana/known landmarks)
  if (addressText && typeof addressText === 'string' && addressText.length > 3 && (addressText.toLowerCase().includes('hyderabad') || addressText.toLowerCase().includes('hitec') || addressText.toLowerCase().includes('gachibowli') || addressText.toLowerCase().includes('mindspace'))) {
    const result = {
      success: true,
      latitude: 17.4435,
      longitude: 78.3772,
      pincode: '500081',
      city: 'Hyderabad',
      formattedAddress: `${addressText}, Hyderabad, Telangana`,
      source: 'NEXORA_HYD_ADDRESS_ENGINE',
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // Fallback for valid 6-digit PIN codes within Hyderabad
  if (/^\d{6}$/.test(cleanPin)) {
    const result = {
      success: true,
      latitude: 17.3850, // Hyderabad default center
      longitude: 78.4867,
      pincode: cleanPin,
      formattedAddress: `Zone ${cleanPin}, Hyderabad, Telangana`,
      source: 'NEXORA_HYD_DEFAULT_CENTER',
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  return {
    success: false,
    reason: 'UNRESOLVED_LOCATION',
  };
}
