'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { BreatheTab } from './BreatheTab';
import { MythsTab } from './MythsTab';
import { TermsTab } from './TermsTab';
import { Wind, BookOpen, FileText } from 'lucide-react';

export type CareSubTabId = 'breathe' | 'learn' | 'terms';

export function CareScreen() {
  const { profile } = useApp();
  const isMono = profile.accentMode === 'mono';
  const shouldReduceMotion = useReducedMotion();
  const [currentTab, setCurrentTab] = useState<CareSubTabId>('breathe');
  const breatheTabRef = useRef<HTMLButtonElement>(null);
  const learnTabRef = useRef<HTMLButtonElement>(null);
  const termsTabRef = useRef<HTMLButtonElement>(null);

  // Initialize from URL hash (#breathe, #learn, #terms) or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.toLowerCase();
    if (hash === '#terms') {
      setCurrentTab('terms');
      return;
    }
    if (hash === '#learn') {
      setCurrentTab('learn');
      return;
    }
    if (hash === '#breathe') {
      setCurrentTab('breathe');
      return;
    }

    try {
      const stored = localStorage.getItem('clearhale_learn_tab') as CareSubTabId;
      if (stored === 'learn' || stored === 'breathe' || stored === 'terms') {
        setCurrentTab(stored);
      }
    } catch (e) {}
  }, []);

  // Listen for hashchange events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#terms') setCurrentTab('terms');
      else if (hash === '#learn') setCurrentTab('learn');
      else if (hash === '#breathe') setCurrentTab('breathe');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const switchTab = (tab: CareSubTabId) => {
    setCurrentTab(tab);
    try {
      localStorage.setItem('clearhale_learn_tab', tab);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch (e) {}
  };

  // Keyboard navigation for tablist (ArrowLeft / ArrowRight across 3 tabs)
  const tabOrder: CareSubTabId[] = ['breathe', 'learn', 'terms'];
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabOrder.length;
      const nextTab = tabOrder[nextIndex];
      switchTab(nextTab);
      focusTab(nextTab);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
      const prevTab = tabOrder[prevIndex];
      switchTab(prevTab);
      focusTab(prevTab);
    }
  };

  const focusTab = (tab: CareSubTabId) => {
    if (tab === 'breathe') breatheTabRef.current?.focus();
    else if (tab === 'learn') learnTabRef.current?.focus();
    else if (tab === 'terms') termsTabRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 text-left">
      {/* Page Header (Compact) */}
      <div className="mb-3">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          <Bi k="care.title" en="Care & Air Knowledge" layout="plain" />
        </h1>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">
          <Bi k="care.subtitle" en="Guided breathing sessions, smog myth busters, and plain-language air quality terms." layout="plain" />
        </p>
      </div>

      {/* Sticky Segmented Pill Tab Control (3 Tabs: Breathe, Learn, Terms) */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-1 pb-3 mb-2">
        <div className="w-full max-w-[460px] mx-auto">
          <div
            role="tablist"
            aria-label="Care and air knowledge sections"
            onKeyDown={handleKeyDown}
            className="p-1 rounded-full bg-card-subtle border border-card-border flex items-center relative select-none shadow-xs"
          >
            {/* Tab 1: Breathe */}
            <button
              ref={breatheTabRef}
              id="tab-breathe"
              role="tab"
              aria-controls="panel-breathe"
              aria-selected={currentTab === 'breathe'}
              tabIndex={currentTab === 'breathe' ? 0 : -1}
              onClick={() => switchTab('breathe')}
              className={`relative z-10 flex-1 min-w-0 min-h-[40px] px-1.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent whitespace-nowrap ${
                currentTab === 'breathe'
                  ? isMono
                    ? 'text-neutral-50 font-semibold'
                    : 'text-foreground font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {currentTab === 'breathe' && (
                <motion.div
                  layoutId="care-tab-pill"
                  className={`absolute inset-0 rounded-full ${
                    isMono
                      ? 'bg-neutral-900 border border-neutral-800 shadow-sm'
                      : 'bg-card shadow-soft border border-card-border'
                  }`}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 35 }
                  }
                />
              )}
              <Wind className={`w-3.5 h-3.5 relative z-10 shrink-0 ${isMono ? (currentTab === 'breathe' ? 'text-neutral-50' : 'text-muted') : 'text-teal-accent'}`} strokeWidth={1.75} />
              <span className="relative z-10">
                <Bi k="care.tabs.breathe" en="Breathe" layout="inline" />
              </span>
            </button>

            {/* Tab 2: Learn */}
            <button
              ref={learnTabRef}
              id="tab-learn"
              role="tab"
              aria-controls="panel-learn"
              aria-selected={currentTab === 'learn'}
              tabIndex={currentTab === 'learn' ? 0 : -1}
              onClick={() => switchTab('learn')}
              className={`relative z-10 flex-1 min-w-0 min-h-[40px] px-1.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent whitespace-nowrap cursor-pointer ${
                currentTab === 'learn'
                  ? isMono
                    ? 'text-neutral-50 font-semibold'
                    : 'text-foreground font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {currentTab === 'learn' && (
                <motion.div
                  layoutId="care-tab-pill"
                  className={`absolute inset-0 rounded-full ${
                    isMono
                      ? 'bg-neutral-900 border border-neutral-800 shadow-sm'
                      : 'bg-card shadow-soft border border-card-border'
                  }`}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 35 }
                  }
                />
              )}
              <BookOpen className={`w-3.5 h-3.5 relative z-10 shrink-0 ${isMono ? (currentTab === 'learn' ? 'text-neutral-50' : 'text-muted') : 'text-teal-accent'}`} strokeWidth={1.75} />
              <span className="relative z-10">
                <Bi k="care.tabs.learn" en="Learn" layout="inline" />
              </span>
            </button>

            {/* Tab 3: Terms */}
            <button
              ref={termsTabRef}
              id="tab-terms"
              role="tab"
              aria-controls="panel-terms"
              aria-selected={currentTab === 'terms'}
              tabIndex={currentTab === 'terms' ? 0 : -1}
              onClick={() => switchTab('terms')}
              className={`relative z-10 flex-1 min-w-0 min-h-[40px] px-1.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent whitespace-nowrap cursor-pointer ${
                currentTab === 'terms'
                  ? isMono
                    ? 'text-neutral-50 font-semibold'
                    : 'text-foreground font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {currentTab === 'terms' && (
                <motion.div
                  layoutId="care-tab-pill"
                  className={`absolute inset-0 rounded-full ${
                    isMono
                      ? 'bg-neutral-900 border border-neutral-800 shadow-sm'
                      : 'bg-card shadow-soft border border-card-border'
                  }`}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 35 }
                  }
                />
              )}
              <FileText className={`w-3.5 h-3.5 relative z-10 shrink-0 ${isMono ? (currentTab === 'terms' ? 'text-neutral-50' : 'text-muted') : 'text-teal-accent'}`} strokeWidth={1.75} />
              <span className="relative z-10">
                <Bi k="care.tabs.terms" en="Terms" layout="inline" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Panels with Short Smooth Slide / Fade Switch */}
      <AnimatePresence mode="wait">
        {currentTab === 'breathe' && (
          <motion.div
            key="breathe"
            id="panel-breathe"
            role="tabpanel"
            aria-labelledby="tab-breathe"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <BreatheTab />
          </motion.div>
        )}

        {currentTab === 'learn' && (
          <motion.div
            key="learn"
            id="panel-learn"
            role="tabpanel"
            aria-labelledby="tab-learn"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <MythsTab />
          </motion.div>
        )}

        {currentTab === 'terms' && (
          <motion.div
            key="terms"
            id="panel-terms"
            role="tabpanel"
            aria-labelledby="tab-terms"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <TermsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Backwards-compatible export
export const LearnScreen = CareScreen;
