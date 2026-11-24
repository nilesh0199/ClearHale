import { NextRequest, NextResponse } from 'next/server';
import { getNearestOpenAQStation } from '@/lib/openaq';
import { calculateAQIFromPM25 } from '@/lib/aqi';
import { AirData, HourlyReading } from '@/types';

export const runtime = 'nodejs';

function getTargetISOHour(now: Date, timeZone?: string, utcOffsetSeconds?: number): string {
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
    } catch {
      // Fall through
    }
  }

  if (typeof utcOffsetSeconds === 'number') {
    const targetMs = now.getTime() + utcOffsetSeconds * 1000;
    const targetDate = new Date(targetMs);
    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    const h = String(targetDate.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}`;
  }

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}`;
}

function selectBestHourIndex(readings: { hour: string; pm2_5: number }[]): number {
  let minPM = Infinity;
  let bestIdx = -1;
  let todayBestIdx = -1;
  let todayMinPM = Infinity;

  const currentHourNum = parseInt(readings[0]?.hour?.split(':')[0] || '12', 10);

  readings.forEach((r, idx) => {
    const hNum = parseInt(r.hour.split(':')[0] || '0', 10);
    const isWaking = hNum >= 7 && hNum < 23; // strictly 7 AM to 11 PM waking hours
    const isToday = idx < Math.max(1, 24 - currentHourNum);

    if (isWaking) {
      if (isToday && r.pm2_5 <= 60 && r.pm2_5 < todayMinPM) {
        todayMinPM = r.pm2_5;
        todayBestIdx = idx;
      }
      if (r.pm2_5 < minPM) {
        minPM = r.pm2_5;
        bestIdx = idx;
      }
    }
  });

  if (todayBestIdx !== -1) return todayBestIdx;
  if (bestIdx !== -1) return bestIdx;

  const firstWaking = readings.findIndex((r) => {
    const h = parseInt(r.hour.split(':')[0] || '0', 10);
    return h >= 7 && h < 23;
  });
  return firstWaking !== -1 ? firstWaking : 0;
}

async function fetchOpenMeteoModel(lat: number, lon: number): Promise<{
  currentPM2_5: number;
  currentPM10: number;
  currentAQI: number;
  hourly24: HourlyReading[];
}> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,us_aqi&timezone=auto&forecast_days=3`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);

  if (!res.ok) throw new Error(`Open-Meteo HTTP error ${res.status}`);

  const data = await res.json();
  if (!data.hourly || !data.hourly.pm2_5 || !data.hourly.time) {
    throw new Error('Incomplete air data received from Open-Meteo');
  }

  const times: string[] = data.hourly.time;
  const pm25s: number[] = data.hourly.pm2_5;
  const pm10s: number[] = data.hourly.pm10 || [];
  const aqiList: number[] = data.hourly.us_aqi || [];

  const now = new Date();
  const targetISOHour = getTargetISOHour(now, data.timezone, data.utc_offset_seconds);

  let currentIndex = times.findIndex((t) => t.startsWith(targetISOHour));
  if (currentIndex === -1) {
    currentIndex = times.findIndex((t) => t >= targetISOHour);
  }
  if (currentIndex === -1) {
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
  const currentAQI = Math.round(aqiList[currentIndex] ?? calculateAQIFromPM25(currentPM2_5));

  const hourly24: HourlyReading[] = [];
  const sliceEnd = Math.min(times.length, currentIndex + 24);
  for (let i = currentIndex; i < sliceEnd; i++) {
    const timeStr = times[i];
    const hourLabel = timeStr.includes('T')
      ? timeStr.split('T')[1].slice(0, 5)
      : `${new Date(timeStr).getHours().toString().padStart(2, '0')}:00`;
    const pm = Math.round(pm25s[i] ?? 0);

    hourly24.push({
      time: timeStr,
      hour: hourLabel,
      pm2_5: pm,
      pm10: Math.round(pm10s[i] ?? Math.round(pm * 1.5)),
      us_aqi: calculateAQIFromPM25(pm),
      isBestHour: false,
    });
  }

  const bestHourIndex = selectBestHourIndex(hourly24);
  if (hourly24[bestHourIndex]) {
    hourly24[bestHourIndex].isBestHour = true;
  }

  return {
    currentPM2_5,
    currentPM10,
    currentAQI,
    hourly24,
  };
}

async function handleAirQualityRequest(lat: number, lon: number): Promise<AirData> {
  // 1. Fetch Open-Meteo model forecast in parallel with OpenAQ
  const [modelResult, openaqResult] = await Promise.allSettled([
    fetchOpenMeteoModel(lat, lon),
    getNearestOpenAQStation(lat, lon),
  ]);

  if (modelResult.status === 'rejected') {
    throw new Error(modelResult.reason?.message || 'Open-Meteo fetch failed');
  }

  const { currentPM2_5: modelPM2_5, currentPM10: modelPM10, currentAQI: modelAQI, hourly24 } =
    modelResult.value;

  const station = openaqResult.status === 'fulfilled' ? openaqResult.value : null;

  if (station) {
    // Measured data available from government station within 25 km
    const measuredPM = station.measuredPM2_5;
    const measuredPM10 = station.measuredPM10 ?? modelPM10;
    const measuredAQI = calculateAQIFromPM25(measuredPM);

    // Calculate percentage difference between measured and forecast model
    const diff = Math.abs(measuredPM - modelPM2_5);
    const diffPercent = modelPM2_5 > 0 ? (diff / modelPM2_5) * 100 : 0;
    const differenceNoted = diffPercent > 40;

    // Atmospheric data assimilation: anchor index 0 ("Now") to ground measurement,
    // and smoothly relax local emission ratio over a 12-hour meteorological horizon.
    // This preserves real physical diurnal peaks (rush hours, sun convection) while eliminating artificial steps.
    const r0_pm25 = Math.min(5.0, Math.max(0.2, measuredPM / Math.max(5, modelPM2_5)));
    const r0_pm10 = Math.min(5.0, Math.max(0.2, measuredPM10 / Math.max(8, modelPM10)));
    const blendHours = 12;

    const harmonizedHourly: HourlyReading[] = hourly24.map((h, idx) => {
      if (idx === 0) {
        return {
          ...h,
          pm2_5: measuredPM,
          pm10: measuredPM10,
          us_aqi: measuredAQI,
          isBestHour: false,
        };
      }
      if (idx < blendHours) {
        // Smooth S-curve (cosine relaxation) from ground anomaly back to regional weather forecast
        const w = 0.5 * (1 + Math.cos((Math.PI * idx) / blendHours));
        const rt_pm25 = 1.0 + (r0_pm25 - 1.0) * w;
        const rt_pm10 = 1.0 + (r0_pm10 - 1.0) * w;
        const blendedPM = Math.max(5, Math.round(h.pm2_5 * rt_pm25));
        const blendedPM10 = Math.max(8, Math.round(h.pm10 * rt_pm10));
        return {
          ...h,
          pm2_5: blendedPM,
          pm10: blendedPM10,
          us_aqi: calculateAQIFromPM25(blendedPM),
          isBestHour: false,
        };
      }
      return {
        ...h,
        us_aqi: calculateAQIFromPM25(h.pm2_5),
        isBestHour: false,
      };
    });

    // Recompute best hour strictly within waking hours on the harmonized curve
    const bestIdx = selectBestHourIndex(harmonizedHourly);
    if (harmonizedHourly[bestIdx]) {
      harmonizedHourly[bestIdx].isBestHour = true;
    }

    return {
      current: {
        pm2_5: measuredPM,
        pm10: measuredPM10,
        us_aqi: measuredAQI,
        time: 'Live',
        isForecast: false,
      },
      hourly: harmonizedHourly,
      source: `Measured at ${station.name}, ${station.distanceKm} km away`,
      updatedAt: Date.now(),
      isCached: false,
      isDemo: false,
      dataType: 'measured',
      station: {
        ...station,
        modelPM2_5,
        differencePercent: Math.round(diffPercent),
        differenceNoted,
      },
      modelPM2_5,
    };
  }

  // Fallback to forecast model estimate
  return {
    current: {
      pm2_5: modelPM2_5,
      pm10: modelPM10,
      us_aqi: modelAQI,
      time: 'Live',
      isForecast: true,
    },
    hourly: hourly24,
    source: 'Forecast estimate, Open-Meteo',
    updatedAt: Date.now(),
    isCached: false,
    isDemo: false,
    dataType: 'estimate',
    station: null,
    emptyReason: 'No station within 25 km, showing a forecast estimate',
    modelPM2_5,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: 'lat and lon query parameters required' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinate bounds' }, { status: 400 });
    }

    const airData = await handleAirQualityRequest(lat, lon);
    return NextResponse.json(airData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch combined air quality data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = parseFloat(body.lat);
    const lon = parseFloat(body.lon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinate bounds' }, { status: 400 });
    }

    const airData = await handleAirQualityRequest(lat, lon);
    return NextResponse.json(airData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch combined air quality data' },
      { status: 500 }
    );
  }
}
