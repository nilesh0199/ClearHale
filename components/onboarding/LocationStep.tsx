'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { searchCities } from '@/lib/openMeteo';
import { POPULAR_INDIAN_CITIES, reverseGeocodeLocation, findNearestCatalogCity } from '@/lib/citiesData';
import { CityLocation } from '@/types';
import { MapPin, Navigation, Search, Check, ArrowRight, ArrowLeft, Loader2, MousePointerClick } from 'lucide-react';

export function LocationStep() {
  const { profile, updateProfile, setOnboardingStep, refreshAirData, t } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedStatus, setDetectedStatus] = useState<string | null>(null);
  const lastClickedCity = useRef<{ name: string; time: number } | null>(null);

  // Popular city chips across India for fast one-tap setup
  const sampleCities: CityLocation[] = POPULAR_INDIAN_CITIES;

  // Geocoding debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await searchCities(query);
        setResults(hits);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCity = (city: CityLocation) => {
    const now = Date.now();
    const isDoubleTap =
      lastClickedCity.current &&
      lastClickedCity.current.name === city.name &&
      now - lastClickedCity.current.time < 500;

    const chosenCity: CityLocation = { ...city, isCurrentLocation: false };

    // Double tap or clicking already selected city advances immediately
    if (isDoubleTap || profile.city.name.startsWith(city.name)) {
      updateProfile({ city: chosenCity });
      refreshAirData(city.lat, city.lon, false);
      setOnboardingStep('intake-choice');
      return;
    }

    lastClickedCity.current = { name: city.name, time: now };
    updateProfile({ city: chosenCity });
    refreshAirData(city.lat, city.lon, false);
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

          // Give user a brief visual confirmation of their detected city, then automatically continue
          setTimeout(() => {
            setOnboardingStep('intake-choice');
          }, 850);
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
            setOnboardingStep('intake-choice');
          }, 850);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setDetectedStatus(null);
        setLocationError('Could not access GPS location. Please select or search your city below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-8 select-none">
      <div>
        <button
          onClick={() => setOnboardingStep('language')}
          className="mb-4 sm:mb-6 min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            <Bi k="onboarding.selectLocation" layout="plain" />
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Smog levels and cold air smoke traps depend heavily on your local district.
          </p>
          <p className="text-xs text-teal-accent font-medium mt-2 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
            <span>Search or double-tap any city to select & continue</span>
          </p>
        </motion.div>

        {/* GPS Button */}
        <div className="mt-6">
          <button
            onClick={handleUseLocation}
            disabled={isLocating || !!detectedStatus}
            className={`w-full min-h-[48px] px-4 py-3 rounded-card border font-medium transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-accent ${
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
                <span className="font-semibold">{detectedStatus} • Continuing...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" strokeWidth={1.75} />
                <span>
                  <Bi k="onboarding.useGps" layout="inline" />
                </span>
              </>
            )}
          </button>
          {locationError && (
            <p className="text-xs text-rose-600 mt-2 px-1">{locationError}</p>
          )}
        </div>

        {/* City Search Input */}
        <div className="mt-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Search className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.onboarding.searchCity}
            className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-card border border-card-border bg-card text-foreground placeholder:text-muted/60 focus:border-teal-accent focus-visible:ring-2 focus-visible:ring-teal-accent transition-colors outline-none"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
            </div>
          )}
        </div>

        {/* Search Results Dropdown or Chips */}
        {results.length > 0 ? (
          <div className="mt-3 bg-card border border-card-border rounded-card shadow-soft divide-y divide-card-border overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectCity(r)}
                onDoubleClick={() => {
                  updateProfile({ city: r });
                  refreshAirData(r.lat, r.lon);
                  setOnboardingStep('intake-choice');
                }}
                className="w-full p-3 text-left hover:bg-teal-light/40 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted">
                    {[r.admin, r.country].filter(Boolean).join(', ')}
                  </div>
                </div>
                <MapPin className="w-4 h-4 text-muted" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Popular Cities & Districts
              </span>
              <span className="text-[11px] text-muted">
                India & Global
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2 pb-6 sm:pb-0">
              {sampleCities.map((city) => {
                const isSelected = profile.city.name.startsWith(city.name);
                return (
                  <motion.button
                    key={city.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCity(city)}
                    onDoubleClick={() => {
                      updateProfile({ city });
                      refreshAirData(city.lat, city.lon);
                      setOnboardingStep('intake-choice');
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-card text-sm font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-teal-accent bg-teal-accent text-white shadow-soft'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    <span>{city.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected City Indicator */}
        <div className="mt-6 p-4 rounded-card bg-card-subtle border border-card-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-light text-teal-accent flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted">Selected Location:</div>
            <div className="font-medium text-foreground truncate">
              {profile.city.name}
            </div>
          </div>
        </div>
      </div>

      {/* Continue - Visible and sticky on all viewports */}
      <div className="pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sticky bottom-0 z-20 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-8 px-4 sm:px-8 border-t border-card-border/60 mt-4 sm:mt-6">
        <button
          onClick={() => setOnboardingStep('intake-choice')}
          className={`w-full min-h-[48px] px-6 py-3.5 rounded-card font-medium shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 ${
            profile.accentMode === 'mono'
              ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 focus-visible:ring-neutral-400'
              : 'bg-teal-accent text-white hover:bg-teal-hover focus-visible:ring-teal-accent'
          }`}
        >
          <Bi k="onboarding.continue" layout="inline" />
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
