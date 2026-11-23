'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { BreathingRing } from '../BreathingRing';
import { ClearhaleMarkFlat } from '../brand/ClearhaleMarkFlat';
import { ShinyText } from '../ui/rb/ShinyText';
import { CheckCircle2 } from 'lucide-react';

export function BuildingPlanStep() {
  const { updateProfile, setOnboardingStep, t } = useApp();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 700);
    const timer2 = setTimeout(() => setStage(2), 1400);
    const timerFinal = setTimeout(() => {
      updateProfile({ onboardingCompleted: true });
      setOnboardingStep('complete');
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerFinal);
    };
  }, [updateProfile, setOnboardingStep]);

  const stages = [
    'Analyzing district air patterns...',
    'Matching peer-reviewed routines to family profile...',
    'Calibrating 24-hour clean air windows...',
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex flex-col items-center max-w-sm">
        <BreathingRing
          colorHex="var(--teal-accent)"
          size={160}
          strokeWidth={4}
          mode="ambient"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-teal-accent font-semibold text-base lowercase flex items-center gap-1.5"
          >
            <ClearhaleMarkFlat size={20} className="shrink-0 text-teal-accent" />
            <span>clearhale</span>
          </motion.div>
        </BreathingRing>

        <h3 className="mt-8 text-xl font-semibold text-foreground tracking-tight">
          <Bi k="onboarding.buildingPlan" layout="plain" />
        </h3>

        <div className="mt-4 min-h-[44px] flex items-center justify-center gap-2 text-xs text-muted">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-accent" />
            <ShinyText text={stages[stage]} className="font-medium" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
