'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import {
  BudgetTier,
  CommuteType,
  CookingFuel,
  FamilyMember,
  WorkType,
} from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  HeartPulse,
  Flame,
  Zap,
  Bus,
  Bike,
  Briefcase,
  Coins,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function HouseholdStep() {
  const { profile, updateProfile, setOnboardingStep, t } = useApp();
  const household = profile.household;

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

  const handleFinish = () => {
    setOnboardingStep('building');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-8 select-none overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-width:thin]">
      <div className="space-y-6 pb-36 sm:pb-40">
        {/* Navigation & Header */}
        <div>
          <button
            onClick={() => setOnboardingStep('location')}
            className="mb-4 sm:mb-6 min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            <Bi k="onboarding.householdTitle" layout="plain" />
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            <Bi k="onboarding.householdSub" layout="plain" />
          </p>
        </div>

        {/* 1. Who is at home? */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            <Bi k="onboarding.vulnerable" layout="plain" />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'child', key: 'home.familyFilter.child', fallbackEn: 'Baby & Kids', icon: Baby },
              { id: 'elderly', key: 'home.familyFilter.elderly', fallbackEn: 'Elderly (60+)', icon: ShieldCheck },
              { id: 'pregnant', key: 'home.familyFilter.pregnant', fallbackEn: 'Pregnant', icon: HeartPulse },
              { id: 'asthma_heart', key: 'onboarding.asthma', fallbackEn: 'Asthma / Heart', icon: HeartPulse },
            ].map((item) => {
              const active = household.members.includes(item.id as FamilyMember);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleMember(item.id as FamilyMember)}
                  className={`min-h-[48px] p-3 rounded-card border text-sm font-medium transition-all flex items-center justify-between ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="text-left leading-tight">
                      <Bi k={item.key} en={item.fallbackEn} layout="inline" />
                    </span>
                  </div>
                  {active && <Check className="w-4 h-4 stroke-[2.5] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Cooking fuel */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            <Bi k="onboarding.fuel" layout="plain" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'lpg', label: 'LPG Gas', icon: Flame },
              { id: 'induction_electric', label: 'Induction / Elec', icon: Zap },
              { id: 'wood_biomass', label: 'Wood / Biomass', icon: Flame },
            ].map((fuel) => {
              const active = household.cookingFuel === fuel.id;
              return (
                <button
                  key={fuel.id}
                  onClick={() => setFuel(fuel.id as CookingFuel)}
                  className={`min-h-[44px] p-2.5 rounded-card border text-xs font-medium text-center transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {fuel.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Commute */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            <Bi k="onboarding.commute" layout="plain" />
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'bus_metro', label: 'Bus / Metro' },
              { id: 'two_wheeler', label: 'Two-Wheeler / Bike' },
              { id: 'walk', label: 'Walking' },
              { id: 'cycle', label: 'Bicycle' },
              { id: 'car', label: 'Car' },
            ].map((com) => {
              const active = household.commute.includes(com.id as CommuteType);
              return (
                <button
                  key={com.id}
                  onClick={() => toggleCommute(com.id as CommuteType)}
                  className={`min-h-[44px] px-3 py-2 rounded-card border text-xs font-medium transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {com.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Work environment */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            <Bi k="onboarding.work" layout="plain" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'indoor', label: 'Indoor / Desk' },
              { id: 'outdoor', label: 'Outdoor / Field' },
            ].map((w) => {
              const active = household.work === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setWork(w.id as WorkType)}
                  className={`min-h-[44px] p-2.5 rounded-card border text-xs font-medium text-center transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Budget preference */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            <Bi k="onboarding.budget" layout="plain" />
          </label>
          <div className="grid grid-cols-3 gap-2">
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
                  className={`min-h-[44px] p-2.5 rounded-card border text-xs font-medium text-center transition-all ${
                    active
                      ? 'border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent'
                      : 'border-card-border bg-card text-foreground hover:border-teal-accent/40'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom actions - sticky on all viewports */}
      <div className="pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sticky bottom-0 z-20 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-8 px-4 sm:px-8 border-t border-card-border/60 mt-auto shrink-0 space-y-2">
        <button
          onClick={handleFinish}
          className={`w-full min-h-[48px] px-6 py-3.5 rounded-card font-medium shadow-soft transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 ${
            profile.accentMode === 'mono'
              ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 focus-visible:ring-neutral-400'
              : 'bg-teal-accent text-white hover:bg-teal-hover focus-visible:ring-teal-accent'
          }`}
        >
          <Bi k="onboarding.continue" layout="inline" />
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleFinish}
          className="w-full min-h-[40px] py-1 text-center text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Bi k="onboarding.skip" layout="inline" />
        </button>
      </div>
    </div>
  );
}
