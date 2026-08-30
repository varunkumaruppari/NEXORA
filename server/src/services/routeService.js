/**
 * RESOLV AI / NEXORA Routing & Road Distance Service
 * Computes road distance & duration using Google Routes API with deterministic Haversine road-curvature fallback
 */

import { calculateHaversineDistance } from './deliveryEligibilityService.js';

const routeCache = new Map();

/**
 * Computes distance and duration between a warehouse origin and customer destination
 */
export async function calculateRoute(origin, destination) {
  if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
    return {
      available: false,
      distanceKm: 0,
      durationMinutes: 0,
      distanceType: 'UNKNOWN',
      provider: 'NONE',
    };
  }

  const cacheKey = `RTE-${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}-${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // 1. If Google Maps API key is configured, call Google Routes / Distance Matrix API
  if (googleApiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${googleApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const distMeters = element.distance.value;
        const durationSec = element.duration.value;

        const distanceKm = Math.round((distMeters / 1000) * 10) / 10;
        const durationMinutes = Math.round(durationSec / 60);

        const result = {
          available: true,
          distanceKm,
          durationMinutes,
          distanceType: 'ROAD',
          provider: 'GOOGLE_ROUTES_API',
          timestamp: new Date().toISOString(),
        };
        routeCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('⚠️ [Google Routes API Fallback]', err.message);
    }
  }

  // 2. Deterministic Hyderabad Road Curvature Engine Fallback
  // Road distance is typically ~1.25x straight-line Haversine distance due to road network topology
  const haversineDist = calculateHaversineDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  const roadDistanceKm = Math.round(haversineDist * 1.25 * 10) / 10;
  const durationMinutes = roadDistanceKm === 0 ? 0 : Math.round((roadDistanceKm / 30) * 60) + 10;

  const result = {
    available: true,
    distanceKm: roadDistanceKm,
    durationMinutes,
    distanceType: 'ROAD',
    provider: 'NEXORA_HYD_ROAD_ENGINE',
    timestamp: new Date().toISOString(),
  };

  routeCache.set(cacheKey, result);
  return result;
}
