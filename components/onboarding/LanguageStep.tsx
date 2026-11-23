'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { SupportedLanguage } from '@/types';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

export function LanguageStep() {
  const { profile, updateProfile, setOnboardingStep, theme } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    updateProfile({ language: code });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-8 select-none pb-28 sm:pb-32">
      <div>
        {/* Back navigation */}
        <button
          onClick={() => setOnboardingStep('theme')}
          className="mb-2 sm:mb-4 min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
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
            <Bi k="onboarding.selectLanguage" layout="plain" />
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            <Bi k="onboarding.languageSub" layout="plain" />
          </p>
        </motion.div>

        {/* Language Grid */}
        <div className="my-3 sm:my-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pb-2">
            {SUPPORTED_LANGUAGES.map((lang, idx) => {
              const isSelected = profile.language === lang.code;
              return (
                <motion.div
                  key={lang.code}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.025, duration: 0.25 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                >
                  <SpotlightCard
                    onClick={() => handleSelectLanguage(lang.code)}
                    spotlightColor={
                      theme === 'dark' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(13, 92, 82, 0.08)'
                    }
                    className={`min-h-[54px] sm:min-h-[62px] p-3 sm:p-4 rounded-card border text-left flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? profile.accentMode === 'mono'
                          ? 'border-border-strong bg-card-subtle text-foreground font-semibold shadow-soft ring-1 ring-border-strong'
                          : 'border-teal-accent bg-teal-light text-teal-accent font-semibold shadow-soft ring-1 ring-teal-accent'
                        : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-base sm:text-lg leading-tight font-medium truncate">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] sm:text-xs text-muted font-normal mt-0.5 truncate">
                        {lang.name}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                          profile.accentMode === 'mono'
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'bg-teal-accent text-white'
                        }`}
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </motion.div>
                    )}
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned Bottom Continue Button: Fixed to bottom of screen so it is ALWAYS visible and reachable on any viewport! */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-card-border/60 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-soft">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
            onClick={() => setOnboardingStep('location')}
            className={`w-full min-h-[48px] px-6 py-3.5 rounded-card font-medium shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 ${
              profile.accentMode === 'mono'
                ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 focus-visible:ring-neutral-400'
                : 'bg-teal-accent text-white hover:bg-teal-hover focus-visible:ring-teal-accent'
            }`}
          >
            <Bi k="onboarding.continue" layout="inline" />
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
