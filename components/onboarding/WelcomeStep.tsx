'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { ClearhaleMarkFull } from '../brand/ClearhaleMarkFull';
import { Particles } from '../ui/rb/Particles';
import { BlurText } from '../ui/rb/BlurText';
import { ArrowRight, PlayCircle } from 'lucide-react';

export function WelcomeStep() {
  const { setOnboardingStep, loadDemoMode, t, profile } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [isSkipped, setIsSkipped] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);

  const disableEffects = shouldReduceMotion || profile.reduceEffects;

  useEffect(() => {
    if (disableEffects) {
      setIsSkipped(true);
      setIsIntroDone(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsIntroDone(true);
    }, 2400);

    return () => clearTimeout(timer);
  }, [disableEffects]);

  const handleScreenTap = () => {
    if (!isSkipped && !disableEffects) {
      setIsSkipped(true);
      setIsIntroDone(true);
    }
  };

  return (
    <div
      onClick={handleScreenTap}
      className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 py-8 sm:py-12 bg-background relative overflow-y-auto overscroll-y-contain touch-pan-y select-none cursor-pointer [scrollbar-width:thin]"
      role="region"
      aria-label="Welcome screen"
    >
      {/* Background Subtle Radial Vignette (Restrained neutrals) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 36%, rgba(13, 92, 82, 0.05) 0%, rgba(13, 92, 82, 0.01) 50%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Haze Particles (React Bits inspired, restrained drift) */}
      {!disableEffects && (
        <Particles
          density={2.0}
          color={profile.theme === 'dark' ? 'rgba(45, 212, 191, 0.18)' : 'rgba(13, 92, 82, 0.12)'}
          speed={0.3}
          className="opacity-70"
        />
      )}

      {/* Main Centered Column Stack (max-w-[420px]) */}
      <div className="w-full max-w-[420px] flex flex-col items-center text-center relative z-10">
        {/* 1. Hero Logo Mark */}
        <div className="relative flex items-center justify-center my-3 sm:my-4">
          <motion.div
            whileHover={disableEffects ? undefined : { scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <ClearhaleMarkFull
              size={144}
              className="w-28 h-28 sm:w-44 sm:h-44 transition-transform"
              introAnimation={!disableEffects && !isSkipped && !isIntroDone}
              isBreathing={isSkipped || isIntroDone}
            />
          </motion.div>
        </div>

        {/* 2. Wordmark */}
        <motion.h1
          initial={disableEffects || isSkipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: disableEffects || isSkipped ? 0 : 1.6,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground lowercase"
        >
          clearhale
        </motion.h1>

        {/* 3. Tagline with subtle BlurText spring entrance */}
        <div className="mt-3 text-sm sm:text-base text-muted leading-relaxed font-normal max-w-sm">
          {disableEffects || isSkipped ? (
            <Bi k="tagline" layout="plain" />
          ) : (
            <BlurText
              text={t.tagline || 'Breathe clearer with every informed decision.'}
              delay={0.04}
            />
          )}
        </div>

        {/* 4. Action Buttons */}
        <motion.div
          initial={disableEffects || isSkipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: disableEffects || isSkipped ? 0 : 2.0,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-6 sm:mt-8 w-full space-y-3 pb-6 sm:pb-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Primary Button: Get started */}
          <motion.button
            whileHover={disableEffects ? undefined : { scale: 1.015 }}
            whileTap={disableEffects ? undefined : { scale: 0.985 }}
            onClick={() => setOnboardingStep('theme')}
            className="w-full min-h-[50px] px-6 py-3.5 rounded-card bg-teal-accent text-white font-medium shadow-soft hover:bg-teal-hover transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-accent text-sm sm:text-base cursor-pointer select-none"
          >
            <Bi k="getStarted" layout="inline" />
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
          </motion.button>

          {/* Secondary Button: Try demo */}
          <motion.button
            whileHover={disableEffects ? undefined : { scale: 1.015 }}
            whileTap={disableEffects ? undefined : { scale: 0.985 }}
            onClick={() => loadDemoMode()}
            className="w-full min-h-[50px] px-6 py-3.5 rounded-card bg-card border border-card-border text-foreground font-medium shadow-soft hover:bg-card-subtle transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-accent text-sm sm:text-base cursor-pointer select-none"
          >
            <PlayCircle className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
            <Bi k="tryDemo" layout="inline" />
          </motion.button>
        </motion.div>
      </div>

      {/* Subtle bottom skip hint before intro completes */}
      {!isSkipped && !isIntroDone && !disableEffects && (
        <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[11px] uppercase tracking-wider text-muted/50 font-medium">
            Tap anywhere to skip
          </span>
        </div>
      )}
    </div>
  );
}
