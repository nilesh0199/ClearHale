/**
 * OpenAQ v3 API Integration for Clearhale
 * Server-side only module. Never exposed directly to the client.
 *
 * Rules:
 * - Base URL: https://api.openaq.org/v3
 * - Auth Header: X-API-Key: process.env.OPENAQ_API_KEY
 * - Max Radius: 25 km (25000 meters)
 * - Freshness: reading <= 3 hours old (configurable)
 * - Valid PM2.5 range: 0 - 1500 µg/m³ (negative or >1500 discarded)
 * - Wrong-city protection: strict <= 25km radius enforcement
 * - Server cache: 10 minutes per coordinate grid
 * - Timeout: 6 seconds with AbortSignal
 * - 429 rate limit backoff cooldown
 */

export interface OpenAQStationResult {
  id: number;
  name: string;
  provider: string;
  distanceKm: number;
  measuredPM2_5: number;
  measuredPM10: number | null;
  measuredAtUtc: string;
  measuredAtLocal: string;
  minutesAgo: number;
}

export interface OpenAQFetchOptions {
  apiKey?: string;
  maxRadiusKm?: number;
  maxAgeHours?: number;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

const OPENAQ_BASE_URL = 'https://api.openaq.org/v3';
const DEFAULT_MAX_RADIUS_KM = 25;
const DEFAULT_MAX_AGE_HOURS = 3;
const DEFAULT_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory server-side cache
interface CacheEntry {
  result: OpenAQStationResult | null;
  timestamp: number;
}
const serverCache = new Map<string, CacheEntry>();

// Upstream 429 cooldown tracker
let openaqCooldownUntil = 0;

/**
 * Calculates great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers rounded to 1 decimal place.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Validates whether a PM measurement value is physically plausible.
 * Discards negative values or values above 1500 µg/m³.
 */
export function isValidPMValue(val: any): boolean {
  if (typeof val !== 'number' || isNaN(val)) return false;
  return val >= 0 && val <= 1500;
}

/**
 * Validates whether an ISO timestamp is fresh (within maxAgeHours).
 */
export function isReadingFresh(
  isoDateStr: string | undefined | null,
  maxAgeHours: number = DEFAULT_MAX_AGE_HOURS,
  nowMs: number = Date.now()
): boolean {
  if (!isoDateStr) return false;
  const timestamp = new Date(isoDateStr).getTime();
  if (isNaN(timestamp)) return false;
  const ageMs = nowMs - timestamp;
  // Ignore future timestamps beyond 10 min tolerance or past maxAgeHours
  if (ageMs < -10 * 60 * 1000) return false;
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

/**
 * Clear in-memory cache (primarily for tests)
 */
export function clearOpenAQCache(): void {
  serverCache.clear();
  openaqCooldownUntil = 0;
}

/**
 * Selects the nearest fresh, valid station from candidate locations and latest measurements.
 * Pure function used by the API route and unit tests.
 */
export function selectBestStation(
  userLat: number,
  userLon: number,
  locations: any[],
  latestMap: Map<number, any[]>,
  options?: { maxRadiusKm?: number; maxAgeHours?: number; nowMs?: number }
): OpenAQStationResult | null {
  const maxRadius = options?.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const maxAge = options?.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const nowMs = options?.nowMs ?? Date.now();

  if (!Array.isArray(locations) || locations.length === 0) {
    return null;
  }

  // Calculate distance and filter out stations beyond maxRadius
  const candidates: {
    location: any;
    distanceKm: number;
  }[] = [];

  for (const loc of locations) {
    const coords = loc.coordinates;
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      continue;
    }

    const dist = calculateDistanceKm(userLat, userLon, coords.latitude, coords.longitude);
    // Wrong-city protection: discard any station beyond maxRadius
    if (dist > maxRadius) {
      continue;
    }

    // Must have PM2.5 sensor capability (parameter id = 2 or name = 'pm25')
    const hasPM25Sensor = Array.isArray(loc.sensors) && loc.sensors.some(
      (s: any) => s.parameter?.id === 2 || s.parameter?.name?.toLowerCase() === 'pm25'
    );
    if (!hasPM25Sensor && Array.isArray(loc.sensors) && loc.sensors.length > 0) {
      continue;
    }

    // If datetimeLast is provided on location, check if it's too stale
    if (loc.datetimeLast?.utc && !isReadingFresh(loc.datetimeLast.utc, maxAge, nowMs)) {
      continue;
    }

    candidates.push({ location: loc, distanceKm: dist });
  }

  // Sort by nearest distance first
  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  // Evaluate candidates in nearest order
  for (const { location, distanceKm } of candidates) {
    const measurements = latestMap.get(location.id) || [];
    if (!Array.isArray(measurements) || measurements.length === 0) {
      continue;
    }

    // Create sensor lookup
    const sensorMap = new Map<number, any>();
    if (Array.isArray(location.sensors)) {
      location.sensors.forEach((s: any) => sensorMap.set(s.id, s));
    }

    let pm25Val: number | null = null;
    let pm10Val: number | null = null;
    let measurementUtc: string | null = null;
    let measurementLocal: string | null = null;

    for (const m of measurements) {
      const sensor = sensorMap.get(m.sensorsId);
      const paramId = sensor?.parameter?.id ?? m.parameter?.id;
      const paramName = (sensor?.parameter?.name ?? m.parameter?.name ?? '').toLowerCase();

      // Check timestamp freshness
      const mUtc = m.datetime?.utc || (typeof m.datetime === 'string' ? m.datetime : null);
      if (!isReadingFresh(mUtc, maxAge, nowMs)) {
        continue;
      }

      if (paramId === 2 || paramName === 'pm25' || paramName === 'pm2_5') {
        if (isValidPMValue(m.value)) {
          pm25Val = Math.round(m.value);
          measurementUtc = mUtc;
          measurementLocal = m.datetime?.local || mUtc;
        }
      } else if (paramId === 1 || paramName === 'pm10') {
        if (isValidPMValue(m.value)) {
          pm10Val = Math.round(m.value);
        }
      }
    }

    // If we found a valid, fresh PM2.5 measurement
    if (pm25Val !== null && measurementUtc) {
      const providerName =
        location.provider?.name ||
        location.owner?.name ||
        'Government Monitoring Station';

      const minutesAgo = Math.max(
        1,
        Math.round((nowMs - new Date(measurementUtc).getTime()) / 60000)
      );

      return {
        id: location.id,
        name: location.name || `Station #${location.id}`,
        provider: providerName,
        distanceKm,
        measuredPM2_5: pm25Val,
        measuredPM10: pm10Val,
        measuredAtUtc: measurementUtc,
        measuredAtLocal: measurementLocal || measurementUtc,
        minutesAgo,
      };
    }
  }

  return null;
}

/**
 * Fetches the nearest fresh government station reading from OpenAQ v3.
 * Server-side only. Uses caching, timeouts, and rate-limit backoff.
 */
export async function getNearestOpenAQStation(
  userLat: number,
  userLon: number,
  options?: OpenAQFetchOptions
): Promise<OpenAQStationResult | null> {
  const apiKey = options?.apiKey || process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    // No key configured: gracefully fall back to model
    return null;
  }

  // Check 429 cooldown
  if (Date.now() < openaqCooldownUntil) {
    return null;
  }

  const maxRadiusKm = options?.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const maxAgeHours = options?.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const customFetch = options?.fetchFn || fetch;

  // Check server cache (rounded to 3 decimal places ~110m)
  const cacheKey = `${userLat.toFixed(3)}_${userLon.toFixed(3)}`;
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    // 1. Query /v3/locations for stations within maxRadiusKm (in meters)
    const radiusMeters = Math.min(25000, Math.round(maxRadiusKm * 1000));
    // Coordinates format in OpenAQ v3: latitude,longitude
    const locUrl = `${OPENAQ_BASE_URL}/locations?coordinates=${userLat.toFixed(4)},${userLon.toFixed(4)}&radius=${radiusMeters}&parameters_id=2&limit=8`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const locRes = await customFetch(locUrl, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (locRes.status === 429) {
      // Cooldown for 45 seconds on rate limit
      openaqCooldownUntil = Date.now() + 45000;
      return null;
    }

    if (!locRes.ok) {
      return null;
    }

    const locData = await locRes.json();
    const locations = locData?.results;
    if (!Array.isArray(locations) || locations.length === 0) {
      serverCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    // 2. Fetch latest readings for nearby locations (up to 3 nearest)
    // Sort locations by approximate distance first to fetch only closest
    const sortedLocs = locations
      .map((l: any) => ({
        loc: l,
        dist: calculateDistanceKm(
          userLat,
          userLon,
          l.coordinates?.latitude || 0,
          l.coordinates?.longitude || 0
        ),
      }))
      .filter((item: any) => item.dist <= maxRadiusKm)
      .sort((a: any, b: any) => a.dist - b.dist)
      .slice(0, 3);

    if (sortedLocs.length === 0) {
      serverCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    const latestMap = new Map<number, any[]>();

    await Promise.all(
      sortedLocs.map(async ({ loc }: { loc: any }) => {
        try {
          const latestUrl = `${OPENAQ_BASE_URL}/locations/${loc.id}/latest`;
          const latestCtrl = new AbortController();
          const latestTimer = setTimeout(() => latestCtrl.abort(), timeoutMs);

          const latestRes = await customFetch(latestUrl, {
            headers: {
              'X-API-Key': apiKey,
              Accept: 'application/json',
            },
            signal: latestCtrl.signal,
          });
          clearTimeout(latestTimer);

          if (latestRes.ok) {
            const data = await latestRes.json();
            if (Array.isArray(data?.results)) {
              latestMap.set(loc.id, data.results);
            }
          }
        } catch {
          // Individual station failure ignored; other stations evaluated
        }
      })
    );

    const bestStation = selectBestStation(
      userLat,
      userLon,
      sortedLocs.map((s) => s.loc),
      latestMap,
      { maxRadiusKm, maxAgeHours, nowMs: Date.now() }
    );

    // Cache the result (or null if none found) for 10 minutes
    serverCache.set(cacheKey, { result: bestStation, timestamp: Date.now() });
    return bestStation;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // Timeout hit (6s), fallback smoothly
      return null;
    }
    return null;
  }
}
