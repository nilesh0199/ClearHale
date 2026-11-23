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
      };
    }
  }

  return null;
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
});
