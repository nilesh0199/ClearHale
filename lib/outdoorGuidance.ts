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
  lang: string = 'en'
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
    };
  }

  const parseHour = (item: { hour?: string; time?: string }): number => {
    const raw = item.hour || item.time || '';
    if (!raw) return 12;
    const part = raw.includes('T') ? raw.split('T')[1] : raw;
    const h = parseInt(part.split(':')[0], 10);
    return isNaN(h) ? 12 : h;
  };

  // 1. Search for lowest PM2.5 strictly within waking hours: 7 AM (07:00) to 11 PM (23:00)
  // Sleeping hours (11 PM to 7 AM) are excluded for family routines and safety.
  let lowestIdx = -1;
  let lowestVal = Infinity;

  for (let i = 0; i < hourly.length; i++) {
    const item = hourly[i];
    const h = parseHour(item);
    const isWakingHour = h >= 7 && h < 23;
    if (isWakingHour) {
      if (item.pm2_5 < lowestVal) {
        lowestVal = item.pm2_5;
        lowestIdx = i;
      }
    }
  }

  // Fallback to all hours if no items fall in 7 AM - 11 PM window (e.g. edge-case truncated data)
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

  let bestTimeText = '';
  let bestTimeNativeText = '';

  if (canEnjoyOutdoors) {
    bestTimeText = `Best time for outdoor workouts: ${bestWindow} (around ${Math.round(lowestVal)} µg/m³).`;
    bestTimeNativeText =
      lang === 'hi'
        ? `बाहर टहलने या कसरत के लिए सबसे अच्छा समय: ${bestWindow} (लगभग ${Math.round(lowestVal)} µg/m³)।`
        : lang === 'mr'
        ? `बाहेर फिरण्यासाठी किंवा व्यायामासाठी उत्तम वेळ: ${bestWindow} (सुमारे ${Math.round(lowestVal)} µg/m³).`
        : bestTimeText;
  } else {
    bestTimeText = `Lightest-exposure hour for essential errands only: ${bestWindow}. Keep it short and gentle.`;
    bestTimeNativeText =
      lang === 'hi'
        ? `जरूरी काम निपटाने का सबसे कम प्रदूषण वाला समय: ${bestWindow}। काम हल्का रखें।`
        : lang === 'mr'
        ? `केवळ महत्त्वाच्या कामासाठी सर्वात कमी धुराची वेळ: ${bestWindow}. काम हलके ठेवा.`
        : bestTimeText;
  }

  return {
    bestWindow,
    lowestPM25: lowestVal,
    canEnjoyOutdoors,
    bestTimeText,
    bestTimeNativeText,
  };
}

/**
 * Plain-language text dictionary for status lines, family guidance, and decisions.
 * Every sentence is strictly 18 words or fewer.
 */
interface CopySet {
  en: string;
  hi: string;
  mr: string;
}

const STATUS_LINES: Record<AQIBandKey, CopySet> = {
  good: {
    en: 'Air quality is clean and safe. Normal outdoor activities welcome.',
    hi: 'हवा पूरी तरह साफ और सुरक्षित है। बाहर की गतिविधियां आराम से करें।',
    mr: 'हवा पूर्णपणे स्वच्छ आणि सुरक्षित आहे. मैदानी कामांचा मनसोक्त आनंद घ्या.',
  },
  satisfactory: {
    en: 'Air quality is acceptable. Normal outdoor activities are safe.',
    hi: 'हवा का स्तर ठीक है। बाहर की सामान्य गतिविधियां सुरक्षित हैं।',
    mr: 'हवेचा दर्जा समाधानकारक आहे. बाहेरील नेहमीची कामे सुरक्षित आहेत.',
  },
  moderate: {
    en: 'Air has noticeable dust and smoke. Sensitive groups should keep outdoor time light.',
    hi: 'हवा में धूल और धुआं है। संवेदनशील लोग बाहर का समय हल्का रखें।',
    mr: 'हवेत धूर आणि धूळ जाणवत आहे. संवेदनशील व्यक्तींनी बाहेरील कामे हलकी ठेवावीत.',
  },
  poor: {
    en: 'Smog is unhealthy today. Avoid outdoor exercise and move workouts indoors.',
    hi: 'आज हवा खराब है। बाहर कसरत करने से बचें और व्यायाम घर के अंदर करें।',
    mr: 'आज हवेत प्रदूषण जास्त आहे. बाहेर व्यायाम करणे टाळा आणि घरातच हालचाली करा.',
  },
  very_poor: {
    en: 'Heavy smog outside. Stay indoors and use a fitted N95 mask for essential trips.',
    hi: 'बाहर भारी स्मॉग है। घर पर रहें और जरूरी काम के लिए फिट N95 मास्क पहनें।',
    mr: 'बाहेर दाट धुरके आहे. घरातच राहा आणि महत्त्वाच्या कामासाठी N95 मास्क वापरा.',
  },
  severe: {
    en: 'Severe toxic smog. Stay strictly indoors and use a fitted N95 for essential trips.',
    hi: 'गंभीर जहरीला स्मॉग। बिल्कुल घर के अंदर रहें और जरूरी काम पर N95 पहनें।',
    mr: 'अतिधोकादायक विषारी हवा. घरातच राहा आणि अत्यंत महत्त्वाच्या कामासाठी N95 वापरा.',
  },
};

const FAMILY_GUIDANCE: Record<AQIBandKey, Record<FamilyView, CopySet>> = {
  good: {
    whole_family: {
      en: 'Air is clean and fresh. Open windows to refresh your home.',
      hi: 'हवा साफ और ताजा है। घर की हवा बदलने के लिए खिड़कियां खोलें।',
      mr: 'हवा स्वच्छ आणि ताजी आहे. घरातील हवा ताजी करण्यासाठी खिडक्या उघडा.',
    },
    child: {
      en: 'Air is clean and safe. Babies and children can play outside freely.',
      hi: 'हवा साफ और सुरक्षित है। बच्चे और नन्हे बच्चे बाहर आराम से खेल सकते हैं।',
      mr: 'हवा स्वच्छ आणि सुरक्षित आहे. मुले आणि लहान बाळे मोकळेपणाने खेळू शकतात.',
    },
    elderly: {
      en: 'Air is clean and safe. Great day for outdoor walks and fresh air.',
      hi: 'हवा साफ और सुरक्षित है। बाहर टहलने और ताजी हवा लेने का बढ़िया दिन है।',
      mr: 'हवा स्वच्छ आणि सुरक्षित आहे. मोकळ्या हवेत फिरण्यासाठी आजचा दिवस उत्तम आहे.',
    },
    pregnant: {
      en: 'Air is pure and healthy. Safe for outdoor walks and open windows.',
      hi: 'हवा शुद्ध और सेहतमंद है। बाहर टहलना और खिड़कियां खोलना सुरक्षित है।',
      mr: 'हवा शुद्ध आणि निरोगी आहे. बाहेर हलके फिरणे आणि खिडक्या उघडणे सुरक्षित आहे.',
    },
    outdoor_worker: {
      en: 'Air is clean across work sites. Outdoor work is comfortable today.',
      hi: 'कामकाज की जगहों पर हवा साफ है। बाहर काम करना आज सहज है।',
      mr: 'कामाच्या ठिकाणी हवा स्वच्छ आहे. उघड्यावर काम करणे आज सोपे आणि सुरक्षित आहे.',
    },
  },
  satisfactory: {
    whole_family: {
      en: 'Air is acceptable. You can open windows for fresh air.',
      hi: 'हवा ठीक है। ताजी हवा के लिए खिड़कियां खोली जा सकती हैं।',
      mr: 'हवा समाधानकारक आहे. ताजी हवा येण्यासाठी खिडक्या उघडू शकता.',
    },
    child: {
      en: 'Safe for kids to play in parks. Normal school sports can proceed.',
      hi: 'बच्चों के पार्क में खेलने के लिए सुरक्षित है। खेलकूद जारी रख सकते हैं।',
      mr: 'मुलांना बागेत खेळण्यासाठी सुरक्षित आहे. नेहमीचे मैदानी खेळ खेळता येतील.',
    },
    elderly: {
      en: 'Comfortable for daily walks. Take a rest if you feel tired.',
      hi: 'रोज की सैर के लिए हवा ठीक है। थकान महसूस हो तो आराम करें।',
      mr: 'नेहमीच्या चालीसाठी हवा ठीक आहे. थकवा जाणवल्यास विश्रांती घ्या.',
    },
    pregnant: {
      en: 'Air is safe for daily routines. Drink water and avoid heavy traffic.',
      hi: 'दैनिक दिनचर्या के लिए हवा सुरक्षित है। पानी पिएं और भारी ट्रैफिक से बचें।',
      mr: 'दैनंदिन कामांसाठी हवा सुरक्षित आहे. भरपूर पाणी प्या आणि रहदारीचे रस्ते टाळा.',
    },
    outdoor_worker: {
      en: 'Work conditions are normal. Drink plenty of water during your shift.',
      hi: 'काम के हालात सामान्य हैं। काम के दौरान भरपूर पानी पीते रहें।',
      mr: 'कामासाठी परिस्थिती सामान्य आहे. कामाच्या वेळी पुरेसे पाणी पीत राहा.',
    },
  },
  moderate: {
    whole_family: {
      en: 'Dust is noticeable outside. Keep outdoor time light and air out home during clean midday.',
      hi: 'बाहर धूल-धुआं है। बाहर का समय हल्का रखें और दोपहर में ही खिड़कियां खोलें।',
      mr: 'बाहेर धूर जाणवत आहे. बाहेरील कामे हलकी ठेवा आणि दुपारच्या वेळेतच खिडक्या उघडा.',
    },
    child: {
      en: 'Smog can cause coughing in children. Move hard sports indoors.',
      hi: 'धुएं से बच्चों को खांसी हो सकती है। भारी खेल घर के अंदर कराएं।',
      mr: 'धुरामुळे मुलांना खोकला येऊ शकतो. जास्त धावपळीचे खेळ घरातच घ्या.',
    },
    elderly: {
      en: 'Dust may irritate sensitive lungs. Keep walks short and gentle.',
      hi: 'धूल से फेफड़ों में परेशानी हो सकती है। सैर छोटी और धीमी रखें।',
      mr: 'धुळीमुळे श्वसनाचा त्रास होऊ शकतो. चालणे कमी आणि हलके ठेवा.',
    },
    pregnant: {
      en: 'Smog can cause throat dryness and tiredness. Rest indoors during busy rush hours.',
      hi: 'धुएं से गले में सूखापन और थकान हो सकती है। व्यस्त समय में घर पर आराम करें।',
      mr: 'धुरामुळे घसा कोरडा पडून थकवा येऊ शकतो. गर्दीच्या वेळी घरातच विश्रांती घ्या.',
    },
    outdoor_worker: {
      en: 'Dust can cause throat dryness. Take regular breaks in sheltered spots.',
      hi: 'धूल से गले में सूखापन आ सकता है। सुरक्षित जगहों पर बीच-बीच में आराम लें।',
      mr: 'धुळीमुळे घसा कोरडा पडू शकतो. सावलीच्या ठिकाणी नियमित विश्रांती घेत काम करा.',
    },
  },
  poor: {
    whole_family: {
      en: 'Smog is unhealthy today. Shut windows, run air filters, and move exercise indoors.',
      hi: 'आज हवा खराब है। खिड़कियां बंद रखें, एयर फिल्टर चलाएं और कसरत अंदर करें।',
      mr: 'आज हवा खराब आहे. खिडक्या बंद ठेवा, एअर फिल्टर चालवा आणि घरातच व्यायाम करा.',
    },
    child: {
      en: 'Air is unhealthy. Keep children indoors and pause outdoor playground sports.',
      hi: 'हवा खराब है। बच्चों को घर के अंदर रखें और बाहर के खेल बंद रखें।',
      mr: 'हवा अस्वच्छ आहे. मुलांना घरातच ठेवा आणि मैदानातील खेळ थांबवा.',
    },
    elderly: {
      en: 'Smog strains lungs and heart. Stay indoors and keep daily medicines close.',
      hi: 'स्मॉग से फेफड़ों और दिल पर जोर पड़ता है। घर में रहें और दवाइयां पास रखें।',
      mr: 'प्रदूषणामुळे फुप्फुस आणि हृदयावर ताण येतो. घरातच राहा आणि औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Smog harms maternal and baby health. Rest indoors with clean filtered air.',
      hi: 'स्मॉग मां और बच्चे दोनों के लिए हानिकारक है। साफ हवा में घर पर आराम करें।',
      mr: 'प्रदूषण आई आणि बाळ दोघांसाठी घातक आहे. घरात स्वच्छ हवेत विश्रांती घ्या.',
    },
    outdoor_worker: {
      en: 'Smog levels are high. Wear a snug N95 mask and take indoor rest pauses.',
      hi: 'प्रदूषण का स्तर ऊंचा है। टाइट N95 मास्क पहनें और अंदर आराम के ब्रेक लें।',
      mr: 'प्रदूषणाची पातळी जास्त आहे. चेहऱ्याला बसणारा N95 मास्क वापरा आणि विश्रांती घ्या.',
    },
  },
  very_poor: {
    whole_family: {
      en: 'Heavy smog outside. Keep windows shut, run air cleaners, and stay inside.',
      hi: 'बाहर भारी स्मॉग है। खिड़कियां बंद रखें, एयर प्यूरीफायर चलाएं और अंदर रहें।',
      mr: 'बाहेर दाट धुरके आहे. खिडक्या बंद ठेवा, एअर प्युरिफायर चालवा आणि घरातच राहा.',
    },
    child: {
      en: 'Heavy smog harms young lungs. Keep kids indoors in a closed, filtered room.',
      hi: 'भारी स्मॉग नन्हे फेफड़ों को नुकसान पहुंचाता है। बच्चों को बंद साफ कमरे में रखें।',
      mr: 'दाट धुरके लहान फुप्फुसांना त्रास देते. मुलांना बंद आणि स्वच्छ खोलीत ठेवा.',
    },
    elderly: {
      en: 'Heavy smog is dangerous for seniors. Stay inside and keep rescue medicines handy.',
      hi: 'बुजुर्गों के लिए भारी स्मॉग खतरनाक है। अंदर रहें और जरूरी दवाएं पास रखें।',
      mr: 'ज्येष्ठांसाठी दाट धूर धोकादायक आहे. घरातच राहा आणि इनहेलर जवळ ठेवा.',
    },
    pregnant: {
      en: 'Toxic smoke passes to unborn babies. Stay inside a closed room with air cleaning.',
      hi: 'जहरीला धुआं बच्चे तक पहुंच सकता है। बंद कमरे में एयर फिल्टर के साथ रहें।',
      mr: 'विषारी धूर गर्भातील बाळासाठी घातक ठरतो. बंद खोलीत हवा स्वच्छ ठेवून विश्रांती घ्या.',
    },
    outdoor_worker: {
      en: 'Heavy smog outside. Wear a tight N95 mask and rest in clean indoor rooms.',
      hi: 'बाहर भारी स्मॉग है। टाइट N95 मास्क पहनें और अंदर साफ कमरों में आराम लें।',
      mr: 'बाहेर तीव्र धुरके आहे. घट्ट N95 मास्क लावा आणि आतील स्वच्छ खोलीत विश्रांती घ्या.',
    },
  },
  severe: {
    whole_family: {
      en: 'Emergency smog levels. Keep doors sealed, run air cleaners, and avoid all outdoor trips.',
      hi: 'आपातकालीन स्मॉग स्तर। दरवाजे बंद रखें, एयर क्लीनर चलाएं और बाहर जाना टालें।',
      mr: 'धोकादायक आणीबाणी पातळी. दारे बंद ठेवा, एअर क्लीनर चालवा आणि बाहेर जाणे पूर्ण टाळा.',
    },
    child: {
      en: 'Emergency smog levels. Keep kids strictly indoors in a sealed, filtered bedroom.',
      hi: 'आपातकालीन स्मॉग। बच्चों को पूरी तरह बंद और साफ हवा वाले कमरे में रखें।',
      mr: 'आणीबाणीची पातळी. मुलांना घरामध्ये बंद आणि स्वच्छ हवेच्या खोलीतच ठेवा.',
    },
    elderly: {
      en: 'Emergency smog levels. Remain indoors; seek urgent medical help if chest feels tight.',
      hi: 'आपातकालीन स्मॉग। अंदर ही रहें; सीने में जकड़न हो तो तुरंत डॉक्टर से संपर्क करें।',
      mr: 'धोकादायक प्रदूषण. घरातच राहा; छातीत त्रास जाणवल्यास त्वरित वैद्यकीय मदत घ्या.',
    },
    pregnant: {
      en: 'Severe toxic smoke outside. Stay inside a sealed, filtered room and avoid travel.',
      hi: 'बाहर जहरीला धुआं है। साफ और बंद कमरे में रहें, बाहर का सफर बिल्कुल न करें।',
      mr: 'बाहेर अत्यंत विषारी धूर आहे. स्वच्छ बंद खोलीत राहा आणि प्रवास पूर्णपणे टाळा.',
    },
    outdoor_worker: {
      en: 'Emergency toxic air. Halt heavy outdoor labor; wear a fitted N95 respirator.',
      hi: 'अत्यधिक जहरीली हवा। बाहर की भारी मेहनत रोकें और फिटेड N95 मास्क पहनें।',
      mr: 'अतिविषारी हवा. उघड्यावरील कष्टाची कामे थांबवा आणि N95 मास्क वापरा.',
    },
  },
};

const NEXT_2_HOURS_DECISIONS: Record<AQIBandKey, Record<FamilyView, CopySet>> = {
  good: {
    whole_family: {
      en: 'Next 2 hours: Air is safe. Outdoor play, sports, and school runs can proceed freely.',
      hi: 'अगले 2 घंटे: हवा सुरक्षित है। बाहर खेलकूद और स्कूल आना-जाना आराम से हो सकता है।',
      mr: 'पुढील २ तास: हवा सुरक्षित आहे. मैदानी खेळ आणि नेहमीची कामे सहज करता येतील.',
    },
    child: {
      en: 'Next 2 hours: Air is safe. Outdoor play, sports, and school runs can proceed freely.',
      hi: 'अगले 2 घंटे: हवा सुरक्षित है। बच्चों का खेल और स्कूल आना-जाना आराम से हो सकता है।',
      mr: 'पुढील २ तास: हवा सुरक्षित आहे. मुलांचे मैदानी खेळ सहज सुरू ठेवता येतील.',
    },
    elderly: {
      en: 'Next 2 hours: Air is safe. Great time for outdoor walks and garden visits.',
      hi: 'अगले 2 घंटे: हवा सुरक्षित है। बाहर टहलने और ताजी हवा लेने का बढ़िया समय है।',
      mr: 'पुढील २ तास: हवा सुरक्षित आहे. बागेत फेरफटका मारण्यासाठी उत्तम वेळ आहे.',
    },
    pregnant: {
      en: 'Next 2 hours: Air is clean and safe. Relax with gentle walks and open windows.',
      hi: 'अगले 2 घंटे: हवा साफ और सुरक्षित है। हल्की सैर करें और खिड़कियां खुली रखें।',
      mr: 'पुढील २ तास: हवा स्वच्छ आणि सुरक्षित आहे. मोकळ्या हवेत फिरणे सुरक्षित आहे.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Air is clean. You can complete outdoor tasks without difficulty.',
      hi: 'अगले 2 घंटे: हवा साफ है। आप बिना किसी परेशानी के बाहर का काम कर सकते हैं।',
      mr: 'पुढील २ तास: हवा स्वच्छ आहे. बाहेरील कामे कोणत्याही अडचणीशिवाय पूर्ण करता येतील.',
    },
  },
  satisfactory: {
    whole_family: {
      en: 'Next 2 hours: Air is acceptable. Normal errands and outdoor activities can continue safely.',
      hi: 'अगले 2 घंटे: हवा ठीक है। बाहर के काम और गतिविधियां सुरक्षित रूप से जारी रखें।',
      mr: 'पुढील २ तास: हवा समाधानकारक आहे. बाहेरील कामे सुरक्षितपणे चालू ठेवता येतील.',
    },
    child: {
      en: 'Next 2 hours: Safe for kids to play in the yard or local park.',
      hi: 'अगले 2 घंटे: बच्चों के पार्क या आंगन में खेलने के लिए सुरक्षित समय है।',
      mr: 'पुढील २ तास: मुलांना अंगणात किंवा बागेत खेळण्यासाठी सुरक्षित वेळ आहे.',
    },
    elderly: {
      en: 'Next 2 hours: Comfortable for routine outdoor walks. Rest if feeling short of breath.',
      hi: 'अगले 2 घंटे: रोज की सैर के लिए ठीक है। सांस फूले तो तुरंत आराम करें।',
      mr: 'पुढील २ तास: नियमित चालण्यासाठी ठीक आहे. दम लागल्यास लगेच विश्रांती घ्या.',
    },
    pregnant: {
      en: 'Next 2 hours: Air conditions are suitable for normal routines. Avoid busy road junctions.',
      hi: 'अगले 2 घंटे: सामान्य दिनचर्या के लिए हवा ठीक है। व्यस्त चौराहों से बचें।',
      mr: 'पुढील २ तास: दैनंदिन कामांसाठी हवा अनुकूल आहे. गर्दीचे रस्ते टाळावेत.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Working conditions are manageable. Stay well hydrated during work.',
      hi: 'अगले 2 घंटे: काम के हालात सामान्य हैं। काम के दौरान पानी पीते रहें।',
      mr: 'पुढील २ तास: कामाची परिस्थिती सामान्य आहे. भरपूर पाणी पीत राहा.',
    },
  },
  moderate: {
    whole_family: {
      en: 'Next 2 hours: Dust is noticeable. Move hard exercise indoors; keep outdoor tasks short and light.',
      hi: 'अगले 2 घंटे: धूल-धुआं है। भारी कसरत अंदर करें; बाहर का काम हल्का और छोटा रखें।',
      mr: 'पुढील २ तास: हवेत धूर आहे. मोठा व्यायाम घरात करा; बाहेरील कामे हलकी ठेवा.',
    },
    child: {
      en: 'Next 2 hours: Move play sessions indoors. Avoid hard sports during dusty hours.',
      hi: 'अगले 2 घंटे: बच्चों का खेल अंदर रखें। धूल भरे समय में भारी खेल टालें।',
      mr: 'पुढील २ तास: मुलांचे खेळ घरात घ्या. जास्त धावपळीचे खेळ थांबवा.',
    },
    elderly: {
      en: 'Next 2 hours: Avoid hard physical exertion. Keep rescue medicines close and rest indoors.',
      hi: 'अगले 2 घंटे: भारी मेहनत से बचें। जरूरी दवाएं पास रखें और अंदर आराम करें।',
      mr: 'पुढील २ तास: जास्त धावपळ टाळा. औषधे जवळ ठेवा आणि घरात विश्रांती घ्या.',
    },
    pregnant: {
      en: 'Next 2 hours: Keep windows shut during dusty hours. Rest in clean indoor rooms.',
      hi: 'अगले 2 घंटे: धूल के समय खिड़कियां बंद रखें। साफ कमरे में आराम करें।',
      mr: 'पुढील २ तास: धुराच्या वेळी खिडक्या बंद ठेवा. स्वच्छ खोलीत विश्रांती घ्या.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Wear a snug N95 mask near traffic. Take short rest breaks in shade.',
      hi: 'अगले 2 घंटे: ट्रैफिक के पास N95 मास्क लगाएं। छांव में छोटे ब्रेक लेते रहें।',
      mr: 'पुढील २ तास: रहदारीजवळ N95 मास्क लावा. सावलीत लहान विश्रांती घ्या.',
    },
  },
  poor: {
    whole_family: {
      en: 'Next 2 hours: Smog is unhealthy. Avoid outdoor exercise; shut windows and run indoor air filters.',
      hi: 'अगले 2 घंटे: स्मॉग खराब है। बाहर कसरत न करें; खिड़कियां बंद कर एयर फिल्टर चलाएं।',
      mr: 'पुढील २ तास: हवा खराब आहे. बाहेर व्यायाम टाळा; खिडक्या बंद करून एअर फिल्टर चालवा.',
    },
    child: {
      en: 'Next 2 hours: Keep children strictly indoors in a closed room with air cleaning running.',
      hi: 'अगले 2 घंटे: बच्चों को बंद कमरे में रखें जहां एयर प्यूरीफायर चल रहा हो।',
      mr: 'पुढील २ तास: मुलांना एअर प्युरिफायर चालू असलेल्या बंद खोलीतच ठेवा.',
    },
    elderly: {
      en: 'Next 2 hours: Stay inside a cleaner-air room. Avoid outdoor walks and keep medicines close.',
      hi: 'अगले 2 घंटे: साफ हवा वाले कमरे में रहें। बाहर टहलना टालें और दवाइयां पास रखें।',
      mr: 'पुढील २ तास: स्वच्छ खोलीतच राहा. बाहेर फिरणे टाळा आणि औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Next 2 hours: Rest inside a closed room with air cleaning. Postpone non-urgent travel.',
      hi: 'अगले 2 घंटे: एयर फिल्टर वाले बंद कमरे में आराम करें। गैर-जरूरी सफर टालें।',
      mr: 'पुढील २ तास: एअर फिल्टर असलेल्या बंद खोलीत विश्रांती घ्या. प्रवास पुढे ढकला.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Put on your fitted N95 respirator. Take breaks inside sheltered rooms.',
      hi: 'अगले 2 घंटे: फिटेड N95 मास्क पहनें। अंदर सुरक्षित कमरों में ब्रेक लें।',
      mr: 'पुढील २ तास: बसणारा N95 मास्क लावा. आतील सुरक्षित खोलीत विश्रांती घ्या.',
    },
  },
  very_poor: {
    whole_family: {
      en: 'Next 2 hours: Heavy smog outside. Stay indoors; wear a fitted N95 mask only for essential trips.',
      hi: 'अगले 2 घंटे: बाहर भारी स्मॉग है। अंदर रहें; जरूरी काम पर ही N95 पहनकर निकलें।',
      mr: 'पुढील २ तास: बाहेर दाट धूर आहे. घरातच राहा; अत्यंत महत्त्वाच्या कामासाठी N95 वापरा.',
    },
    child: {
      en: 'Next 2 hours: Keep children strictly indoors in a closed room. Never use masks on babies under two.',
      hi: 'अगले 2 घंटे: बच्चों को बंद कमरे में रखें। 2 साल से छोटे बच्चों को मास्क न लगाएं।',
      mr: 'पुढील २ तास: मुलांना बंद खोलीतच ठेवा. २ वर्षांखालील बाळांना मास्क वापरू नका.',
    },
    elderly: {
      en: 'Next 2 hours: Keep seniors in a dedicated clean room. Avoid balcony walks and keep inhalers close.',
      hi: 'अगले 2 घंटे: बुजुर्गों को साफ कमरे में रखें। बालकनी में न जाएं और इनहेलर पास रखें।',
      mr: 'पुढील २ तास: ज्येष्ठांना स्वच्छ खोलीत ठेवा. बाल्कनीत फिरणे टाळा आणि इनहेलर जवळ ठेवा.',
    },
    pregnant: {
      en: 'Next 2 hours: Remain inside with air cleaners running. Wear a tight N95 for necessary doctor visits.',
      hi: 'अगले 2 घंटे: एयर प्यूरीफायर चालू रखकर अंदर रहें। डॉक्टर के पास जाते समय N95 पहनें।',
      mr: 'पुढील २ तास: एअर प्युरिफायर चालू ठेवून आत राहा. डॉक्टरकडे जाताना घट्ट N95 वापरा.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Wear your fitted N95 respirator. Move heavy lifting to indoor sheltered spaces.',
      hi: 'अगले 2 घंटे: फिटेड N95 मास्क पहनें। भारी सामान उठाने का काम अंदर शेड में करें।',
      mr: 'पुढील २ तास: बसणारा N95 मास्क वापरा. जड कामांसाठी आतील सुरक्षित जागा वापरा.',
    },
  },
  severe: {
    whole_family: {
      en: 'Next 2 hours: Emergency smog outside. Stay strictly indoors; use a fitted N95 mask only for essential trips.',
      hi: 'अगले 2 घंटे: आपातकालीन स्मॉग है। बिल्कुल अंदर रहें; जरूरी काम पर ही N95 पहनकर जाएं।',
      mr: 'पुढील २ तास: आणीबाणीचा धूर आहे. पूर्णपणे आत राहा; महत्त्वाच्या कामासाठीच N95 वापरा.',
    },
    child: {
      en: 'Next 2 hours: Keep children strictly indoors in a closed bedroom with active air filtration.',
      hi: 'अगले 2 घंटे: बच्चों को पूरी तरह बंद बेडरूम में रखें जहां एयर फिल्टर चल रहा हो।',
      mr: 'पुढील २ तास: मुलांना एअर फिल्टर चालू असलेल्या बंद बेडरूममध्येच ठेवा.',
    },
    elderly: {
      en: 'Next 2 hours: Keep seniors in a sealed clean-air room. Seek immediate help if chest tightness occurs.',
      hi: 'अगले 2 घंटे: बुजुर्गों को बंद साफ कमरे में रखें। सीने में भारीपन लगे तो तुरंत मदद लें।',
      mr: 'पुढील २ तास: ज्येष्ठांना बंद स्वच्छ खोलीत ठेवा. छातीत त्रास झाल्यास तातडीने मदत घ्या.',
    },
    pregnant: {
      en: 'Next 2 hours: Remain inside a closed room with air cleaning. Avoid any outdoor travel.',
      hi: 'अगले 2 घंटे: एयर फिल्टर वाले बंद कमरे में रहें। बाहर का कोई सफर न करें।',
      mr: 'पुढील २ तास: एअर फिल्टर असलेल्या बंद खोलीत राहा. बाहेरचा कोणताही प्रवास टाळा.',
    },
    outdoor_worker: {
      en: 'Next 2 hours: Stop heavy outdoor work. Wear a fitted N95 respirator and rest in filtered air.',
      hi: 'अगले 2 घंटे: बाहर की भारी मेहनत रोकें। फिटेड N95 मास्क लगाएं और साफ हवा में आराम करें।',
      mr: 'पुढील २ तास: कष्टाची कामे थांबवा. N95 मास्क लावा आणि आतील स्वच्छ हवेत विश्रांती घ्या.',
    },
  },
};

/**
 * Single function outdoorGuidance(currentBand, hourlyForecast, persona, profile, lang)
 * Returns the unified outdoor advice, level, status line, guidance copy, and decision.
 */
export function outdoorGuidance(
  currentBand: AQIBandKey | { key: AQIBandKey } | number,
  hourlyForecast?: Array<{ hour: string; pm2_5: number; isBestHour?: boolean }> | null,
  persona: FamilyView = 'whole_family',
  profile?: Partial<UserProfile>,
  lang: string = 'en'
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

  // Next 2 hours decision text
  const decisionMap = NEXT_2_HOURS_DECISIONS[bandKey] || NEXT_2_HOURS_DECISIONS.poor;
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
