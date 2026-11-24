import { NextRequest, NextResponse } from 'next/server';
import { checkIpRateLimit, extractClientIp } from '@/lib/ai/rateLimit';

export const runtime = 'nodejs';

// Supported audio mime types
const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/aac',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const clientIp = extractClientIp(req.headers);
    const ipLimit = checkIpRateLimit(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before sending more voice requests.',
          fallbackToBrowser: true,
          retryAfterSec: ipLimit.resetInSec,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.resetInSec) },
        }
      );
    }

    // 2. Validate Multipart Form Data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data', fallbackToBrowser: true },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('audio')) as File | Blob | null;
    const languageHint = (formData.get('language') as string || '').trim().toLowerCase();

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided', fallbackToBrowser: true },
        { status: 400 }
      );
    }

    // 3. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Audio file exceeds 25MB limit', fallbackToBrowser: true },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty', fallbackToBrowser: true },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type
    const fileMime = (file.type || '').split(';')[0].trim().toLowerCase();
    const baseMimeAllowed = Array.from(ALLOWED_MIME_TYPES).some((m) =>
      m.startsWith(fileMime) || fileMime.startsWith(m.split(';')[0])
    );

    if (file.type && !baseMimeAllowed) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${file.type}. Please use webm, mp4, wav, or ogg.`,
          fallbackToBrowser: true,
        },
        { status: 415 }
      );
    }

    // 5. Groq Whisper API Call
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured on server', fallbackToBrowser: true },
        { status: 503 }
      );
    }

    const modelName = process.env.STT_MODEL || 'whisper-large-v3';

    // Build Groq multipart payload
    const groqFormData = new FormData();
    // Default file name based on type
    const ext = fileMime.includes('mp4') || fileMime.includes('m4a') ? 'mp4' : fileMime.includes('wav') ? 'wav' : 'webm';
    groqFormData.append('file', file, `audio.${ext}`);
    groqFormData.append('model', modelName);
    groqFormData.append('response_format', 'json');

    // Language hint (ISO-639-1)
    if (languageHint && /^[a-z]{2,3}$/.test(languageHint)) {
      groqFormData.append('language', languageHint);
    }

    // 8-second timeout for STT
    const abortCtrl = new AbortController();
    const timeout = setTimeout(() => abortCtrl.abort(), 8000);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqFormData,
        signal: abortCtrl.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`[STT] Groq Whisper error ${res.status}: ${errText}`);
        return NextResponse.json(
          {
            error: `Whisper transcription failed with status ${res.status}`,
            fallbackToBrowser: true,
          },
          { status: res.status === 429 ? 429 : 502 }
        );
      }

      const data = await res.json();
      const transcribedText = (data.text || '').trim();

      return NextResponse.json({
        text: transcribedText,
        language: data.language || languageHint || 'en',
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      const isTimeout = (fetchErr instanceof Error && fetchErr.name === 'AbortError') || abortCtrl.signal.aborted;
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.warn(`[STT] Fetch error: ${isTimeout ? 'Request timed out after 8s' : errMsg}`);
      return NextResponse.json(
        {
          error: isTimeout ? 'Speech-to-text timed out after 8s' : 'Network error reaching transcription service',
          fallbackToBrowser: true,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[STT] Unhandled error:', errMsg);
    return NextResponse.json(
      { error: 'Internal server error processing speech', fallbackToBrowser: true },
      { status: 500 }
    );
  }
}
