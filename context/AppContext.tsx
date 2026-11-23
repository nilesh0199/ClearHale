'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AirData,
  AQIBandInfo,
  SupportedLanguage,
  UserProfile,
  FamilyView,
  AppTheme,
} from '@/types';
import { getAQIBand } from '@/lib/aqi';
import {
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  getBiString,
  getActionI18n,
  getFlatEnglishDictionary,
} from '@/lib/languages';
import { DEMO_LOCATION, DEMO_PROFILE, generateDemoAirData } from '@/lib/demoData';
import { fetchAirQuality } from '@/lib/openMeteo';
import { VoiceProvider } from './VoiceContext';
import {
  DEFAULT_INITIAL_PROFILE,
  loadStoredProfile,
  resetAllStoredData,
  saveStoredProfile,
} from '@/lib/storage';

export type OnboardingStep =
  | 'welcome'
  | 'theme'
  | 'language'
  | 'location'
  | 'intake-choice'
  | 'intake-chat'
  | 'household'
  | 'building'
  | 'complete';

export type AppTab = 'home' | 'plan' | 'ask' | 'care' | 'learn' | 'profile';

interface AppContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (partial: Partial<UserProfile>) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  airData: AirData;
  loadingAir: boolean;
  airError: string | null;
  refreshAirData: (lat?: number, lon?: number) => Promise<void>;
  currentBand: AQIBandInfo;
  t: typeof UI_TRANSLATIONS['en'];
  tBi: (key: string, defaultEn?: string) => { en: string; native: string };
  getActionBi: (
    actionId: string,
    fallbackTitle: string,
    aqiBandKey?: string
  ) => { enTitle: string; nativeTitle: string };
  dynamicDict: Record<string, string>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;
  isIntakeChatOpen: boolean;
  openChatIntake: () => void;
  closeChatIntake: () => void;
  toggleActionChecked: (actionId: string) => void;
  loadDemoMode: () => void;
  resetAllData: () => void;
  clearChatHistory: () => void;
  isInstallable: boolean;
  triggerInstall: () => Promise<void>;
  installPrompt: any;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_INITIAL_PROFILE);
  const [theme, setThemeState] = useState<AppTheme>('system');
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [airData, setAirData] = useState<AirData>(generateDemoAirData());
  const [loadingAir, setLoadingAir] = useState(false);
  const [airError, setAirError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [isIntakeChatOpen, setIsIntakeChatOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dynamicDict, setDynamicDict] = useState<Record<string, string>>({});

  const openChatIntake = useCallback(() => {
    setIsIntakeChatOpen(true);
  }, []);

  const closeChatIntake = useCallback(() => {
    setIsIntakeChatOpen(false);
  }, []);

  // Dynamic AI translation for regional languages other than Hindi and Marathi
  useEffect(() => {
    const lang = profile.language;
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      setDynamicDict({});
      return;
    }

    if (typeof window === 'undefined') return;

    const cacheKey = `clearhale_dict_${lang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setDynamicDict(parsed);
          return;
        }
      } catch (e) {
        // Fall through to fetch
      }
    }

    const flatStrings = getFlatEnglishDictionary();
    fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLang: lang,
        strings: flatStrings,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.translations && Object.keys(data.translations).length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(data.translations));
          setDynamicDict(data.translations);
        }
      })
      .catch((err) => {
        console.warn('Dynamic dictionary translation error, falling back to English:', err);
      });
  }, [profile.language]);

  // Apply theme to DOM with 200ms smooth transition
  const applyThemeToDOM = (nextTheme: AppTheme, nextAccent?: any, nextTrueBlack?: boolean) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const isDark =
      nextTheme === 'dark' ||
      (nextTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const activeAccent = nextAccent || profile.accentMode || 'teal';
    const isTrueBlack = nextTrueBlack !== undefined ? nextTrueBlack : Boolean(profile.trueBlack);

    root.classList.add('theme-transition');
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    root.setAttribute('data-accent', activeAccent);
    root.setAttribute('data-true-black', isTrueBlack ? 'true' : 'false');

    // Dynamic meta theme-color
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    const themeColor = isDark
      ? (isTrueBlack ? '#000000' : '#0A0A0A')
      : '#FAFAFA';
    metaTags.forEach((tag) => {
      tag.setAttribute('content', themeColor);
    });

    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 220);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemeToDOM(theme, profile.accentMode, profile.trueBlack);
      if (profile.accentMode) {
        localStorage.setItem('clearhale_accent', profile.accentMode);
      }
      if (profile.trueBlack !== undefined) {
        localStorage.setItem('clearhale_true_black', profile.trueBlack ? 'true' : 'false');
      }
    }
  }, [profile.accentMode, profile.trueBlack]);

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyThemeToDOM(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clearhale_theme', nextTheme);
    }
    updateProfile({ theme: nextTheme });
  };

  // Initialize from localStorage
  useEffect(() => {
    const stored = loadStoredProfile();
    setProfile(stored);

    // Initial theme
    const storedTheme = (localStorage.getItem('clearhale_theme') as AppTheme) || stored.theme || 'system';
    setThemeState(storedTheme);
    applyThemeToDOM(storedTheme);

    // Listen for OS system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentStored = localStorage.getItem('clearhale_theme') || 'system';
      if (currentStored === 'system') {
        applyThemeToDOM('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    if (stored.onboardingCompleted || (typeof window !== 'undefined' && localStorage.getItem('clearhale_onboarding_completed') === 'true')) {
      setOnboardingStep('complete');
    }
    setIsClientLoaded(true);

    // Initial fetch of air quality
    fetchAirQuality(stored.city.lat, stored.city.lon)
      .then((data) => setAirData(data))
      .catch((err) => {
        console.warn('Initial air fetch error, using stored baseline:', err);
        setAirData(generateDemoAirData());
      });

    // PWA BeforeInstallPrompt handler
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Service Worker registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration note:', err));
    }

    // Auto-refresh air data periodically (every 30 minutes) and on window focus
    const autoRefreshInterval = setInterval(() => {
      fetchAirQuality(stored.city.lat, stored.city.lon)
        .then((data) => setAirData(data))
        .catch(() => {});
    }, 30 * 60 * 1000);

    const handleWindowFocus = () => {
      setAirData((prev) => {
        if (Date.now() - prev.updatedAt >= 25 * 60 * 1000) {
          fetchAirQuality(stored.city.lat, stored.city.lon)
            .then((data) => setAirData(data))
            .catch(() => {});
        }
        return prev;
      });
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(autoRefreshInterval);
      window.removeEventListener('focus', handleWindowFocus);
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Sync profile updates to localStorage
  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...partial };
      saveStoredProfile(updated);
      return updated;
    });
  };

  const refreshAirData = async (lat?: number, lon?: number) => {
    setLoadingAir(true);
    setAirError(null);
    const targetLat = lat ?? profile.city.lat;
    const targetLon = lon ?? profile.city.lon;

    try {
      const data = await fetchAirQuality(targetLat, targetLon);
      setAirData(data);
    } catch (err: any) {
      setAirError(err?.message || 'Could not refresh air data');
    } finally {
      setLoadingAir(false);
    }
  };

  // Toggle checked actions
  const toggleActionChecked = (actionId: string) => {
    setProfile((prev) => {
      const exists = prev.checkedActions.includes(actionId);
      const nextChecked = exists
        ? prev.checkedActions.filter((id) => id !== actionId)
        : [...prev.checkedActions, actionId];
      const updated = { ...prev, checkedActions: nextChecked };
      saveStoredProfile(updated);
      return updated;
    });
  };

  // Demo mode: uses live data for Delhi with stored baseline fallback if APIs fail
  const loadDemoMode = () => {
    const demo = { ...DEMO_PROFILE };
    setProfile(demo);
    saveStoredProfile(demo);
    // Instant initial render with stored baseline
    setAirData(generateDemoAirData());
    setOnboardingStep('complete');
    setActiveTab('home');

    // Attempt live data fetch for Delhi preset, retaining fallback if network or APIs fail
    fetchAirQuality(DEMO_LOCATION.lat, DEMO_LOCATION.lon)
      .then((live) => {
        if (live && live.current) {
          setAirData(live);
        }
      })
      .catch((err) => {
        console.warn('Demo live air quality fetch failed, retaining stored fallback:', err);
      });
  };

  // Clear AI chat history only
  const clearChatHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('clearhale_chat_history');
        localStorage.removeItem('vayu_chat_history');
        window.dispatchEvent(new CustomEvent('clearhale:clear_chat'));
      } catch (err) {
        console.warn('Failed to clear chat history:', err);
      }
    }
  }, []);

  // Reset all
  const resetAllData = () => {
    resetAllStoredData();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clearhale:clear_chat'));
    }
    localStorage.removeItem('clearhale_theme');
    setThemeState('system');
    applyThemeToDOM('system');
    setProfile(DEFAULT_INITIAL_PROFILE);
    setAirData(generateDemoAirData());
    setOnboardingStep('welcome');
    setActiveTab('home');
  };

  // Trigger PWA install
  const triggerInstall = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (err) {
      console.warn('PWA install error:', err);
    }
  };

  // Language translation dict
  const t = useMemo(() => {
    if (profile.language === 'mr') return UI_TRANSLATIONS.mr;
    if (profile.language === 'hi') return UI_TRANSLATIONS.hi;
    if (profile.language === 'ta' && (UI_TRANSLATIONS as any).ta) return (UI_TRANSLATIONS as any).ta;
    if (profile.language === 'bn' && (UI_TRANSLATIONS as any).bn) return (UI_TRANSLATIONS as any).bn;
    return UI_TRANSLATIONS.en;
  }, [profile.language]);

  // Bilingual string resolver
  const tBi = (key: string, defaultEn?: string) => {
    return getBiString(profile.language, key, dynamicDict, defaultEn);
  };

  // AQI Band computed for current reading
  const currentBand = useMemo(() => {
    return getAQIBand(
      airData.current.pm2_5,
      profile.language
    );
  }, [airData.current.pm2_5, profile.language]);

  // Action card bilingual resolver
  const getActionBi = (actionId: string, fallbackTitle: string, aqiBandKey?: string) => {
    const band = aqiBandKey || currentBand?.key || 'poor';
    return getActionI18n(profile.language, actionId, fallbackTitle, dynamicDict, band);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        theme,
        setTheme,
        airData,
        loadingAir,
        airError,
        refreshAirData,
        currentBand,
        t,
        tBi,
        getActionBi,
        dynamicDict,
        activeTab,
        setActiveTab,
        onboardingStep,
        setOnboardingStep,
        isIntakeChatOpen,
        openChatIntake,
        closeChatIntake,
        toggleActionChecked,
        loadDemoMode,
        resetAllData,
        clearChatHistory,
        isInstallable,
        triggerInstall,
        installPrompt,
      }}
    >
      <VoiceProvider>{children}</VoiceProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
