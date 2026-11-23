import { NextRequest, NextResponse } from 'next/server';
import { generate, AIMessage } from '@/lib/ai/provider';
import { checkIpRateLimit, extractClientIp } from '@/lib/ai/rateLimit';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { SupportedLanguage } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req.headers);
    const ipLimit = checkIpRateLimit(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.resetInSec) } }
      );
    }

    const body = await req.json();
    const targetLanguage = (body.targetLanguage || body.targetLang) as SupportedLanguage;
    const strings = body.strings as Record<string, string>;

    if (!targetLanguage || !strings || typeof strings !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage);
    const langName = langInfo ? langInfo.name : targetLanguage;

    const prompt = `Translate the following UI strings into ${langName} (${langInfo?.nativeName || ''}).
Rules:
1. Provide accurate, natural, professional everyday translations in the native script.
2. Return ONLY a single raw valid JSON object mapping the exact same keys to the translated strings.
3. No markdown code blocks, no backticks, no comments.

Input JSON:
${JSON.stringify(strings, null, 2)}`;

    const messages: AIMessage[] = [{ role: 'user', content: prompt }];

    const rawResponse = await generate(messages, {
      temperature: 0.1,
      maxTokens: 2000,
      jsonMode: true,
      language: targetLanguage,
    });

    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({ translations: parsed });
    } catch (parseErr) {
      console.warn('AI translation parse error, returning fallback:', parseErr);
      return NextResponse.json({ translations: {} });
    }
  } catch (err) {
    console.error('Error in translate API:', err);
    return NextResponse.json({ translations: {} }, { status: 500 });
  }
}
