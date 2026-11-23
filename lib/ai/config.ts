import type { ProviderName } from './providerTypes';

export interface LanguageCapability {
  code: string;
  name: string;
  nativeName: string;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  aiProvider: ProviderName;
}

/**
 * Per-language voice capabilities.
 * Enabled for voice at first: English, Hindi, Marathi, Bengali, Tamil, Telugu.
 * Others are text-only until tested.
 */
export const DEFAULT_LANGUAGE_CAPABILITIES: Record<string, LanguageCapability> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'groq',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'groq',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'gemini',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'gemini',
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'gemini',
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    sttEnabled: true,
    ttsEnabled: true,
    aiProvider: 'gemini',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  },
};

/**
 * Returns dynamic language routing table, allowing overrides via AI_LANGUAGE_ROUTING env var.
 * Example AI_LANGUAGE_ROUTING='{"en":"groq","hi":"groq","mr":"gemini"}'
 */
export function getLanguageRoutingTable(): Record<string, ProviderName> {
  const envRouting = process.env.AI_LANGUAGE_ROUTING;
  if (envRouting) {
    try {
      const parsed = JSON.parse(envRouting);
      if (typeof parsed === 'object' && parsed !== null) {
        const table: Record<string, ProviderName> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 'groq' || v === 'gemini') {
            table[k.toLowerCase()] = v;
          }
        }
        return {
          ...Object.fromEntries(
            Object.entries(DEFAULT_LANGUAGE_CAPABILITIES).map(([k, v]) => [k, v.aiProvider])
          ),
          ...table,
        };
      }
    } catch (e) {
      console.warn('[AI Config] Failed to parse AI_LANGUAGE_ROUTING env var, using defaults');
    }
  }

  return Object.fromEntries(
    Object.entries(DEFAULT_LANGUAGE_CAPABILITIES).map(([k, v]) => [k, v.aiProvider])
  );
}

/**
 * Get capability configuration for a specific language code.
 */
export function getLanguageCapability(langCode: string): LanguageCapability {
  const code = (langCode || 'en').toLowerCase().trim();
  const base = DEFAULT_LANGUAGE_CAPABILITIES[code] || {
    code,
    name: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    sttEnabled: false,
    ttsEnabled: false,
    aiProvider: 'gemini',
  };

  const routingTable = getLanguageRoutingTable();
  const assignedProvider = routingTable[code] || base.aiProvider;

  return {
    ...base,
    aiProvider: assignedProvider,
  };
}

/**
 * Checks whether speech-to-text (voice input) is enabled for the language.
 */
export function isSttSupported(langCode: string): boolean {
  return getLanguageCapability(langCode).sttEnabled;
}

/**
 * Checks whether text-to-speech (read aloud) is enabled for the language.
 */
export function isTtsSupported(langCode: string): boolean {
  return getLanguageCapability(langCode).ttsEnabled;
}

/**
 * Resolves the primary AI provider for a given language.
 */
export function getLanguageAiProvider(langCode?: string): ProviderName {
  if (!langCode) {
    const defaultPrimary = (process.env.AI_PRIMARY || 'groq').toLowerCase().trim();
    return defaultPrimary === 'gemini' ? 'gemini' : 'groq';
  }
  return getLanguageCapability(langCode).aiProvider;
}
