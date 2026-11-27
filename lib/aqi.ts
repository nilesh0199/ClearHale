import type { AQIBandInfo, AQIBandKey } from '../types';
import { outdoorGuidance } from './outdoorGuidance';

export const AQI_BANDS: Record<AQIBandKey, AQIBandInfo> = {
  good: {
    key: 'good',
    label: 'Good',
    minPM: 0,
    maxPM: 30,
    color: 'text-[var(--aqi-good)]',
    bgColor: 'bg-[var(--aqi-good-bg)] text-[var(--aqi-good-text)] border-[var(--aqi-good-border)]',
    borderColor: 'border-[var(--aqi-good)]',
    ringHex: 'var(--aqi-good)',
    statusLine: 'Air quality is clean and safe. Normal outdoor activities welcome.',
    advice: 'Air is clean and fresh. Open windows to refresh your home.',
  },
  satisfactory: {
    key: 'satisfactory',
    label: 'Satisfactory',
    minPM: 31,
    maxPM: 60,
    color: 'text-[var(--aqi-sat)]',
    bgColor: 'bg-[var(--aqi-sat-bg)] text-[var(--aqi-sat-text)] border-[var(--aqi-sat-border)]',
    borderColor: 'border-[var(--aqi-sat)]',
    ringHex: 'var(--aqi-sat)',
    statusLine: 'Air quality is acceptable. Normal outdoor activities are safe.',
    advice: 'Good conditions for outdoor travel. Normal routines are safe.',
  },
  moderate: {
    key: 'moderate',
    label: 'Moderate',
    minPM: 61,
    maxPM: 90,
    color: 'text-[var(--aqi-mod)]',
    bgColor: 'bg-[var(--aqi-mod-bg)] text-[var(--aqi-mod-text)] border-[var(--aqi-mod-border)]',
    borderColor: 'border-[var(--aqi-mod)]',
    ringHex: 'var(--aqi-mod)',
    statusLine: 'Air has noticeable dust and smoke. Sensitive groups should keep outdoor time light.',
    advice: 'Air has noticeable dust and smoke. Avoid long or hard outdoor exercise.',
  },
  poor: {
    key: 'poor',
    label: 'Poor',
    minPM: 91,
    maxPM: 120,
    color: 'text-[var(--aqi-poor)]',
    bgColor: 'bg-[var(--aqi-poor-bg)] text-[var(--aqi-poor-text)] border-[var(--aqi-poor-border)]',
    borderColor: 'border-[var(--aqi-poor)]',
    ringHex: 'var(--aqi-poor)',
    statusLine: 'Smog is unhealthy today. Avoid outdoor exercise and move workouts indoors.',
    advice: 'Smog is unhealthy today. Avoid outdoor exercise and keep doors and windows shut.',
  },
  very_poor: {
    key: 'very_poor',
    label: 'Very Poor',
    minPM: 121,
    maxPM: 250,
    color: 'text-[var(--aqi-verypoor)]',
    bgColor: 'bg-[var(--aqi-verypoor-bg)] text-[var(--aqi-verypoor-text)] border-[var(--aqi-verypoor-border)]',
    borderColor: 'border-[var(--aqi-verypoor)]',
    ringHex: 'var(--aqi-verypoor)',
    statusLine: 'Heavy smog outside. Stay indoors and use a fitted N95 mask for essential trips.',
    advice: 'Heavy smog outside. Keep windows shut and run indoor air cleaning.',
  },
  severe: {
    key: 'severe',
    label: 'Severe',
    minPM: 251,
    maxPM: 1000,
    color: 'text-[var(--aqi-severe)]',
    bgColor: 'bg-[var(--aqi-severe-bg)] text-[var(--aqi-severe-text)] border-[var(--aqi-severe-border)]',
    borderColor: 'border-[var(--aqi-severe)]',
    ringHex: 'var(--aqi-severe)',
    statusLine: 'Severe toxic smog. Stay strictly indoors and use a fitted N95 for essential trips.',
    advice: 'Severe toxic smog. Stay strictly inside and run indoor air cleaning continuously.',
  },
};

/**
 * Computes official CPCB Indian National Air Quality Index (NAQI) for PM2.5 (24-hr)
 * Breakpoints (µg/m³ -> AQI):
 *  0 - 30    -> 0 - 50 (Good)
 *  31 - 60   -> 51 - 100 (Satisfactory)
 *  61 - 90   -> 101 - 200 (Moderate)
 *  91 - 120  -> 201 - 300 (Poor)
 *  121 - 250 -> 301 - 400 (Very Poor)
 *  251+      -> 401 - 500 (Severe)
 */
export function calculateAQIFromPM25(pm2_5: number): number {
  const pm = Math.max(0, Math.round(pm2_5));
  if (pm <= 30) {
    return Math.round((50 / 30) * pm);
  } else if (pm <= 60) {
    return Math.round(51 + ((100 - 51) / (60 - 30)) * (pm - 30));
  } else if (pm <= 90) {
    return Math.round(101 + ((200 - 101) / (90 - 60)) * (pm - 60));
  } else if (pm <= 120) {
    return Math.round(201 + ((300 - 201) / (120 - 90)) * (pm - 90));
  } else if (pm <= 250) {
    return Math.round(301 + ((400 - 301) / (250 - 120)) * (pm - 120));
  } else {
    return Math.min(500, Math.round(401 + ((500 - 401) / (380 - 250)) * (pm - 250)));
  }
}

export const BAND_LABELS_BY_LANG: Record<string, Record<AQIBandKey, string>> = {
  mr: {
    good: 'छान (Good)',
    satisfactory: 'समाधानकारक (Satisfactory)',
    moderate: 'मध्यम (Moderate)',
    poor: 'खराब (Poor)',
    very_poor: 'अत्यंत खराब (Very Poor)',
    severe: 'गंभीर (Severe)',
  },
  hi: {
    good: 'अच्छा (Good)',
    satisfactory: 'संतोषजनक (Satisfactory)',
    moderate: 'मध्यम (Moderate)',
    poor: 'खराब (Poor)',
    very_poor: 'बहुत खराब (Very Poor)',
    severe: 'गंभीर (Severe)',
  },
  bn: {
    good: 'ভালো (Good)',
    satisfactory: 'সন্তোষজনক (Satisfactory)',
    moderate: 'মাঝারি (Moderate)',
    poor: 'খারাপ (Poor)',
    very_poor: 'খুব খারাপ (Very Poor)',
    severe: 'মারাত্মক (Severe)',
  },
  ta: {
    good: 'நல்லது (Good)',
    satisfactory: 'திருப்திகரமானது (Satisfactory)',
    moderate: 'மிதமானது (Moderate)',
    poor: 'மோசமானது (Poor)',
    very_poor: 'மிக மோசமானது (Very Poor)',
    severe: 'கடுமையானது (Severe)',
  },
  te: {
    good: 'మంచిది (Good)',
    satisfactory: 'సంతృప్తికరం (Satisfactory)',
    moderate: 'మితమైనది (Moderate)',
    poor: 'చెడు (Poor)',
    very_poor: 'చాలా చెడు (Very Poor)',
    severe: 'తీవ్రమైనది (Severe)',
  },
  kn: {
    good: 'ಉತ್ತಮ (Good)',
    satisfactory: 'ತೃಪ್ತಿಕರ (Satisfactory)',
    moderate: 'ಮಧ್ಯಮ (Moderate)',
    poor: 'ಕಳಪೆ (Poor)',
    very_poor: 'ಬಹಳ ಕಳಪೆ (Very Poor)',
    severe: 'ಗಂಭೀರ (Severe)',
  },
  ml: {
    good: 'നല്ലത് (Good)',
    satisfactory: 'തൃപ്തികരം (Satisfactory)',
    moderate: 'മിതമായത് (Moderate)',
    poor: 'മോശം (Poor)',
    very_poor: 'വളരെ മോശം (Very Poor)',
    severe: 'ഗുരുതരം (Severe)',
  },
  gu: {
    good: 'સારું (Good)',
    satisfactory: 'સંતોષકારક (Satisfactory)',
    moderate: 'મધ્યમ (Moderate)',
    poor: 'ખરાબ (Poor)',
    very_poor: 'ખૂબ ખરાબ (Very Poor)',
    severe: 'ગંભીર (Severe)',
  },
  pa: {
    good: 'ਵਧੀਆ (Good)',
    satisfactory: 'ਸੰਤੋਖਜਨਕ (Satisfactory)',
    moderate: 'ਦਰਮਿਆਨੀ (Moderate)',
    poor: 'ਖ਼ਰਾਬ (Poor)',
    very_poor: 'ਬਹੁਤ ਖ਼ਰਾਬ (Very Poor)',
    severe: 'ਗੰਭੀਰ (Severe)',
  },
  or: {
    good: 'ଭଲ (Good)',
    satisfactory: 'ସନ୍ତୋଷଜନକ (Satisfactory)',
    moderate: 'ମଧ୍ୟମ (Moderate)',
    poor: 'ଖରାପ (Poor)',
    very_poor: 'ଅତି ଖରାପ (Very Poor)',
    severe: 'ଗମ୍ଭୀର (Severe)',
  },
};

export function getAQIBand(pm2_5: number, lang: string = 'en'): AQIBandInfo {
  const safePM = Math.max(0, Math.round(pm2_5));

  let key: AQIBandKey = 'good';
  if (safePM <= 30) key = 'good';
  else if (safePM <= 60) key = 'satisfactory';
  else if (safePM <= 90) key = 'moderate';
  else if (safePM <= 120) key = 'poor';
  else if (safePM <= 250) key = 'very_poor';
  else key = 'severe';

  const band = AQI_BANDS[key];
  const guidance = outdoorGuidance(key, null, 'whole_family', undefined, lang);

  const statusLine = lang === 'en' ? guidance.statusLine : guidance.statusLineNative;
  const advice = lang === 'en' ? guidance.guidance : guidance.guidanceNative;

  const langKey = (lang || 'en').toLowerCase();
  const langMap = BAND_LABELS_BY_LANG[langKey] || (langKey !== 'en' ? BAND_LABELS_BY_LANG.hi : null);

  if (langMap) {
    return {
      ...band,
      label: langMap[key],
      statusLine,
      advice,
    };
  }

  return {
    ...band,
    statusLine,
    advice,
  };
}
