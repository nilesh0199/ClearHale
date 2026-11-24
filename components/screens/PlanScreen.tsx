'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { Term } from '../Term';
import { Particles } from '../ui/rb/Particles';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { CountUp } from '../ui/rb/CountUp';
import { ALL_ACTIONS, calculateWhatIfExposure, getPlanOrderedActions, whyForYou } from '@/lib/rulesEngine';
import { outdoorGuidance } from '@/lib/outdoorGuidance';
import { ACTIONS_I18N } from '@/lib/languages';
import { ActionGroup, ActionItem, FamilyMember, FamilyView } from '@/types';
import { CostChip, EvidenceChip } from '../ui/NeutralChips';
import confetti from 'canvas-confetti';
import { ShareModal } from '../share/ShareModal';
import {
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Circle,
  ChevronDown,
  AlertTriangle,
  Flame,
  Shield,
  HelpCircle,
  Share2,
  Users,
  Baby,
  Heart,
  UserCheck,
  Activity,
  Check,
  Plus,
  Utensils,
  IndianRupee,
  Wind,
} from 'lucide-react';

export function PlanScreen() {
  const { profile, toggleActionChecked, airData, t, getActionBi, updateProfile, currentBand } = useApp();
  const isCleanAir = currentBand.key === "good" || currentBand.key === "satisfactory";

  // What-if simulator state
  const [windowsClosed, setWindowsClosed] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'none' | 'hepa' | 'diy_box'>('hepa');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  const ROOM_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'living', label: 'Living room' },
    { id: 'whole-home', label: 'Whole home' },
  ];

  const outdoorPM2_5 = airData.current.pm2_5;
  const whatIf = calculateWhatIfExposure(outdoorPM2_5, windowsClosed, activeFilter);
  const activeFamilyView = profile.activeFamilyFilter || 'whole_family';

  // Toggle household vulnerable member directly from Action Plan tab
  const toggleHouseholdMember = (m: FamilyMember) => {
    const currentMembers = profile.household.members || [];
    const exists = currentMembers.includes(m);
    const updated = exists
      ? currentMembers.filter((x) => x !== m)
      : [...currentMembers, m];
    updateProfile({ household: { ...profile.household, members: updated } });
  };

  const handleActionToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasChecked = profile.checkedActions.includes(id);
    toggleActionChecked(id);

    if (!wasChecked) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#0D5C52', '#10B981', '#F59E0B'],
        });
      } catch (e) {}
    }
  };

  const groups: ActionGroup[] = ['Routines', 'Indoors', 'Sustainable swaps'];

  const renderActionCard = (action: ActionItem) => {
    const isChecked = profile.checkedActions.includes(action.id);
    const isExpanded = expandedId === action.id;
    const { enTitle, nativeTitle } = getActionBi(action.id, action.title, currentBand.key);

    const isMyth = action.evidence === 'Myth' || action.evidence_level === 'Myth';
    const isStrong = action.evidence === 'Strong' || action.evidence_level === 'Strong';
    const isPersonaMatch =
      activeFamilyView !== 'whole_family' &&
      action.suits.includes(activeFamilyView);

    return (
      <motion.div
        key={action.id}
        layout
        whileHover={{ y: -2 }}
      >
        <SpotlightCard
          spotlightColor={
            isChecked
              ? 'rgba(16, 185, 129, 0.12)'
              : isPersonaMatch
              ? 'rgba(45, 212, 191, 0.14)'
              : 'rgba(13, 92, 82, 0.08)'
          }
          className={`rounded-card border transition-all shadow-soft overflow-hidden ${
            isChecked
              ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/20'
              : isPersonaMatch
              ? 'border-teal-accent/40 bg-teal-light/20'
              : isMyth
              ? 'border-card-border/80 bg-card-subtle/50'
              : 'border-card-border hover:border-teal-accent/40'
          }`}
        >
          {/* Action Header */}
          <div
            onClick={() => setExpandedId(isExpanded ? null : action.id)}
            className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer"
          >
            <button
              onClick={(e) => handleActionToggle(action.id, e)}
              className="mt-0.5 p-1 rounded-full text-muted hover:text-teal-accent transition-colors shrink-0"
              aria-label={`Toggle completion for ${action.title}`}
            >
              {isChecked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" strokeWidth={1.75} />
              ) : (
                <Circle className="w-5 h-5 text-muted hover:text-foreground" strokeWidth={1.75} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {profile.language === 'en' ? (
                  <h3
                    className={`text-sm sm:text-base font-semibold text-foreground ${
                      isChecked ? 'line-through text-muted' : ''
                    }`}
                  >
                    {action.title}
                  </h3>
                ) : (
                  <div className="flex flex-col">
                    <h3
                      className={`text-sm sm:text-base font-semibold text-foreground ${
                        isChecked ? 'line-through text-muted' : ''
                      }`}
                    >
                      {nativeTitle}
                    </h3>
                    <span className="text-xs text-muted font-normal mt-0.5">
                      {enTitle}
                    </span>
                  </div>
                )}

                {/* Evidence Level Badge */}
                <EvidenceChip level={action.evidence || action.evidence_level} />

                {/* Cost Tier */}
                <CostChip tier={action.cost_tier} />
              </div>

              {/* Muted personalized whyForYou line */}
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {whyForYou(action, profile, airData)}
              </p>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              strokeWidth={1.75}
            />
          </div>

          {/* Expanded Card Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 sm:px-5 pb-5 pt-1 border-t border-card-border/60 bg-card-subtle/50 text-xs text-muted space-y-3"
              >
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">
                    Do this:
                  </span>
                  <p className="leading-relaxed text-foreground/90">
                    {action.doThis}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-foreground block mb-0.5">
                    Why it works:
                  </span>
                  <p className="leading-relaxed text-muted/90">
                    {action.whyItWorks || action.why}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                  <div>
                    <span className="font-semibold text-foreground">Cost and time: </span>
                    <span>{action.cost_tier} • {action.timeNeeded}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Evidence: </span>
                    <span>{action.evidence || action.evidence_level}</span>
                  </div>
                </div>

                {action.source && (
                  <div>
                    <a
                      href={action.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-accent hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      Official Source <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                )}

                {(action.careful || action.safety_note) && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <strong className="font-semibold block">Be careful about:</strong>
                      <span className="leading-relaxed">{action.careful || action.safety_note}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          <Bi k="plan.title" layout="plain" />
        </h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          <Bi k="plan.subtitle" layout="plain" />
        </p>
      </div>

      {/* "What If" Indoor Exposure Simulator Panel */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.15)"
        className="relative overflow-hidden bg-card rounded-card border border-card-border p-5 sm:p-6 shadow-soft"
      >
        {/* Real-time thinning atmospheric haze particles bound to reduction % */}
        <Particles
          density={3.5}
          thinFactor={whatIf.reductionPercentage / 100}
          color="rgba(16, 185, 129, 0.22)"
          speed={0.3}
          className="opacity-70"
        />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-light text-teal-accent flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              <Bi k="plan.whatIfTitle" layout="plain" />
            </h2>
            <p className="text-xs text-muted">
              <Bi k="plan.whatIfNote" layout="plain" />
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-4 border-b border-card-border">
          {/* Windows State */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              <Bi k="plan.windowsDoors" layout="plain" />
            </label>
            <div className="flex rounded-lg bg-card-subtle p-1">
              <button
                onClick={() => setWindowsClosed(true)}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  windowsClosed
                    ? profile.accentMode === 'mono'
                      ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'bg-card text-teal-accent font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Bi k="plan.closed" layout="plain" />
              </button>
              <button
                onClick={() => setWindowsClosed(false)}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  !windowsClosed
                    ? profile.accentMode === 'mono'
                      ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'bg-card text-rose-700 dark:text-rose-400 font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Bi k="plan.open" layout="plain" />
              </button>
            </div>
          </div>

          {/* Active Filter State */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2 flex items-center justify-between">
              <span><Bi k="plan.filterType" layout="plain" /></span>
              <span className="text-[11px] normal-case text-muted">
                <Term k="hepa">HEPA</Term> • <Term k="diy_box_fan">DIY Box</Term>
              </span>
            </label>
            <div className="flex rounded-lg bg-card-subtle p-1">
              <button
                onClick={() => setActiveFilter('none')}
                className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFilter === 'none'
                    ? profile.accentMode === 'mono'
                      ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'bg-card text-foreground font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Bi k="plan.none" layout="plain" />
              </button>
              <button
                onClick={() => setActiveFilter('diy_box')}
                className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFilter === 'diy_box'
                    ? profile.accentMode === 'mono'
                      ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'bg-card text-teal-accent font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Bi k="plan.diyBox" layout="plain" />
              </button>
              <button
                onClick={() => setActiveFilter('hepa')}
                className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFilter === 'hepa'
                    ? profile.accentMode === 'mono'
                      ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                      : 'bg-card text-teal-accent font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Bi k="plan.hepa" layout="plain" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Comparison Display */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 text-center relative z-10">
          <div className="p-3 rounded-xl bg-card-subtle border border-card-border flex flex-col justify-between">
            <span className="text-[11px] text-muted font-medium leading-tight">
              <Bi k="plan.outdoorBaseline" en="Outdoor PM2.5" layout="plain" />
            </span>
            <div className="text-xl sm:text-2xl font-semibold text-foreground my-1">
              <CountUp to={outdoorPM2_5} duration={1.0} />
            </div>
            <span className="text-[10px] text-muted">µg/m³</span>
          </div>

          <div className="p-3 rounded-xl bg-teal-light text-teal-accent border border-teal-accent/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold leading-tight">
              <Bi k="plan.estimatedIndoor" en="Est. Indoor PM2.5" layout="plain" />
            </span>
            <div className="text-xl sm:text-2xl font-semibold my-1">
              <CountUp to={whatIf.indoorPM2_5} duration={1.0} />
            </div>
            <span className="text-[10px] opacity-80">µg/m³</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-col justify-between">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-tight">
              <Bi k="plan.reduction" en="Exposure Drop" layout="plain" />
            </span>
            <div className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 my-1">
              -<CountUp to={whatIf.reductionPercentage} duration={1.0} />%
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80">
              <Bi k="plan.reduction" en="reduction" layout="plain" />
            </span>
          </div>
        </div>

        {/* Mathematical & Scientific Assumptions Accordion */}
        <div className="mt-4 pt-3 border-t border-card-border/60">
          <details className="text-xs text-muted">
            <summary className="cursor-pointer font-medium hover:text-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-accent" />
              <span>View Scientific Modeling Assumptions</span>
            </summary>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted/90 bg-card-subtle p-3 rounded-lg border border-card-border">
              {whatIf.assumptions.map((ass: string, i: number) => (
                <li key={i}>{ass}</li>
              ))}
            </ul>
          </details>
        </div>
      </SpotlightCard>

      {/* 1. Household & Family Members Manager (Interactive Toggles from Action Plan) */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.12)"
        className="bg-card rounded-card border border-card-border p-4 sm:p-5 shadow-soft space-y-4"
      >
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-accent" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
              Household Vulnerable Members
            </h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Tap to toggle members • Re-ranks your action plan live
          </p>
        </div>

        {/* Member Toggle Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4">
          {[
            { id: 'child' as FamilyMember, label: 'Baby & Kids', icon: Baby },
            { id: 'elderly' as FamilyMember, label: 'Elderly (60+)', icon: UserCheck },
            { id: 'pregnant' as FamilyMember, label: 'Pregnant Person', icon: Heart },
            { id: 'asthma_heart' as FamilyMember, label: 'Asthma / Heart', icon: Activity },
          ].map((m) => {
            const isSelected = profile.household.members?.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleHouseholdMember(m.id)}
                className={`min-h-[38px] sm:min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  isSelected
                    ? profile.accentMode === 'mono'
                      ? 'border-neutral-800 bg-neutral-900 text-neutral-50 font-semibold shadow-xs'
                      : 'border-teal-accent bg-teal-light text-teal-accent font-semibold ring-1 ring-teal-accent/30 shadow-xs'
                    : 'border-card-border bg-card-subtle text-muted hover:border-teal-accent/40 hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <m.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </span>
                {isSelected ? (
                  <Check className={`w-3.5 h-3.5 shrink-0 ml-1 ${
                    profile.accentMode === 'mono'
                      ? 'text-neutral-50'
                      : 'text-teal-accent'
                  }`} />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted/60 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Persona Focus Filter */}
        <div className="pt-3 flex items-center justify-between flex-wrap gap-2.5">
          <span className="text-xs font-medium text-muted flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-teal-accent" />
            <span>Prioritize focus for:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'whole_family' as FamilyView, label: 'Whole Family' },
              ...(profile.household.members?.includes('child') ? [{ id: 'child' as FamilyView, label: 'Baby & Kids' }] : []),
              ...(profile.household.members?.includes('elderly') ? [{ id: 'elderly' as FamilyView, label: 'Elderly' }] : []),
              ...(profile.household.members?.includes('pregnant') ? [{ id: 'pregnant' as FamilyView, label: 'Pregnant Person' }] : []),
              ...(profile.household.members?.includes('asthma_heart') || (profile.household.members as any)?.includes('asthma') || profile.household?.respiratoryOrHeart ? [{ id: 'asthma' as FamilyView, label: 'Asthma / Heart' }] : []),
              { id: 'outdoor_worker' as FamilyView, label: 'Outdoor Worker' },
            ].map((p) => {
              const isFocused = activeFamilyView === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateProfile({ activeFamilyFilter: p.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isFocused
                      ? profile.accentMode === 'mono'
                        ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-xs'
                        : 'bg-teal-accent text-white font-semibold shadow-xs'
                      : 'bg-card text-muted border border-card-border hover:border-teal-accent/40 hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </SpotlightCard>

      {/* 2. Household Tailored Guidance & Tips based on Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
            <span>Household Tailored Guidance</span>
          </h2>
          <span className="text-[11px] text-teal-accent font-medium">
            Personalized to your Settings setup
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tip A: Clean Cooking Guidance */}
          <div className="p-4 rounded-xl bg-card border border-card-border shadow-soft flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kitchen & Cooking</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {profile.household.cookingFuel === 'wood_biomass'
                    ? 'Biomass Fuel'
                    : profile.household.cookingFuel === 'induction_electric'
                    ? 'Induction'
                    : 'LPG Gas'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isCleanAir
                  ? 'Outdoor air is pure! Open kitchen windows wide for fresh air during and after cooking to quickly flush heat, moisture, and cooking smoke.'
                  : profile.household.cookingFuel === 'wood_biomass'
                  ? 'Chulha/biomass smoke causes severe indoor smoke spikes. Cook in open airy exterior zones and keep bedroom doors shut.'
                  : profile.household.cookingFuel === 'induction_electric'
                  ? 'Induction cooking releases zero smoke! Keep windows open during high-heat oil frying to spread out oil fumes.'
                  : 'LPG releases NO₂ and fine soot. Keep an exhaust fan running or open a kitchen window during cooking and for 15 minutes afterward.'}
              </p>
            </div>
          </div>

          {/* Tip B: Vulnerable Member Health Guidance */}
          <div className="p-4 rounded-xl bg-card border border-card-border shadow-soft flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Vulnerability Guard</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                  {profile.household.members?.includes('pregnant')
                    ? 'Pregnant Person'
                    : profile.household.members?.includes('child')
                    ? 'Baby & Kids'
                    : profile.household.members?.includes('elderly')
                    ? 'Elderly Care'
                    : profile.household.members?.includes('asthma_heart')
                    ? 'Respiratory'
                    : 'General'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {(() => {
                  const persona: FamilyView = profile.household.members?.includes('pregnant')
                    ? 'pregnant'
                    : profile.household.members?.includes('child')
                    ? 'child'
                    : profile.household.members?.includes('elderly')
                    ? 'elderly'
                    : profile.household.work === 'outdoor'
                    ? 'outdoor_worker'
                    : 'whole_family';
                  const outdoor = outdoorGuidance(currentBand.key, null, persona, profile, profile.language);
                  return profile.language === 'en'
                    ? outdoor.guidance
                    : `${outdoor.guidanceNative} (${outdoor.guidance})`;
                })()}
              </p>
            </div>
          </div>

          {/* Tip C: Cost & Budget Strategy */}
          <div className="p-4 rounded-xl bg-card border border-card-border shadow-soft flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-teal-accent" />
                  <span>Budget Strategy</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-teal-light text-teal-accent border border-teal-accent/30">
                  {profile.household.budget === 'free_only'
                    ? 'Free Only'
                    : profile.household.budget === 'low_cost'
                    ? 'Low-cost (DIY)'
                    : 'Flexible HEPA'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isCleanAir
                  ? 'Zero-cost strategy: Open windows during clean midday hours to refresh indoor air, and enjoy free walks in green spaces without needing purifiers.'
                  : profile.household.budget === 'free_only'
                  ? 'Zero-cost strategy: with windows and doors shut, indoor PM2.5 is still about 55-60% of outdoor levels in smoke events, so block door gaps with towels and shift cooking off-peak.'
                  : profile.household.budget === 'low_cost'
                  ? 'Low-cost strategy: a DIY box-fan filter with MERV-13 filters cuts smoke by about 40-70% in studies, offering clean air on a modest budget.'
                  : 'Comprehensive strategy: a portable HEPA purifier may cut indoor PM2.5 by about 50-80% when run continuously with doors and windows closed.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Moment: After checking off 3 actions */}
      {profile.checkedActions.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-teal-light/80 border border-teal-accent/30 shadow-soft flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-accent text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                Nice work. Share what you did today?
              </div>
              <div className="text-xs text-muted">
                You&apos;ve completed {profile.checkedActions.length} clean-air actions for your home.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-accent hover:bg-teal-hover text-white text-xs font-semibold shadow-soft transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Your Actions</span>
          </button>
        </motion.div>
      )}

      {/* Action Catalog Grouped by Section */}
      <div className="space-y-6">
        {groups.map((group) => {
          const items = getPlanOrderedActions(
            group,
            activeFamilyView,
            profile.household,
            currentBand.key,
            group === 'Indoors' ? selectedRoom : undefined
          );

          const userBudget = profile.household?.budget || 'flexible';
          const isWithinBudget = (costTier: string) => {
            if (userBudget === 'free_only') return costTier === 'Free';
            if (userBudget === 'low_cost') return costTier === 'Free' || costTier === 'Low-cost';
            return true;
          };

          const inBudgetItems = items.filter((a) => isWithinBudget(a.cost_tier));
          const beyondBudgetItems = items.filter((a) => !isWithinBudget(a.cost_tier));

          return (
            <section key={group} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  {group}
                </h2>
                <span className="text-[11px] text-muted">
                  {items.length} {items.length === 1 ? 'action' : 'actions'}
                </span>
              </div>

              {/* Room Chips for Indoors group */}
              {group === 'Indoors' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2.5 no-scrollbar">
                  {ROOM_OPTIONS.map((opt) => {
                    const isSelected = selectedRoom === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedRoom(opt.id)}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[36px] flex items-center justify-center ${
                          isSelected
                            ? 'text-white font-semibold'
                            : 'text-muted hover:text-foreground bg-card border border-card-border'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="plan-room-pill"
                            className="absolute inset-0 rounded-full bg-teal-accent shadow-xs"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeFamilyView}-${selectedRoom}-${profile.household.members?.join('-')}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {inBudgetItems.map((action) => renderActionCard(action))}
                  </div>

                  {/* Collapsed More Options for actions beyond budget tier */}
                  {beyondBudgetItems.length > 0 && (
                    <details className="mt-3 group/budget">
                      <summary className="cursor-pointer py-2.5 px-3.5 rounded-xl bg-card-subtle/80 hover:bg-card-subtle border border-card-border/80 text-xs text-muted flex items-center justify-between transition-colors list-none">
                        <span className="font-medium text-foreground/80 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-accent" strokeWidth={1.75} />
                          More options ({beyondBudgetItems.length} beyond your current budget)
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted transition-transform group-open/budget:rotate-180" strokeWidth={1.75} />
                      </summary>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {beyondBudgetItems.map((action) => renderActionCard(action))}
                      </div>
                    </details>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        initialStyle="done"
      />
    </div>
  );
}
