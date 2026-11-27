import { NextRequest, NextResponse } from 'next/server';
import { checkIpRateLimit, extractClientIp } from '@/lib/ai/rateLimit';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 600; // Max 600 characters per request

/**
 * Builds a standard 44-byte RIFF/WAV header for raw 24kHz 16-bit mono PCM.
 */
function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const clientIp = extractClientIp(req.headers);
    const ipLimit = checkIpRateLimit(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before requesting more voice audio.',
          fallbackToBrowser: true,
          retryAfterSec: ipLimit.resetInSec,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.resetInSec) },
        }
      );
    }

    // 2. Validate JSON Body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request body', fallbackToBrowser: true },
        { status: 400 }
      );
    }

    const rawText = typeof body.text === 'string' ? body.text.trim() : '';
    const language = (body.language || 'en').trim().toLowerCase();
    const voiceName = (body.voice || 'Puck').trim();

    if (!rawText) {
      return NextResponse.json(
        { error: 'text is required', fallbackToBrowser: true },
        { status: 400 }
      );
    }

    // 3. Length Validation (Max 600 chars per request)
    if (rawText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters.`,
          fallbackToBrowser: true,
        },
        { status: 400 }
      );
    }

    // Clean markdown/bullet formatting so audio sounds natural
    const cleanSpeechText = rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~]/g, '')
      .replace(/^[•–—\-]\s*/gm, '')
      .trim();

    // 4. Gemini Speech Generation
    const apiKey = req.headers.get('x-gemini-api-key')?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured on server',
          fallbackToBrowser: true,
        },
        { status: 503 }
      );
    }

    const primaryModel = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
    const fallbackModels = ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-tts'].filter(
      (m) => m !== primaryModel
    );
    const candidateModels = [primaryModel, ...fallbackModels];

    // Send clean speech text directly to audio generation model
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanSpeechText,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Puck',
            },
          },
        },
      },
    };

    interface InlineAudioPart {
      inlineData?: {
        mimeType?: string;
        data?: string;
      };
    }

    let audioPart: InlineAudioPart | null = null;
    let lastError = '';
    let lastStatus = 502;

    for (const model of candidateModels) {
      const abortCtrl = new AbortController();
      const timeout = setTimeout(() => abortCtrl.abort(), 8000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortCtrl.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = `Gemini speech error on ${model} (${res.status}): ${errText}`;
          lastStatus = res.status === 429 ? 429 : 502;
          console.warn(`[TTS] ${lastError}`);
          continue; // try next candidate model
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const part = (candidate?.content?.parts as InlineAudioPart[] | undefined)?.find(
          (p) => p.inlineData?.data
        );
        if (part?.inlineData?.data) {
          audioPart = part;
          break; // successfully got audio
        }
      } catch (err: unknown) {
        clearTimeout(timeout);
        lastError = err instanceof Error ? err.message : 'Network error';
        console.warn(`[TTS] Exception on ${model}: ${lastError}`);
      }
    }

    if (!audioPart || !audioPart.inlineData?.data) {
      console.warn('[TTS] No audio generated by any candidate model:', lastError);
      return NextResponse.json(
        {
          error: 'No audio generated by model',
          details: lastError,
          fallbackToBrowser: true,
        },
        { status: lastStatus }
      );
    }

      const mimeType = audioPart.inlineData.mimeType || 'audio/wav';
      const base64Data = audioPart.inlineData.data;
      const rawBuffer = Buffer.from(base64Data, 'base64');

      // If already WAV container, return as is
      let finalAudioBuffer: Buffer;
      if (mimeType.includes('wav') && rawBuffer.slice(0, 4).toString() === 'RIFF') {
        finalAudioBuffer = rawBuffer;
      } else {
        // Prepend 44-byte WAV header for raw 24kHz 16-bit mono PCM
        const header = createWavHeader(rawBuffer.length, 24000, 1, 16);
        finalAudioBuffer = Buffer.concat([header, rawBuffer]);
      }

      return new NextResponse(new Uint8Array(finalAudioBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': String(finalAudioBuffer.length),
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[TTS] Unhandled error:', errMsg);
    return NextResponse.json(
      { error: 'Internal server error generating speech', fallbackToBrowser: true },
      { status: 500 }
    );
  }
}
