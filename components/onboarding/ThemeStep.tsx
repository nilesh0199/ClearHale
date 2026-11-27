'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { AppTheme } from '@/types';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { ArrowLeft, ArrowRight, Check, Sun, Moon, Laptop, MousePointerClick, LucideIcon } from 'lucide-react';

interface ThemeOption {
  id: AppTheme;
  title: string;
  description: string;
  icon: LucideIcon;
  preview: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
}

export function ThemeStep() {
  const { theme, setTheme, setOnboardingStep, profile } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const lastClickedTheme = useRef<{ id: string; time: number } | null>(null);

  const themes: ThemeOption[] = [
    {
      id: 'light',
      title: 'Light',
      description: 'Clean, calm off-white palette',
      icon: Sun,
      preview: {
        bg: '#FAFAFA',
        card: '#FFFFFF',
        accent: '#0D5C52',
        text: '#171717',
      },
    },
    {
      id: 'dark',
      title: 'Dark',
      description: 'Deep neutral, easy on eyes',
      icon: Moon,
      preview: {
        bg: '#0A0A0A',
        card: '#171717',
        accent: '#2DD4BF',
        text: '#F5F5F5',
      },
    },
    {
      id: 'system',
      title: 'System',
      description: 'Matches your device preference',
      icon: Laptop,
      preview: {
        bg: 'linear-gradient(135deg, #FAFAFA 50%, #0A0A0A 50%)',
        card: 'linear-gradient(135deg, #FFFFFF 50%, #171717 50%)',
        accent: '#2DD4BF',
        text: '#171717',
      },
    },
  ];

  const handleSelect = (selectedTheme: AppTheme) => {
    const now = Date.now();
    const isDoubleTap =
      lastClickedTheme.current &&
      lastClickedTheme.current.id === selectedTheme &&
      now - lastClickedTheme.current.time < 500;

    // Double tap or clicking already selected theme advances immediately
    if (isDoubleTap || theme === selectedTheme) {
      setTheme(selectedTheme);
      setOnboardingStep('language');
      return;
    }

    lastClickedTheme.current = { id: selectedTheme, time: now };
    setTheme(selectedTheme);
  };

  const handleContinue = () => {
    setOnboardingStep('language');
  };

  const handleSkip = () => {
    setTheme('system');
    setOnboardingStep('language');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-8 select-none">
      <div>
        {/* Back navigation */}
        <button
          onClick={() => setOnboardingStep('welcome')}
          className="mb-4 sm:mb-6 min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Back</span>
        </button>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Choose your look
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Clearhale adapts comfortably to day or night with tuned contrast.
          </p>
          <p className="text-xs text-teal-accent font-medium mt-2 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
            <span>Double-click or tap twice to select & continue</span>
          </p>
        </motion.div>

        {/* 3 Tappable Theme Preview Cards with React Bits SpotlightCard */}
        <div className="mt-5 sm:mt-8 space-y-3 sm:space-y-3.5">
          {themes.map((item, idx) => {
            const isSelected = theme === item.id;
            return (
              <motion.div
                key={item.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              >
                <SpotlightCard
                  onClick={() => handleSelect(item.id)}
                  onDoubleClick={() => {
                    setTheme(item.id);
                    setOnboardingStep('language');
                  }}
                  spotlightColor={
                    theme === 'dark' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(13, 92, 82, 0.08)'
                  }
                  className={`w-full p-3.5 sm:p-4 rounded-card border text-left flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? profile.accentMode === 'mono'
                        ? 'border-border-strong bg-card-subtle text-foreground shadow-soft ring-1 ring-border-strong'
                        : 'border-teal-accent bg-teal-light text-foreground shadow-soft ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Miniature Visual Preview */}
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-card-border flex items-center justify-center shrink-0 p-1.5 relative overflow-hidden shadow-xs"
                      style={{ background: item.preview.bg }}
                    >
                      <div
                        className="w-full h-full rounded-lg flex flex-col items-center justify-center p-1 border border-black/5"
                        style={{ background: item.preview.card }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: item.preview.accent }}
                        />
                        <div
                          className="w-5 h-1 rounded-full mt-1 opacity-60"
                          style={{ backgroundColor: item.preview.text }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-sm sm:text-base flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${profile.accentMode === 'mono' ? 'text-foreground' : 'text-teal-accent'}`} strokeWidth={1.75} />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                        profile.accentMode === 'mono'
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                          : 'bg-teal-accent text-white'
                      }`}
                    >
                      <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions - Hidden on mobile (users double tap to select & proceed), visible on desktop */}
      <div className="hidden sm:block pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sticky bottom-0 z-20 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-8 px-4 sm:px-8 border-t border-card-border/60 mt-4 sm:mt-6 space-y-2">
        <motion.button
          whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
          onClick={handleContinue}
          className={`w-full min-h-[48px] px-6 py-3.5 rounded-card font-medium shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 ${
            profile.accentMode === 'mono'
              ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 focus-visible:ring-neutral-400'
              : 'bg-teal-accent text-white hover:bg-teal-hover focus-visible:ring-teal-accent'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </motion.button>

        <button
          onClick={handleSkip}
          className="w-full min-h-[40px] py-1 text-center text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Skip (defaults to System)
        </button>
      </div>

      {/* Mobile-only Skip link */}
      <div className="sm:hidden text-center mt-6 pb-4">
        <button
          onClick={handleSkip}
          className="min-h-[40px] px-4 py-1 text-center text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Skip (defaults to System)
        </button>
      </div>
    </div>
  );
}
