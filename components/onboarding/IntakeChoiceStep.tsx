'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { ArrowLeft, ArrowRight, MessageSquare, ClipboardList, Mic } from 'lucide-react';

export function IntakeChoiceStep() {
  const { setOnboardingStep, theme } = useApp();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col justify-between p-6 sm:p-10 select-none">
      <div>
        {/* Back navigation */}
        <button
          onClick={() => setOnboardingStep('location')}
          className="mb-6 min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Back</span>
        </button>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            <Bi k="onboarding.intakeChoiceTitle" layout="plain" />
          </h2>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            <Bi k="onboarding.intakeChoiceSub" layout="plain" />
          </p>
        </motion.div>

        {/* Choice Cards */}
        <div className="mt-8 space-y-4">
          {/* Option 1: Personalise in about 2 minutes (voice or text) */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
          >
            <SpotlightCard
              onClick={() => setOnboardingStep('intake-chat')}
              spotlightColor={
                theme === 'dark' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(13, 92, 82, 0.1)'
              }
              className="p-5 sm:p-6 rounded-card border border-teal-accent/40 bg-teal-light/20 text-left flex flex-col justify-between cursor-pointer transition-all hover:border-teal-accent shadow-soft group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-foreground leading-snug">
                      <Bi k="onboarding.choicePersonalise" layout="plain" />
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-accent/15 text-teal-accent">
                      <Mic className="w-3 h-3" strokeWidth={1.75} />
                      Voice or text
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed">
                    <Bi k="onboarding.choicePersonaliseSub" layout="plain" />
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-card-border/60 flex items-center justify-between text-xs font-medium text-teal-accent">
                <span>Start 2-minute conversation</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Option 2: Skip, use quick setup */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
          >
            <SpotlightCard
              onClick={() => setOnboardingStep('household')}
              spotlightColor={
                theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
              }
              className="p-5 sm:p-6 rounded-card border border-card-border bg-card text-left flex flex-col justify-between cursor-pointer transition-all hover:border-card-border/80 shadow-soft group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-card-subtle border border-card-border text-muted flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground leading-snug">
                    <Bi k="onboarding.choiceQuick" layout="plain" />
                  </h3>
                  <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed">
                    <Bi k="onboarding.choiceQuickSub" layout="plain" />
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-card-border/60 flex items-center justify-between text-xs font-medium text-muted group-hover:text-foreground">
                <span>Open quick checklist</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>

      {/* Footer reassurance */}
      <div className="pt-6 pb-2 text-center">
        <p className="text-[11px] text-muted leading-relaxed">
          You can change these preferences anytime from Settings.
        </p>
      </div>
    </div>
  );
}
