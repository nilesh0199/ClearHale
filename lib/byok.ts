/**
 * Clearhale BYOK (Bring Your Own Key) Engine
 * Secure client-side storage & management of personal Google Gemini API keys.
 * 
 * Security Principles:
 * 1. Stored strictly in browser localStorage ('clearhale_byok_gemini_key') - never saved on server disk or database.
 * 2. Sent strictly over TLS/HTTPS via custom 'x-gemini-api-key' request header.
 * 3. Never logged in plaintext in server logs or analytics.
 * 4. User can remove or reset anytime; automatically falls back to server env key.
 */

export const BYOK_GEMINI_STORAGE_KEY = 'clearhale_byok_gemini_key';

export function getCustomGeminiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BYOK_GEMINI_STORAGE_KEY)?.trim();
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveCustomGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(BYOK_GEMINI_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(BYOK_GEMINI_STORAGE_KEY);
    }
  } catch (err) {
    console.error('[BYOK] Failed to save key in localStorage:', err);
  }
}

export function removeCustomGeminiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BYOK_GEMINI_STORAGE_KEY);
  } catch (err) {
    console.error('[BYOK] Failed to remove key from localStorage:', err);
  }
}

export function isCustomGeminiKeyConfigured(): boolean {
  return Boolean(getCustomGeminiKey());
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}••••••••${end}`;
}

export function isValidGeminiKeyFormat(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Standard Google API keys start with AIza and are ~39 chars
  return trimmed.startsWith('AIza') && trimmed.length >= 30;
}

export function getByokHeaders(headers: HeadersInit = {}): HeadersInit {
  const customKey = getCustomGeminiKey();
  if (!customKey) return headers;

  if (headers instanceof Headers) {
    headers.set('x-gemini-api-key', customKey);
    return headers;
  }

  if (Array.isArray(headers)) {
    return [...headers, ['x-gemini-api-key', customKey]];
  }

  return {
    ...headers,
    'x-gemini-api-key': customKey,
  };
}

export async function validateGeminiKey(apiKey: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { valid: false, message: 'Please enter a Gemini API key.' };
  }

  if (!cleanKey.startsWith('AIza') || cleanKey.length < 30) {
    return {
      valid: false,
      message: 'Invalid key format. Google Gemini keys start with "AIza" and are ~39 characters long.',
    };
  }

  try {
    const res = await fetch('/api/gemini/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': cleanKey,
      },
      body: JSON.stringify({ key: cleanKey }),
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      return { valid: true, message: 'Key verified successfully with Google Gemini!' };
    }
    return {
      valid: false,
      message: data.error || 'Failed to authenticate with Google Gemini. Check the key and try again.',
    };
  } catch (err) {
    return {
      valid: false,
      message: err instanceof Error ? err.message : 'Network error verifying key.',
    };
  }
}
