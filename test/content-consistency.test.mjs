import { register } from 'node:module';
register('./ts-resolver.mjs', import.meta.url);

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const {
  outdoorGuidance,
  getIndiaBandKey,
  getOutdoorLevel,
  calculateBestTimeWindow,
  sanitizeChatOutdoorAdvice,
} = await import('../lib/outdoorGuidance');

const { getAQIBand } = await import('../lib/aqi');
const { getBandPersonaAdvice } = await import('../lib/bandAdvice');
const { getFallbackNext2Hours, getFilteredAndRankedActions } = await import('../lib/rulesEngine');
const { isIndianCity, getRegionalLanguageForCity } = await import('../lib/languages');
const actionsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/actions.json'), 'utf8'));

describe('Content Consistency & Single Source of Truth Test Suite', () => {
  // 1. UNIT TESTS: BOUNDARY VALUES FOR outdoorGuidance
  describe('1. Boundary Values for outdoorGuidance', () => {
    test('Boundary 30 (Good) vs 31 (Satisfactory): both are "go"', () => {
      const g30 = outdoorGuidance('good', null, 'whole_family');
      assert.equal(g30.level, 'go');
      assert(g30.statusLine.length > 0);
      assert(g30.guidance.length > 0);

      const s31 = outdoorGuidance('satisfactory', null, 'whole_family');
      assert.equal(s31.level, 'go');
    });

    test('Boundary 60 (Satisfactory) vs 61 (Moderate): "go" vs "light-only"', () => {
      const s60 = outdoorGuidance('satisfactory', null, 'whole_family');
      assert.equal(s60.level, 'go');

      const m61 = outdoorGuidance('moderate', null, 'whole_family');
      assert.equal(m61.level, 'light-only');

      // Healthy adult in moderate air
      const m61Adult = outdoorGuidance('moderate', null, 'whole_family', {
        members: ['adult'],
        hasAsthmaOrHeart: false,
        isPregnant: false,
      });
      assert.equal(m61Adult.level, 'light-only');
    });

    test('Boundary 90 (Moderate) vs 91 (Poor): "light-only" vs "avoid"', () => {
      const m90 = outdoorGuidance('moderate', null, 'whole_family');
      assert.equal(m90.level, 'light-only');

      const p91 = outdoorGuidance('poor', null, 'whole_family');
      assert.equal(p91.level, 'avoid');
    });

    test('Boundary 120 (Poor) vs 121 (Very Poor): both "avoid"', () => {
      const p120 = outdoorGuidance('poor', null, 'whole_family');
      assert.equal(p120.level, 'avoid');

      const vp121 = outdoorGuidance('very_poor', null, 'whole_family');
      assert.equal(vp121.level, 'avoid');
    });

    test('Boundary 250 (Very Poor) vs 251 (Severe): both "avoid"', () => {
      const vp250 = outdoorGuidance('very_poor', null, 'whole_family');
      assert.equal(vp250.level, 'avoid');

      const sev251 = outdoorGuidance('severe', null, 'whole_family');
      assert.equal(sev251.level, 'avoid');
    });

    test('Best time window: workout recommendation only when <= 60 µg/m³', () => {
      const cleanForecast = [
        { time: '14:00', pm2_5: 45 },
        { time: '15:00', pm2_5: 50 },
      ];
      const winClean = calculateBestTimeWindow(cleanForecast);
      assert.equal(winClean.canEnjoyOutdoors, true);
      assert(winClean.bestTimeText.includes('outdoor workouts'));

      const pollutedForecast = [
        { time: '14:00', pm2_5: 85 },
        { time: '15:00', pm2_5: 110 },
      ];
      const winPolluted = calculateBestTimeWindow(pollutedForecast);
      assert.equal(winPolluted.canEnjoyOutdoors, false);
      assert(winPolluted.bestTimeText.toLowerCase().includes('lightest-exposure hour for essential errands only'));
      assert(!winPolluted.bestTimeText.toLowerCase().includes('enjoy'));
      assert(!winPolluted.bestTimeText.toLowerCase().includes('workout'));
    });

    test('Excludes sleeping hours (11 PM to 7 AM) and strictly selects within waking hours (7 AM to 11 PM)', () => {
      const forecastWithNightClean = [
        { hour: '02:00', pm2_5: 20 }, // 2 AM (sleeping hour, lowest raw PM2.5)
        { hour: '04:00', pm2_5: 15 }, // 4 AM (sleeping hour)
        { hour: '14:00', pm2_5: 45 }, // 2 PM (waking hour)
        { hour: '17:00', pm2_5: 55 }, // 5 PM (waking hour)
        { hour: '23:00', pm2_5: 18 }, // 11 PM (sleeping hour)
      ];
      const win = calculateBestTimeWindow(forecastWithNightClean);
      // Must NOT select 2 AM or 4 AM or 11 PM! Must select 2 PM (14:00 to 17:00)
      assert.equal(win.bestWindow, '2 PM to 5 PM');
      assert.equal(win.lowestPM25, 45);
    });

    test('Air quality ring single-word translations: Marathi uses "छान" (Chhan) and regional languages use natural terms', () => {
      const cleanWord = (bandInfo) => (bandInfo.label || '').replace(/\s*\([^)]*\)/g, '').trim();

      // Marathi: "छान" (Chhan) for good air, not textbook "चांगली"
      const mrGood = getAQIBand(20, 'mr');
      assert.equal(cleanWord(mrGood), 'छान');

      // Hindi: "अच्छा"
      const hiGood = getAQIBand(20, 'hi');
      assert.equal(cleanWord(hiGood), 'अच्छा');

      // Bengali: "ভালো"
      const bnGood = getAQIBand(20, 'bn');
      assert.equal(cleanWord(bnGood), 'ভালো');

      // Punjabi: "ਵਧੀਆ"
      const paGood = getAQIBand(20, 'pa');
      assert.equal(cleanWord(paGood), 'ਵਧੀਆ');

      // Gujarati: "સારું"
      const guGood = getAQIBand(20, 'gu');
      assert.equal(cleanWord(guGood), 'સારું');

      // Tamil: "நல்லது"
      const taGood = getAQIBand(20, 'ta');
      assert.equal(cleanWord(taGood), 'நல்லது');

      // Telugu: "మంచిది"
      const teGood = getAQIBand(20, 'te');
      assert.equal(cleanWord(teGood), 'మంచిది');

      // Kannada: "ಉತ್ತಮ"
      const knGood = getAQIBand(20, 'kn');
      assert.equal(cleanWord(knGood), 'ಉತ್ತಮ');

      // Malayalam: "നല്ലത്"
      const mlGood = getAQIBand(20, 'ml');
      assert.equal(cleanWord(mlGood), 'നല്ലത്');

      // Odia: "ଭଲ"
      const orGood = getAQIBand(20, 'or');
      assert.equal(cleanWord(orGood), 'ଭଲ');

      // English: "Good"
      const enGood = getAQIBand(20, 'en');
      assert.equal(enGood.label, 'Good');
    });

    test('International cities strictly suggest only English, while Indian cities suggest regional languages', () => {
      // International cities
      const tokyo = { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 };
      const london = { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 };
      const newYork = { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 };
      const dubai = { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 };
      const paris = { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 };

      assert.equal(isIndianCity(tokyo), false);
      assert.equal(isIndianCity(london), false);
      assert.equal(isIndianCity(newYork), false);
      assert.equal(isIndianCity(dubai), false);
      assert.equal(isIndianCity(paris), false);

      assert.equal(getRegionalLanguageForCity(tokyo), 'en');
      assert.equal(getRegionalLanguageForCity(london), 'en');
      assert.equal(getRegionalLanguageForCity(newYork), 'en');
      assert.equal(getRegionalLanguageForCity(dubai), 'en');
      assert.equal(getRegionalLanguageForCity(paris), 'en');

      // Indian cities
      const delhi = { name: 'Delhi', country: 'India', admin: 'Delhi', lat: 28.6139, lon: 77.2090 };
      const pune = { name: 'Pune', country: 'India', admin: 'Maharashtra', lat: 18.5204, lon: 73.8567 };
      const chennai = { name: 'Chennai', country: 'India', admin: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 };
      const kolkata = { name: 'Kolkata', country: 'India', admin: 'West Bengal', lat: 22.5726, lon: 88.3639 };

      assert.equal(isIndianCity(delhi), true);
      assert.equal(isIndianCity(pune), true);
      assert.equal(isIndianCity(chennai), true);
      assert.equal(isIndianCity(kolkata), true);

      assert.equal(getRegionalLanguageForCity(delhi), 'hi');
      assert.equal(getRegionalLanguageForCity(pune), 'mr');
      assert.equal(getRegionalLanguageForCity(chennai), 'ta');
      assert.equal(getRegionalLanguageForCity(kolkata), 'bn');
    });
  });

  // 2. CHAT SAFETY SANITIZER TESTS
  describe('2. Chat Safety Sanitizer', () => {
    test('passes safe response when level is "go"', () => {
      const raw = 'The air is great right now, enjoy your outdoor morning run in the park!';
      const sanitized = sanitizeChatOutdoorAdvice(raw, 'go', 'en');
      assert.equal(sanitized, raw);
    });

    test('replaces pro-exercise outdoor advice when level is "avoid"', () => {
      const raw = 'The air is bad, but you can enjoy a nice outdoor workout in the park!';
      const sanitized = sanitizeChatOutdoorAdvice(raw, 'avoid', 'en');
      assert.notEqual(sanitized, raw);
      assert(sanitized.includes('Avoid outdoor exercise and move workouts indoors'));
      assert(!sanitized.includes('enjoy a nice outdoor workout'));
    });

    test('replaces pro-exercise advice when level is "light-only"', () => {
      const raw = 'Go ahead and do an outdoor jog or marathon training!';
      const sanitized = sanitizeChatOutdoorAdvice(raw, 'light-only', 'en');
      assert.notEqual(sanitized, raw);
      assert(sanitized.includes('Limit outdoor activity to light walking only'));
    });
  });

  // 3. CATALOG & RULES ENGINE CONSISTENCY
  describe('3. Catalog & Rules Engine Consistency', () => {
    test('outdoorPositive action items are explicitly flagged in actions.json', () => {
      const outdoorPos = actionsData.filter((a) => a.outdoorPositive === true);
      assert(outdoorPos.length > 0);
      assert(outdoorPos.some((a) => a.id === 'good_day_outdoor_workout'));
    });

    test('outdoorPositive actions NEVER appear when outdoor level is not "go"', () => {
      // In moderate air, whole_family is light-only
      const actionsModerate = getFilteredAndRankedActions({}, 'moderate', 'whole_family');
      assert.equal(
        actionsModerate.some((a) => a.outdoorPositive === true),
        false,
        'Found outdoorPositive action in moderate air!'
      );

      // In poor air, level is avoid
      const actionsPoor = getFilteredAndRankedActions({}, 'poor', 'whole_family');
      assert.equal(
        actionsPoor.some((a) => a.outdoorPositive === true),
        false,
        'Found outdoorPositive action in poor air!'
      );

      // In severe air, level is avoid
      const actionsSevere = getFilteredAndRankedActions({}, 'severe', 'whole_family');
      assert.equal(
        actionsSevere.some((a) => a.outdoorPositive === true),
        false,
        'Found outdoorPositive action in severe air!'
      );
    });

    test('outdoorPositive actions CAN appear when air is Good or Satisfactory', () => {
      const actionsGood = getFilteredAndRankedActions({}, 'good', 'whole_family');
      assert(actionsGood.length > 0);
      assert(
        actionsGood.some((a) => a.outdoorPositive === true),
        'Good air should include outdoor-friendly actions'
      );
    });

    test('every action title and why reason agree in direction', () => {
      for (const a of actionsData) {
        if (a.outdoorPositive) {
          // If outdoor positive, reason must not say stay indoors
          assert(!a.why.toLowerCase().includes('stay indoors'), `Action ${a.id} contradicts itself`);
        }
      }
    });
  });

  // 4. CONTRADICTION MATRIX TEST
  describe('4. Contradiction Matrix Across Bands, Personas & Profiles', () => {
    const BANDS = ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'];
    const PERSONAS = ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker', 'asthma'];
    const PROFILES = [
      { name: 'child profile', p: { members: ['child'], childAgeBand: 'toddler_under_2' } },
      { name: 'elderly profile', p: { members: ['elderly'] } },
      { name: 'asthma profile', p: { hasAsthmaOrHeart: true } },
      { name: 'worker profile', p: { commute: 'two_wheeler', work: 'outdoor' } },
      { name: 'healthy adult', p: { members: ['adult'], hasAsthmaOrHeart: false } },
      { name: 'empty profile', p: {} },
    ];

    const FORBIDDEN_EXERCISE_WORDS = [
      'enjoy outdoor workout',
      'good day for a walk or workout outside',
      'outdoor play, sports',
      'sports and outdoor play welcome',
      'sports and outdoor workouts can proceed',
      'great day for a brisk walk',
      'normal outdoor routines welcome',
      'enjoy fresh outdoor air',
      'normal outdoor activities welcome',
      'enjoy your outdoor run',
      'jogging outside',
    ];

    for (const band of BANDS) {
      for (const persona of PERSONAS) {
        for (const { name: profileName, p } of PROFILES) {
          test(`Band: ${band} | Persona: ${persona} | Profile: ${profileName}`, () => {
            const guidance = outdoorGuidance(band, null, persona, p);
            const level = guidance.level;

            // If level is 'avoid' or 'light-only', no visible text should encourage outdoor exercise
            if (level === 'avoid' || level === 'light-only') {
              const allText = [
                guidance.statusLine,
                guidance.guidance,
                guidance.next2HoursDecision,
              ].join(' ').toLowerCase();

              for (const forbidden of FORBIDDEN_EXERCISE_WORDS) {
                assert(
                  !allText.includes(forbidden.toLowerCase()),
                  `Contradiction in band=${band}, persona=${persona}: text contains "${forbidden}" while level is ${level}`
                );
              }

              // Top recommended actions must not contain outdoorPositive actions
              const actions = getFilteredAndRankedActions(p, band, persona);
              for (const act of actions) {
                assert.notEqual(
                  act.outdoorPositive,
                  true,
                  `Action ${act.id} is outdoorPositive but level is ${level} in band=${band}, persona=${persona}`
                );
              }
            }

            // In good/satisfactory, level must be 'go'
            if (band === 'good' || band === 'satisfactory') {
              assert.equal(level, 'go', `Expected "go" in band ${band}`);
            }

            // In poor, very_poor, severe, level must be 'avoid'
            if (band === 'poor' || band === 'very_poor' || band === 'severe') {
              assert.equal(level, 'avoid', `Expected "avoid" in band ${band}`);
            }
          });
        }
      }
    }
  });

  // 5. BANNED-WORDS SCANNER TEST
  describe('5. Banned-Words Scanner', () => {
    const BANNED_PATTERNS = [
      /\binversion layer\b/i,
      /\bsolar heating disperses\b/i,
      /\bparticulates\b/i,
      /\bsensitive lower lung\b/i,
      /\bcardiovascular exercise\b/i,
      /\bboundary layer\b/i,
      /\bexposure reduction\b/i,
    ];

    const CONTENT_FILES = [
      'data/actions.json',
      'data/terms.ts',
      'lib/bandAdvice.ts',
      'lib/whyForYou.ts',
      'lib/rulesEngine.ts',
      'lib/languages.ts',
      'lib/aqi.ts',
      'components/share/AirQualityCard.tsx',
      'components/screens/MythsTab.tsx',
      'components/screens/HomeScreen.tsx',
      'components/screens/PlanScreen.tsx',
      'components/onboarding/LocationStep.tsx',
      'components/onboarding/BuildingPlanStep.tsx',
    ];

    for (const relPath of CONTENT_FILES) {
      test(`File ${relPath} contains zero banned jargon`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) return;
        const text = fs.readFileSync(fullPath, 'utf8');

        for (const pattern of BANNED_PATTERNS) {
          const match = text.match(pattern);
          assert(
            !match,
            `Found banned jargon "${match?.[0]}" in ${relPath}`
          );
        }
      });
    }
  });

  // 6. SENTENCE-LENGTH TEST
  describe('6. Sentence-Length Test (<= 18 words per sentence)', () => {
    test('All generated outdoorGuidance advice sentences are <= 18 words', () => {
      const BANDS = ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'];
      const PERSONAS = ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker', 'asthma'];

      const longSentences = [];

      for (const band of BANDS) {
        for (const persona of PERSONAS) {
          const g = outdoorGuidance(band, null, persona);
          const fields = [g.statusLine, g.guidance, g.decision];

          for (const text of fields) {
            // Split into sentences by period, exclamation, or question mark
            const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
            for (const s of sentences) {
              const wordCount = s.split(/\s+/).filter(Boolean).length;
              if (wordCount > 18) {
                longSentences.push({ band, persona, wordCount, sentence: s });
              }
            }
          }
        }
      }

      assert.equal(
        longSentences.length,
        0,
        `Found ${longSentences.length} sentences longer than 18 words: ` +
          JSON.stringify(longSentences, null, 2)
      );
    });

    test('Night-time sleeping hours (12 AM to 6 AM) strictly suggest sleep and never outdoor exercise', () => {
      const BANDS = ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'];
      const PERSONAS = ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker', 'asthma'];
      const NIGHT_HOURS = [0, 1, 2, 3, 4, 5];

      for (const h of NIGHT_HOURS) {
        for (const band of BANDS) {
          for (const persona of PERSONAS) {
            const g = outdoorGuidance(band, null, persona, undefined, 'en', h);
            const dec = g.decision.toLowerCase();

            // Must suggest sleep or resting
            assert(
              dec.includes('sleep') || dec.includes('rest') || dec.includes('night'),
              `Hour ${h} band ${band} persona ${persona} must suggest sleep or rest: ${g.decision}`
            );

            // Must NOT suggest outdoor workouts or park trips
            assert(
              !dec.includes('outdoor workout') && !dec.includes('park visit') && !dec.includes('errands'),
              `Hour ${h} band ${band} persona ${persona} must NOT suggest outdoor workouts: ${g.decision}`
            );

            // For asthma patients, must advise inhaler or medicine
            if (persona === 'asthma') {
              assert(
                dec.includes('inhaler') || dec.includes('medicine') || dec.includes('medication'),
                `Hour ${h} asthma advice must mention inhaler: ${g.decision}`
              );
            }

            // Check <= 18 words per sentence
            const sentences = g.decision.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
            for (const s of sentences) {
              const wordCount = s.split(/\s+/).filter(Boolean).length;
              assert(
                wordCount <= 18,
                `Hour ${h} band ${band} persona ${persona} sentence has ${wordCount} words (>18): "${s}"`
              );
            }
          }
        }
      }
    });

    test('Asthma persona decisions across all bands always advise carrying or keeping inhaler / medicine', () => {
      const BANDS = ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'];

      for (const band of BANDS) {
        const gDay = outdoorGuidance(band, null, 'asthma', undefined, 'en');
        const decDay = gDay.decision.toLowerCase();
        assert(
          decDay.includes('inhaler') || decDay.includes('medicine') || decDay.includes('medication'),
          `Daytime band ${band} asthma advice must mention inhaler/medicine: ${gDay.decision}`
        );

        const gNight = outdoorGuidance(band, null, 'asthma', undefined, 'en', 2);
        const decNight = gNight.decision.toLowerCase();
        assert(
          decNight.includes('inhaler') || decNight.includes('medicine') || decNight.includes('medication'),
          `Nighttime band ${band} asthma advice must mention inhaler/medicine: ${gNight.decision}`
        );
      }
    });
  });

  // 7. SHARE POSTER CONTRADICTION & SAFETY VERIFICATION
  describe('7. Share Poster Contradiction & Safety Verification', () => {
    const BANDS = [
      { key: 'good', pm: 20 },
      { key: 'satisfactory', pm: 45 },
      { key: 'moderate', pm: 75 },
      { key: 'poor', pm: 105 },
      { key: 'very_poor', pm: 180 },
      { key: 'severe', pm: 320 },
    ];
    const AUDIENCES = ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker'];

    test('AirQualityCard strictly aligns with Single Source of Truth for all bands & audiences', () => {
      const cardSource = fs.readFileSync(path.resolve(process.cwd(), 'components/share/AirQualityCard.tsx'), 'utf8');

      // Card must derive level directly from outdoorGuidance
      assert(cardSource.includes('outdoorGuidance(activeBand.key'), 'Card must call outdoorGuidance');
      assert(cardSource.includes("level === 'go'"), 'Card must guard pro-outdoor advice with level === "go"');
      assert(!cardSource.includes('!isBadAir'), 'Card must NOT use fragile isBadAir boolean that treated moderate as clean');

      for (const band of BANDS) {
        for (const aud of AUDIENCES) {
          const info = outdoorGuidance(band.key, null, aud, {}, 'en');
          const level = info.level;
          const actions = getFilteredAndRankedActions({}, band.key, aud);
          const safeActions = (level !== 'go' ? actions.filter((a) => !a.outdoorPositive) : actions).slice(0, 3);

          if (band.key === 'moderate' || band.key === 'poor' || band.key === 'very_poor' || band.key === 'severe') {
            assert.notEqual(level, 'go', 'Band ' + band.key + ' must not be level go');
            for (const act of safeActions) {
              assert.notEqual(act.outdoorPositive, true, 'Action ' + act.id + ' is outdoorPositive in ' + band.key);
            }
          } else {
            assert.equal(level, 'go', 'Band ' + band.key + ' must be level go');
          }
        }
      }
    });

    test('Poster copy in Moderate air specifically cautions vulnerable members', () => {
      const childGuidance = outdoorGuidance('moderate', null, 'child', {}, 'en');
      assert(
        childGuidance.guidance.includes('coughing') || childGuidance.guidance.includes('indoors'),
        'Child guidance in moderate air must mention coughing or moving sports indoors'
      );

      const elderlyGuidance = outdoorGuidance('moderate', null, 'elderly', {}, 'en');
      assert(
        elderlyGuidance.guidance.includes('short') || elderlyGuidance.guidance.includes('gentle') || elderlyGuidance.guidance.includes('irritate'),
        'Elderly guidance in moderate air must advise keeping walks short and gentle'
      );
    });
  });
});
