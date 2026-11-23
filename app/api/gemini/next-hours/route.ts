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

    let personaGuidance = 'balanced household protection (sealed windows, filtration, avoiding morning smog)';
    if (familyView === 'child') {
      personaGuidance = 'infant and young child safety, outdoor play and school run timing, clean bedroom filtration, and note that respirators are not for children under 2';
    } else if (familyView === 'elderly') {
      personaGuidance = 'a cleaner-air room, keeping medications and rescue inhalers accessible, avoiding physical exertion, and knowing when to seek urgent care';
    } else if (familyView === 'pregnant') {
      personaGuidance = 'maternal and fetal protection, PM2.5 placental barrier risks, continuous HEPA bedroom filtration, avoiding morning smog/traffic exposure, wearing well-fitted N95 for essential clinical visits, eliminating indoor incense and chulha smoke, and staying hydrated';
    } else if (familyView === 'outdoor_worker') {
      personaGuidance = 'tight-fitting N95 seal check, frequent indoor rest-break timing, and shifting heavy physical labor to cleaner afternoon hours';
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

    const prompt = `Write ONE concise, actionable decision sentence for the next 2 hours for ${familyView === 'whole_family' ? 'a family' : familyView} in ${city}.
Current PM2.5 is ${pm2_5} µg/m³ (Band: ${aqiBand}), based on ${sourceContext}.
Data Type: ${dataType}.
Focus perspective: ${familyView}.
Specific persona rules to emphasize: ${personaGuidance}.
${languageRule}
MANDATORY DATA INTEGRITY RULES:
- Maximum 2 sentences total. Be calm, directive, and scientific.
- NEVER invent, hallucinate, or alter any PM2.5 or AQI number. Use ONLY the provided PM2.5 value.
- If data type is "estimate", say "forecast estimate" or "model estimate" if referencing air quality numbers.
- Ground directly in the actions catalog.`;

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
