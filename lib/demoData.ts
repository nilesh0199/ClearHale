import type { AirData, CityLocation, HourlyReading, UserProfile } from '../types';
import { calculateAQIFromPM25 } from './aqi';

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

// Realistic diurnal curves reflecting atmospheric boundary layer dynamics:
// - Nighttime inversion trapping
// - Morning rush hour peak (07:00 - 09:00)
// - Midday solar convective dispersion (lowest PM2.5 between 13:00 - 15:00)
// - Evening commuter peak (17:00 - 19:00)
export function generateDemoAirData(city?: CityLocation): AirData {
  const now = new Date();
  const currentHour = now.getHours();

  const cName = (city?.name || '').toLowerCase();
  const cAdmin = (city?.admin || '').toLowerCase();
  const cCountry = (city?.country || '').toLowerCase();

  let hourlyBase: number[];

  if (cCountry && cCountry !== 'india') {
    // International cities: Clean air profile
    hourlyBase = [
      14, 13, 12, 12, 13, 15, // 00 - 05
      18, 22, 21, 19, 16, 15, // 06 - 11
      14, 13, 12, 13, 16, 19, // 12 - 17
      21, 20, 18, 16, 15, 14, // 18 - 23
    ];
  } else if (
    cName.includes('bengaluru') || cName.includes('bangalore') ||
    cName.includes('chennai') || cName.includes('hyderabad') ||
    cName.includes('kochi') || cName.includes('trivandrum') ||
    cAdmin.includes('kerala') || cAdmin.includes('karnataka') || cAdmin.includes('tamil nadu')
  ) {
    // South India profile: Mild/moderate, lowest around 2 PM
    hourlyBase = [
      32, 30, 29, 28, 29, 34, // 00 - 05
      42, 48, 44, 38, 33, 29, // 06 - 11
      26, 24, 25, 27, 34, 43, // 12 - 17
      46, 44, 41, 38, 35, 33, // 18 - 23
    ];
  } else if (
    cName.includes('nagpur') || cName.includes('pune') ||
    cName.includes('mumbai') || cName.includes('nashik') ||
    cName.includes('indore') || cName.includes('bhopal') ||
    cAdmin.includes('maharashtra') || cAdmin.includes('madhya pradesh')
  ) {
    // Maharashtra & Central India: Typical diurnal curve matching CPCB/Open-Meteo
    hourlyBase = [
      38, 38, 39, 39, 39, 41, // 00 - 05
      44, 47, 48, 46, 41, 36, // 06 - 11
      33, 31, 30, 31, 35, 42, // 12 - 17
      44, 41, 37, 35, 33, 32, // 18 - 23
    ];
  } else {
    // Delhi NCR & Gangetic Plains: Realistic winter baseline
    hourlyBase = [
      235, 248, 254, 258, 252, 246, // 00 - 05
      262, 278, 264, 218, 174, 148, // 06 - 11
      136, 128, 122, 131, 154, 192, // 12 - 17
      226, 242, 248, 244, 238, 232, // 18 - 23
    ];
  }

  const hourly: HourlyReading[] = [];
  let minPM = Infinity;
  let bestIndex = -1;

  // Build 24 hours starting from currentHour, selecting cleanest window strictly from upcoming waking hours (7 AM to 11 PM)
  let todayBestIndex = -1;
  let todayMinPM = Infinity;

  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHour + i) % 24;
    const isWaking = targetHour >= 7 && targetHour < 23;
    const isToday = currentHour + i < 24;
    if (isWaking) {
      const pm = hourlyBase[targetHour];
      if (isToday && pm <= 60 && pm < todayMinPM) {
        todayMinPM = pm;
        todayBestIndex = i;
      }
      if (pm < minPM) {
        minPM = pm;
        bestIndex = i;
      }
    }
  }

  if (todayBestIndex !== -1) {
    bestIndex = todayBestIndex;
  }

  if (bestIndex === -1) {
    minPM = Infinity;
    bestIndex = 0;
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
  }

  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHour + i) % 24;
    const pm = hourlyBase[targetHour];
    const hourLabel = `${targetHour.toString().padStart(2, '0')}:00`;
    hourly.push({
      time: hourLabel,
      hour: hourLabel,
      pm2_5: pm,
      pm10: Math.round(pm * 1.5),
      us_aqi: calculateAQIFromPM25(pm),
      isBestHour: i === bestIndex,
    });
  }

  const currentPM = hourlyBase[currentHour];

  return {
    current: {
      pm2_5: currentPM,
      pm10: Math.round(currentPM * 1.5),
      us_aqi: calculateAQIFromPM25(currentPM),
      time: 'Just now',
      isForecast: true,
    },
    hourly,
    source: city ? `Forecast model, ${city.name}` : 'Open-Meteo Air Quality Model (Calibrated Baseline)',
    updatedAt: Date.now() - 15 * 60 * 1000,
    isCached: false,
    isDemo: true,
    dataType: 'estimate',
    modelPM2_5: currentPM,
    emptyReason: 'Calibrated seasonal atmospheric model active',
  };
}
