import type { AirData, HourlyReading, UserProfile } from '../types';

export const DEMO_LOCATION = {
  name: 'Delhi, India',
  lat: 28.6139,
  lon: 77.2090,
  admin: 'Delhi',
  country: 'India',
};

export const DEMO_PROFILE: UserProfile = {
  city: DEMO_LOCATION,
  language: 'en',
  household: {
    members: ['child', 'elderly'],
    cookingFuel: 'lpg',
    commute: ['two_wheeler', 'bus_metro'],
    work: 'indoor',
    budget: 'low_cost',
  },
  activeFamilyFilter: 'whole_family',
  checkedActions: ['windows_doors_closed'],
  onboardingCompleted: true,
  reduceEffects: false,
};

// Realistic Delhi winter smog 24-hour cycle:
// Severe cold air smoke trap overnight and early morning (220-290 PM2.5),
// afternoon sun warming (110-140 PM2.5) as the best window,
// rising again in evening peak traffic and cold air trapping (240-280 PM2.5).
export function generateDemoAirData(): AirData {
  const now = new Date();
  const currentHour = now.getHours();

  const hourlyBase = [
    260, 275, 285, 290, 280, 265, // 00 - 05 (severe cold night smoke trap)
    285, 295, 270, 230, 185, 150, // 06 - 11 (morning rush + early heating)
    130, 120, 115, 125, 145, 180, // 12 - 17 (afternoon sun spreads smoke out)
    215, 245, 260, 255, 250, 255, // 18 - 23 (evening traffic + cold air returns)
  ];

  const hourly: HourlyReading[] = [];
  let minPM = Infinity;
  let bestIndex = -1;

  // Build 24 hours starting from currentHour, selecting cleanest window strictly from waking hours (7 AM to 11 PM)
  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHour + i) % 24;
    const isWaking = targetHour >= 7 && targetHour < 23;
    if (isWaking) {
      const pm = hourlyBase[targetHour];
      if (pm < minPM) {
        minPM = pm;
        bestIndex = i;
      }
    }
  }

  if (bestIndex === -1) {
    minPM = Infinity;
    bestIndex = 0;
    for (let i = 0; i < 24; i++) {
      const targetHour = (currentHour + i) % 24;
      const pm = hourlyBase[targetHour];
      if (pm < minPM) {
        minPM = pm;
        bestIndex = i;
      }
    }
  }

  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHour + i) % 24;
    const pm = hourlyBase[targetHour];
    const hourLabel = `${targetHour.toString().padStart(2, '0')}:00`;
    hourly.push({
      time: hourLabel,
      hour: hourLabel,
      pm2_5: pm,
      pm10: Math.round(pm * 1.65),
      us_aqi: Math.min(500, Math.round(pm * 1.25)),
      isBestHour: i === bestIndex,
    });
  }

  const currentPM = hourlyBase[currentHour];

  return {
    current: {
      pm2_5: currentPM,
      pm10: Math.round(currentPM * 1.65),
      us_aqi: Math.min(500, Math.round(currentPM * 1.25)),
      time: 'Just now',
      isForecast: true,
    },
    hourly,
    source: 'Open-Meteo Air Quality Model (Stored Baseline)',
    updatedAt: Date.now() - 15 * 60 * 1000, // 15 mins ago
    isCached: false,
    isDemo: true,
    dataType: 'estimate',
    modelPM2_5: currentPM,
    emptyReason: 'Demo mode stored baseline active',
  };
}
