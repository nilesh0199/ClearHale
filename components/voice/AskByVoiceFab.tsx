'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useVoice } from '@/context/VoiceContext';
import { Bi } from '../Bi';

export function AskByVoiceFab() {
  const { activeTab, setActiveTab, profile, t } = useApp();
  const { isSpeechRecognitionSupported, voiceSettings, startListening } = useVoice();
  const shouldReduceMotion = useReducedMotion();
  const [isShrunk, setIsShrunk] = useState(false);

  // If voice is disabled or unsupported, do not display
  if (!isSpeechRecognitionSupported || !voiceSettings.enabled) {
    return null;
  }

  // Scroll listener: on Home tab, shrink to mic-only circle on scroll; expand at top
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // When scrolled down past 28px, shrink into a compact circle
      if (scrollY > 28) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When switching to home tab or clicking home, expand fully if near the top
  useEffect(() => {
    if (activeTab === 'home') {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY <= 28) {
        setIsShrunk(false);
      }
    }
  }, [activeTab]);

  const handleFabClick = () => {
    // 1. Switch to Ask screen
    setActiveTab('ask');

    // 2. Start listening immediately (small tick delay ensures Ask screen textarea is mounted)
    setTimeout(() => {
      startListening();
    }, 120);
  };

  return (
    <motion.button
      layout
      type="button"
      onClick={handleFabClick}
      initial={{ scale: 0.9, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`fixed bottom-28 right-4 sm:bottom-8 sm:right-8 z-30 min-h-[48px] rounded-full bg-teal-accent hover:bg-teal-hover text-white font-medium shadow-float flex items-center justify-center border border-white/20 select-none group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent overflow-hidden transition-[width,padding] duration-300 ease-out ${
        isShrunk ? 'w-12 h-12 p-0' : 'w-12 h-12 p-0 sm:w-auto sm:px-4 sm:py-2.5 sm:gap-2.5'
      }`}
      aria-label="Ask by voice - opens Ask Clearhale and starts microphone"
      title={isShrunk ? 'Ask by voice' : undefined}
    >
      {/* Ambient Pulsing Glow Halo */}
      {!shouldReduceMotion && (
        <span
          className="absolute inset-0 rounded-full bg-teal-400/35 blur-sm animate-mic-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Mic Icon with circular badge */}
      <div
        className={`relative rounded-full bg-white/20 flex items-center justify-center shrink-0 transition-all ${
          isShrunk ? 'w-9 h-9' : 'w-7 h-7'
        }`}
      >
        <Mic className={isShrunk ? 'w-5 h-5 text-white' : 'w-4 h-4 text-white'} />
      </div>

      {/* Button Text (Compact mic on mobile; on desktop expands with single concise label, never gets extra long) */}
      <AnimatePresence initial={false}>
        {!isShrunk && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="hidden sm:inline text-xs sm:text-sm font-semibold tracking-tight text-white whitespace-nowrap drop-shadow-xs overflow-hidden"
          >
            {profile.language === 'en' ? 'Ask by voice' : (t.voice?.askByVoice || 'Ask by voice')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
