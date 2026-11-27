'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import {
  Play,
  Pause,
  RotateCcw,
  Vibrate,
  VibrateOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export type BreathingPattern = 'calm' | 'box';

interface PhaseStep {
  phase: 'in' | 'hold-in' | 'out' | 'hold-out';
  duration: number; // in seconds
  labelKey: string;
  subtext: string;
}

const CALM_PATTERN_STEPS: PhaseStep[] = [
  { phase: 'in', duration: 4, labelKey: 'learn.breathe.in', subtext: 'Inhale gently through nose' },
  { phase: 'out', duration: 6, labelKey: 'learn.breathe.out', subtext: 'Slow, smooth exhale' },
];

const BOX_PATTERN_STEPS: PhaseStep[] = [
  { phase: 'in', duration: 4, labelKey: 'learn.breathe.in', subtext: 'Inhale gently through nose' },
  { phase: 'hold-in', duration: 4, labelKey: 'learn.breathe.hold', subtext: 'Hold breath gently' },
  { phase: 'out', duration: 4, labelKey: 'learn.breathe.out', subtext: 'Slow, smooth exhale' },
  { phase: 'hold-out', duration: 4, labelKey: 'learn.breathe.hold', subtext: 'Hold before next breath' },
];

const CIRCLE_RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~263.89378

export function BreatheTab() {
  const { profile } = useApp();
  const isMono = profile.accentMode === 'mono';
  const shouldReduceMotion = useReducedMotion();

  // Pattern and duration settings
  const [pattern, setPattern] = useState<BreathingPattern>('calm');
  const [durationMinutes, setDurationMinutes] = useState<number>(3);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(false);

  // Load haptics preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('clearhale_breathe_haptics');
      if (stored === 'true') setHapticsEnabled(true);
    } catch (e) {}
  }, []);

  const toggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    try {
      localStorage.setItem('clearhale_breathe_haptics', String(next));
    } catch (e) {}
    if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }
  };

  // Active session state
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [isQuarterPulsing, setIsQuarterPulsing] = useState(false);
  const [ariaPhaseAnnouncement, setAriaPhaseAnnouncement] = useState('Ready to breathe');

  // Monotonic timing refs
  const elapsedRef = useRef(0);
  const lastPerfTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const quartersHitRef = useRef<Set<number>>(new Set());
  const prevPhaseRef = useRef<string>('');

  const steps = pattern === 'calm' ? CALM_PATTERN_STEPS : BOX_PATTERN_STEPS;
  const cycleDuration = useMemo(
    () => steps.reduce((sum, s) => sum + s.duration, 0),
    [steps]
  );
  const totalTargetSeconds = durationMinutes * 60;

  // Trigger light haptic buzz on phase transitions
  const triggerHaptic = (ms = 35) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  };

  // Monotonic clock timer loop using performance.now and requestAnimationFrame
  useEffect(() => {
    if (!isActive || isCompleted) {
      lastPerfTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastPerfTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastPerfTimeRef.current === null) {
        lastPerfTimeRef.current = now;
      }
      const delta = (now - lastPerfTimeRef.current) / 1000;
      lastPerfTimeRef.current = now;

      // Accumulate monotonic elapsed seconds
      elapsedRef.current += delta;
      const currentElapsed = elapsedRef.current;

      if (currentElapsed >= totalTargetSeconds) {
        elapsedRef.current = totalTargetSeconds;
        setElapsed(totalTargetSeconds);
        setIsActive(false);
        setIsCompleted(true);
        setAriaPhaseAnnouncement('Session complete. Well done.');
        triggerHaptic(60);
        return;
      }

      setElapsed(currentElapsed);

      // Check quarter milestones (0.25, 0.50, 0.75)
      const fraction = currentElapsed / totalTargetSeconds;
      [0.25, 0.5, 0.75].forEach((q) => {
        if (fraction >= q && !quartersHitRef.current.has(q)) {
          quartersHitRef.current.add(q);
          setIsQuarterPulsing(true);
          setTimeout(() => setIsQuarterPulsing(false), 450);
          triggerHaptic(45);
        }
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, isCompleted, totalTargetSeconds, hapticsEnabled]);

  // Determine current phase within cycle from elapsed time
  const timeInCycle = elapsed % cycleDuration;
  let accumulatedTime = 0;
  let activeStep = steps[0];
  let stepTime = 0;

  for (let i = 0; i < steps.length; i++) {
    if (timeInCycle < accumulatedTime + steps[i].duration) {
      activeStep = steps[i];
      stepTime = timeInCycle - accumulatedTime;
      break;
    }
    accumulatedTime += steps[i].duration;
  }

  const stepProgress = Math.min(1, Math.max(0, stepTime / activeStep.duration));
  const cyclesCompleted = Math.floor(elapsed / cycleDuration);

  // Polite accessibility aria-live announcement ONLY on phase change
  useEffect(() => {
    if (!isActive) return;
    const currentPhase = activeStep.phase;
    if (currentPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhase;
      if (currentPhase === 'in') {
        setAriaPhaseAnnouncement('Breathe in');
        triggerHaptic(35);
      } else if (currentPhase === 'hold-in' || currentPhase === 'hold-out') {
        setAriaPhaseAnnouncement('Hold breath');
        triggerHaptic(30);
      } else if (currentPhase === 'out') {
        setAriaPhaseAnnouncement('Breathe out');
        triggerHaptic(35);
      }
    }
  }, [activeStep.phase, isActive]);

  // Phase countdown calculations (shows only 4 or 6 seconds in the ring)
  const currentStepDuration = activeStep.duration;
  const phaseRemainingSeconds = isActive
    ? Math.max(1, Math.ceil(currentStepDuration - stepTime))
    : currentStepDuration;

  // Phase UI clock perimeter line: green perimeter line reduces with each second of the phase
  const phaseFraction = isActive
    ? Math.min(1, Math.max(0, stepTime / currentStepDuration))
    : 0;
  const phaseRemainingLength = (1 - phaseFraction) * CIRCUMFERENCE;
  const phaseElapsedLength = phaseFraction * CIRCUMFERENCE;

  // Overall session calculations (for the big timer at the bottom)
  const remainingSeconds = Math.max(0, Math.ceil(totalTargetSeconds - elapsed));
  const fractionElapsed = Math.min(1, Math.max(0, elapsed / totalTargetSeconds));

  // Format mm:ss with tabular numerals
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartPause = () => {
    if (isCompleted) {
      handleReset();
      setIsActive(true);
      return;
    }
    if (!isActive) {
      triggerHaptic(30);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsCompleted(false);
    elapsedRef.current = 0;
    setElapsed(0);
    quartersHitRef.current.clear();
    prevPhaseRef.current = '';
    setAriaPhaseAnnouncement('Reset to beginning');
  };

  const changePattern = (newPattern: BreathingPattern) => {
    if (pattern === newPattern) return;
    setPattern(newPattern);
    setIsActive(false);
    setIsCompleted(false);
    elapsedRef.current = 0;
    setElapsed(0);
    quartersHitRef.current.clear();
    prevPhaseRef.current = '';
  };

  const changeDuration = (mins: number) => {
    setDurationMinutes(mins);
    if (!isActive) {
      elapsedRef.current = 0;
      setElapsed(0);
      quartersHitRef.current.clear();
      prevPhaseRef.current = '';
    }
  };

  const progressPercent = Math.min(100, (elapsed / totalTargetSeconds) * 100);

  return (
    <div className="w-full flex flex-col items-center justify-center text-center select-none py-1">
      {/* Screen Reader Polite Live Region for Phase Announcements Only */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaPhaseAnnouncement}
      </div>

      {/* Hero Countdown Breathing Ring */}
      <div className="relative flex items-center justify-center my-3 sm:my-4">
        {/* Soft Ambient Halo behind the ring with Quarter Pulse Animation */}
        <motion.div
          className="absolute rounded-full pointer-events-none bg-emerald-500/10 dark:bg-emerald-400/10 w-[250px] h-[250px] lg:w-[300px] lg:h-[300px]"
          animate={
            shouldReduceMotion
              ? { scale: 1, opacity: 0.12 }
              : isQuarterPulsing
              ? { scale: [1, 1.18, 1], opacity: [0.15, 0.4, 0.15] }
              : isCompleted
              ? { scale: [1, 1.12, 1], opacity: [0.12, 0.3, 0.12] }
              : { scale: 1, opacity: 0.16 }
          }
          transition={{
            duration: isQuarterPulsing ? 0.45 : 4,
            ease: 'easeOut',
          }}
        />

        {/* Outer SVG Container (Rotated -90deg so 12 o'clock is at the top) */}
        <div className="relative w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] lg:w-[280px] lg:h-[280px] flex items-center justify-center">
          <motion.svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            animate={
              isQuarterPulsing && !shouldReduceMotion
                ? { scale: [1, 1.035, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {/* Constant Solid Light Green Fill covering the whole circle */}
            <circle
              cx="50"
              cy="50"
              r={CIRCLE_RADIUS}
              style={{ fill: 'var(--teal-light)' }}
              className="transition-colors duration-200"
            />

            {/* Background Faint Track */}
            <circle
              cx="50"
              cy="50"
              r={CIRCLE_RADIUS}
              stroke="var(--border-color)"
              strokeWidth="4.5"
              fill="none"
              className="opacity-45"
            />

            {/* UI Clock Green Perimeter Line: Reduces with each second of the phase like in mobile phone timer */}
            <circle
              cx="50"
              cy="50"
              r={CIRCLE_RADIUS}
              stroke="var(--teal-accent, #10b981)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 50 50)"
              strokeDasharray={`${phaseRemainingLength} ${CIRCUMFERENCE}`}
              strokeDashoffset={-phaseElapsedLength}
              className="text-teal-600 dark:text-teal-400 drop-shadow-xs"
            />
          </motion.svg>

          {/* Centered Content Inside Ring: Large mm:ss Time + Phase Text beneath */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none z-10">
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center px-2"
                >
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-teal-light text-teal-accent flex items-center justify-center mb-1 shadow-soft">
                    <CheckCircle2 className="w-6 h-6 lg:w-7 lg:h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                    <Bi
                      k="learn.breathe.wellDone"
                      layout="stacked"
                      nativeClassName="font-bold text-base sm:text-lg lg:text-xl text-foreground"
                      enClassName="text-xs sm:text-sm text-muted uppercase tracking-wider font-semibold"
                    />
                  </h3>
                  <span className="text-xs sm:text-sm lg:text-base text-muted mt-0.5 font-medium">
                    {cyclesCompleted} <Bi k="learn.cyclesCompleted" en="cycles completed" layout="inline" />
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="active-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center max-w-[155px] lg:max-w-[180px]"
                >
                  {/* Current phase in text ("Breathe in", "Hold", "Breathe out") */}
                  <div className="mb-0.5 min-h-[26px] flex flex-col items-center justify-center text-center px-1">
                    <Bi
                      k={isActive ? activeStep.labelKey : 'learn.breathe.in'}
                      layout="stacked"
                      className="text-center"
                      nativeClassName="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200 leading-tight block"
                      enClassName="text-xs lg:text-sm text-teal-900/75 dark:text-teal-100/75 uppercase tracking-widest font-semibold leading-tight block -mt-0.5"
                    />
                  </div>

                  {/* Phase seconds counter: 4 or 6 seconds (counts down with each second) */}
                  <div
                    role="timer"
                    aria-label={`Phase countdown: ${phaseRemainingSeconds} seconds`}
                    className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-foreground tabular-nums select-none leading-none drop-shadow-xs my-0.5"
                  >
                    {phaseRemainingSeconds}
                  </div>
                  <span className="text-xs lg:text-sm uppercase font-bold tracking-widest text-muted/80">
                    sec
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Gentle Guidance Cue beneath ring */}
      <div className="min-h-[22px] flex items-center justify-center mb-2.5 lg:mb-4 px-2 text-center">
        <p className="text-xs sm:text-sm lg:text-base text-muted/90 font-medium">
          {isActive ? activeStep.subtext : (
            <Bi k="learn.breathe.subtitle" en="Clean, calm breathing session to lower pulse and stress indoors." layout="plain" />
          )}
        </p>
      </div>

      {/* Pattern Selector & Duration Selector Row (Ultra-compact on mobile, comfortably spacious on desktop) */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg flex items-center justify-between gap-2 px-1 text-xs sm:text-sm lg:text-base">
        {/* Pattern: Calm vs Box */}
        <div
          className="flex items-center bg-card-subtle p-0.5 sm:p-1 rounded-xl lg:rounded-2xl border border-card-border"
          role="radiogroup"
          aria-label="Breathing pattern"
        >
          <button
            onClick={() => changePattern('calm')}
            disabled={isActive}
            className={`px-2.5 sm:px-3.5 lg:px-5 py-1 sm:py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl font-medium transition-colors text-xs sm:text-sm lg:text-base ${
              pattern === 'calm'
                ? isMono
                  ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                  : 'bg-card text-teal-accent font-semibold shadow-soft'
                : 'text-muted hover:text-foreground'
            } ${isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Bi k="learn.breathe.calmPattern" en="Calm" layout="inline" />
          </button>
          <button
            onClick={() => changePattern('box')}
            disabled={isActive}
            className={`px-2.5 sm:px-3.5 lg:px-5 py-1 sm:py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl font-medium transition-colors text-xs sm:text-sm lg:text-base ${
              pattern === 'box'
                ? isMono
                  ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                  : 'bg-card text-teal-accent font-semibold shadow-soft'
                : 'text-muted hover:text-foreground'
            } ${isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Bi k="learn.breathe.boxPattern" en="Box" layout="inline" />
          </button>
        </div>

        {/* Duration Selector: 1m, 3m, 5m */}
        <div
          className="flex items-center bg-card-subtle p-0.5 sm:p-1 rounded-xl lg:rounded-2xl border border-card-border"
          role="radiogroup"
          aria-label="Session duration"
        >
          {[1, 3, 5].map((m) => (
            <button
              key={m}
              onClick={() => changeDuration(m)}
              disabled={isActive}
              className={`px-2.5 sm:px-3.5 lg:px-4.5 py-1 sm:py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl font-medium transition-colors text-xs sm:text-sm lg:text-base ${
                durationMinutes === m
                  ? isMono
                    ? 'bg-neutral-900 text-neutral-50 font-semibold shadow-sm'
                    : 'bg-card text-teal-accent font-semibold shadow-soft'
                  : 'text-muted hover:text-foreground'
              } ${isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Haptics Toggle */}
        <button
          onClick={toggleHaptics}
          title={hapticsEnabled ? 'Haptics: On' : 'Haptics: Off'}
          className={`p-1.5 sm:p-2 lg:p-2.5 rounded-xl lg:rounded-2xl border transition-colors flex items-center justify-center ${
            hapticsEnabled
              ? 'bg-teal-light border-teal-accent/30 text-teal-accent'
              : 'bg-card-subtle border-card-border text-muted hover:text-foreground'
          }`}
          aria-label={hapticsEnabled ? 'Turn off haptic buzz' : 'Turn on haptic buzz'}
        >
          {hapticsEnabled ? (
            <Vibrate className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          ) : (
            <VibrateOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          )}
        </button>
      </div>

      {/* Main Action Controls */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mt-3.5 lg:mt-5 space-y-2.5 lg:space-y-3.5">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Large Start / Pause Button */}
          <button
            onClick={handleStartPause}
            className="btn-primary flex-1 min-h-[48px] sm:min-h-[52px] lg:min-h-[60px] px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-card lg:rounded-2xl font-semibold shadow-soft transition-all flex items-center justify-center gap-2 lg:gap-3 text-sm sm:text-base lg:text-xl focus-visible:ring-2 focus-visible:ring-teal-accent cursor-pointer"
          >
            {isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" strokeWidth={1.75} />
                <Bi k="learn.breathe.goAgain" layout="inline" />
              </>
            ) : isActive ? (
              <>
                <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 fill-current stroke-current" />
                <Bi k="learn.breathe.pause" layout="inline" />
              </>
            ) : elapsed > 0 ? (
              <>
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 fill-current stroke-current" />
                <Bi k="learn.breathe.resume" layout="inline" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 fill-current stroke-current" />
                <Bi k="learn.breathe.start" layout="inline" />
              </>
            )}
          </button>

          {/* Reset Button (visible when session has started or completed) */}
          {(elapsed > 0 || isCompleted) && (
            <button
              onClick={handleReset}
              className="min-h-[48px] sm:min-h-[52px] lg:min-h-[60px] px-4 py-2.5 sm:py-3.5 rounded-card lg:rounded-2xl bg-card border border-card-border text-foreground hover:bg-card-subtle transition-colors flex items-center justify-center cursor-pointer"
              title="Reset session"
              aria-label="Reset session"
            >
              <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-muted" />
            </button>
          )}
        </div>

        {/* Big Overall Session Timer & Progress Line at Bottom */}
        <div className="w-full px-3.5 sm:px-4.5 lg:px-6 py-3 sm:py-4 lg:py-5 rounded-xl lg:rounded-2xl bg-card-subtle/70 border border-card-border shadow-xs space-y-2.5 lg:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base font-bold text-muted">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-teal-accent" />
              <span>Session Time</span>
            </div>
            <div className="text-sm sm:text-base lg:text-2xl font-black font-mono tabular-nums text-foreground">
              {formatTime(remainingSeconds)} <span className="text-xs sm:text-sm lg:text-base font-normal text-muted">left</span>
            </div>
          </div>
          <div className="w-full h-2 sm:h-2.5 lg:h-3.5 bg-card-border/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-accent rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm lg:text-base text-muted font-mono tabular-nums">
            <span>Elapsed: {formatTime(Math.floor(elapsed))}</span>
            <span>Target: {formatTime(totalTargetSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Single-line Safety Note (No medical claims, filtered indoor air only) */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mt-3.5 lg:mt-5 p-3 sm:p-3.5 lg:p-4 rounded-xl lg:rounded-2xl bg-card-subtle/80 border border-card-border/60 text-xs sm:text-sm lg:text-base text-muted text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-teal-accent shrink-0" />
        <span className="leading-tight">
          <Bi k="learn.breathe.notice" layout="plain" />
        </span>
      </div>
    </div>
  );
}
