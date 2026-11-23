'use client';

import React from 'react';
import { AirData, AQIBandInfo, UserProfile, ActionItem } from '@/types';
import { getTop3Actions, getFilteredAndRankedActions } from '@/lib/rulesEngine';
import { calculateAQIFromPM25, getAQIBand } from '@/lib/aqi';
import { outdoorGuidance } from '@/lib/outdoorGuidance';
import { isIndianCity } from '@/lib/languages';
import { findNearestCatalogCity } from '@/lib/citiesData';

export type ShareFormat = '4:5';
export type ShareCardStyle = 'alert';
export type ShareAudience =
  | 'whole_family'
  | 'child'
  | 'elderly'
  | 'pregnant'
  | 'outdoor_worker';

export interface AirQualityCardProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  profile: UserProfile;
  airData: AirData;
  currentBand: AQIBandInfo;
  format?: string;
  cardStyle?: string;
  audience?: ShareAudience;
  timeDiffMinutes?: number;
  familyName?: string;
  includeStatBlock?: boolean;
  includeActions?: boolean;
  includeQrCode?: boolean;
  qrCodeDataUrl?: string;
}

// Band-specific high-contrast text and pill colors (rich, warm, professional poster palette)
const BAND_PALETTES: Record<
  string,
  {
    bandColor: string; // High contrast text color
    bgTint: string;
    pillBg: string;
    borderHex: string;
  }
> = {
  good: {
    bandColor: '#059669', // Emerald 600
    bgTint: '#F2FAF6',
    pillBg: '#ECFDF5',
    borderHex: '#A7F3D0',
  },
  satisfactory: {
    bandColor: '#0D9488', // Teal 600
    bgTint: '#F0FAF8',
    pillBg: '#F0FDFA',
    borderHex: '#99F6E4',
  },
  moderate: {
    bandColor: '#B45309', // Amber 700
    bgTint: '#FFFBEB',
    pillBg: '#FEF3C7',
    borderHex: '#FDE68A',
  },
  poor: {
    bandColor: '#EA580C', // Orange 600
    bgTint: '#FFF7ED',
    pillBg: '#FFEDD5',
    borderHex: '#FED7AA',
  },
  very_poor: {
    bandColor: '#E11D48', // Rose 600
    bgTint: '#FEF2F2',
    pillBg: '#FFE4E6',
    borderHex: '#FECDD3',
  },
  severe: {
    bandColor: '#DC2626', // Red 600
    bgTint: '#FEF2F2',
    pillBg: '#FEE2E2',
    borderHex: '#FECACA',
  },
};

// Calculate best time outside from hourly forecast
function getBestOutdoorWindow(hourly: AirData['hourly']): string {
  if (!hourly || hourly.length === 0) return '12 to 3 pm';
  const bestIdx = hourly.findIndex((h) => h.isBestHour);
  if (bestIdx !== -1) {
    const rawH = parseInt(hourly[bestIdx].hour.split(':')[0], 10) || 13;
    const startH = rawH;
    const endH = (startH + 3) % 24;
    const fmt = (h: number) => {
      const ampm = h >= 12 ? 'pm' : 'am';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr} ${ampm}`;
    };
    return `${fmt(startH)} to ${fmt(endH)}`;
  }
  return '12 to 3 pm';
}

// Calculate WHO 2021 24-hr comparison guideline from today's hourly average
function computeWhoComparison(airData: AirData) {
  let avgPM2_5 = airData.current.pm2_5;
  if (airData.hourly && airData.hourly.length > 0) {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayReadings = airData.hourly.filter(
      (h) => h.time && h.time.startsWith(todayStr)
    );
    const listToAvg = todayReadings.length >= 6 ? todayReadings : airData.hourly.slice(0, 24);
    if (listToAvg.length > 0) {
      avgPM2_5 = Math.round(
        listToAvg.reduce((sum, h) => sum + (h.pm2_5 || 0), 0) / listToAvg.length
      );
    }
  }

  // WHO 2021 24-hour guideline is 15 µg/m³
  const ratio = Number((avgPM2_5 / 15).toFixed(1));

  let pillText = '';
  if (ratio > 1.1) {
    pillText = `${ratio}× WHO's daily guideline`;
  } else if (ratio >= 0.9 && ratio <= 1.1) {
    pillText = "About at WHO's daily guideline";
  } else {
    pillText = "Within WHO's daily guideline";
  }

  return { avgPM2_5, ratio, pillText };
}

// Map top actions to concise plain words (at most 6 plain words!) adapting dynamically to clean vs smog air
function getPlainActionTitle(
  action: ActionItem,
  lang: string,
  aqiBandKey: string = 'poor',
  audience: ShareAudience = 'whole_family'
): { native: string; en: string } {
  const isCleanAir = aqiBandKey === 'good' || aqiBandKey === 'satisfactory';

  // Audience-specific overrides for custom tailored poster recommendations
  if (audience === 'outdoor_worker') {
    if (action.id === 'cleaner_travel_routes') {
      const item = {
        en: 'Choose low-traffic work routes',
        hi: 'कम ट्रैफिक वाले काम के रास्ते चुनें',
        mr: 'कमी ट्रॅफिकचे कामाचे रस्ते निवडा',
        bn: 'কম যানজটের কাজের পথ বেছে নিন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'n95_respirator') {
      const item = isCleanAir
        ? {
            en: 'Breathe freely on outdoor shifts',
            hi: 'ड्यूटी पर खुली हवा में सांस लें',
            mr: 'कामावर मोकळा श्वास घ्या',
            bn: 'কাজে মুক্ত বাতাসে শ্বাস নিন',
          }
        : {
            en: 'Wear fitted N95 on outdoor shifts',
            hi: 'ड्यूटी पर N95 मास्क पहनें',
            mr: 'कामावर N95 मास्क वापरा',
            bn: 'বাইরে কাজের সময় N95 মাস্ক পরুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'shift_outdoor_offpeak') {
      const item = isCleanAir
        ? {
            en: 'Schedule outdoor tasks in daylight',
            hi: 'काम के फेरे सही समय रखें',
            mr: 'कामाच्या वेळा योग्य ठेवा',
            bn: 'কাজের সময় ঠিক রাখুন',
          }
        : {
            en: 'Shift outdoor work trips off-peak',
            hi: 'धुएं के समय बाहर काम टालें',
            mr: 'धुराच्या वेळेत बाहेर काम टाळा',
            bn: 'ধোঁয়ার সময় বাইরে কাজ এড়ান',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'pick_lightest_hour_errands') {
      const item = {
        en: 'Schedule shifts in cleaner hours',
        hi: 'कम धुएं वाले समय शिफ्ट रखें',
        mr: 'कमी धुराच्या वेळी शिफ्ट ठेवा',
        bn: 'কম ধোঁয়ার সময়ে কাজ রাখুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'commute_clean_choices') {
      const item = {
        en: 'Use cleaner covered transit',
        hi: 'धुएं से बचने ढकी गाड़ी से जाएं',
        mr: 'धुरापासून बचावासाठी बंद वाहनाने जा',
        bn: 'ধোঁয়া এড়াতে ঢাকা গাড়িতে যান',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
  } else if (audience === 'child') {
    if (action.id === 'move_exercise_indoors') {
      const item = isCleanAir
        ? {
            en: 'Enjoy outdoor play & sports',
            hi: 'बच्चों को बाहर खेलने दें',
            mr: 'मुलांना बाहेर मोकळे खेळू द्या',
            bn: 'বাচ্চাদের বাইরে খেলতে দিন',
          }
        : {
            en: "Keep children's play indoors",
            hi: 'बच्चों का खेल घर में रखें',
            mr: 'मुलांचा खेळ घरातच ठेवा',
            bn: 'বাচ্চাদের খেলা ঘরের ভেতরে রাখুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'good_day_outdoor_workout') {
      const item = isCleanAir
        ? {
            en: 'Great day for outdoor games',
            hi: 'मैदान में खेलने का बढ़िया दिन',
            mr: 'मैदानावर खेळण्यासाठी छान दिवस',
            bn: 'মাঠে খেলার দারুণ দিন',
          }
        : {
            en: "Keep children's play indoors",
            hi: 'बच्चों का खेल घर में रखें',
            mr: 'मुलांचा खेळ घरातच ठेवा',
            bn: 'বাচ্চাদের খেলা ঘরের ভেতরে রাখুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'bedroom_sanctuary') {
      const item = {
        en: "Create child's clean room sanctuary",
        hi: 'बच्चों का कमरा साफ़ रखें',
        mr: 'मुलांची खोली स्वच्छ ठेवा',
        bn: 'বাচ্চাদের ঘর পরিষ্কার রাখুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'n95_respirator') {
      const item = {
        en: 'Child-fit mask outdoors (age 2+)',
        hi: 'बच्चों को फिट होने वाला मास्क पहनाएं',
        mr: 'मुलांना योग्य आकाराचा मास्क द्या',
        bn: 'শিশুদের মানানসই মাস্ক পরান',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'shift_outdoor_offpeak') {
      const item = {
        en: 'Pick cleaner hours for school trips',
        hi: 'स्कूल आने-जाने का सही समय रखें',
        mr: 'शाळेच्या प्रवासाची योग्य वेळ ठेवा',
        bn: 'স্কুলে যাওয়ার সময় খেয়াল রাখুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'advocate_cleaner_spaces') {
      const item = {
        en: 'Advocate for clean school spaces',
        hi: 'स्कूल व खेल के मैदान साफ़ रखने की मांग करें',
        mr: 'शाळा व मैदाने स्वच्छ ठेवण्यास सांगा',
        bn: 'স্কুল প্রাঙ্গণ পরিচ্ছন্ন রাখতে বলুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
  } else if (audience === 'elderly') {
    if (action.id === 'move_exercise_indoors') {
      const item = isCleanAir
        ? {
            en: 'Take pleasant garden walks',
            hi: 'पार्क में सुखद सैर करें',
            mr: 'बागेत फेरफटका मारा',
            bn: 'বাগানে সুখকর হাঁটাহাঁটি করুন',
          }
        : {
            en: 'Gentle indoor stretching at home',
            hi: 'घर के अंदर ही हल्का व्यायाम करें',
            mr: 'घरातच हलका व्यायाम करा',
            bn: 'ঘরের ভেতরেই হালকা ব্যায়াম করুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'good_day_outdoor_workout') {
      const item = isCleanAir
        ? {
            en: 'Enjoy gentle morning daylight',
            hi: 'सुबह की गुनगुनी धूप का आनंद लें',
            mr: 'सकाळच्या कोवळ्या उन्हाचा आनंद घ्या',
            bn: 'সকালের নরম রোদের আনন্দ নিন',
          }
        : {
            en: 'Gentle indoor stretching at home',
            hi: 'घर के अंदर ही हल्का व्यायाम करें',
            mr: 'घरातच हलका व्यायाम करा',
            bn: 'ঘরের ভেতরেই হালকা ব্যায়াম করুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'bedroom_sanctuary') {
      const item = {
        en: 'Create elder clean-air sanctuary',
        hi: 'बुजुर्गों का कमरा स्वच्छ रखें',
        mr: 'ज्येष्ठांसाठी स्वच्छ खोली ठेवा',
        bn: 'বয়স্কদের ঘর পরিচ্ছন্ন রাখুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'shift_outdoor_offpeak') {
      const item = isCleanAir
        ? {
            en: 'Walk during warm afternoon hours',
            hi: 'दोपहर की गुनगुनी धूप में टहलें',
            mr: 'दुपारच्या उबदार वेळेत फिरा',
            bn: 'দুপুরের রোদে হাঁটুন',
          }
        : {
            en: 'Avoid morning cold, walk at noon',
            hi: 'सुबह की ठंड से बचें, दोपहर टहलें',
            mr: 'सकाळची थंडी टाळा, दुपारी फिरा',
            bn: 'সকালের ঠান্ডা এড়ান, দুপুরে হাঁটুন',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
  } else if (audience === 'pregnant') {
    if (action.id === 'move_exercise_indoors') {
      const item = isCleanAir
        ? {
            en: 'Enjoy peaceful nature walks',
            hi: 'पार्क में सुकून से टहलें',
            mr: 'बागेत शांत फेरफटका मारा',
            bn: 'প্রকৃতিতে শান্ত হাঁটুন',
          }
        : {
            en: 'Rest indoors, avoid heavy exertion',
            hi: 'घर में आराम करें, भारी काम न करें',
            mr: 'घरात विश्रांती घ्या, श्रम टाळा',
            bn: 'ঘরে বিশ্রাম নিন, ভারী কাজ এড়ান',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'good_day_outdoor_workout') {
      const item = isCleanAir
        ? {
            en: 'Peaceful park strolls',
            hi: 'पार्क में शांत सैर करें',
            mr: 'बागेत शांत फेरफटका मारा',
            bn: 'পার্কে শান্ত হাঁটুন',
          }
        : {
            en: 'Rest indoors, avoid heavy exertion',
            hi: 'घर में आराम करें, भारी काम न करें',
            mr: 'घरात विश्रांती घ्या, श्रम टाळा',
            bn: 'ঘরে বিশ্রাম নিন, ভারী কাজ এড়ান',
          };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'bedroom_sanctuary') {
      const item = {
        en: 'Set up clean nursery sanctuary',
        hi: 'शयनकक्ष की हवा स्वच्छ रखें',
        mr: 'झोपण्याच्या खोलीतील हवा स्वच्छ ठेवा',
        bn: 'শোবার ঘরের বাতাস পরিষ্কার রাখুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'shift_outdoor_offpeak') {
      const item = {
        en: 'Avoid smog errands, rest indoors',
        hi: 'बाहर न जाएं, घर में आराम करें',
        mr: 'बाहेर जाणे टाळा, घरात विश्रांती घ्या',
        bn: 'বাইরে যাওয়া এড়িয়ে চলুন, বিশ্রাম নিন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
    if (action.id === 'n95_respirator') {
      const item = {
        en: 'Wear fitted N95 for clinic visits',
        hi: 'डॉक्टर के पास जाते समय N95 पहनें',
        mr: 'दवाखान्यात जाताना N95 वापरा',
        bn: 'ডাক্তারের কাছে গেলে N95 পরুন',
      };
      const native = lang === 'hi' ? item.hi : lang === 'mr' ? item.mr : lang === 'bn' ? item.bn : item.en;
      return { native, en: item.en };
    }
  }

  // Base Clean & Smog Dictionary for All Households
  const cleanDictionary: Record<string, { en: string; hi: string; mr: string; bn?: string }> = {
    good_day_outdoor_workout: {
      en: 'Good day for outside workout',
      hi: 'बाहर कसरत करने का अच्छा दिन',
      mr: 'बाहेर व्यायाम करण्यासाठी छान दिवस',
      bn: 'বাইরে ব্যায়াম করার দারুণ দিন',
    },
    cleaner_travel_routes: {
      en: 'Choose low-traffic travel routes',
      hi: 'कम ट्रैफिक वाले रास्ते चुनें',
      mr: 'कमी ट्रॅफिकचे रस्ते निवडा',
      bn: 'কম যানজটের পথ বেছে নিন',
    },
    pick_lightest_hour_errands: {
      en: 'Pick lightest hour for errands',
      hi: 'जरूरी काम कम धुआं वाले समय करें',
      mr: 'कमी धुराच्या वेळी महत्त्वाची कामे करा',
      bn: 'কম ধোঁয়ার সময়ে জরুরি কাজ করুন',
    },
    move_exercise_indoors: {
      en: 'Exercise outdoors in parks',
      hi: 'पार्क में बाहर कसरत करें',
      mr: 'बागेत बाहेर व्यायाम करा',
      bn: 'পার্কে বাইরে ব্যায়াম করুন',
    },
    windows_doors_closed: {
      en: 'Open windows for fresh air',
      hi: 'खिड़कियां खोलकर ताज़ी हवा लें',
      mr: 'खिडक्या उघडून ताजी हवा घ्या',
      bn: 'তাজা বাতাসের জন্য জানালা খুলুন',
    },
    shut_windows_smog: {
      en: 'Open windows for fresh air',
      hi: 'खिड़कियां खोलकर ताज़ी हवा लें',
      mr: 'खिडक्या उघडून ताजी हवा घ्या',
      bn: 'তাজা বাতাসের জন্য জানালা খুলুন',
    },
    air_out_cleanest_hour: {
      en: 'Air out home during midday',
      hi: 'दोपहर में घर में ताज़ी हवा लें',
      mr: 'दुपारी घरात ताजी हवा येऊ द्या',
      bn: 'দুপুরে ঘরের বাতাস বদলে নিন',
    },
    switch_to_induction: {
      en: 'Switch to an induction cooktop',
      hi: 'इंडक्शन चूल्हे का इस्तेमाल करें',
      mr: 'इंडक्शन शेगडीचा वापर करा',
      bn: 'ইন্ডাকশন কুকার ব্যবহার করুন',
    },
    choose_hepa_not_ozone: {
      en: 'Choose HEPA over ionizing purifiers',
      hi: 'ओजोन की जगह HEPA चुनें',
      mr: 'ओझोन ऐवजी HEPA निवडा',
      bn: 'ওজোন এর বদলে HEPA বাছুন',
    },
    seal_gaps_weatherstripping: {
      en: 'Seal drafty doors & gaps',
      hi: 'दरवाज़े और खिड़कियों की दरारें सील करें',
      mr: 'दारे आणि खिडक्यांच्या फटी बंद करा',
      bn: 'দরজা-জানালার ফাঁক বন্ধ করুন',
    },
    bedroom_sanctuary: {
      en: 'Create bedroom clean-air sanctuary',
      hi: 'शयनकक्ष को साफ़ हवा का कमरा बनाएं',
      mr: 'झोपण्याच्या खोलीत स्वच्छ हवा ठेवा',
      bn: 'শোবার ঘরে পরিচ্ছন্ন বাতাস রাখুন',
    },
    child_play_school_timing: {
      en: 'Enjoy outdoor play & sports',
      hi: 'बच्चों को बाहर खेलने दें',
      mr: 'मुलांना बाहेर मोकळे खेळू द्या',
      bn: 'বাচ্চাদের বাইরে খেলতে দিন',
    },
    elderly_clean_room: {
      en: 'Take pleasant garden walks',
      hi: 'पार्क में सुखद सैर करें',
      mr: 'बागेत फेरफटका मारा',
      bn: 'বাগানে सुखकर হাঁটাহাঁटी করুন',
    },
    pregnant_sanctuary_filtration: {
      en: 'Enjoy peaceful nature walks',
      hi: 'पार्क में सुकून से टहलें',
      mr: 'बागेत शांत फेरफटका मारा',
      bn: 'প্রকৃতিতে শান্ত হাঁটুন',
    },
    pregnant_avoid_smog_errands: {
      en: 'Take relaxing park walks',
      hi: 'पार्क में सुकून से टहलें',
      mr: 'बागेत शांत फेरफटका मारा',
      bn: 'পার্কে रिलाक्स হাঁটুন',
    },
    n95_mask_errands: {
      en: 'Breathe fresh air freely',
      hi: 'बिना मास्क खुली हवा में सांस लें',
      mr: 'विना मास्क मोकळा श्वास घ्या',
      bn: 'মাস্ক ছাড়া মুক্ত বাতাসে শ্বাস নিন',
    },
    n95_respirator: {
      en: 'Breathe fresh air freely',
      hi: 'बिना मास्क खुली हवा में सांस लें',
      mr: 'विना मास्क मोकळा श्वास घ्या',
      bn: 'মাস্ক ছাড়া মুক্ত বাতাসে শ্বাস নিন',
    },
    shift_commute_hours: {
      en: 'Enjoy walking or cycling travel',
      hi: 'पैदल या साइकिल से जाएं',
      mr: 'चालत किंवा सायकलने जा',
      bn: 'হেঁটে বা সাইকেলে যান',
    },
    hepa_purifier: {
      en: 'Ventilate home with fresh air',
      hi: 'घर में ताज़ी हवा आने दें',
      mr: 'घरात ताजी हवा येऊ द्या',
      bn: 'ঘরে তাজা বাতাস আসতে দিন',
    },
  };

  const smogDictionary: Record<string, { en: string; hi: string; mr: string; bn?: string }> = {
    good_day_outdoor_workout: {
      en: 'Move workouts indoors today',
      hi: 'कसरत घर के अंदर करें',
      mr: 'व्यायाम घराच्या आतच करा',
      bn: 'শরীরচর্চা ঘরের ভেতরে করুন',
    },
    cleaner_travel_routes: {
      en: 'Choose low-traffic travel routes',
      hi: 'कम ट्रैफिक वाले रास्ते चुनें',
      mr: 'कमी ट्रॅफिकचे रस्ते निवडा',
      bn: 'কম যানজটের পথ বেছে নিন',
    },
    shift_outdoor_offpeak: {
      en: 'Shift outdoor trips off-peak',
      hi: 'जरूरी काम कम धुआं वाले समय करें',
      mr: 'कमी धुराच्या वेळी बाहेर पडा',
      bn: 'কম ধোঁয়ার সময়ে বাইরে যান',
    },
    pick_lightest_hour_errands: {
      en: 'Pick lightest hour for errands',
      hi: 'जरूरी काम कम धुआं वाले समय करें',
      mr: 'कमी धुराच्या वेळी महत्त्वाची कामे करा',
      bn: 'কম ধোঁয়ার সময়ে জরুরি কাজ করুন',
    },
    shut_windows_smog: {
      en: 'Keep windows and doors shut',
      hi: 'खिड़कियां और दरवाज़े बंद रखें',
      mr: 'खिडक्या आणि दारे बंद ठेवा',
      bn: 'জানালা ও দরজা বন্ধ রাখুন',
    },
    windows_doors_closed: {
      en: 'Keep windows and doors shut',
      hi: 'खिड़कियां और दरवाज़े बंद रखें',
      mr: 'खिडक्या आणि दारे बंद ठेवा',
      bn: 'জানালা ও দরজা বন্ধ রাখুন',
    },
    bedroom_sanctuary: {
      en: 'Create bedroom clean-air sanctuary',
      hi: 'शयनकक्ष को साफ़ हवा का कमरा बनाएं',
      mr: 'झोपण्याच्या खोलीत स्वच्छ हवा ठेवा',
      bn: 'শোবার ঘরে পরিচ্ছন্ন বাতাস রাখুন',
    },
    bedroom_door_towel: {
      en: 'Block door gaps with towels',
      hi: 'दरवाजे के नीचे तौलिया लगाएं',
      mr: 'दाराच्या फटीमध्ये टॉवेल लावा',
      bn: 'দরজার ফাঁকে তোয়ালে দিন',
    },
    diy_box_fan: {
      en: 'Build a DIY box-fan filter',
      hi: 'फिल्टर वाला DIY फैन चलाएं',
      mr: 'फिल्टरसह DIY पंखा वापरा',
      bn: 'ফিল্টারসহ DIY ফ্যান চালান',
    },
    hepa_purifier: {
      en: 'Run a HEPA purifier in room',
      hi: 'कमरे में HEPA प्यूरिफायर चलाएं',
      mr: 'खोलीत HEPA प्युरिफायर चालवा',
      bn: 'ঘরে HEPA পিউরিফায়ার চালান',
    },
    choose_hepa_not_ozone: {
      en: 'Choose HEPA over ionizing purifiers',
      hi: 'ओजोन की जगह HEPA चुनें',
      mr: 'ओझोन ऐवजी HEPA निवडा',
      bn: 'ওজোন এর বদলে HEPA বাছুন',
    },
    switch_to_induction: {
      en: 'Switch to an induction cooktop',
      hi: 'इंडक्शन चूल्हे का इस्तेमाल करें',
      mr: 'इंडक्शन शेगडीचा वापर करा',
      bn: 'ইন্ডাকশন কুকার ব্যবহার করুন',
    },
    seal_gaps_weatherstripping: {
      en: 'Seal door and window gaps',
      hi: 'दरवाज़े और खिड़कियों की दरारें सील करें',
      mr: 'दारे आणि खिडक्यांच्या फटी बंद करा',
      bn: 'দরজা-জানালার ফাঁক বন্ধ করুন',
    },
    n95_mask_errands: {
      en: 'Wear an N95 mask outside',
      hi: 'बाहर जाते समय N95 पहनें',
      mr: 'बाहेर जाताना N95 मास्क वापरा',
      bn: 'বাইরে গেলে N95 মাস্ক পরুন',
    },
    n95_respirator: {
      en: 'Wear an N95 respirator outside',
      hi: 'बाहर जाते समय N95 पहनें',
      mr: 'बाहेर जाताना N95 मास्क वापरा',
      bn: 'বাইरे গেলে N95 मास्क পরুন',
    },
    move_exercise_indoors: {
      en: 'Move workouts indoors today',
      hi: 'कसरत घर के अंदर करें',
      mr: 'व्यायाम घराच्या आतच करा',
      bn: 'শরীরচর্চা ঘরের ভেতরে করুন',
    },
    wet_mop_no_broom: {
      en: 'Wet mop floors, skip sweeping',
      hi: 'गीला पोछा लगाएं, झाड़ू नहीं',
      mr: 'ओला बोळा फिरवा, झाडू नको',
      bn: 'ভিজে कपड़ा দিয়ে মুছুন',
    },
    child_play_school_timing: {
      en: "Keep children's play indoors",
      hi: 'बच्चों का खेल घर में रखें',
      mr: 'मुलांचा खेळ घरातच ठेवा',
      bn: 'বাচ্চাদের খেলা ঘরের ভেতরে রাখুন',
    },
    elderly_clean_room: {
      en: 'Set up clean bedroom sanctuary',
      hi: 'बुजुर्गों का कमरा स्वच्छ रखें',
      mr: 'ज्येष्ठांसाठी स्वच्छ खोली ठेवा',
      bn: 'বয়স্কদের ঘর পরিচ্ছন্ন রাখুন',
    },
    pregnant_sanctuary_filtration: {
      en: 'Keep bedroom air extra clean',
      hi: 'शयनकक्ष की हवा स्वच्छ रखें',
      mr: 'झोपण्याच्या खोलीतील हवा स्वच्छ ठेवा',
      bn: 'শোবার ঘরের বাতাস পরিষ্কার রাখুন',
    },
    pregnant_avoid_smog_errands: {
      en: 'Avoid smog errands, wear N95',
      hi: 'बाहर न जाएं, N95 मास्क पहनें',
      mr: 'बाहेर जाणे टाळा, N95 वापरा',
      bn: 'বাইরে যাওয়া এড়িয়ে চলুন',
    },
    stagger_kitchen_ventilation: {
      en: 'Ventilate kitchen during cooking',
      hi: 'खाना बनाते समय खिड़की खोलें',
      mr: 'स्वयंपाक करताना हवा खेळती ठेवा',
      bn: 'রান্নার সময় ধোঁয়া বের করুন',
    },
  };

  const dictionary = isCleanAir ? cleanDictionary : smogDictionary;
  const item = dictionary[action.id];
  if (item) {
    const native =
      lang === 'hi'
        ? item.hi
        : lang === 'mr'
        ? item.mr
        : lang === 'bn'
        ? item.bn || item.en
        : item.en;
    return { native, en: item.en };
  }

  const words = action.title.split(' ');
  const trimmed = words.slice(0, 6).join(' ');
  return { native: trimmed, en: trimmed };
}

export function AirQualityCard({
  cardRef,
  profile,
  airData,
  currentBand,
  audience = 'whole_family',
  timeDiffMinutes = 1,
  qrCodeDataUrl,
}: AirQualityCardProps) {
  const isEn = profile.language === 'en';
  const lang = profile.language;

  const width = 1080;
  const height = 1350; // Exact 4:5 poster format matching user mock

  // Best outdoor window and WHO calculation
  const bestWindow = getBestOutdoorWindow(airData.hourly);
  const { avgPM2_5, pillText } = computeWhoComparison(airData);

  // Primary displayed PM2.5 metric for today's air (strictly current PM2.5 so it matches Home ring!)
  const displayPM = airData.current.pm2_5;
  const displayAQI = calculateAQIFromPM25(displayPM);

  // Derive active band directly from displayPM so that:
  // 1) The category word (good, satisfactory, moderate, poor, very poor, severe)
  // 2) The hero number (displayPM)
  // 3) The corresponding AQI (displayAQI)
  // 4) Color highlights and recommended actions
  // ALL 100% MATCH AND NEVER CONFLICT!
  const activeBand = getAQIBand(displayPM, lang);
  const palette = BAND_PALETTES[activeBand.key] || BAND_PALETTES.poor;
  const bandColor = palette.bandColor;

  // Outdoor advice & best time window taken strictly from Single Source of Truth outdoorGuidance
  const outdoorInfo = outdoorGuidance(activeBand.key, airData.hourly, audience, profile, lang);
  const level = outdoorInfo.level; // 'go' | 'light-only' | 'avoid'

    // Top 3 plain actions for this air quality band: drop outdoorPositive actions if level is not 'go'
  const rawTopActions = getTop3Actions(profile, activeBand.key, audience);
  let safeActions = (level !== 'go'
    ? rawTopActions.filter((a) => !a.outdoorPositive)
    : rawTopActions
  );

  // Deduplicate so no two cards ever share the same title or action id
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const uniqueSafeActions: ActionItem[] = [];

  const addIfUnique = (action: ActionItem) => {
    if (uniqueSafeActions.length >= 3) return;
    const title = getPlainActionTitle(action, lang, activeBand.key, audience).en.toLowerCase();
    if (!seenIds.has(action.id) && !seenTitles.has(title)) {
      seenIds.add(action.id);
      seenTitles.add(title);
      uniqueSafeActions.push(action);
    }
  };

  for (const a of safeActions) {
    addIfUnique(a);
  }

  if (uniqueSafeActions.length < 3) {
    const allRanked = getFilteredAndRankedActions(profile, activeBand.key, audience)
      .filter((a: ActionItem) => a.evidence_level !== 'Myth' && (level === 'go' || !a.outdoorPositive));
    for (const a of allRanked) {
      if (uniqueSafeActions.length >= 3) break;
      addIfUnique(a);
    }
  }

  const topActions = uniqueSafeActions.slice(0, 3);

  // Formatted date and time matching mock: "Fri 20 Nov · 5:06 pm"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Extract short city name (e.g. "Delhi" from "Delhi, India") for a bold, clean headline matching the mock
  const rawCityName = (profile.city?.name || '').split(',')[0].trim();
  const isGeneric =
    !rawCityName ||
    rawCityName.toLowerCase().includes('current location') ||
    rawCityName.toLowerCase().includes('my current location') ||
    rawCityName.toLowerCase() === 'gps';

  const resolvedNearest = isGeneric
    ? findNearestCatalogCity(profile.city?.lat ?? 28.6139, profile.city?.lon ?? 77.2090)
    : null;

  const cityName = isGeneric ? (resolvedNearest?.name || 'Your City') : rawCityName;
  const countryName =
    profile.city?.country ||
    (profile.city?.name?.includes(',')
      ? profile.city.name.split(',').pop()?.trim()
      : isIndianCity(profile.city)
      ? 'India'
      : '');
  const fullLocation = isGeneric
    ? (resolvedNearest
        ? resolvedNearest.admin && !resolvedNearest.name.toLowerCase().includes(resolvedNearest.admin.toLowerCase())
          ? `${resolvedNearest.name}, ${resolvedNearest.admin}`
          : `${resolvedNearest.name}, ${resolvedNearest.country || 'India'}`
        : 'Your City')
    : profile.city?.name?.includes(',')
    ? profile.city.name
    : countryName
    ? `${profile.city.name}, ${countryName}`
    : profile.city?.name || 'Your City';

  // ================= HEADLINE LOGIC (SIMPLE, EVERYDAY NATURAL WORDS) =================
  let headlineNative: React.ReactNode = null;
  let headlineEn: string = '';

  switch (activeBand.key) {
    case 'good':
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>fresh &amp; clean today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is fresh & clean today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>ताज़ा और साफ़ है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>स्वच्छ आणि छान आहे.</span>
          </span>
        );
      }
      break;

    case 'satisfactory':
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>pleasant today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is pleasant today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>सुखद और अच्छी है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>आल्हाददायक आहे.</span>
          </span>
        );
      }
      break;

    case 'moderate':
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>moderate today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is moderate today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>मध्यम स्तर पर है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>मध्यम आहे.</span>
          </span>
        );
      }
      break;

    case 'poor':
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>poor today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is poor today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>खराब है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>वाईट आहे.</span>
          </span>
        );
      }
      break;

    case 'very_poor':
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>very poor today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is very poor today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>बहुत खराब है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>खूप वाईट आहे.</span>
          </span>
        );
      }
      break;

    case 'severe':
    default:
      headlineNative = (
        <span>
          {cityName}&apos;s air is
          <br />
          <span style={{ color: bandColor }}>hazardous today.</span>
        </span>
      );
      headlineEn = `${cityName}'s air is hazardous today.`;
      if (lang === 'hi') {
        headlineNative = (
          <span>
            {cityName} की हवा आज
            <br />
            <span style={{ color: bandColor }}>खतरनाक है।</span>
          </span>
        );
      } else if (lang === 'mr') {
        headlineNative = (
          <span>
            {cityName} मधील हवा आज
            <br />
            <span style={{ color: bandColor }}>घातक आहे.</span>
          </span>
        );
      }
      break;
  }

  // ================= AUDIENCE GUIDANCE LINE (DERIVED DIRECTLY FROM SINGLE SOURCE OF TRUTH LEVEL) =================
  let lovelyLineEn = '';
  let lovelyLineNative = '';

  if (level === 'go') {
    // Clean & Safe Air (Good, Satisfactory)
    if (audience === 'child') {
      lovelyLineEn = 'A wonderful day for kids to play in the park & run free 🎈';
      lovelyLineNative =
        lang === 'hi'
          ? 'बच्चों के लिए पार्क में खेलने और दौड़ लगाने का प्यारा दिन 🎈'
          : lang === 'mr'
          ? 'मुलांसाठी बागेत खेळण्यासाठी आणि बागडण्यासाठी छान दिवस 🎈'
          : lang === 'bn'
          ? 'বাচ্চাদের জন্য পার্কে খেলাধুলা ও আনন্দের দারুণ দিন 🎈'
          : lang === 'ta'
          ? 'குழந்தைகள் பூங்காவில் மகிழ்ச்சியாக விளையாட அருமையான நாள் 🎈'
          : lang === 'te'
          ? 'పిల్లలు పార్కులో ఆడుకోవడానికి మరియు ఆనందించడానికి చక్కని రోజు 🎈'
          : lovelyLineEn;
    } else if (audience === 'elderly') {
      lovelyLineEn = 'A peaceful day for a gentle garden walk & fresh oxygen 🌸';
      lovelyLineNative =
        lang === 'hi'
          ? 'बुजुर्गों के लिए ताज़ा हवा में हल्की सैर और सुकून का दिन 🌸'
          : lang === 'mr'
          ? 'ज्येष्ठांसाठी बागेत शांत फेरफटका मारण्यासाठी सुंदर दिवस 🌸'
          : lang === 'bn'
          ? 'প্রবীণদের জন্য বাগানে শান্ত হাঁটাচলার সুন্দর দিন 🌸'
          : lang === 'ta'
          ? 'பெரியவர்கள் தோட்டத்தில் அமைதியாக நடைபயிற்சி செய்ய சிறந்த நாள் 🌸'
          : lang === 'te'
          ? 'పెద్దవారు ప్రశాంతంగా తోటలో నడవడానికి అనువైన రోజు 🌸'
          : lovelyLineEn;
    } else if (audience === 'pregnant') {
      lovelyLineEn = 'A soothing day for relaxing daylight walks & calm breathing 🌷';
      lovelyLineNative =
        lang === 'hi'
          ? 'भावी माताओं के लिए धूप में शांत सैर और सुकून भरी सांसों का दिन 🌷'
          : lang === 'mr'
          ? 'गरोदर मातांसाठी शांत वातावरणात चालण्यासाठी सुंदर दिवस 🌷'
          : lang === 'bn'
          ? 'গর্ভবতী মায়েদের জন্য নির্মল আলো-বাতাসে শান্ত হাঁটার দিন 🌷'
          : lang === 'ta'
          ? 'கர்ப்பிணி தாய்மார்கள் அமைதியாக நடைபயிற்சி செய்ய இனிமையான நாள் 🌷'
          : lang === 'te'
          ? 'గర్భిణీ స్త్రీలు ప్రశాంతంగా నడవడానికి ఆహ్లాదకరమైన రోజు 🌷'
          : lovelyLineEn;
    } else if (audience === 'outdoor_worker') {
      lovelyLineEn = 'Clear & crisp air to work, commute, and breathe easily today ☀️';
      lovelyLineNative =
        lang === 'hi'
          ? 'कामकाज और बाहर आने-जाने के लिए साफ हवा और आसान दिन ☀️'
          : lang === 'mr'
          ? 'कामानिमित्त बाहेर पडणाऱ्यांसाठी मोकळी हवा आणि उत्तम दिवस ☀️'
          : lang === 'bn'
          ? 'বাইরে কাজ ও যাতায়াতের জন্য পরিষ্কার বাতাসের অনুকূল দিন ☀️'
          : lang === 'ta'
          ? 'வெளியே வேலை செய்பவர்கள் தடையின்றி சுவாசிக்க நல்ல நாள் ☀️'
          : lang === 'te'
          ? 'బయట పని చేసేవారికి సులభంగా శ్వాస తీసుకోవడానికి మంచి రోజు ☀️'
          : lovelyLineEn;
    } else {
      lovelyLineEn = 'A lovely day for a gentle family stroll & fresh park air 🌿';
      lovelyLineNative =
        lang === 'hi'
          ? 'परिवार के साथ बाहर टहलने और ताज़ा हवा का प्यारा दिन 🌿'
          : lang === 'mr'
          ? 'कुटुंबासोबत फेरफटका मारण्यासाठी आणि ताज्या हवेसाठी सुंदर दिवस 🌿'
          : lang === 'bn'
          ? 'পরিবারের সাথে বাইরে হাঁটার ও নির্মল বাতাসের সুন্দর দিন 🌿'
          : lang === 'ta'
          ? 'குடும்பத்துடன் பூங்காவில் நடைபயிற்சி செய்ய அருமையான நாள் 🌿'
          : lang === 'te'
          ? 'కుటుంబంతో కలిసి పార్కులో నడవడానికి ఆహ్లాదకరమైన రోజు 🌿'
          : lovelyLineEn;
    }
  } else if (level === 'light-only') {
    // Moderate Air (Noticeable dust/smoke - Light physical exertion only!)
    if (audience === 'child') {
      lovelyLineEn = 'Smog is noticeable; keep outdoor play light & move hard sports indoors 🏠';
      lovelyLineNative =
        lang === 'hi'
          ? 'धुआं महसूस हो रहा है; बाहर खेल हल्का रखें और भारी खेल अंदर कराएं 🏠'
          : lang === 'mr'
          ? 'हवेत धूर जाणवत आहे; मैदानी धावपळ कमी ठेवा आणि खेळ घरात घ्या 🏠'
          : lang === 'bn'
          ? 'বাতাসে ধোঁয়া আছে; বাইরে খেলা হালকা রাখুন ও ভারী খেলা ঘরে করুন 🏠'
          : lang === 'ta'
          ? 'காற்றில் புகை உள்ளது; வெளிப்புற விளையாட்டை மிதமாக வைத்து உள்ளரங்கில் விளையாடவும் 🏠'
          : lang === 'te'
          ? 'గాలిలో పొగ ఉంది; బయట ఆటలు తేలికగా ఉంచి ఇంట్లోనే ఆడించండి 🏠'
          : lovelyLineEn;
    } else if (audience === 'elderly') {
      lovelyLineEn = 'Dust may irritate lungs; keep outdoor walks short & leisurely ☕';
      lovelyLineNative =
        lang === 'hi'
          ? 'धूल से फेफड़ों में परेशानी हो सकती है; सैर छोटी और धीमी रखें ☕'
          : lang === 'mr'
          ? 'धुळीमुळे श्वसनाचा त्रास होऊ शकतो; चालणे हलके आणि कमी ठेवा ☕'
          : lang === 'bn'
          ? 'ধুলোয় শ্বাসকষ্ট হতে পারে; হাঁটাচলা অল্প ও ধীর রাখুন ☕'
          : lang === 'ta'
          ? 'தூசியால் சிரமம் ஏற்படலாம்; நடைபயிற்சியை மெதுவாகவும் குறைவாகவும் வைக்கவும் ☕'
          : lang === 'te'
          ? 'ధూళితో శ్వాస ఇబ్బంది కలగవచ్చు; నడకను తక్కువగా మరియు నెమ్మదిగా ఉంచండి ☕'
          : lovelyLineEn;
    } else if (audience === 'pregnant') {
      lovelyLineEn = 'Noticeable smoke outside; rest indoors during busy traffic hours 🌷';
      lovelyLineNative =
        lang === 'hi'
          ? 'बाहर धुआं है; व्यस्त समय में घर के अंदर ही आराम करें 🌷'
          : lang === 'mr'
          ? 'बाहेर धूर जाणवत आहे; गर्दीच्या वेळी घरातच विश्रांती घ्या 🌷'
          : lang === 'bn'
          ? 'বাইরে ধোঁয়া আছে; ব্যস্ত সময়ে ঘরেই বিশ্রাম নিন 🌷'
          : lang === 'ta'
          ? 'வெளியே புகை உள்ளது; போக்குவரத்து நேரங்களில் வீட்டில் ஓய்வெடுக்கவும் 🌷'
          : lang === 'te'
          ? 'బయట పొగ ఉంది; రద్దీ వేళల్లో ఇంట్లోనే విశ్రాంతి తీసుకోండి 🌷'
          : lovelyLineEn;
    } else if (audience === 'outdoor_worker') {
      lovelyLineEn = 'Dust can dry the throat; take regular rest breaks in sheltered spots 🛡️';
      lovelyLineNative =
        lang === 'hi'
          ? 'धूल से गला सूख सकता है; शेड में बीच-बीच में आराम लेते रहें 🛡️'
          : lang === 'mr'
          ? 'धुळीमुळे घसा कोरडा पडू शकतो; सावलीत नियमित विश्रांती घेत काम करा 🛡️'
          : lang === 'bn'
          ? 'ধুলোয় গলা শুকিয়ে যেতে পারে; ছায়াযুক্ত স্থানে নিয়মিত বিরতি নিন 🛡️'
          : lang === 'ta'
          ? 'தூசியால் தொண்டை வறளலாம்; நிழலான இடங்களில் ஓய்வு எடுத்து வேலை செய்யவும் 🛡️'
          : lang === 'te'
          ? 'ధూళితో గొంతు పొడిబారవచ్చు; నీడ ఉన్న ప్రదేశాల్లో విశ్రాంతి తీసుకుంటూ పని చేయండి 🛡️'
          : lovelyLineEn;
    } else {
      lovelyLineEn = 'Air has noticeable dust; keep outdoor time light and gentle 🏡';
      lovelyLineNative =
        lang === 'hi'
          ? 'हवा में धूल-धुआं है; बाहर का समय सीमित और हल्का रखें 🏡'
          : lang === 'mr'
          ? 'हवेत धूर जाणवत आहे; बाहेरील वेळ मर्यादित आणि हलका ठेवा 🏡'
          : lang === 'bn'
          ? 'বাতাসে ধুলোবালি আছে; বাইরে থাকার সময় সংক্ষিপ্ত ও হালকা রাখুন 🏡'
          : lang === 'ta'
          ? 'காற்றில் தூசி உள்ளது; வெளியே இருக்கும் நேரத்தைக் குறைவாக வைக்கவும் 🏡'
          : lang === 'te'
          ? 'గాలిలో ధూళి ఉంది; బయట గడిపే సమయాన్ని తక్కువగా ఉంచండి 🏡'
          : lovelyLineEn;
    }
  } else {
    // Bad Air (Poor, Very Poor, Severe - Level 'avoid')
    if (audience === 'child') {
      lovelyLineEn = 'Keep the little ones smiling with fun indoor games today 🎨';
      lovelyLineNative =
        lang === 'hi'
          ? 'आज नन्हे-मुन्नों को घर के अंदर मजेदार खेलों में व्यस्त रखें 🎨'
          : lang === 'mr'
          ? 'लहान मुलांना आज घरातच आनंददायी खेळांमध्ये रमवा 🎨'
          : lang === 'bn'
          ? 'আজ ছোটদের ঘরের ভেতর মজার খেলায় আনন্দে রাখুন 🎨'
          : lang === 'ta'
          ? 'குழந்தைகளை இன்று வீட்டிற்குள் விளையாட வைத்து மகிழுங்கள் 🎨'
          : lang === 'te'
          ? 'పిల్లలను ఈ రోజు ఇంట్లోనే ఇష్టమైన ఆటలతో సంతోషంగా ఉంచండి 🎨'
          : lovelyLineEn;
    } else if (audience === 'elderly') {
      lovelyLineEn = 'A cozy day for seniors to rest indoors with warm comfort ☕';
      lovelyLineNative =
        lang === 'hi'
          ? 'बुजुर्गों के लिए घर के अंदर आराम और सुकून भरा दिन ☕'
          : lang === 'mr'
          ? 'ज्येष्ठांसाठी आज घरातच शांत विश्रांती घेण्याचा दिवस ☕'
          : lang === 'bn'
          ? 'প্রবীণদের জন্য আজ ঘরে উষ্ণ ও শান্ত বিশ্রামের দিন ☕'
          : lang === 'ta'
          ? 'பெரியவர்கள் இன்று வீட்டிற்குள் ஓய்வெடுக்க சிறந்த நாள் ☕'
          : lang === 'te'
          ? 'పెద్దవారు ఈ రోజు ఇంట్లోనే ప్రశాंतంగా విశ్రాంతి తీసుకోండి ☕'
          : lovelyLineEn;
    } else if (audience === 'pregnant') {
      lovelyLineEn = 'Protecting mother and baby with clean, filtered indoor air 🤱';
      lovelyLineNative =
        lang === 'hi'
          ? 'मां और नन्हे शिशु की सुरक्षा के लिए घर की हवा साफ रखें 🤱'
          : lang === 'mr'
          ? 'आई आणि बाळाच्या आरोग्यासाठी घरातील हवा शुद्ध ठेवा 🤱'
          : lang === 'bn'
          ? 'মা ও সন্তানের সুরক্ষায় ঘরের বাতাস পরিষ্কার রাখুন 🤱'
          : lang === 'ta'
          ? 'தாயும் சேயும் நலமாக இருக்க வீட்டின் காற்றை சுத்தமாக வையுங்கள் 🤱'
          : lang === 'te'
          ? 'తల్లీ బిడ్డల ఆరోగ్యం కోసం ఇంట్లోని గాలిని శుభ్రంగా ఉంచండి 🤱'
          : lovelyLineEn;
    } else if (audience === 'outdoor_worker') {
      lovelyLineEn = 'Stay guarded with a snug N95 mask while you work outdoors 🛡️';
      lovelyLineNative =
        lang === 'hi'
          ? 'बाहर काम करते समय अच्छी फिटिंग वाला N95 मास्क अवश्य पहनें 🛡️'
          : lang === 'mr'
          ? 'घराबाहेर काम करताना सुरक्षित राहण्यासाठी N95 मास्क वापरा 🛡️'
          : lang === 'bn'
          ? 'বাইরে কাজের সময় ভালো ফিটিং যুক্ত N95 মাস্ক ব্যবহার করুন 🛡️'
          : lang === 'ta'
          ? 'வெளியே வேலை செய்யும் போது N95 முகக்கவசம் அணியுங்கள் 🛡️'
          : lang === 'te'
          ? 'బయట పని చేసేటప్పుడు తప్పనిసరిగా N95 మాస్క్ ధరించండి 🛡️'
          : lovelyLineEn;
    } else {
      lovelyLineEn = 'Keep your loved ones safe & well-protected indoors today 🏡';
      lovelyLineNative =
        lang === 'hi'
          ? 'आज अपनों को घर के अंदर सुरक्षित और शांत रखें 🏡'
          : lang === 'mr'
          ? 'आज प्रियजनांना घरात सुरक्षित आणि शांत ठेवा 🏡'
          : lang === 'bn'
          ? 'আজ পরিবারের সবাইকে ঘরের ভেতরে সুরক্ষিত রাখুন 🏡'
          : lang === 'ta'
          ? 'இன்று அன்பானவர்களை வீட்டிற்குள் பாதுகாப்பாக வையுங்கள் 🏡'
          : lang === 'te'
          ? 'ఈ రోజు మీ కుటుంబ సభ్యులను ఇంట్లోనే సురక్షితంగా ఉంచండి 🏡'
          : lovelyLineEn;
    }
  }

  const outdoorPrefix = lang === 'hi' ? 'बाहर जाने की सलाह: ' : lang === 'mr' ? 'घराबाहेर जाण्याचा सल्ला: ' : 'Outdoor advice: ';
  const outdoorAdviceEn = `Outdoor advice: ${outdoorInfo.guidance}`;
  const outdoorAdviceNative = isEn
    ? outdoorAdviceEn
    : `${outdoorPrefix}${outdoorInfo.guidanceNative}`;
  const bestTimeEn = outdoorInfo.bestTime.bestTimeText;
  const bestTimeNative = isEn
    ? bestTimeEn
    : outdoorInfo.bestTime.bestTimeNativeText;

  return (
    <div
      ref={cardRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#FAF7F2',
        color: '#0F172A',
        padding: '46px 56px 38px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'relative',
        borderRadius: '36px',
        border: '2px solid #EAE5DE',
        fontFamily:
          'var(--font-sans), "Noto Sans Devanagari", "Noto Sans Bengali", system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Soft warm circular organic background shapes matching the user mock */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-60px',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(254, 215, 170, 0.45) 0%, rgba(250, 247, 242, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          right: '-100px',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(254, 215, 170, 0.3) 0%, rgba(250, 247, 242, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ================= 1. HEADER ================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left: Logo mark and clearhale wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '62px',
              height: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/brand/logo.png"
              alt="Clearhale"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              fontSize: '44px',
              fontWeight: 800,
              color: '#0D5C52',
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}
          >
            clearhale
          </div>
        </div>

        {/* Right: Full City Location and formatted date/time */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.3px',
              lineHeight: 1.15,
            }}
          >
            {fullLocation}
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#64748B',
              fontWeight: 600,
              marginTop: '4px',
            }}
          >
            {dateStr} · {timeStr}
          </div>

          {/* Honest status label */}
          {(airData.isDemo || airData.isCached) && (
            <div style={{ marginTop: '6px' }}>
              {airData.isDemo ? (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#B45309',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                  }}
                >
                  Demo data
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#64748B',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                  }}
                >
                  Old data, {timeDiffMinutes} min ago
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. HEADLINE & SUBHEAD ================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '6px 0 2px',
        }}
      >
        <h1
          style={{
            fontSize: '76px',
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-1.5px',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          {headlineNative}
        </h1>

        {!isEn && headlineEn && (
          <p
            style={{
              fontSize: '30px',
              fontWeight: 600,
              color: '#475569',
              margin: '6px 0 0 0',
              lineHeight: 1.25,
            }}
          >
            {headlineEn}
          </p>
        )}

        {/* Lovely line: Must finish in ONE line only */}
        <div
          style={{
            marginTop: '10px',
            fontSize: '32px',
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lovelyLineNative}
        </div>
        {!isEn && lovelyLineEn !== lovelyLineNative && (
          <div
            style={{
              fontSize: '22px',
              color: '#64748B',
              fontWeight: 500,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lovelyLineEn}
          </div>
        )}

        {/* When air is clean ('go'): Best time outside line sits directly below lovely line */}
        {level === 'go' && (
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#475569',
                lineHeight: 1.3,
              }}
            >
              {bestTimeNative}
            </div>
            {!isEn && bestTimeEn !== bestTimeNative && (
              <div
                style={{
                  fontSize: '21px',
                  color: '#64748B',
                  fontWeight: 500,
                  marginTop: '2px',
                }}
              >
                {bestTimeEn}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 3. STAT BLOCK ================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          border: '1.5px solid rgba(226, 232, 240, 0.85)',
          padding: '22px 32px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Left: Large PM2.5 and paired AQI Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '116px',
                fontWeight: 900,
                color: bandColor,
                lineHeight: 0.95,
                letterSpacing: '-2px',
              }}
            >
              {displayPM}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#475569',
                  lineHeight: 1.1,
                }}
              >
                µg/m³
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#64748B',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                PM2.5 · Current
              </span>
            </div>
          </div>

          {/* Clean, prominent Category & AQI Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: (activeBand.label || '').length > 10 ? '8px 18px' : '10px 22px',
              borderRadius: '18px',
              backgroundColor: palette.pillBg,
              border: `2px solid ${palette.borderHex}`,
              minWidth: '140px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize:
                  (activeBand.label || '').replace(/\s*\([^)]*\)/g, '').trim().length > 11
                    ? '22px'
                    : (activeBand.label || '').replace(/\s*\([^)]*\)/g, '').trim().length > 8
                    ? '24px'
                    : '26px',
                fontWeight: 800,
                color: bandColor,
                letterSpacing: '-0.2px',
                lineHeight: 1.15,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {(activeBand.label || '').replace(/\s*\([^)]*\)/g, '').trim() || activeBand.label}
            </span>
            <span
              style={{
                fontSize: '21px',
                fontWeight: 800,
                color: bandColor,
                opacity: 0.9,
                letterSpacing: '0.2px',
                marginTop: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              AQI {displayAQI}
            </span>
          </div>
        </div>

        {/* Right: WHO Pill & Reference Notes */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            textAlign: 'right',
            gap: '6px',
          }}
        >
          {/* WHO Comparison Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: palette.pillBg,
              color: bandColor,
              border: `2px solid ${palette.borderHex}`,
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.2px',
            }}
          >
            {pillText}
          </div>

          <div
            style={{
              fontSize: '21px',
              fontWeight: 500,
              color: '#64748B',
              marginTop: '4px',
            }}
          >
            WHO 24h limit: 15 µg/m³
          </div>
          <div
            style={{
              fontSize: '21px',
              color: '#475569',
              fontWeight: 600,
            }}
          >
            24h avg: {avgPM2_5} µg/m³ (AQI {calculateAQIFromPM25(avgPM2_5)})
          </div>
        </div>
      </div>

      {/* When air is moderate or bad (level !== 'go'): Outdoor advice line is placed below the numbers box */}
      {level !== 'go' && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '12px 24px',
            borderRadius: '18px',
            backgroundColor: palette.pillBg,
            border: `1.5px solid ${palette.borderHex}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '10px',
            marginBottom: '2px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={bandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: bandColor,
                lineHeight: 1.25,
              }}
            >
              {outdoorAdviceNative}
            </div>
            {!isEn && outdoorAdviceEn !== outdoorAdviceNative && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#64748B',
                  fontWeight: 500,
                  marginTop: '2px',
                }}
              >
                {outdoorAdviceEn}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. DO THIS TODAY ================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          margin: '6px 0',
        }}
      >
        <div
          style={{
            paddingLeft: '4px',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
            }}
          >
            Do this today
          </span>
        </div>

        {topActions.map((action, idx) => {
          const shortTitles = getPlainActionTitle(action, lang, activeBand.key, audience);
          const costBadgeStyle =
            action.cost_tier === 'Free'
              ? {
                  bg: '#ECFDF5',
                  color: '#059669',
                  border: '#A7F3D0',
                  label: 'Free',
                }
              : action.cost_tier === 'Low-cost'
              ? {
                  bg: '#FFFBEB',
                  color: '#D97706',
                  border: '#FDE68A',
                  label: 'Low-cost',
                }
              : {
                  bg: '#EFF6FF',
                  color: '#2563EB',
                  border: '#BFDBFE',
                  label: 'If you can afford',
                };

          return (
            <div
              key={action.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                border: '1.5px solid rgba(226, 232, 240, 0.85)',
                padding: '16px 26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1.5px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '30px',
                      fontWeight: 700,
                      color: '#0F172A',
                      lineHeight: 1.25,
                    }}
                  >
                    {shortTitles.native}
                  </div>
                  {!isEn && shortTitles.en !== shortTitles.native && (
                    <div
                      style={{
                        fontSize: '22px',
                        color: '#64748B',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      {shortTitles.en}
                    </div>
                  )}
                </div>
              </div>

              <span
                style={{
                  padding: '8px 22px',
                  borderRadius: '9999px',
                  backgroundColor: costBadgeStyle.bg,
                  color: costBadgeStyle.color,
                  border: `1.5px solid ${costBadgeStyle.border}`,
                  fontSize: '22px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {costBadgeStyle.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ================= 5. FOOTER ================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#64748B',
              lineHeight: 1.2,
            }}
          >
            Check your city&apos;s air
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#0D5C52',
              letterSpacing: '-0.3px',
              marginTop: '4px',
            }}
          >
            clearhale-vercel.vercel.app
          </div>
        </div>

        {/* Right: Small Client-Side QR Code */}
        {qrCodeDataUrl ? (
          <div
            style={{
              width: '116px',
              height: '116px',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1.5px solid #E2E8F0',
              padding: '6px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={qrCodeDataUrl}
              alt="QR Code clearhale-vercel.vercel.app"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '116px',
              height: '116px',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            QR
          </div>
        )}
      </div>
    </div>
  );
}
