import type { AirData, CityLocation, HourlyReading } from '../types';
import { generateDemoAirData } from './demoData';
import { searchLocalCities } from './citiesData';

const CACHE_KEY = 'clearhale_last_reading_cache';
const LEGACY_CACHE_KEY = 'vayu_last_reading_cache';

function getTargetISOHour(now: Date, timeZone?: string, utcOffsetSeconds?: number): string {
  // 1. Try Intl.DateTimeFormat with target timezone
  if (timeZone && timeZone !== 'auto') {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      let h = parts.find((p) => p.type === 'hour')?.value;
      if (h === '24') h = '00';
      if (y && m && d && h !== undefined) {
        return `${y}-${m}-${d}T${h}`;
      }
    } catch (e) {
      // Fall through to offset or local time
    }
  }

  // 2. If utcOffsetSeconds is provided, calculate target date
  if (typeof utcOffsetSeconds === 'number') {
    const targetMs = now.getTime() + utcOffsetSeconds * 1000;
    const targetDate = new Date(targetMs);
    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    const h = String(targetDate.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}`;
  }

  // 3. Fallback to client's local time
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}`;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Immediately match against our offline-first catalog of 250+ Indian districts & global cities
  const localHits = searchLocalCities(trimmed, 15);

  // 2. Concurrently query remote geocoding with a 2-second timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=12&language=en&format=json`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const remoteHits: CityLocation[] = data.results.map((item: any) => ({
          name: item.name,
          lat: item.latitude,
          lon: item.longitude,
          admin: item.admin1 || item.admin2 || '',
          country: item.country || '',
        }));

        // Merge: avoid duplicates by matching name and country
        const seen = new Set(localHits.map((c) => `${c.name.toLowerCase()}|${(c.country || '').toLowerCase()}`));
        const merged = [...localHits];

        for (const rh of remoteHits) {
          const key = `${rh.name.toLowerCase()}|${(rh.country || '').toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(rh);
          }
        }

        // Sort: Indian locations first, followed by international
        merged.sort((a, b) => {
          const aIsIndia = (a.country || '').toLowerCase() === 'india' ? 1 : 0;
          const bIsIndia = (b.country || '').toLowerCase() === 'india' ? 1 : 0;
          return bIsIndia - aIsIndia;
        });

        return merged.slice(0, 15);
      }
    }
  } catch (err) {
    // Network failure / timeout - gracefully rely on comprehensive local catalog
    console.warn('Remote geocoding unavailable or timed out, using local catalog:', err);
  }

  return localHits;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirData> {
  // 1. Try server-side integrated route (OpenAQ live measurements + Open-Meteo forecast)
  if (typeof window !== 'undefined') {
    try {
      const serverUrl = `/api/air-quality?lat=${lat}&lon=${lon}`;
      const ctrl = new AbortController();
      const serverTimer = setTimeout(() => ctrl.abort(), 7000);

      const serverRes = await fetch(serverUrl, { signal: ctrl.signal });
      clearTimeout(serverTimer);

      if (serverRes.ok) {
        const liveCombined: AirData = await serverRes.json();
        if (liveCombined && liveCombined.current && Array.isArray(liveCombined.hourly)) {
          // Cache in client localStorage
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(liveCombined));
          } catch {}
          return liveCombined;
        }
      }
    } catch {
      // Fall through to direct client Open-Meteo fetch
    }
  }

  // 2. Direct Open-Meteo client fallback
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,us_aqi&timezone=auto&forecast_days=3`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Air Quality HTTP error ${res.status}`);

    const data = await res.json();
    if (!data.hourly || !data.hourly.pm2_5 || !data.hourly.time) {
      throw new Error('Incomplete hourly air data received from Open-Meteo');
    }

    const times: string[] = data.hourly.time;
    const pm25s: number[] = data.hourly.pm2_5;
    const pm10s: number[] = data.hourly.pm10 || [];
    const aqiList: number[] = data.hourly.us_aqi || [];

    // Match current hour in location's local timezone (NOT UTC)
    const now = new Date();
    const targetISOHour = getTargetISOHour(now, data.timezone, data.utc_offset_seconds);
    
    let currentIndex = times.findIndex((t) => t.startsWith(targetISOHour));
    if (currentIndex === -1) {
      // Find first upcoming slot >= targetISOHour
      currentIndex = times.findIndex((t) => t >= targetISOHour);
    }
    if (currentIndex === -1) {
      // Fallback: closest by timestamp
      const nowEpoch = now.getTime();
      let minDiff = Infinity;
      times.forEach((t, idx) => {
        const diff = Math.abs(new Date(t).getTime() - nowEpoch);
        if (diff < minDiff) {
          minDiff = diff;
          currentIndex = idx;
        }
      });
    }

    if (currentIndex === -1) currentIndex = 0;

    const currentPM2_5 = Math.round(pm25s[currentIndex] ?? 0);
    const currentPM10 = Math.round(pm10s[currentIndex] ?? Math.round(currentPM2_5 * 1.5));
    const currentAQI = Math.round(aqiList[currentIndex] ?? Math.round(currentPM2_5 * 1.2));

    // Next 24 hours starting from current local hour
    const hourly24: HourlyReading[] = [];
    const sliceEnd = Math.min(times.length, currentIndex + 24);
    let minPM = Infinity;
    let bestIdx = -1;

    // Pick best hour strictly from upcoming waking hours (7 AM to 11 PM) - exclude sleep hours (11 PM to 7 AM)
    // If today still has upcoming waking hours with clean air (<=60), prioritize today so users can act today
    let todayBestIdx = -1;
    let todayMinPM = Infinity;
    const currentDay = times[currentIndex]?.includes('T')
      ? new Date(times[currentIndex]).getDate()
      : -1;

    for (let i = currentIndex; i < sliceEnd; i++) {
      const timeStr = times[i];
      const hNum = timeStr.includes('T')
        ? parseInt(timeStr.split('T')[1].slice(0, 2), 10)
        : new Date(timeStr).getHours();

      const isWaking = hNum >= 7 && hNum < 23;
      const isToday =
        currentDay !== -1 && timeStr.includes('T')
          ? new Date(timeStr).getDate() === currentDay
          : (i - currentIndex) < (24 - (times[currentIndex]?.includes('T') ? parseInt(times[currentIndex].split('T')[1].slice(0, 2), 10) : new Date().getHours()));

      if (isWaking) {
        const pm = Math.round(pm25s[i] ?? 0);
        if (isToday && pm <= 60 && pm < todayMinPM) {
          todayMinPM = pm;
          todayBestIdx = i - currentIndex;
        }
        if (pm < minPM) {
          minPM = pm;
          bestIdx = i - currentIndex;
        }
      }
    }

    if (todayBestIdx !== -1) {
      bestIdx = todayBestIdx;
    }

    // Fallback if no waking hours in slice
    if (bestIdx === -1) {
      minPM = Infinity;
      bestIdx = 0;
      for (let i = currentIndex; i < sliceEnd; i++) {
        const pm = Math.round(pm25s[i] ?? 0);
        if (pm < minPM) {
          minPM = pm;
          bestIdx = i - currentIndex;
        }
      }
    }

    for (let i = currentIndex; i < sliceEnd; i++) {
      const timeStr = times[i];
      // Open-Meteo returns "YYYY-MM-DDTHH:MM" in local time. Extract "HH:MM" directly.
      const hourLabel = timeStr.includes('T')
        ? timeStr.split('T')[1].slice(0, 5)
        : `${new Date(timeStr).getHours().toString().padStart(2, '0')}:00`;
      const pm = Math.round(pm25s[i] ?? 0);

      hourly24.push({
        time: timeStr,
        hour: hourLabel,
        pm2_5: pm,
        pm10: Math.round(pm10s[i] ?? Math.round(pm * 1.5)),
        us_aqi: Math.round(aqiList[i] ?? Math.round(pm * 1.2)),
        isBestHour: (i - currentIndex) === bestIdx,
      });
    }

    const airData: AirData = {
      current: {
        pm2_5: currentPM2_5,
        pm10: currentPM10,
        us_aqi: currentAQI,
        time: 'Live',
        isForecast: true,
      },
      hourly: hourly24,
      source: 'Open-Meteo Air Quality Model',
      updatedAt: Date.now(),
      isCached: false,
      isDemo: false,
    };

    // Save to localStorage cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(airData));
      } catch (e) {
        // storage quota ignored
      }
    }

    return airData;
  } catch (err) {
    console.warn('Air Quality fetch failed, attempting cached reading:', err);
    
    // Check localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY) || localStorage.getItem(LEGACY_CACHE_KEY);
        if (cached) {
          const parsed: AirData = JSON.parse(cached);
          const isFresh = Date.now() - (parsed.updatedAt || 0) < 60 * 60 * 1000;
          if (isFresh && parsed.hourly && parsed.hourly.length > 0) {
            parsed.isCached = true;
            return parsed;
          }
        }
      } catch (e) {
        // ignore JSON parse fail
      }
    }

    // Fall back to stored demo reading
    return generateDemoAirData();
  }
}
