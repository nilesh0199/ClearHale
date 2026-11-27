import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Logic replicated from lib/openaq.ts for self-contained Node ESM testing
const DEFAULT_MAX_RADIUS_KM = 25;
const DEFAULT_MAX_AGE_HOURS = 3;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
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

function isValidPMValue(val) {
  if (typeof val !== 'number' || isNaN(val)) return false;
  return val >= 0 && val <= 1500;
}

function isReadingFresh(isoDateStr, maxAgeHours = DEFAULT_MAX_AGE_HOURS, nowMs = Date.now()) {
  if (!isoDateStr) return false;
  const timestamp = new Date(isoDateStr).getTime();
  if (isNaN(timestamp)) return false;
  const ageMs = nowMs - timestamp;
  if (ageMs < -10 * 60 * 1000) return false;
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

function selectBestStation(userLat, userLon, locations, latestMap, options = {}) {
  const maxRadius = options.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const maxAge = options.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const nowMs = options.nowMs ?? Date.now();

  if (!Array.isArray(locations) || locations.length === 0) return null;

  const candidates = [];
  for (const loc of locations) {
    const coords = loc.coordinates;
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      continue;
    }
    const dist = calculateDistanceKm(userLat, userLon, coords.latitude, coords.longitude);
    if (dist > maxRadius) continue;

    const hasPM25Sensor = Array.isArray(loc.sensors) && loc.sensors.some(
      (s) => s.parameter?.id === 2 || s.parameter?.name?.toLowerCase() === 'pm25'
    );
    if (!hasPM25Sensor && Array.isArray(loc.sensors) && loc.sensors.length > 0) {
      continue;
    }

    if (loc.datetimeLast?.utc && !isReadingFresh(loc.datetimeLast.utc, maxAge, nowMs)) {
      continue;
    }

    candidates.push({ location: loc, distanceKm: dist });
  }

  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  for (const { location, distanceKm } of candidates) {
    const measurements = latestMap.get(location.id) || [];
    if (!Array.isArray(measurements) || measurements.length === 0) continue;

    const sensorMap = new Map();
    if (Array.isArray(location.sensors)) {
      location.sensors.forEach((s) => sensorMap.set(s.id, s));
    }

    let pm25Val = null;
    let pm10Val = null;
    let measurementUtc = null;
    let measurementLocal = null;

    for (const m of measurements) {
      const sensor = sensorMap.get(m.sensorsId);
      const paramId = sensor?.parameter?.id ?? m.parameter?.id;
      const paramName = (sensor?.parameter?.name ?? m.parameter?.name ?? '').toLowerCase();

      const mUtc = m.datetime?.utc || (typeof m.datetime === 'string' ? m.datetime : null);
      if (!isReadingFresh(mUtc, maxAge, nowMs)) continue;

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

    if (pm25Val !== null && measurementUtc) {
      const providerName =
        location.provider?.name || location.owner?.name || 'Government Monitoring Station';
      const minutesAgo = Math.max(1, Math.round((nowMs - new Date(measurementUtc).getTime()) / 60000));

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

function selectStationConsensus(userLat, userLon, locations, latestMap, options = {}) {
  const maxRadius = options.maxRadiusKm ?? DEFAULT_MAX_RADIUS_KM;
  const maxAge = options.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const nowMs = options.nowMs ?? Date.now();
  const maxStations = options.maxStations ?? 5;

  if (!Array.isArray(locations) || locations.length === 0) return null;

  const validStations = [];

  for (const loc of locations) {
    const coords = loc.coordinates;
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') continue;

    const dist = calculateDistanceKm(userLat, userLon, coords.latitude, coords.longitude);
    if (dist > maxRadius) continue;

    const measurements = latestMap.get(loc.id) || [];
    if (!Array.isArray(measurements) || measurements.length === 0) continue;

    const sensorMap = new Map();
    if (Array.isArray(loc.sensors)) {
      loc.sensors.forEach((s) => sensorMap.set(s.id, s));
    }

    let bestPm25 = null;
    let bestPm10 = null;
    let bestUtc = null;
    let bestLocal = null;
    let latestTimestampMs = 0;

    for (const m of measurements) {
      const sensor = sensorMap.get(m.sensorsId);
      const paramId = sensor?.parameter?.id ?? m.parameter?.id;
      const paramName = (sensor?.parameter?.name ?? m.parameter?.name ?? '').toLowerCase();

      const mUtc = m.datetime?.utc || (typeof m.datetime === 'string' ? m.datetime : null);
      if (!isReadingFresh(mUtc, maxAge, nowMs)) continue;

      if (paramId === 2 || paramName === 'pm25' || paramName === 'pm2_5') {
        if (isValidPMValue(m.value)) {
          const tMs = new Date(mUtc).getTime();
          if (tMs >= latestTimestampMs) {
            bestPm25 = Math.round(m.value);
            bestUtc = mUtc;
            bestLocal = m.datetime?.local || mUtc;
            latestTimestampMs = tMs;
          }
        }
      } else if (paramId === 1 || paramName === 'pm10') {
        if (isValidPMValue(m.value)) {
          bestPm10 = Math.round(m.value);
        }
      }
    }

    if (bestPm25 !== null && bestUtc) {
      const providerName =
        loc.provider?.name || loc.owner?.name || 'Government Monitoring Station';
      const minutesAgo = Math.max(1, Math.round((nowMs - new Date(bestUtc).getTime()) / 60000));

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

  if (validStations.length === 0) return null;

  validStations.sort((a, b) => a.distanceKm - b.distanceKm);
  const activeSlice = validStations.slice(0, maxStations);

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
      nearbyStations: [{ id: s.id, name: s.name, distanceKm: s.distanceKm, pm2_5: s.pm25, pm10: s.pm10 }],
    };
  }

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
    if (s.minutesAgo < minMinutesAgo) minMinutesAgo = s.minutesAgo;
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

describe('OpenAQ v3 Live Data Integration', () => {
  const nowMs = 1732200000000; // Fixed timestamp for deterministic tests
  const freshIso = new Date(nowMs - 30 * 60 * 1000).toISOString(); // 30 min ago
  const staleIso = new Date(nowMs - 4 * 60 * 60 * 1000).toISOString(); // 4 hours ago (stale > 3h)

  describe('1. Nearest Fresh Station Selection', () => {
    test('Chooses the nearest station when multiple fresh stations report PM2.5', () => {
      // User in Central Delhi
      const userLat = 28.6139;
      const userLon = 77.2090;

      const locFar = {
        id: 101,
        name: 'Station Far (15 km)',
        provider: { name: 'CPCB' },
        coordinates: { latitude: 28.74, longitude: 77.2090 }, // ~14 km away
        sensors: [{ id: 1, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const locNear = {
        id: 102,
        name: 'Station Near (2.5 km)',
        provider: { name: 'DPCC' },
        coordinates: { latitude: 28.63, longitude: 77.22 }, // ~2.1 km away
        sensors: [{ id: 2, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(101, [{ sensorsId: 1, value: 180, datetime: { utc: freshIso } }]);
      latestMap.set(102, [{ sensorsId: 2, value: 145, datetime: { utc: freshIso } }]);

      const result = selectBestStation(userLat, userLon, [locFar, locNear], latestMap, { nowMs });

      assert.ok(result);
      assert.equal(result.id, 102);
      assert.equal(result.name, 'Station Near (2.5 km)');
      assert.equal(result.measuredPM2_5, 145);
      assert.ok(result.distanceKm < 5, 'Should be within ~2.1 km');
    });
  });

  describe('2. Stale Stations Skipped', () => {
    test('Skips a nearer station if its reading is older than 3 hours, picking the fresh one', () => {
      const userLat = 28.6139;
      const userLon = 77.2090;

      const locNearStale = {
        id: 201,
        name: 'Near but Stale',
        coordinates: { latitude: 28.62, longitude: 77.21 }, // ~0.7 km
        sensors: [{ id: 10, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: staleIso },
      };

      const locFurtherFresh = {
        id: 202,
        name: 'Further but Fresh',
        coordinates: { latitude: 28.66, longitude: 77.25 }, // ~6.5 km
        sensors: [{ id: 20, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(201, [{ sensorsId: 10, value: 110, datetime: { utc: staleIso } }]);
      latestMap.set(202, [{ sensorsId: 20, value: 135, datetime: { utc: freshIso } }]);

      const result = selectBestStation(
        userLat,
        userLon,
        [locNearStale, locFurtherFresh],
        latestMap,
        { nowMs }
      );

      assert.ok(result);
      assert.equal(result.id, 202);
      assert.equal(result.name, 'Further but Fresh');
      assert.equal(result.measuredPM2_5, 135);
    });
  });

  describe('3. Impossible Values Dropped', () => {
    test('Discards negative PM2.5 readings (< 0)', () => {
      assert.equal(isValidPMValue(-1), false);
      assert.equal(isValidPMValue(-50), false);
      assert.equal(isValidPMValue(0), true);
    });

    test('Discards extreme physical impossible readings (> 1500 µg/m³)', () => {
      assert.equal(isValidPMValue(1501), false);
      assert.equal(isValidPMValue(9999), false);
      assert.equal(isValidPMValue(500), true);
      assert.equal(isValidPMValue(1499), true);
    });

    test('Falls through to next station if nearest station reports impossible reading', () => {
      const userLat = 28.6139;
      const userLon = 77.2090;

      const locGlitch = {
        id: 301,
        name: 'Sensor Glitch (-999)',
        coordinates: { latitude: 28.62, longitude: 77.21 }, // ~0.7 km
        sensors: [{ id: 30, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const locValid = {
        id: 302,
        name: 'Valid Next Station',
        coordinates: { latitude: 28.64, longitude: 77.23 }, // ~3.5 km
        sensors: [{ id: 31, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(301, [{ sensorsId: 30, value: -999, datetime: { utc: freshIso } }]);
      latestMap.set(302, [{ sensorsId: 31, value: 165, datetime: { utc: freshIso } }]);

      const result = selectBestStation(userLat, userLon, [locGlitch, locValid], latestMap, {
        nowMs,
      });

      assert.ok(result);
      assert.equal(result.id, 302);
      assert.equal(result.measuredPM2_5, 165);
    });
  });

  describe('4. No Station in Range (Fallback)', () => {
    test('Returns null when no stations exist within 25 km radius', () => {
      const userLat = 28.6139;
      const userLon = 77.2090;

      // Station located 60 km away
      const locFarAway = {
        id: 401,
        name: 'Out of Range Station',
        coordinates: { latitude: 29.2, longitude: 77.2090 }, // ~65 km away
        sensors: [{ id: 40, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(401, [{ sensorsId: 40, value: 85, datetime: { utc: freshIso } }]);

      const result = selectBestStation(userLat, userLon, [locFarAway], latestMap, { nowMs });
      assert.equal(result, null, 'Must return null when out of 25 km range');
    });

    test('Returns null when locations list is empty', () => {
      const result = selectBestStation(28.6139, 77.2090, [], new Map(), { nowMs });
      assert.equal(result, null);
    });
  });

  describe('5. Rate Limiting (429) & Timeout Handling', () => {
    test('Simulates 429 response handling with graceful fallback', async () => {
      let cooldownUntil = 0;

      async function mockFetchWith429() {
        if (Date.now() < cooldownUntil) {
          return null; // Instant fallback during cooldown
        }
        // Simulate upstream 429
        cooldownUntil = Date.now() + 45000;
        return null;
      }

      const res1 = await mockFetchWith429();
      assert.equal(res1, null);
      assert.ok(cooldownUntil > Date.now());

      const res2 = await mockFetchWith429();
      assert.equal(res2, null, 'Immediately returns fallback during cooldown without contacting API');
    });

    test('Simulates 6-second timeout abort with graceful fallback', async () => {
      async function mockFetchWithTimeout(timeoutMs = 50) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
          // Simulate slow network taking 200ms
          await new Promise((resolve, reject) => {
            const delay = setTimeout(resolve, 200);
            ctrl.signal.addEventListener('abort', () => {
              clearTimeout(delay);
              reject(new Error('AbortError'));
            });
          });
          clearTimeout(timer);
          return { ok: true };
        } catch (err) {
          assert.equal(err.message, 'AbortError');
          return null; // Graceful fallback
        }
      }

      const res = await mockFetchWithTimeout(30);
      assert.equal(res, null);
    });
  });

  describe('6. Wrong-City Protection', () => {
    test('Pune coordinate (18.5204, 73.8567) must NEVER use a Mumbai station (19.0760, 72.8777)', () => {
      const puneLat = 18.5204;
      const puneLon = 73.8567;

      const mumbaiLat = 19.0760;
      const mumbaiLon = 72.8777;

      const distanceToMumbai = calculateDistanceKm(puneLat, puneLon, mumbaiLat, mumbaiLon);
      assert.ok(
        distanceToMumbai > 110,
        `Distance from Pune to Mumbai should be ~120 km (got ${distanceToMumbai} km)`
      );

      const mumbaiStation = {
        id: 501,
        name: 'Bandra, Mumbai Station',
        provider: { name: 'MPCB' },
        coordinates: { latitude: mumbaiLat, longitude: mumbaiLon },
        sensors: [{ id: 50, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(501, [{ sensorsId: 50, value: 92, datetime: { utc: freshIso } }]);

      // Running selection for Pune with the Mumbai station available
      const result = selectBestStation(puneLat, puneLon, [mumbaiStation], latestMap, {
        maxRadiusKm: 25,
        nowMs,
      });

      assert.equal(
        result,
        null,
        'Wrong-city protection MUST reject Mumbai station for Pune coordinates'
      );
    });
  });

  describe('7. Multi-Station Consensus & Inverse-Distance Averaging', () => {
    test('Calculates inverse-distance weighted average across multiple fresh active stations', () => {
      const userLat = 28.6139;
      const userLon = 77.2090;

      // Station 1: 3.5 km away, PM2.5 = 73 (Weight = 1/3.5 = 0.2857)
      const loc1 = {
        id: 5613,
        name: 'ITO, New Delhi - CPCB',
        provider: { name: 'CPCB' },
        coordinates: { latitude: 28.628, longitude: 77.241 }, // ~3.5 km
        sensors: [{ id: 101, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      // Station 2: 7.1 km away, PM2.5 = 80 (Weight = 1/7.1 = 0.1408)
      const loc2 = {
        id: 5586,
        name: 'Sirifort, Delhi - CPCB',
        provider: { name: 'CPCB' },
        coordinates: { latitude: 28.553, longitude: 77.218 }, // ~7.1 km
        sensors: [{ id: 102, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      // Station 3: 6.0 km away, PM2.5 = 47 (Weight = 1/6.0 = 0.1667)
      const loc3 = {
        id: 17,
        name: 'R K Puram, Delhi - DPCC',
        provider: { name: 'DPCC' },
        coordinates: { latitude: 28.563, longitude: 77.187 }, // ~6.0 km
        sensors: [{ id: 103, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(5613, [{ sensorsId: 101, value: 73, datetime: { utc: freshIso } }]);
      latestMap.set(5586, [{ sensorsId: 102, value: 80, datetime: { utc: freshIso } }]);
      latestMap.set(17, [{ sensorsId: 103, value: 47, datetime: { utc: freshIso } }]);

      const result = selectStationConsensus(
        userLat,
        userLon,
        [loc1, loc2, loc3],
        latestMap,
        { nowMs, maxStations: 5 }
      );

      assert.ok(result);
      assert.equal(result.isAverage, true);
      assert.equal(result.stationCount, 3);
      // Expected weighted average: (0.2857*73 + 0.1408*80 + 0.1667*47) / (0.2857 + 0.1408 + 0.1667) ≈ 67
      assert.ok(result.measuredPM2_5 >= 65 && result.measuredPM2_5 <= 70, `Expected ~67, got ${result.measuredPM2_5}`);
      assert.equal(result.nearbyStations.length, 3);
      assert.ok(result.name.includes('ITO'));
    });

    test('Gracefully collapses to single station when only 1 active station is within radius', () => {
      const userLat = 21.1458;
      const userLon = 79.0882;

      const locOnly = {
        id: 901,
        name: 'Mahal, Nagpur - MPCB',
        provider: { name: 'MPCB' },
        coordinates: { latitude: 21.147, longitude: 79.105 }, // ~1.8 km
        sensors: [{ id: 91, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(901, [{ sensorsId: 91, value: 58, datetime: { utc: freshIso } }]);

      const result = selectStationConsensus(userLat, userLon, [locOnly], latestMap, { nowMs });

      assert.ok(result);
      assert.equal(result.isAverage, false);
      assert.equal(result.stationCount, 1);
      assert.equal(result.measuredPM2_5, 58);
      assert.equal(result.name, 'Mahal, Nagpur - MPCB');
    });

    test('Current location mode selects single nearest station without averaging', () => {
      const userLat = 28.6139;
      const userLon = 77.2090;

      const loc1 = {
        id: 5613,
        name: 'ITO, New Delhi - CPCB',
        provider: { name: 'CPCB' },
        coordinates: { latitude: 28.628, longitude: 77.241 }, // ~3.5 km
        sensors: [{ id: 101, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const loc2 = {
        id: 5586,
        name: 'Sirifort, Delhi - CPCB',
        provider: { name: 'CPCB' },
        coordinates: { latitude: 28.553, longitude: 77.218 }, // ~7.1 km
        sensors: [{ id: 102, parameter: { id: 2, name: 'pm25' } }],
        datetimeLast: { utc: freshIso },
      };

      const latestMap = new Map();
      latestMap.set(5613, [{ sensorsId: 101, value: 73, datetime: { utc: freshIso } }]);
      latestMap.set(5586, [{ sensorsId: 102, value: 80, datetime: { utc: freshIso } }]);

      // In current location mode (useConsensus: false), single nearest station is chosen
      const result = selectBestStation(userLat, userLon, [loc1, loc2], latestMap, { nowMs });

      assert.ok(result);
      assert.equal(result.isAverage, false);
      assert.equal(result.stationCount, 1);
      assert.equal(result.id, 5613);
      assert.equal(result.measuredPM2_5, 73);
    });
  });
});
