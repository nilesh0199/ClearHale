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

export interface NearbyStationItem {
  id?: number;
  name: string;
  distanceKm: number;
  pm2_5: number;
  pm10?: number | null;
}

export interface OpenAQSensor {
  id: number;
  name?: string;
  parameter?: {
    id?: number;
    name?: string;
    units?: string;
    displayName?: string;
  };
}

export interface OpenAQCoordinates {
  latitude: number;
  longitude: number;
}

export interface OpenAQLocation {
  id: number;
  name: string;
  locality?: string;
  timezone?: string;
  country?: {
    id?: number;
    code?: string;
    name?: string;
  };
  coordinates?: OpenAQCoordinates;
  sensors?: OpenAQSensor[];
  datetimeLast?: {
    utc?: string;
    local?: string;
  };
  provider?: {
    id?: number;
    name?: string;
  };
  owner?: {
    id?: number;
    name?: string;
  };
}

export interface OpenAQMeasurement {
  period?: {
    datetimeTo?: {
      utc?: string;
      local?: string;
    };
  };
  datetime?:
    | {
        utc?: string;
        local?: string;
      }
    | string;
  value?: number;
  parameter?: {
    id?: number;
    name?: string;
  };
  sensorsId?: number;
}

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
  isAverage?: boolean;
  stationCount?: number;
  nearbyStations?: NearbyStationItem[];
}

export interface OpenAQFetchOptions {
  apiKey?: string;
  maxRadiusKm?: number;
  maxAgeHours?: number;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  useConsensus?: boolean;
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
export function isValidPMValue(val: unknown): boolean {
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
  locations: OpenAQLocation[],
  latestMap: Map<number, OpenAQMeasurement[]>,
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
    location: OpenAQLocation;
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
      (s: OpenAQSensor) => s.parameter?.id === 2 || s.parameter?.name?.toLowerCase() === 'pm25'
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
    const sensorMap = new Map<number, OpenAQSensor>();
    if (Array.isArray(location.sensors)) {
      location.sensors.forEach((s: OpenAQSensor) => sensorMap.set(s.id, s));
    }

    let pm25Val: number | null = null;
    let pm10Val: number | null = null;
    let measurementUtc: string | null = null;
    let measurementLocal: string | null = null;

    for (const m of measurements) {
      const sensor = m.sensorsId !== undefined ? sensorMap.get(m.sensorsId) : undefined;
      const paramId = sensor?.parameter?.id ?? m.parameter?.id;
      const paramName = (sensor?.parameter?.name ?? m.parameter?.name ?? '').toLowerCase();

      // Check timestamp freshness
      const mUtc =
        typeof m.datetime === 'object' && m.datetime !== null
          ? m.datetime.utc
          : typeof m.datetime === 'string'
          ? m.datetime
          : null;
      if (!isReadingFresh(mUtc, maxAge, nowMs)) {
        continue;
      }

      if (paramId === 2 || paramName === 'pm25' || paramName === 'pm2_5') {
        if (isValidPMValue(m.value) && typeof m.value === 'number') {
          pm25Val = Math.round(m.value);
          measurementUtc = mUtc ?? null;
          measurementLocal =
            (typeof m.datetime === 'object' && m.datetime?.local
              ? m.datetime.local
              : mUtc) ?? null;
        }
      } else if (paramId === 1 || paramName === 'pm10') {
        if (isValidPMValue(m.value) && typeof m.value === 'number') {
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
        isAverage: false,
        stationCount: 1,
        nearbyStations: [
          {
            id: location.id,
            name: location.name || `Station #${location.id}`,
            distanceKm,
            pm2_5: pm25Val,
            pm10: pm10Val,
          },
        ],
      };
    }
  }

  return null;
}

/**
 * Calculates inverse-distance weighted consensus across nearby active stations.
 * If only 1 station is in range, returns the single station measurement.
 * When multiple stations report fresh data (e.g. in major metropolitan areas),
 * synthesizes an inverse-distance weighted consensus to guard against single-station anomalies.
 */
export function selectStationConsensus(
  userLat: number,
  userLon: number,
  locations: OpenAQLocation[],
  latestMap: Map<number, OpenAQMeasurement[]>,
  options?: { maxRadiusKm?: number; maxAgeHours?: number; nowMs?: number; maxStations?: number }
): OpenAQStationResult | null {
  const maxRadius = options?.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const maxAge = options?.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const nowMs = options?.nowMs ?? Date.now();
  const maxStations = options?.maxStations ?? 5;

  if (!Array.isArray(locations) || locations.length === 0) {
    return null;
  }

  const validStations: Array<{
    id: number;
    name: string;
    provider: string;
    distanceKm: number;
    pm25: number;
    pm10: number | null;
    utc: string;
    local: string;
    minutesAgo: number;
  }> = [];

  for (const loc of locations) {
    const coords = loc.coordinates;
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      continue;
    }

    const dist = calculateDistanceKm(userLat, userLon, coords.latitude, coords.longitude);
    if (dist > maxRadius) {
      continue;
    }

    const measurements = latestMap.get(loc.id) || [];
    if (!Array.isArray(measurements) || measurements.length === 0) {
      continue;
    }

    const sensorMap = new Map<number, OpenAQSensor>();
    if (Array.isArray(loc.sensors)) {
      loc.sensors.forEach((s: OpenAQSensor) => sensorMap.set(s.id, s));
    }

    let bestPm25: number | null = null;
    let bestPm10: number | null = null;
    let bestUtc: string | null = null;
    let bestLocal: string | null = null;
    let latestTimestampMs = 0;

    for (const m of measurements) {
      const sensor = m.sensorsId !== undefined ? sensorMap.get(m.sensorsId) : undefined;
      const paramId = sensor?.parameter?.id ?? m.parameter?.id;
      const paramName = (sensor?.parameter?.name ?? m.parameter?.name ?? '').toLowerCase();

      const mUtc =
        typeof m.datetime === 'object' && m.datetime !== null
          ? m.datetime.utc
          : typeof m.datetime === 'string'
          ? m.datetime
          : null;
      if (!isReadingFresh(mUtc, maxAge, nowMs)) {
        continue;
      }

      if (paramId === 2 || paramName === 'pm25' || paramName === 'pm2_5') {
        if (isValidPMValue(m.value) && typeof m.value === 'number') {
          const tMs = new Date(mUtc!).getTime();
          if (tMs >= latestTimestampMs) {
            bestPm25 = Math.round(m.value);
            bestUtc = mUtc!;
            bestLocal =
              typeof m.datetime === 'object' && m.datetime?.local
                ? m.datetime.local
                : mUtc!;
            latestTimestampMs = tMs;
          }
        }
      } else if (paramId === 1 || paramName === 'pm10') {
        if (isValidPMValue(m.value) && typeof m.value === 'number') {
          bestPm10 = Math.round(m.value);
        }
      }
    }

    if (bestPm25 !== null && bestUtc) {
      const providerName =
        loc.provider?.name ||
        loc.owner?.name ||
        'Government Monitoring Station';

      const minutesAgo = Math.max(
        1,
        Math.round((nowMs - new Date(bestUtc).getTime()) / 60000)
      );

      validStations.push({
        id: loc.id,
        name: loc.name || `Station #${loc.id}`,
        provider: providerName,
        distanceKm: dist,
        pm25: bestPm25,
        pm10: bestPm10,
        utc: bestUtc,
        local: bestLocal || bestUtc,
        minutesAgo,
      });
    }
  }

  if (validStations.length === 0) {
    return null;
  }

  // Sort candidates by proximity to user
  validStations.sort((a, b) => a.distanceKm - b.distanceKm);

  // Pick top N closest active stations
  const activeSlice = validStations.slice(0, maxStations);

  // If exactly 1 station is in range, return single-station format
  if (activeSlice.length === 1) {
    const s = activeSlice[0];
    return {
      id: s.id,
      name: s.name,
      provider: s.provider,
      distanceKm: s.distanceKm,
      measuredPM2_5: s.pm25,
      measuredPM10: s.pm10,
      measuredAtUtc: s.utc,
      measuredAtLocal: s.local,
      minutesAgo: s.minutesAgo,
      isAverage: false,
      stationCount: 1,
      nearbyStations: [
        {
          id: s.id,
          name: s.name,
          distanceKm: s.distanceKm,
          pm2_5: s.pm25,
          pm10: s.pm10,
        },
      ],
    };
  }

  // Inverse distance weighted consensus: w_i = 1 / max(1.0, distanceKm_i)
  let totalWeight = 0;
  let weightedPm25 = 0;
  let weightedPm10 = 0;
  let pm10Count = 0;
  let minMinutesAgo = Infinity;
  let latestUtc = activeSlice[0].utc;
  let latestLocal = activeSlice[0].local;
  let maxTimeMs = 0;

  for (const s of activeSlice) {
    const w = 1 / Math.max(1.0, s.distanceKm);
    totalWeight += w;
    weightedPm25 += s.pm25 * w;
    if (s.pm10 !== null) {
      weightedPm10 += s.pm10 * w;
      pm10Count++;
    }
    if (s.minutesAgo < minMinutesAgo) {
      minMinutesAgo = s.minutesAgo;
    }
    const tMs = new Date(s.utc).getTime();
    if (tMs > maxTimeMs) {
      maxTimeMs = tMs;
      latestUtc = s.utc;
      latestLocal = s.local;
    }
  }

  const consensusPM25 = Math.round(weightedPm25 / totalWeight);
  const consensusPM10 = pm10Count > 0 ? Math.round(weightedPm10 / totalWeight) : null;
  const nearest = activeSlice[0];

  return {
    id: nearest.id,
    name: `${nearest.name.split(',')[0]} & ${activeSlice.length - 1} nearby stations`,
    provider: nearest.provider,
    distanceKm: nearest.distanceKm,
    measuredPM2_5: consensusPM25,
    measuredPM10: consensusPM10,
    measuredAtUtc: latestUtc,
    measuredAtLocal: latestLocal,
    minutesAgo: minMinutesAgo === Infinity ? nearest.minutesAgo : minMinutesAgo,
    isAverage: true,
    stationCount: activeSlice.length,
    nearbyStations: activeSlice.map((s) => ({
      id: s.id,
      name: s.name,
      distanceKm: s.distanceKm,
      pm2_5: s.pm25,
      pm10: s.pm10,
    })),
  };
}

/**
 * Fetches the nearest fresh government station reading or multi-station consensus from OpenAQ v3.
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
  const useConsensus = options?.useConsensus ?? true;

  // Check server cache (rounded to 3 decimal places ~110m, separated by consensus mode)
  const cacheKey = `${userLat.toFixed(3)}_${userLon.toFixed(3)}_${useConsensus ? 'cons' : 'single'}`;
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    // 1. Query /v3/locations for stations within maxRadiusKm (in meters)
    const radiusMeters = Math.min(25000, Math.round(maxRadiusKm * 1000));
    // Coordinates format in OpenAQ v3: latitude,longitude
    const locUrl = `${OPENAQ_BASE_URL}/locations?coordinates=${userLat.toFixed(4)},${userLon.toFixed(4)}&radius=${radiusMeters}&parameters_id=2&limit=25`;

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

    // 2. Filter locations within maxRadiusKm and filter out historical dormant stations (where datetimeLast is too old)
    const nowMs = Date.now();
    const sortedLocs = (locations as OpenAQLocation[])
      .map((l: OpenAQLocation) => ({
        loc: l,
        dist: calculateDistanceKm(
          userLat,
          userLon,
          l.coordinates?.latitude || 0,
          l.coordinates?.longitude || 0
        ),
      }))
      .filter((item: { loc: OpenAQLocation; dist: number }) => {
        if (item.dist > maxRadiusKm) return false;
        // If datetimeLast is provided on location, filter out dormant stations (> maxAgeHours old)
        if (item.loc?.datetimeLast?.utc && !isReadingFresh(item.loc.datetimeLast.utc, maxAgeHours, nowMs)) {
          return false;
        }
        return true;
      })
      .sort((a: { dist: number }, b: { dist: number }) => a.dist - b.dist)
      .slice(0, 5); // Take up to top 5 nearest active stations

    if (sortedLocs.length === 0) {
      serverCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    const latestMap = new Map<number, OpenAQMeasurement[]>();

    await Promise.all(
      sortedLocs.map(async ({ loc }: { loc: OpenAQLocation }) => {
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

    const stationResult = useConsensus
      ? selectStationConsensus(
          userLat,
          userLon,
          sortedLocs.map((s) => s.loc),
          latestMap,
          { maxRadiusKm, maxAgeHours, nowMs: Date.now(), maxStations: 5 }
        )
      : selectBestStation(
          userLat,
          userLon,
          sortedLocs.map((s) => s.loc),
          latestMap,
          { maxRadiusKm, maxAgeHours, nowMs: Date.now() }
        );

    // Cache the result (or null if none found) for 10 minutes
    serverCache.set(cacheKey, { result: stationResult, timestamp: Date.now() });
    return stationResult;
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    if (isAbort) {
      // Timeout hit (6s), fallback smoothly
      return null;
    }
    return null;
  }
}
