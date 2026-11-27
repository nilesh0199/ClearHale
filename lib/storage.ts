import { UserProfile, VoiceSettings, FamilyView, AccentMode } from '@/types';
import { DEMO_PROFILE } from './demoData';
import { findNearestCatalogCity } from './citiesData';

const PROFILE_KEY = 'clearhale_user_profile';
const LEGACY_PROFILE_KEY = 'vayu_user_profile';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  autoSend: true,
  autoReadReplies: false,
  speechRate: 1.2,
  readBothBilingual: false,
  preferredVoiceURI: undefined,
};

export const DEFAULT_INITIAL_PROFILE: UserProfile = {
  city: {
    name: 'Delhi, India',
    lat: 28.6139,
    lon: 77.2090,
    admin: 'Delhi',
    country: 'India',
  },
  language: 'en',
  household: {
    members: [],
    cookingFuel: 'lpg',
    commute: ['bus_metro'],
    work: 'indoor',
    budget: 'low_cost',
  },
  activeFamilyFilter: 'whole_family',
  checkedActions: [],
  onboardingCompleted: false,
  accentMode: 'teal',
  trueBlack: false,
  voice: DEFAULT_VOICE_SETTINGS,
  reduceEffects: false,
};

export function loadStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY) || localStorage.getItem(LEGACY_PROFILE_KEY);
    const parsed: UserProfile = raw ? { ...DEFAULT_INITIAL_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_INITIAL_PROFILE };
    // Auto-heal any stale placeholder or generic "Current Location" names to real detected city
    if (
      parsed.city &&
      (parsed.city.name.toLowerCase().includes('current location') ||
        parsed.city.name.toLowerCase().includes('my current location') ||
        parsed.city.admin === 'Local GPS')
    ) {
      const resolved = findNearestCatalogCity(parsed.city.lat ?? 28.6139, parsed.city.lon ?? 77.2090);
      const fixedName =
        resolved.admin && !resolved.name.toLowerCase().includes(resolved.admin.toLowerCase())
          ? `${resolved.name}, ${resolved.admin}`
          : resolved.name;
      parsed.city = {
        name: fixedName,
        lat: parsed.city.lat,
        lon: parsed.city.lon,
        admin: resolved.admin,
        country: resolved.country || 'India',
      };
    }

    parsed.household = { ...DEFAULT_INITIAL_PROFILE.household, ...(parsed.household || {}) };
    parsed.checkedActions = parsed.checkedActions || [];
    const storedFamily = localStorage.getItem('clearhale_family_view');
    if (storedFamily && ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker'].includes(storedFamily)) {
      parsed.activeFamilyFilter = storedFamily as FamilyView;
    } else if (parsed.household) {
      if (parsed.household.members?.includes('child')) {
        parsed.activeFamilyFilter = 'child';
      } else if (parsed.household.members?.includes('elderly')) {
        parsed.activeFamilyFilter = 'elderly';
      } else if (parsed.household.members?.includes('pregnant')) {
        parsed.activeFamilyFilter = 'pregnant';
      } else if (parsed.household.work === 'outdoor') {
        parsed.activeFamilyFilter = 'outdoor_worker';
      }
    }
    // Ensure default voice settings exist
    parsed.voice = {
      ...DEFAULT_VOICE_SETTINGS,
      ...(parsed.voice || {}),
    };
    parsed.accentMode = parsed.accentMode || (localStorage.getItem('clearhale_accent') as AccentMode) || 'teal';
    parsed.trueBlack = parsed.trueBlack ?? (localStorage.getItem('clearhale_true_black') === 'true');
    parsed.onboardingCompleted = Boolean(parsed.onboardingCompleted || localStorage.getItem('clearhale_onboarding_completed') === 'true');
    return parsed;
  } catch (err) {
    console.error('Failed to parse stored profile:', err);
    return DEFAULT_INITIAL_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (profile.activeFamilyFilter) {
      localStorage.setItem('clearhale_family_view', profile.activeFamilyFilter);
    }
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

export function resetAllStoredData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    localStorage.removeItem('clearhale_family_view');
    localStorage.removeItem('clearhale_last_reading_cache');
    localStorage.removeItem('vayu_last_reading_cache');
    localStorage.removeItem('clearhale_chat_history');
    localStorage.removeItem('vayu_chat_history');
    localStorage.removeItem('clearhale_byok_gemini_key');
    localStorage.removeItem('clearhale_last_severe_alert');
    localStorage.removeItem('clearhale_notifications_prompted');
    localStorage.removeItem('clearhale_notifications_enabled');
    sessionStorage.removeItem('vayu_had_fallback_tip');
    sessionStorage.removeItem('clearhale_had_fallback_tip');
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
