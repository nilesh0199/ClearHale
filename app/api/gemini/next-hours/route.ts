import { NextRequest, NextResponse } from 'next/server';
import { stream, AIMessage } from '@/lib/ai/provider';
import { checkIpRateLimit, extractClientIp } from '@/lib/ai/rateLimit';
import { getFallbackNext2Hours } from '@/lib/rulesEngine';
import { getIndiaBandKey, outdoorGuidance, sanitizeChatOutdoorAdvice } from '@/lib/outdoorGuidance';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { AQIBandKey, FamilyView } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP Rate Limiting
    const clientIp = extractClientIp(req.headers);
    const ipLimit = checkIpRateLimit(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded.',
          retryAfterSec: ipLimit.resetInSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipLimit.resetInSec),
          },
        }
      );
    }

    const body = await req.json();
    const {
      pm2_5 = 150,
      aqiBand = 'very_poor',
      familyView = 'whole_family',
      language = 'en',
      city = 'Delhi',
      dataType = 'estimate',
      stationName = '',
      timestamp = '',
    } = body;

        const bandKey = ((aqiBand as AQIBandKey) || getIndiaBandKey(pm2_5));
    const outdoorInfo = outdoorGuidance(bandKey, null, familyView as FamilyView, undefined, language);
    const outdoorLevel = outdoorInfo.level;

    const fallback = getFallbackNext2Hours(
      aqiBand as AQIBandKey,
      familyView as FamilyView,
      language
    );

    let personaGuidance = '';
    if (outdoorLevel === 'go') {
      if (familyView === 'child') {
        personaGuidance = 'Air is clean and safe for children. Encourage outdoor playtime, playground sports, and fresh air.';
      } else if (familyView === 'elderly') {
        personaGuidance = 'Air is gentle and comfortable. Encourage a pleasant outdoor garden walk or peaceful stroll.';
      } else if (familyView === 'pregnant') {
        personaGuidance = 'Air is safe and refreshing. Encourage gentle walks, relaxing outside, and opening windows for fresh air.';
      } else if (familyView === 'outdoor_worker') {
        personaGuidance = 'Working conditions are safe and comfortable. No mask required unless around dust; stay hydrated.';
      } else {
        personaGuidance = 'Air is pleasant and safe. Encourage opening windows for natural home ventilation, outdoor exercise, and errands.';
      }
    } else if (outdoorLevel === 'light-only') {
      if (familyView === 'child') {
        personaGuidance = 'Mild haze. Kids can play outside normally, but take breaks if running fast or sensitive to dust.';
      } else if (familyView === 'elderly') {
        personaGuidance = 'Mild haze. Safe for light walks; avoid heavy physical exertion and keep rescue inhalers close.';
      } else if (familyView === 'pregnant') {
        personaGuidance = 'Mild haze. Safe for routine tasks; steer clear of heavy traffic fumes and dusty intersections.';
      } else if (familyView === 'outdoor_worker') {
        personaGuidance = 'Manageable outdoor conditions. Take periodic shade breaks and drink plenty of water.';
      } else {
        personaGuidance = 'Mild haze. Normal daily routines are fine; pace heavy sports or shift intense workouts indoors.';
      }
    } else {
      if (familyView === 'child') {
        personaGuidance = 'Heavy smog. Protect children by keeping them indoors in a filtered room; delay park visits.';
      } else if (familyView === 'elderly') {
        personaGuidance = 'Unhealthy smog. Stay comfortably indoors in a filtered room, keep medicines close, avoid outdoor walks.';
      } else if (familyView === 'pregnant') {
        personaGuidance = 'High pollution. Protect maternal health by resting indoors in filtered air; wear an N95 if stepping out.';
      } else if (familyView === 'outdoor_worker') {
        personaGuidance = 'Hazardous smog. Wear a snug-fitting N95 respirator and take regular breaks in cleaner indoor spaces.';
      } else {
        personaGuidance = 'Smog is elevated. Keep windows closed, run indoor filtration, and wear an N95 respirator if stepping out.';
      }
    }

    const isRegional = language !== 'en';
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    const langName = langInfo ? langInfo.name : language;

    let languageRule = '';
    if (isRegional) {
      languageRule = `BILINGUAL DELIMITER INSTRUCTION (STRICT REQUIREMENT):
For regional languages, return the decision in ${langName} (${langInfo?.nativeName || ''}), then a newline, then EXACTLY the line:
---EN---
then a short 1-sentence English version. Both must be present.`;
    } else {
      languageRule = `Output language: English only. DO NOT output any ---EN--- delimiter.`;
    }

    const sourceContext =
      dataType === 'measured'
        ? `measured reading from government monitoring station "${stationName || 'Nearby Station'}" (${timestamp || 'recent'})`
        : `forecast model estimate from Open-Meteo (${timestamp || 'current hour'})`;

    const prompt = `Write ONE warm, friendly, caring decision (1 to 2 short sentences max) for the next 2 hours for ${familyView === 'whole_family' ? 'a family' : familyView} in ${city}.
Current PM2.5 is ${pm2_5} µg/m³ (Band: ${aqiBand}), based on ${sourceContext}.
Outdoor Air Quality Status: ${outdoorLevel === 'go' ? 'FRESH & SAFE (open windows, outdoor exercise safe)' : outdoorLevel === 'light-only' ? 'MODERATE (light activities ok)' : 'UNHEALTHY SMOG (keep windows shut, run filter)'}.
Guidance perspective: ${personaGuidance}.
${languageRule}
CRITICAL TONE & ACCURACY RULES:
- Sound like a warm, supportive, caring friend or family doctor who genuinely cares.
- Keep sentences short (under 16 words each). Speak directly using 'you' or 'your family'.
- NEVER use bureaucratic preamble like "With the model estimate indicating..." or "rely on filtration systems for balanced household protection".
- CRITICAL: Match the air quality! If air is Safe (${outdoorLevel === 'go'}), CELEBRATE the clean air (open windows, go outdoors). NEVER say to seal windows or avoid outdoor activities when air is clean!
- If air is Unhealthy (${outdoorLevel === 'avoid'}), gently advise staying indoors with air filtration.
- NEVER invent, hallucinate, or alter any PM2.5 or AQI number.`;

    const messages: AIMessage[] = [{ role: 'user', content: prompt }];

    const streamResponse = await stream(messages, {
      language,
      temperature: 0.2,
      maxTokens: 120,
      fallbackTemplateText: fallback,
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Error generating next 2 hours advice:', err);
    const fallback = getFallbackNext2Hours('very_poor', 'whole_family', 'en');
    return new Response(fallback, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
