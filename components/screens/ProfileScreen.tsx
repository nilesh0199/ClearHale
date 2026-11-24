'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useVoice } from '@/context/VoiceContext';
import { Bi } from '../Bi';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { SUPPORTED_LANGUAGES, getRegionalLanguageForCity } from '@/lib/languages';
import { searchCities } from '@/lib/openMeteo';
import { reverseGeocodeLocation, findNearestCatalogCity, POPULAR_INDIAN_CITIES } from '@/lib/citiesData';
import {
  BudgetTier,
  CityLocation,
  CommuteType,
  CookingFuel,
  FamilyMember,
  SupportedLanguage,
  WorkType,
  ChildAgeBand,
  MaskType,
  CommuteTime,
  PriorityGoal,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Download,
  Trash2,
  MapPin,
  Globe,
  Home,
  Check,
  Search,
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  Mic,
  Volume2,
  Info,
  MessageSquare,
  Shield,
  LogIn,
  LogOut,
  Car,
  Clock,
  Wind,
  Navigation,
  Loader2,
} from 'lucide-react';

export function ProfileScreen() {
  const {
    profile,
    updateProfile,
    theme,
    setTheme,
    refreshAirData,
    resetAllData,
    clearChatHistory,
    loadDemoMode,
    isInstallable,
    triggerInstall,
    openChatIntake,
    t,
  } = useApp();

  const {
    user,
    signIn,
    signOut,
    saveCloudProfile,
    deleteCloudAccount,
    isConfigured: isAuthConfigured,
  } = useAuth();

  const {
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    availableVoices,
    voiceSettings,
    updateVoiceSettings,
  } = useVoice();

  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityLocation[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedStatus, setDetectedStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [chatClearedToast, setChatClearedToast] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  // Lock body scroll when reset confirmation is open
  useEffect(() => {
    if (showResetConfirm) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showResetConfirm]);

  const household = profile.household;

  const handleCitySearch = async (val: string) => {
    setCityQuery(val);
    if (val.trim().length < 2) {
      setCityResults([]);
      return;
    }
    const hits = await searchCities(val);
    setCityResults(hits);
  };

  const handleSelectCity = (c: CityLocation) => {
    const chosen: CityLocation = { ...c, isCurrentLocation: false };
    updateProfile({ city: chosen });
    refreshAirData(c.lat, c.lon, false);
    setIsSearchingCity(false);
    setCityQuery('');
    setCityResults([]);
  };

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setDetectedStatus('Accessing GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setDetectedStatus('Identifying your city...');

        try {
          const autoCity = await reverseGeocodeLocation(lat, lon);
          const currentCity: CityLocation = { ...autoCity, isCurrentLocation: true };
          updateProfile({ city: currentCity });
          refreshAirData(currentCity.lat, currentCity.lon, true);
          setDetectedStatus(`Detected: ${autoCity.name}`);

          setTimeout(() => {
            setIsSearchingCity(false);
            setDetectedStatus(null);
            setIsLocating(false);
          }, 900);
        } catch (err) {
          console.warn('Reverse geocode failed:', err);
          const nearest = findNearestCatalogCity(lat, lon);
          const autoCity: CityLocation = {
            name:
              nearest.admin && !nearest.name.toLowerCase().includes(nearest.admin.toLowerCase())
                ? `${nearest.name}, ${nearest.admin}`
                : nearest.name,
            lat,
            lon,
            admin: nearest.admin,
            country: nearest.country || 'India',
            isCurrentLocation: true,
          };
          updateProfile({ city: autoCity });
          refreshAirData(lat, lon, true);
          setDetectedStatus(`Detected: ${autoCity.name}`);
          setTimeout(() => {
            setIsSearchingCity(false);
            setDetectedStatus(null);
            setIsLocating(false);
          }, 900);
        }
      },
      (err) => {
        setIsLocating(false);
        setDetectedStatus(null);
        setLocationError(
          'Could not access GPS location. Please check browser permissions or search your city below.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const toggleMember = (m: FamilyMember) => {
    const exists = household.members.includes(m);
    const updated = exists
      ? household.members.filter((x) => x !== m)
      : [...household.members, m];
    updateProfile({ household: { ...household, members: updated } });
  };

  const setFuel = (cookingFuel: CookingFuel) => {
    updateProfile({ household: { ...household, cookingFuel } });
  };

  const toggleCommute = (c: CommuteType) => {
    const exists = household.commute.includes(c);
    const updated = exists
      ? household.commute.filter((x) => x !== c)
      : [...household.commute, c];
    updateProfile({ household: { ...household, commute: updated } });
  };

  const setWork = (work: WorkType) => {
    updateProfile({ household: { ...household, work } });
  };

  const setBudget = (budget: BudgetTier) => {
    updateProfile({ household: { ...household, budget } });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          <Bi k="profile.title" layout="plain" />
        </h1>
        <p className="text-sm sm:text-base text-muted mt-2.5 sm:mt-3 leading-relaxed">
          <Bi k="profile.subtitle" layout="plain" />
        </p>
      </div>

      {/* 1. Install App Banner (PWA) */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.15)"
        className="bg-card rounded-card border border-teal-accent/25 p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6"
      >
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-base sm:text-lg font-semibold text-teal-accent flex items-center gap-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            <Bi k="profile.installPwa" layout="inline" />
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
            <Bi k="profile.installSub" layout="plain" />
          </p>
        </div>

        <button
          onClick={triggerInstall}
          disabled={!isInstallable}
          className={`min-h-[44px] px-4 py-2 rounded-xl font-medium shadow-soft transition-colors text-xs sm:text-sm flex items-center gap-2 shrink-0 self-start mt-4 sm:mt-5 ${
            isInstallable
              ? 'btn-primary cursor-pointer'
              : 'bg-card-subtle text-foreground/70 border border-card-border cursor-not-allowed opacity-90'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <Bi k={isInstallable ? 'profile.installNow' : 'profile.appInstalled'} layout="inline" />
        </button>
      </SpotlightCard>

      {/* 2. Personalise with a Chat Banner */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.15)"
        className="bg-card rounded-card border border-teal-accent/35 p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-accent" strokeWidth={1.75} />
            <Bi k={household.intakeCompleted ? 'profile.redoChat' : 'profile.personaliseChat'} layout="inline" />
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            <Bi k="profile.intakeChatSub" layout="plain" />
          </p>
        </div>
        <button
          onClick={openChatIntake}
          className="btn-primary min-h-[44px] px-4 py-2 rounded-xl font-medium transition-colors text-xs sm:text-sm flex items-center gap-2 shrink-0 self-start mt-4 sm:mt-5 cursor-pointer shadow-soft"
        >
          <Mic className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <Bi k={household.intakeCompleted ? 'profile.redoChat' : 'profile.personaliseChat'} layout="inline" />
        </button>
      </SpotlightCard>

      {/* 3. Account & Cloud Sync (Optional Google Login) */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
              <Bi k="profile.cloudSyncTitle" layout="inline" />
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {user ? (
                <>
                  <Bi k="profile.signedInAs" layout="inline" />{' '}
                  <span className="font-medium text-foreground">{user.email || user.displayName || 'Google user'}</span>.{' '}
                  <Bi k="profile.cloudSyncSignedIn" layout="plain" />
                </>
              ) : (
                <Bi k="profile.cloudSyncLocalOnly" layout="plain" />
              )}
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  await saveCloudProfile(profile);
                  setSyncToast(true);
                  setTimeout(() => setSyncToast(false), 2500);
                }}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-teal-accent text-teal-accent hover:bg-teal-light font-medium transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {syncToast ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />}
                <Bi k={syncToast ? 'profile.cloudSaved' : 'profile.cloudSave'} layout="inline" />
              </button>
              <button
                onClick={() => signOut()}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-card-border text-foreground hover:bg-card-subtle font-medium transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                <Bi k="profile.signOut" layout="inline" />
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                const res = await signIn();
                if (res.success) {
                  await saveCloudProfile(profile);
                }
              }}
              className="btn-primary min-h-[44px] px-4 py-2 rounded-xl font-medium transition-colors text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-soft"
            >
              <LogIn className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <Bi k="profile.continueGoogle" layout="inline" />
            </button>
          )}
        </div>

        <p className="text-[11px] text-muted leading-relaxed pt-2 border-t border-card-border/60">
          <Bi k="profile.cloudConsent" layout="plain" />
        </p>
      </SpotlightCard>

      {/* 2. Appearance (Theme) */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft"
      >
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
            <Bi k="profile.appearance" layout="plain" />
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Switch between light, dark, or automatic system appearance.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map((mode) => {
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as any)}
                className={`min-h-[38px] sm:min-h-[40px] py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? profile.accentMode === 'mono'
                      ? 'border-neutral-800 bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent shadow-sm'
                    : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                }`}
              >
                <mode.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                <Bi k={`profile.${mode.id}`} en={mode.label} layout="inline" />
              </button>
            );
          })}
        </div>

        {/* Reduce Effects Switch */}
        <div className="pt-4 mt-4 border-t border-card-border/70 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-semibold text-foreground block">
              Reduce effects
            </span>
            <span className="text-xs text-muted block leading-relaxed">
              Disables atmospheric haze particles, ambient ring pulsing, and heavy background animations.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(profile.reduceEffects)}
            onClick={() => updateProfile({ reduceEffects: !profile.reduceEffects })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent ${
              profile.reduceEffects ? 'bg-teal-accent' : 'bg-card-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                profile.reduceEffects ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Neutral Theme Experiment: Accent Mode & True Black (gated by NEXT_PUBLIC_THEME_EXPERIMENT) */}
        {process.env.NEXT_PUBLIC_THEME_EXPERIMENT === 'true' && (
          <>
            {/* Accent Mode Switcher */}
            <div className="pt-4 mt-4 border-t border-card-border/70">
              <div className="space-y-0.5 mb-3">
                <span className="text-xs sm:text-sm font-semibold text-foreground block">
                  Accent Color Mode
                </span>
                <span className="text-xs text-muted block leading-relaxed">
                  Choose between the signature teal accent or the minimalist monochrome neutral mode.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { id: 'teal', label: 'Teal Accent', desc: 'Signature teal & mint' },
                  { id: 'mono', label: 'Monochrome', desc: 'Refined 900 neutral' },
                ].map((mode) => {
                  const isSelected = (profile.accentMode || 'teal') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateProfile({ accentMode: mode.id as any })}
                      className={`min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? mode.id === 'teal'
                            ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent shadow-xs'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-50 font-semibold shadow-xs'
                          : 'border-card-border bg-card text-foreground hover:border-card-border'
                      }`}
                    >
                      <span className="font-semibold">{mode.label}</span>
                      <span className={`text-[11px] font-normal mt-0.5 ${
                        isSelected && mode.id === 'mono'
                          ? 'text-neutral-50/80'
                          : isSelected && mode.id === 'teal'
                            ? 'text-teal-accent/80'
                            : 'text-muted'
                      }`}>{mode.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* True Black (OLED) Setting */}
            <div className="pt-4 mt-4 border-t border-card-border/70 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-foreground block">
                  True black (OLED)
                </span>
                <span className="text-xs text-muted block leading-relaxed">
                  Uses pure #000000 background in dark mode for maximum contrast and battery saving on OLED screens.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(profile.trueBlack)}
                onClick={() => updateProfile({ trueBlack: !profile.trueBlack })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  profile.trueBlack
                    ? (profile.accentMode === 'mono' ? 'bg-foreground' : 'bg-teal-accent')
                    : 'bg-card-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                    profile.trueBlack ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </>
        )}
      </SpotlightCard>

      {/* 3. City & Location Setup */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft"
      >
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-accent" />
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
                <Bi k="profile.location" layout="plain" />
              </h2>
            </div>
            <button
              onClick={() => setIsSearchingCity(!isSearchingCity)}
              className="text-xs sm:text-sm font-medium text-teal-accent hover:underline py-1 px-2 -mr-2 rounded-lg cursor-pointer"
            >
              {isSearchingCity ? 'Close search' : 'Change city'}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Live forecast, AQI scale, and local alerts adapt to your selected city.
          </p>
        </div>

        <div className="mt-4 sm:mt-5 py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl bg-card-subtle border border-card-border flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-foreground text-xs sm:text-sm leading-snug">
              {profile.city.name}
            </div>
            <div className="text-[11px] sm:text-xs text-muted leading-relaxed">
              {[profile.city.admin, profile.city.country].filter(Boolean).join(', ')}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-teal-accent font-semibold px-2 py-0.5 rounded-full bg-teal-light border border-teal-accent/20 shrink-0">
            Active
          </span>
        </div>

        {isSearchingCity && (
          <div className="pt-2 space-y-2.5">
            {/* GPS Current Location Option */}
            <button
              onClick={handleUseLocation}
              disabled={isLocating || !!detectedStatus}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-card border font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-accent ${
                detectedStatus?.startsWith('Detected:')
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 shadow-soft'
                  : 'bg-teal-light border-teal-accent/30 text-teal-accent hover:bg-teal-light/80'
              }`}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-accent" strokeWidth={1.75} />
                  <span>{detectedStatus || 'Detecting coordinates...'}</span>
                </>
              ) : detectedStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  <span className="font-semibold">{detectedStatus}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" strokeWidth={1.75} />
                  <span>Use current location (GPS)</span>
                </>
              )}
            </button>
            {locationError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 px-1">{locationError}</p>
            )}

            <div className="relative">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => handleCitySearch(e.target.value)}
                placeholder="Search Indian city or district..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-card border border-card-border bg-card text-foreground text-sm focus:border-teal-accent focus:outline-none"
              />
            </div>

            {cityResults.length > 0 ? (
              <div className="bg-card border border-card-border rounded-xl shadow-soft divide-y divide-card-border max-h-48 overflow-y-auto">
                {cityResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCity(r)}
                    className="w-full p-3 text-left text-xs sm:text-sm hover:bg-teal-light/40 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="text-muted text-xs">
                      {[r.admin, r.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                  Popular Indian Cities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_INDIAN_CITIES.slice(0, 10).map((c) => {
                    const isSelected = profile.city.name.startsWith(c.name);
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleSelectCity(c)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-teal-accent text-white border-teal-accent shadow-soft'
                            : 'bg-card border-card-border text-foreground hover:border-teal-accent/40'
                        }`}
                      >
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3 h-3" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* 4. AI Language Preference */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft"
      >
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-accent" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
              <Bi k="profile.language" layout="plain" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Choose your preferred language for explanations, plain-language terms, and advice.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 mt-4 sm:mt-5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = profile.language === lang.code;
            const isRegional = lang.code === getRegionalLanguageForCity(profile.city);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => updateProfile({ language: lang.code })}
                className={`relative min-h-[44px] sm:min-h-[46px] py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all flex flex-col justify-center items-center gap-0.5 cursor-pointer select-none ${
                  isSelected
                    ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-2 ring-teal-accent shadow-sm'
                    : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                }`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="text-xs sm:text-sm font-semibold leading-tight">{lang.nativeName}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-accent shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-muted leading-tight">{lang.name}</span>
                  {isRegional && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold bg-teal-accent/15 text-teal-accent border border-teal-accent/30">
                      Regional
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SpotlightCard>

      {/* 5. Voice & Speech Settings */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft space-y-5 sm:space-y-6"
      >
        <div className="space-y-2 sm:space-y-2.5">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-teal-accent" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
              <Bi k="voice.title" layout="plain" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            <Bi k="voice.subtitle" layout="plain" />
          </p>
        </div>

        <div className="divide-y divide-card-border/60">
          {/* 1. Voice Input Toggle */}
          <div className="py-4 sm:py-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-medium text-foreground">
                <Bi k="voice.inputToggle" layout="plain" />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isSpeechRecognitionSupported ? (
                  <Bi k="voice.inputSub" layout="plain" />
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Voice typing is not supported in this browser. You can use your phone&apos;s keyboard microphone.
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voiceSettings.enabled && isSpeechRecognitionSupported}
              disabled={!isSpeechRecognitionSupported}
              onClick={() => updateVoiceSettings({ enabled: !voiceSettings.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                voiceSettings.enabled && isSpeechRecognitionSupported
                  ? 'bg-teal-accent'
                  : 'bg-card-border'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  voiceSettings.enabled && isSpeechRecognitionSupported
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Auto-send Toggle */}
          <div className="py-4 sm:py-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-medium text-foreground">
                <Bi k="voice.autoSend" layout="plain" />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                <Bi k="voice.autoSendSub" layout="plain" />
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voiceSettings.autoSend}
              disabled={!voiceSettings.enabled || !isSpeechRecognitionSupported}
              onClick={() => updateVoiceSettings({ autoSend: !voiceSettings.autoSend })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                voiceSettings.autoSend && voiceSettings.enabled && isSpeechRecognitionSupported
                  ? 'bg-teal-accent'
                  : 'bg-card-border'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  voiceSettings.autoSend && voiceSettings.enabled && isSpeechRecognitionSupported
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Auto-read AI Replies Toggle */}
          <div className="py-4 sm:py-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-accent" />
                <Bi k="voice.autoRead" layout="plain" />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                <Bi k="voice.autoReadSub" layout="plain" />
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voiceSettings.autoReadReplies}
              disabled={!isSpeechSynthesisSupported}
              onClick={() => updateVoiceSettings({ autoReadReplies: !voiceSettings.autoReadReplies })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                voiceSettings.autoReadReplies && isSpeechSynthesisSupported
                  ? 'bg-teal-accent'
                  : 'bg-card-border'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  voiceSettings.autoReadReplies && isSpeechSynthesisSupported
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Speech Rate Selector */}
          <div className="py-4 sm:py-4.5 space-y-2">
            <div className="text-xs sm:text-sm font-medium text-foreground">
              <Bi k="voice.speed" layout="plain" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-2.5">
              {[
                { value: 1.0, label: '1.0x (Relaxed)' },
                { value: 1.2, label: '1.2x (Brisk)' },
                { value: 1.35, label: '1.35x (Fast)' },
              ].map((rate) => {
                const effectiveRate = voiceSettings.speechRate || 1.2;
                const isSelected = effectiveRate === rate.value;
                return (
                  <button
                    key={rate.value}
                    type="button"
                    onClick={() => updateVoiceSettings({ speechRate: rate.value })}
                    className={`min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    {rate.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Read Both Languages in Bilingual Mode */}
          <div className="py-4 sm:py-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-medium text-foreground">
                <Bi k="voice.readBoth" layout="plain" />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                <Bi k="voice.readBothSub" layout="plain" />
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voiceSettings.readBothBilingual}
              disabled={!isSpeechSynthesisSupported}
              onClick={() => updateVoiceSettings({ readBothBilingual: !voiceSettings.readBothBilingual })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                voiceSettings.readBothBilingual && isSpeechSynthesisSupported
                  ? 'bg-teal-accent'
                  : 'bg-card-border'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  voiceSettings.readBothBilingual && isSpeechSynthesisSupported
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 6. Voice Picker Dropdown */}
          <div className="py-4 sm:py-4.5 space-y-2">
            <label className="text-xs sm:text-sm font-medium text-foreground block">
              <Bi k="voice.picker" layout="plain" />
            </label>
            <select
              value={voiceSettings.preferredVoiceURI || ''}
              onChange={(e) =>
                updateVoiceSettings({ preferredVoiceURI: e.target.value || undefined })
              }
              className="w-full min-h-[38px] sm:min-h-[40px] px-3 py-2 rounded-xl border border-card-border bg-card text-foreground text-xs sm:text-sm focus:border-teal-accent focus:outline-none mt-2"
            >
              <option value="">
                -- {t.voice?.defaultVoice || 'System Default Voice'} --
              </option>
              {availableVoices
                .filter((v, idx, arr) => arr.findIndex((item) => item.voiceURI === v.voiceURI) === idx)
                .map((v, index) => (
                  <option key={`${v.voiceURI}-${index}`} value={v.voiceURI}>
                    {v.name} ({v.lang}) {v.default ? '★' : ''}
                  </option>
                ))}
            </select>
            {availableVoices.length === 0 && (
              <p className="text-[11px] text-muted">
                Detecting device voices...
              </p>
            )}
          </div>
        </div>

        {/* 7. Privacy Note */}
        <div className="p-4 rounded-xl bg-teal-light/40 border border-teal-accent/20 flex items-start gap-3 text-xs sm:text-sm text-muted leading-relaxed">
          <Info className="w-4 h-4 text-teal-accent shrink-0 mt-0.5" />
          <span>
            <Bi
              k="voice.privacyNote"
              en="Your browser or device may process your voice to turn it into text."
              layout="plain"
            />
          </span>
        </div>
      </SpotlightCard>

      {/* 6. Household Setup Details */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft space-y-6"
      >
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-teal-accent" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
              {t.profile.household}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Customize health vulnerabilities, cooking methods, and budget tier for your household.
          </p>
        </div>

        {/* Members */}
        <div className="pt-1">
          <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
            Vulnerable Family Members
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {[
              { id: 'child', key: 'home.familyFilter.child', fallbackEn: 'Baby & Kids' },
              { id: 'elderly', key: 'home.familyFilter.elderly', fallbackEn: 'Elderly (60+)' },
              { id: 'pregnant', key: 'home.familyFilter.pregnant', fallbackEn: 'Pregnant Person' },
              { id: 'asthma_heart', key: 'onboarding.asthma', fallbackEn: 'Asthma / Heart' },
            ].map((item) => {
              const active = household.members.includes(item.id as FamilyMember);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleMember(item.id as FamilyMember)}
                  className={`min-h-[38px] sm:min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-1.5 ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  <span className="text-left leading-snug">
                    <Bi k={item.key} en={item.fallbackEn} layout="inline" />
                  </span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cooking Fuel */}
        <div className="pt-2">
          <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
            Cooking Fuel
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {[
              { id: 'lpg', label: 'LPG Gas' },
              { id: 'induction_electric', label: 'Induction / Elec' },
              { id: 'wood_biomass', label: 'Wood / Biomass' },
            ].map((f) => {
              const active = household.cookingFuel === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFuel(f.id as CookingFuel)}
                  className={`min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Preference */}
        <div className="pt-2">
          <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
            Action Cost Preference
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {[
              { id: 'free_only', label: 'Free only' },
              { id: 'low_cost', label: 'Low-cost (DIY/N95)' },
              { id: 'flexible', label: 'Flexible (HEPA)' },
            ].map((b) => {
              const active = household.budget === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBudget(b.id as BudgetTier)}
                  className={`min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Child Age Band (if children present) */}
        {household.members.includes('child') && (
          <div className="pt-2 border-t border-card-border/60">
            <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
              Child Age Band
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {[
                { id: 'infant_0_2', label: 'Infant (< 2 yrs)' },
                { id: 'child_2_12', label: 'Child (2–12 yrs)' },
                { id: 'teen_13_18', label: 'Teen (13–18 yrs)' },
              ].map((age) => {
                const active = household.childAgeBand === age.id;
                return (
                  <button
                    key={age.id}
                    onClick={() =>
                      updateProfile({
                        household: { ...household, childAgeBand: age.id as ChildAgeBand },
                      })
                    }
                    className={`min-h-[36px] px-2 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    {age.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Work & Commute */}
        <div className="pt-2 border-t border-card-border/60 space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
              Work Environment
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {[
                { id: 'indoor', label: 'Indoor (Office / Home)' },
                { id: 'outdoor', label: 'Outdoor (Site / Transit)' },
              ].map((w) => {
                const active = household.work === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWork(w.id as WorkType)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
              Daily Commute Modes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'two_wheeler', label: 'Two-wheeler' },
                { id: 'bus_metro', label: 'Bus / Metro' },
                { id: 'walk', label: 'Walk' },
                { id: 'cycle', label: 'Cycle' },
              ].map((c) => {
                const active = household.commute.includes(c.id as CommuteType);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCommute(c.id as CommuteType)}
                    className={`min-h-[36px] px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      active
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    <span>{c.label}</span>
                    {active && <Check className="w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs sm:text-sm text-foreground font-medium">Daily School Drop & Pickup</span>
            <button
              type="button"
              onClick={() =>
                updateProfile({
                  household: { ...household, schoolRun: !household.schoolRun },
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                household.schoolRun ? 'bg-teal-accent' : 'bg-card-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  household.schoolRun ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Air Purifier & Clean Air Gear */}
        <div className="pt-2 border-t border-card-border/60 space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
              Home Air Purifier
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {[
                { val: true, label: 'Have an Air Purifier' },
                { val: false, label: 'No Purifier Yet' },
              ].map((p) => {
                const active = household.hasPurifier === p.val;
                return (
                  <button
                    key={String(p.val)}
                    onClick={() =>
                      updateProfile({
                        household: { ...household, hasPurifier: p.val },
                      })
                    }
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground block mb-3">
              Outdoor Mask Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'n95', label: 'Fitted N95' },
                { id: 'cloth', label: 'Cloth mask' },
                { id: 'none', label: 'None' },
              ].map((m) => {
                const active = household.maskType === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      updateProfile({
                        household: { ...household, maskType: m.id as MaskType },
                      })
                    }
                    className={`min-h-[36px] px-2 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* 7. Demo Reload & Danger Zone */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.08)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft space-y-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
              Demo Preset (Delhi Smog Scenario)
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Loads stored sample reading (PM2.5: 184) and household with child & senior.
            </p>
          </div>
          <button
            onClick={loadDemoMode}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-teal-accent text-teal-accent font-medium hover:bg-teal-light transition-colors text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Load Demo Data</span>
          </button>
        </div>

        {/* Clear Chat History */}
        <div className="pt-4 border-t border-card-border/70 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-accent" />
              <Bi k="profile.clearChat" layout="plain" />
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              <Bi k="profile.clearChatSub" layout="plain" />
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearChatHistory();
              setChatClearedToast(true);
              setTimeout(() => setChatClearedToast(false), 2500);
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-card-border hover:border-teal-accent/50 bg-card hover:bg-card-subtle text-foreground transition-all text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            {chatClearedToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-accent" />
                <span className="text-teal-accent font-semibold">Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-muted" />
                <Bi k="profile.clearChat" layout="plain" />
              </>
            )}
          </button>
        </div>

        {/* Reset All Data */}
        <div className="pt-4 border-t border-card-border/70 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <Bi k="profile.resetData" layout="plain" />
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Wipes localStorage cache, profile settings, and chat history.
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <Bi k="profile.resetData" layout="plain" />
          </button>
        </div>
      </SpotlightCard>

      {/* 8. About & Data Sources */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.08)"
        className="bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft space-y-2.5 sm:space-y-3"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-accent" />
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
            About Clearhale
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Real live air quality data powered by OpenAQ from official government ground monitoring stations, with forecast models by Open-Meteo. Clearhale provides science-backed environmental guidance for cleaner indoor air.
        </p>
      </SpotlightCard>

      {/* Reset Confirmation Dialog (Portaled to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-card max-w-sm w-full p-6 shadow-float border border-card-border space-y-4"
              >
                <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400 font-semibold text-base">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Confirm Reset</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  <Bi k="profile.resetConfirm" layout="plain" />
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 rounded-card border border-card-border text-foreground hover:bg-card-subtle text-xs font-medium"
                  >
                    <Bi k="profile.cancel" en="Cancel" layout="inline" />
                  </button>
                  <button
                    onClick={async () => {
                      if (user) {
                        await deleteCloudAccount();
                      }
                      resetAllData();
                      setShowResetConfirm(false);
                    }}
                    className="px-4 py-2 rounded-card bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold shadow-soft"
                  >
                    <Bi k="profile.confirmReset" en="Yes, Reset Everything" layout="inline" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
