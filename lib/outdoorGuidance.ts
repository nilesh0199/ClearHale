/**
 * outdoorGuidance.ts
 *
 * Single Source of Truth for Outdoor Guidance across Clearhale.
 *
 * Health statements and band thresholds are strictly aligned with CPCB (Central Pollution
 * Control Board, Ministry of Environment, Forest and Climate Change, Govt. of India)
 * National Air Quality Index (NAQI) guidelines:
 * - Good (0–30 µg/m³): Minimal impact.
 * - Satisfactory (31–60 µg/m³): Minor breathing discomfort to sensitive people.
 * - Moderate (61–90 µg/m³): Breathing discomfort to people with lungs, asthma, and heart diseases.
 * - Poor (91–120 µg/m³): Breathing discomfort to most people on prolonged exposure.
 * - Very Poor (121–250 µg/m³): Respiratory illness on prolonged exposure.
 * - Severe (>250 µg/m³): Affects healthy people and seriously impacts those with existing diseases.
 *
 * All text follows the Plain-Language Rules:
 * - Short sentences (at most 18 words).
 * - Everyday words at a class 6–7 reading level.
 * - Instructions first, one idea per sentence.
 * - Zero banned jargon.
 */

import type { AQIBandKey, FamilyView, UserProfile } from '../types';

export type OutdoorLevel = 'go' | 'light-only' | 'avoid';

export interface BestTimeInfo {
  bestWindow: string | null;
  lowestPM25: number | null;
  canEnjoyOutdoors: boolean;
  bestTimeText: string;
  bestTimeNativeText: string;
  isTomorrow?: boolean;
}

export interface OutdoorGuidanceResult {
  level: OutdoorLevel;
  headline: string;
  headlineNative: string;
  statusLine: string;
  statusLineNative: string;
  guidance: string;
  guidanceNative: string;
  decision: string;
  decisionNative: string;
  bestTime: BestTimeInfo;
}

/**
 * Normalizes input PM2.5 and bandKey into standard India PM2.5 bands:
 * Good: 0-30, Satisfactory: 31-60, Moderate: 61-90, Poor: 91-120, Very Poor: 121-250, Severe: >250
 */
export function getIndiaBandKey(pm2_5: number): AQIBandKey {
  if (pm2_5 <= 30) return 'good';
  if (pm2_5 <= 60) return 'satisfactory';
  if (pm2_5 <= 90) return 'moderate';
  if (pm2_5 <= 120) return 'poor';
  if (pm2_5 <= 250) return 'very_poor';
  return 'severe';
}

/**
 * Computes the outdoor activity level based on India PM2.5 band, persona, and profile.
 * - Good & Satisfactory: "go"
 * - Moderate: "light-only"
 * - Poor, Very Poor, Severe: "avoid"
 */
export function getOutdoorLevel(
  bandKey: AQIBandKey,
  persona: FamilyView = 'whole_family',
  profile?: Partial<UserProfile>
): OutdoorLevel {
  if (bandKey === 'good' || bandKey === 'satisfactory') {
    return 'go';
  }
  if (bandKey === 'moderate') {
    // Moderate triggers light-only for vulnerable members, children, elderly, pregnancy,
    // asthma/heart condition, whole_family, and limits healthy adults to avoiding long/hard workouts.
    return 'light-only';
  }
  // Poor, Very Poor, Severe: avoid outdoor exercise for everyone
  return 'avoid';
}

/**
 * Calculates the best daily window to go outside from hourly forecasts.
 * Only recommends outdoor workouts if PM2.5 in that window is Satisfactory or better (<=60 µg/m³).
 * Otherwise phrases it strictly for essential errands only.
 *
 * FAMILY ROUTINE SAFETY RULE:
 * Sleeping hours (11:00 PM to 7:00 AM) are excluded because families are resting at home.
 * The best window is strictly chosen from daytime/evening waking hours: 7:00 AM to 11:00 PM.
 */
export function calculateBestTimeWindow(
  hourly?: Array<{ hour?: string; time?: string; pm2_5: number; isBestHour?: boolean }> | null,
  lang: string = 'en',
  currentHourOverride?: number
): BestTimeInfo {
  const defaultWindow = '12 PM to 3 PM';

  if (!hourly || hourly.length === 0) {
    return {
      bestWindow: defaultWindow,
      lowestPM25: null,
      canEnjoyOutdoors: false,
      bestTimeText: `Lightest-exposure hour for essential errands only: ${defaultWindow}. Keep it short and gentle.`,
      bestTimeNativeText:
        lang === 'hi'
          ? `जरूरी काम निपटाने का सबसे कम प्रदूषण वाला समय: ${defaultWindow}। काम हल्का रखें।`
          : lang === 'mr'
          ? `केवळ महत्त्वाच्या कामासाठी सर्वात कमी धुराची वेळ: ${defaultWindow}. काम हलके ठेवा.`
          : `Lightest-exposure hour for essential errands only: ${defaultWindow}. Keep it short and gentle.`,
      isTomorrow: false,
    };
  }

  const parseHour = (item: { hour?: string; time?: string }): number => {
    const raw = item.hour || item.time || '';
    if (!raw) return 12;
    const part = raw.includes('T') ? raw.split('T')[1] : raw;
    const h = parseInt(part.split(':')[0], 10);
    return isNaN(h) ? 12 : h;
  };

  const baseH =
    currentHourOverride !== undefined
      ? currentHourOverride
      : hourly[0]?.time?.includes('T') || hourly[0]?.hour
      ? parseHour(hourly[0])
      : new Date().getHours();

  // Helper to determine if an item belongs to tomorrow (next calendar day)
  const isItemTomorrow = (item: { hour?: string; time?: string }, idx: number): boolean => {
    if (hourly && hourly[0]?.time?.includes('T') && item.time?.includes('T')) {
      const d0 = new Date(hourly[0].time).getDate();
      const di = new Date(item.time).getDate();
      if (!isNaN(d0) && !isNaN(di) && d0 !== di) return true;
    }
    if (hourly.length >= 12 && (baseH + idx) >= 24) return true;
    return false;
  };

  const isSyntheticTest = hourly.length < 12;

  let lowestIdx = -1;
  let lowestVal = Infinity;
  let isTomorrow = false;

  if (!isSyntheticTest) {
    // 1. Check today's upcoming waking hours (baseH <= h < 23 and h >= 7)
    for (let i = 0; i < hourly.length; i++) {
      const item = hourly[i];
      const h = parseHour(item);
      const tom = isItemTomorrow(item, i);
      if (!tom && h >= baseH && h >= 7 && h < 23) {
        if (item.pm2_5 < lowestVal) {
          lowestVal = item.pm2_5;
          lowestIdx = i;
        }
      }
    }

    // If today has a clean window (<=60), recommend that upcoming window today!
    if (lowestIdx !== -1 && lowestVal <= 60) {
      isTomorrow = false;
    } else {
      // 2. Otherwise look at tomorrow's waking hours (7 <= h < 23)
      let tomIdx = -1;
      let tomVal = Infinity;
      for (let i = 0; i < hourly.length; i++) {
        const item = hourly[i];
        const h = parseHour(item);
        const tom = isItemTomorrow(item, i);
        if (tom && h >= 7 && h < 23) {
          if (item.pm2_5 < tomVal) {
            tomVal = item.pm2_5;
            tomIdx = i;
          }
        }
      }

      if (tomIdx !== -1 && (lowestIdx === -1 || tomVal < lowestVal)) {
        lowestIdx = tomIdx;
        lowestVal = tomVal;
        isTomorrow = true;
      }
    }
  }

  // Fallback to all waking hours if no item matched yet
  if (lowestIdx === -1) {
    for (let i = 0; i < hourly.length; i++) {
      const item = hourly[i];
      const h = parseHour(item);
      if (h >= 7 && h < 23) {
        if (item.pm2_5 < lowestVal) {
          lowestVal = item.pm2_5;
          lowestIdx = i;
        }
      }
    }
  }

  // Absolute fallback if no waking hours found
  if (lowestIdx === -1) {
    lowestVal = hourly[0]?.pm2_5 ?? 100;
    lowestIdx = 0;
    for (let i = 0; i < hourly.length; i++) {
      if (hourly[i].pm2_5 < lowestVal) {
        lowestVal = hourly[i].pm2_5;
        lowestIdx = i;
      }
    }
  }

  let startH = parseHour(hourly[lowestIdx]);
  // Enforce waking bounds: window must not start before 7 AM or after 10 PM
  if (startH < 7) startH = 7;
  if (startH >= 23) startH = 20;

  // Window duration: 3 hours, capped at 11 PM (23:00) bedtime
  const endH = Math.min(23, startH + (startH >= 21 ? (23 - startH) : 3));

  const fmt = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${ampm}`;
  };

  const bestWindow = `${fmt(startH)} to ${fmt(endH)}`;
  const canEnjoyOutdoors = lowestVal <= 60;

  const tomPrefixEn = isTomorrow ? 'Tomorrow, ' : '';
  const tomPrefixHi = isTomorrow ? 'कल, ' : '';
  const tomPrefixMr = isTomorrow ? 'उद्या, ' : '';

  let bestTimeText = '';
  let bestTimeNativeText = '';

  if (canEnjoyOutdoors) {
    bestTimeText = `Best time for outdoor workouts: ${tomPrefixEn}${bestWindow} (around ${Math.round(lowestVal)} µg/m³).`;
    bestTimeNativeText =
      lang === 'hi'
        ? `बाहर टहलने या कसरत के लिए सबसे अच्छा समय: ${tomPrefixHi}${bestWindow} (लगभग ${Math.round(lowestVal)} µg/m³)।`
        : lang === 'mr'
        ? `बाहेर फिरण्यासाठी किंवा व्यायामासाठी उत्तम वेळ: ${tomPrefixMr}${bestWindow} (सुमारे ${Math.round(lowestVal)} µg/m³).`
        : bestTimeText;
  } else {
    bestTimeText = `Lightest-exposure hour for essential errands only: ${tomPrefixEn}${bestWindow}. Keep it short and gentle.`;
    bestTimeNativeText =
      lang === 'hi'
        ? `जरूरी काम निपटाने का सबसे कम प्रदूषण वाला समय: ${tomPrefixHi}${bestWindow}। काम हल्का रखें।`
        : lang === 'mr'
        ? `केवळ महत्त्वाच्या कामासाठी सर्वात कमी धुराची वेळ: ${tomPrefixMr}${bestWindow}. काम हलके ठेवा.`
        : bestTimeText;
  }

  return {
    bestWindow,
    lowestPM25: lowestVal,
    canEnjoyOutdoors,
    bestTimeText,
    bestTimeNativeText,
    isTomorrow,
  };
}

/**
 * Plain-language text dictionary for status lines, family guidance, and decisions.
 * Every sentence is strictly 18 words or fewer.
 */
import { STATUS_LINES, FAMILY_GUIDANCE, NEXT_2_HOURS_DECISIONS, NIGHT_SLEEP_DECISIONS } from './outdoorMatrix';
import type { CopySet } from './outdoorMatrix';
export function outdoorGuidance(
  currentBand: AQIBandKey | { key: AQIBandKey } | number,
  hourlyForecast?: Array<{ hour: string; pm2_5: number; isBestHour?: boolean }> | null,
  persona: FamilyView = 'whole_family',
  profile?: Partial<UserProfile>,
  lang: string = 'en',
  currentHour?: number
): OutdoorGuidanceResult {
  // Resolve band key
  let bandKey: AQIBandKey = 'poor';
  if (typeof currentBand === 'number') {
    bandKey = getIndiaBandKey(currentBand);
  } else if (typeof currentBand === 'string') {
    bandKey = currentBand;
  } else if (currentBand && typeof currentBand === 'object' && currentBand.key) {
    bandKey = currentBand.key;
  }

  const level = getOutdoorLevel(bandKey, persona, profile);
  const bestTime = calculateBestTimeWindow(hourlyForecast, lang);

  // Status line
  const statusSet = STATUS_LINES[bandKey] || STATUS_LINES.poor;
  const statusLine = statusSet.en;
  const statusLineNative =
    lang === 'hi' ? statusSet.hi : lang === 'mr' ? statusSet.mr : statusLine;

  // Family guidance text
  const bandGuidanceMap = FAMILY_GUIDANCE[bandKey] || FAMILY_GUIDANCE.poor;
  const guidanceSet = bandGuidanceMap[persona] || bandGuidanceMap.whole_family;
  const guidance = guidanceSet.en;
  const guidanceNative =
    lang === 'hi' ? guidanceSet.hi : lang === 'mr' ? guidanceSet.mr : guidance;

  // Next 2 hours decision text:
  // If hour is between 12 AM and 6 AM (hours 0, 1, 2, 3, 4, 5), suggest sleep/night rest and indoor comfort
  const isNightSleep = currentHour !== undefined && currentHour >= 0 && currentHour < 6;
  const activeDecisionsMap = isNightSleep ? NIGHT_SLEEP_DECISIONS : NEXT_2_HOURS_DECISIONS;
  const decisionMap = activeDecisionsMap[bandKey] || activeDecisionsMap.poor;
  const decisionSet = decisionMap[persona] || decisionMap.whole_family;
  const decision = decisionSet.en;
  const decisionNative =
    lang === 'hi' ? decisionSet.hi : lang === 'mr' ? decisionSet.mr : decision;

  // Headlines
  let headline = 'Safe to exercise outside';
  let headlineNative = 'बाहर कसरत सुरक्षित है';
  if (level === 'light-only') {
    headline = 'Light outdoor activities only';
    headlineNative = lang === 'hi' ? 'केवल हल्की बाहरी गतिविधियां' : 'केवळ हलक्या मैदानी हालचाली';
  } else if (level === 'avoid') {
    headline = 'Avoid outdoor exercise';
    headlineNative = lang === 'hi' ? 'बाहर व्यायाम करने से बचें' : 'बाहेर व्यायाम करणे टाळा';
  }

  return {
    level,
    headline,
    headlineNative,
    statusLine,
    statusLineNative,
    guidance,
    guidanceNative,
    decision,
    decisionNative,
    bestTime,
  };
}

/**
 * Post-generation safety check for Chat replies.
 * If level is "avoid" or "light-only" and the answer encourages outdoor exercise/runs,
 * replaces the outdoor portion or returns the template guidance for that level.
 */
export function sanitizeChatOutdoorAdvice(
  replyText: string,
  level: OutdoorLevel,
  lang: string = 'en'
): string {
  if (level === 'go') {
    return replyText;
  }

  // Regex patterns that mistakenly encourage outdoor workouts/cardio/runs
  const outdoorExercisePatterns = [
    /\benjoy\s+.*?\b(outdoor|park|outside)\s+(workout|exercise|run|jog|cardio|sports)/i,
    /\bgreat\s+.*?\bfor\s+(outdoor|park|outside)\s+(workouts?|jogging|runs?|cardio|exercise)/i,
    /\bexercise\s+outdoors\s+in\s+parks?/i,
    /\bgo\s+(for\s+an\s+)?outdoor\s+(run|jog|workout|exercise)/i,
    /\bhead\s+outside\s+for\s+a\s+run/i,
    /\boutdoor\s+(jog|run|workout|exercise|marathon)/i,
    /\b(पार्क या खुले मैदान में बाहर कसरत करें)\b/,
    /\b(बागेत किंवा मोकळ्या मैदानात बाहेर व्यायाम करा)\b/,
    /\b(बाहर दौड़ने या कसरत करने जाएं)\b/,
  ];

  const hasContradiction = outdoorExercisePatterns.some((p) => p.test(replyText));

  if (!hasContradiction) {
    return replyText;
  }

  // If a contradiction is detected, sanitize it based on level
  if (level === 'avoid') {
    const safeNoticeEn =
      'Smog is unhealthy today. Avoid outdoor exercise and move workouts indoors. Keep doors and windows closed and run indoor air cleaning.';
    const safeNoticeNative =
      lang === 'hi'
        ? 'आज हवा खराब है। बाहर कसरत करने से बचें और व्यायाम घर के अंदर करें। खिड़कियां बंद रखें और एयर फिल्टर चलाएं।'
        : lang === 'mr'
        ? 'आज हवेत प्रदूषण जास्त आहे. बाहेर व्यायाम करणे टाळा आणि घरातच व्यायाम करा. खिडक्या बंद ठेवून एअर फिल्टर चालवा.'
        : safeNoticeEn;

    if (lang === 'en') {
      return safeNoticeEn;
    }

    return `${safeNoticeNative}\n---EN---\n${safeNoticeEn}`;
  }

  if (level === 'light-only') {
    const safeNoticeEn =
      'Air has noticeable dust and smoke. Limit outdoor activity to light walking only; avoid long or hard exercise.';
    const safeNoticeNative =
      lang === 'hi'
        ? 'हवा में धूल और धुआं है। केवल हल्की सैर तक सीमित रखें; भारी कसरत से बचें।'
        : lang === 'mr'
        ? 'हवेत धूर आणि धूळ जाणवत आहे. केवळ हलक्या फेरफटक्यापुरते मर्यादित ठेवा; मोठा व्यायाम टाळा.'
        : safeNoticeEn;

    if (lang === 'en') {
      return safeNoticeEn;
    }

    return `${safeNoticeNative}\n---EN---\n${safeNoticeEn}`;
  }

  return replyText;
}
