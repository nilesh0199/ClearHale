import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const key =
      req.headers.get('x-gemini-api-key')?.trim() ||
      body.key?.trim() ||
      '';

    if (!key) {
      return NextResponse.json({ valid: false, error: 'Key is required' }, { status: 400 });
    }

    if (!key.startsWith('AIza') || key.length < 30) {
      return NextResponse.json(
        { valid: false, error: 'Invalid key format. Gemini API keys must start with "AIza".' },
        { status: 400 }
      );
    }

    // Ping Google Generative Language API model list (no token cost, pure auth validation)
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      return NextResponse.json({ valid: true });
    }

    const data = await res.json().catch(() => ({}));
    const rawMsg = String(data?.error?.message || '').toLowerCase();
    const status = String(data?.error?.status || '');

    let friendlyError = 'Google rejected this API key.';

    if (rawMsg.includes('api key not valid') || rawMsg.includes('invalid') || status === 'INVALID_ARGUMENT' || res.status === 400) {
      friendlyError = 'Invalid Gemini API key. Please check your key from Google AI Studio.';
    } else if (rawMsg.includes('quota') || rawMsg.includes('resource_exhausted') || status === 'RESOURCE_EXHAUSTED' || res.status === 429) {
      friendlyError = 'Quota limit exceeded on this Gemini API key. Please check your Google AI Studio quota/plan.';
    } else if (rawMsg.includes('permission_denied') || status === 'PERMISSION_DENIED' || res.status === 403) {
      friendlyError = 'Access denied for this key. Please make sure the Generative Language API is enabled.';
    } else if (rawMsg.includes('not found') || status === 'NOT_FOUND' || res.status === 404) {
      friendlyError = 'Gemini model not found or unavailable for this project.';
    } else if (data?.error?.message) {
      friendlyError = data.error.message;
    }

    return NextResponse.json({ valid: false, error: friendlyError }, { status: res.status >= 400 ? res.status : 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network failure validating key.';
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}
