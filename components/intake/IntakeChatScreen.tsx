'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useSpeech } from '@/hooks/useSpeech';
import { isSttSupported, isTtsSupported } from '@/lib/ai/config';
import { INTAKE_QUESTIONS, IntakeQuestionDef, IntakeChipOption } from '@/data/intakeQuestions';
import { mergeProfilePatch } from '@/lib/ai/intakeParser';
import { hasEmergencySymptoms } from '@/lib/medicalSafety';
import { WaveformBars } from '../voice/WaveformBars';
import { Bi } from '../Bi';
import { HouseholdProfile, FamilyMember, CommuteType, CookingFuel, BudgetTier, PriorityGoal } from '@/types';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Edit2,
  Check,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Loader2,
  Send,
  X,
  Shield,
  HelpCircle,
} from 'lucide-react';

const QUICK_REPLY_LABELS: Record<string, string> = {
  en: 'Tap what fits, or just tell me.',
  hi: 'जो सही लगे चुनें, या बोलकर बताएं।',
  mr: 'योग्य पर्याय निवडा, किंवा सांगा.',
  bn: 'যা উপযুক্ত বেছে নিন, বা বলুন।',
  ta: 'பொருந்துவதைத் தொடவும், அல்லது சொல்லவும்.',
  te: 'సరిపోయేదాన్ని నొక్కండి, లేదా చెప్పండి.',
};

const GOT_IT_LABELS: Record<string, string> = {
  en: 'Got it',
  hi: 'समझ गया',
  mr: 'समजले',
  bn: 'বুঝেছি',
  ta: 'புரிந்தது',
  te: 'అర్థమైంది',
};

interface IntakeChatScreenProps {
  mode: 'onboarding' | 'settings';
  onClose?: () => void;
}

export function IntakeChatScreen({ mode, onClose }: IntakeChatScreenProps) {
  const { profile, updateProfile, setOnboardingStep, theme } = useApp();
  const { user, signIn, saveCloudProfile, isConfigured: isAuthConfigured } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const lang = profile.language || 'en';
  const sttEnabled = isSttSupported(lang);
  const ttsEnabled = isTtsSupported(lang);

  // Screen phases: 'questions' | 'emergency' | 'summary' | 'auth_offer'
  const [phase, setPhase] = useState<'questions' | 'emergency' | 'summary' | 'auth_offer'>('questions');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [turnCount, setTurnCount] = useState(1);
  const [followUp, setFollowUp] = useState<string | null>(null);

  // Accumulated profile patch (not saved until confirmed)
  const [accumulatedPatch, setAccumulatedPatch] = useState<HouseholdProfile>({
    ...profile.household,
  });

  // Selected chips for the current question
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  // Heard text & editing state
  const [heardText, setHeardText] = useState('');
  const [isEditingHeard, setIsEditingHeard] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual typing state
  const [showTypeInput, setShowTypeInput] = useState(!sttEnabled);
  const [typeInput, setTypeInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speaker toggle (default ON if ttsEnabled)
  const [isVoiceMuted, setIsVoiceMuted] = useState(!ttsEnabled);

  // Confirm check animation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Short non-blocking "Got it" acknowledgement between questions
  const [showGotIt, setShowGotIt] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Voice output hook
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeech({ language: lang });

  // Voice input hook
  const handleSpeechResult = useCallback((text: string) => {
    if (!text || !text.trim()) return;

    // Check emergency symptoms immediately
    if (hasEmergencySymptoms(text)) {
      setPhase('emergency');
      return;
    }

    setHeardText(text.trim());
    setIsEditingHeard(false);

    // Start 1.5s countdown before auto-advancing
    setAutoAdvanceCountdown(1.5);
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

    autoAdvanceTimerRef.current = setTimeout(() => {
      submitAnswer(text.trim());
    }, 1500);
  }, []);

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    error: voiceInputError,
    clearError: clearVoiceError,
  } = useVoiceInput({
    language: lang,
    maxDurationSeconds: 30,
    onTranscribed: (text) => handleSpeechResult(text),
    onError: (err) => {
      setErrorMessage('Voice transcription is temporarily unavailable. You can type or tap options below.');
      setShowTypeInput(true);
    },
  });

  const currentQ: IntakeQuestionDef | undefined = INTAKE_QUESTIONS[questionIdx];
  const questionPromptText = currentQ ? currentQ.question[lang] || currentQ.question.en : '';

  // Speak question aloud when question changes if voice enabled and not muted
  useEffect(() => {
    if (phase === 'questions' && !isVoiceMuted && ttsEnabled && questionPromptText) {
      speak(followUp || questionPromptText);
    }
    return () => {
      stopSpeaking();
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [questionIdx, followUp, phase, isVoiceMuted, ttsEnabled]);

  // Move keyboard focus to question heading on question change
  useEffect(() => {
    if (phase === 'questions') {
      headingRef.current?.focus();
    }
  }, [questionIdx, followUp, phase]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Cancel countdown if user starts editing the heard field
  const handleStartEditingHeard = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
    setIsEditingHeard(true);
  };

  // Toggle quick-reply chip with Question 3 and Question 4 rules
  const handleToggleChip = (chipId: string) => {
    setSelectedChips((prev) => {
      const isSelected = prev.includes(chipId);
      if (isSelected) {
        return prev.filter((id) => id !== chipId);
      }

      // Q1: Just me clears others, and any other clears just_me
      if (chipId === 'just_me') {
        return ['just_me'];
      }
      let next = prev.filter((id) => id !== 'just_me');

      // Q3: home_equipment single-choice and mutual-exclusion rules
      if (currentQ?.id === 'home_equipment') {
        const cookingGroup = ['lpg', 'induction', 'biomass'];
        const budgetGroup = ['budget_free', 'budget_low_cost', 'budget_flexible'];

        if (cookingGroup.includes(chipId)) {
          // Single choice within cooking
          next = next.filter((id) => !cookingGroup.includes(id));
        } else if (budgetGroup.includes(chipId)) {
          // Single choice within budget
          next = next.filter((id) => !budgetGroup.includes(id));
        } else if (chipId === 'has_purifier') {
          // Mutually exclusive with no_purifier
          next = next.filter((id) => id !== 'no_purifier');
        } else if (chipId === 'no_purifier') {
          // Mutually exclusive with has_purifier
          next = next.filter((id) => id !== 'has_purifier');
        }
      }

      return [...next, chipId];
    });
  };

  // Submit current answer (via speech transcript, typed text, or chip selection)
  const submitAnswer = async (textOverride?: string) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);

    const textToSubmit = (textOverride !== undefined ? textOverride : (heardText || typeInput)).trim();

    if (textToSubmit && hasEmergencySymptoms(textToSubmit)) {
      setPhase('emergency');
      return;
    }

    setIsAiProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ?.id || 'question',
          userText: textToSubmit,
          selectedChipIds: selectedChips,
          currentHousehold: accumulatedPatch,
          language: lang,
          turnCount,
        }),
      });

      const data = await res.json();

      if (data.emergency) {
        setPhase('emergency');
        setIsAiProcessing(false);
        return;
      }

      // Merge patch into accumulated profile
      if (data.patch) {
        setAccumulatedPatch((prev) => ({
          ...prev,
          ...mergeProfilePatch({ ...prev }, data.patch),
        }));
      }

      // Check if AI requested a single follow-up and we haven't hit 6 turns
      if (data.followUpQuestion && !followUp && turnCount < 6) {
        setFollowUp(data.followUpQuestion);
        setTurnCount((prev) => prev + 1);
        setHeardText('');
        setTypeInput('');
        setSelectedChips([]);
        setIsAiProcessing(false);
        return;
      }

      // Advance to next question or summary
      advanceToNextQuestion();
    } catch (err) {
      console.warn('[Intake] API call failed, falling back to local patch:', err);
      // Fallback: apply selected chips locally
      advanceToNextQuestion();
    } finally {
      setIsAiProcessing(false);
    }
  };

  const advanceToNextQuestion = () => {
    setFollowUp(null);
    setHeardText('');
    setTypeInput('');
    setSelectedChips([]);
    setAutoAdvanceCountdown(null);
    setTurnCount((prev) => prev + 1);

    // Show non-blocking "Got it" acknowledgement for 600 ms
    setShowGotIt(true);
    setTimeout(() => {
      setShowGotIt(false);
    }, 600);

    if (questionIdx + 1 < INTAKE_QUESTIONS.length) {
      setQuestionIdx((prev) => prev + 1);
    } else {
      setPhase('summary');
    }
  };

  const handleSkipQuestion = () => {
    advanceToNextQuestion();
  };

  const handleBack = () => {
    stopSpeaking();
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

    if (followUp) {
      setFollowUp(null);
      return;
    }

    if (questionIdx > 0) {
      setQuestionIdx((prev) => prev - 1);
      setSelectedChips([]);
      setHeardText('');
      setTypeInput('');
    } else {
      if (mode === 'onboarding') {
        setOnboardingStep('intake-choice');
      } else {
        onClose?.();
      }
    }
  };

  // Confirming the summary
  const handleConfirmSummary = () => {
    setIsConfirming(true);

    // Save locally
    const updatedHousehold: HouseholdProfile = {
      ...accumulatedPatch,
      intakeCompleted: true,
    };

    updateProfile({ household: updatedHousehold });

    setTimeout(() => {
      setIsConfirming(false);
      // If user is already signed in with Google, sync to cloud and complete
      if (user) {
        saveCloudProfile({
          ...profile,
          household: updatedHousehold,
        }).catch((e) => console.warn('Cloud sync error:', e));

        finishIntake();
      } else {
        // Show optional Google login screen
        setPhase('auth_offer');
      }
    }, 700);
  };

  const finishIntake = () => {
    if (mode === 'onboarding') {
      setOnboardingStep('building');
    } else {
      onClose?.();
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await signIn();
      if (res.success) {
        // Sync profile to cloud
        await saveCloudProfile({
          ...profile,
          household: accumulatedPatch,
        });
        finishIntake();
      } else {
        setAuthError(res.error || 'Sign-in was not completed.');
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Could not connect to Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const renderChip = (chip: IntakeChipOption) => {
    const isSelected = selectedChips.includes(chip.id);
    const chipLabel = chip.label[lang] || chip.label.en;
    return (
      <button
        key={chip.id}
        type="button"
        onClick={() => handleToggleChip(chip.id)}
        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer max-w-full text-left whitespace-normal break-words focus-visible:ring-2 focus-visible:ring-teal-accent focus-visible:outline-none focus:outline-none ${
          isSelected
            ? 'border border-teal-accent bg-teal-light text-teal-accent ring-1 ring-teal-accent font-semibold shadow-xs'
            : 'border border-card-border bg-card-subtle text-foreground hover:border-teal-accent/40'
        }`}
      >
        <span className="leading-snug">{chipLabel}</span>
        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-0.5" strokeWidth={2.5} />}
      </button>
    );
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between p-6 sm:p-10 select-none bg-background text-foreground pb-12 overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-width:thin]"
      role="region"
      aria-label="Personalisation Intake"
    >
      {/* 1. TOP NAVIGATION & PROGRESS HEADER */}
      <div>
        <div className="flex items-center justify-between pb-6">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="min-h-[44px] px-2 -ml-2 rounded-lg text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Back</span>
          </button>

          {/* Progress dots (Questions 1 to 4) */}
          {phase === 'questions' && (
            <div className="flex items-center gap-2" aria-label={`Step ${questionIdx + 1} of 4`}>
              {INTAKE_QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === questionIdx
                      ? 'w-6 bg-teal-accent'
                      : i < questionIdx
                      ? 'w-2 bg-teal-accent'
                      : 'w-2 bg-card-border'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Right actions: Speaker toggle & Skip */}
          <div className="flex items-center gap-2">
            {ttsEnabled && phase === 'questions' && (
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setIsVoiceMuted((prev) => !prev);
                }}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-accent focus-visible:outline-none focus:outline-none ${
                  !isVoiceMuted
                    ? 'border-teal-accent/40 text-teal-accent bg-teal-light/25 shadow-xs'
                    : 'border-card-border text-muted hover:text-foreground bg-card'
                }`}
                title={isVoiceMuted ? 'Voice off: Tap to enable question speech' : 'Voice on: Tap to mute question speech'}
                aria-label={isVoiceMuted ? 'Voice off' : 'Voice on'}
              >
                {!isVoiceMuted ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Voice on</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Voice off</span>
                  </>
                )}
              </button>
            )}

            {phase === 'questions' && (
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="min-h-[44px] px-3 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-teal-accent focus-visible:outline-none focus:outline-none"
              >
                Skip
              </button>
            )}
          </div>
        </div>

        {/* 2. EMERGENCY RED-FLAG STATE */}
        {phase === 'emergency' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 space-y-4 shadow-soft my-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-bold">Urgent Medical Notice</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Severe breathlessness, chest pain, blue lips, or fainting are signs of a critical medical emergency.
            </p>
            <div className="p-4 rounded-xl bg-white/70 dark:bg-black/30 border border-rose-200 dark:border-rose-900 text-xs sm:text-sm font-semibold space-y-1">
              <div>National Emergency Helpline: 112</div>
              <div>Ambulance Helpline: 102 / 108</div>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300">
              Please seek emergency clinical care immediately. Clearhale provides non-clinical environmental guidance only.
            </p>
            <button
              onClick={() => setPhase('questions')}
              className="w-full min-h-[44px] px-4 py-2 rounded-card bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors text-sm"
            >
              Return to intake
            </button>
          </motion.div>
        )}

        {/* 3. QUESTION CARD PHASE */}
        {phase === 'questions' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${questionIdx}-${followUp ? 'followup' : 'main'}`}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Large Question Card */}
              <div className="p-6 sm:p-7 rounded-card bg-card border border-card-border shadow-soft space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-accent">
                        Question {questionIdx + 1} of 4
                      </span>
                      {showGotIt && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-light text-teal-accent border border-teal-accent/30 text-[11px] font-semibold shadow-xs animate-in fade-in duration-200">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                          <span>{GOT_IT_LABELS[lang] || GOT_IT_LABELS.en}</span>
                        </span>
                      )}
                    </div>
                    <h2
                      ref={headingRef}
                      tabIndex={-1}
                      className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight leading-snug outline-none focus:outline-none"
                    >
                      {followUp || questionPromptText}
                    </h2>
                    {!followUp && currentQ?.helper && (
                      <p className="text-xs sm:text-sm text-muted leading-relaxed">
                        {currentQ.helper[lang] || currentQ.helper.en}
                      </p>
                    )}
                  </div>

                  {ttsEnabled && (
                    <button
                      type="button"
                      onClick={() => speak(followUp || questionPromptText)}
                      disabled={isSpeaking}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-card-subtle border border-card-border text-muted hover:text-teal-accent hover:border-teal-accent/30 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-teal-accent focus-visible:outline-none focus:outline-none disabled:opacity-50"
                      title="Play question"
                      aria-label="Play question"
                    >
                      <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span className="hidden sm:inline">Play question</span>
                    </button>
                  )}
                </div>

                {/* Quick-reply Chips */}
                {!followUp && currentQ && (
                  <div className="pt-2">
                    <div className="text-xs font-medium text-muted mb-3">
                      {QUICK_REPLY_LABELS[lang] || QUICK_REPLY_LABELS.en}
                    </div>

                    {currentQ.id === 'home_equipment' ? (
                      <div className="space-y-4">
                        {(['cooking', 'at_home', 'budget'] as const).map((grpKey) => {
                          const grpChips = currentQ.chips.filter((c) => c.group === grpKey);
                          if (grpChips.length === 0) return null;
                          const groupTitle =
                            grpChips[0].groupLabel?.[lang] || grpChips[0].groupLabel?.en || grpKey;
                          return (
                            <div key={grpKey} className="space-y-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                {groupTitle}
                              </span>
                              <div className="flex flex-wrap gap-2.5">
                                {grpChips.map((chip) => renderChip(chip))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {currentQ.chips.map((chip) => renderChip(chip))}
                      </div>
                    )}
                  </div>
                )}

                {/* Heard feedback display */}
                {heardText && (
                  <div className="p-3.5 rounded-xl bg-teal-light/30 border border-teal-accent/25 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-teal-accent">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Heard:
                      </span>
                      {autoAdvanceCountdown !== null && !isEditingHeard && (
                        <span className="text-[11px] text-muted">
                          Moving on in {autoAdvanceCountdown}s...
                        </span>
                      )}
                    </div>

                    {isEditingHeard ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={heardText}
                          onChange={(e) => setHeardText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitAnswer(heardText);
                          }}
                          className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-teal-accent bg-card text-foreground text-sm focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => submitAnswer(heardText)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-teal-accent text-white font-medium text-xs"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground font-medium truncate">
                          "{heardText}"
                        </span>
                        <button
                          onClick={handleStartEditingHeard}
                          className="p-1 rounded text-muted hover:text-foreground text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual typing fallback box */}
                {showTypeInput && !heardText && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitAnswer();
                      }}
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-card-border bg-card text-foreground text-sm focus:border-teal-accent focus:outline-none"
                    />
                    <button
                      onClick={() => submitAnswer()}
                      disabled={!typeInput.trim() && selectedChips.length === 0}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-accent text-white font-medium hover:bg-teal-hover disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
                    >
                      {isAiProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                      ) : (
                        <Send className="w-4 h-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Central Voice Mic Interaction Area (Only if STT is supported) */}
              {sttEnabled && !heardText && (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  {isRecording ? (
                    <div className="flex flex-col items-center space-y-2">
                      <WaveformBars barCount={5} colorClass="bg-rose-500" size="md" />
                      <div className="text-xs font-semibold text-rose-500">
                        Listening ({recordingDuration}s) — Tap to stop
                      </div>
                      <button
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-soft hover:bg-rose-600 transition-all cursor-pointer ring-4 ring-rose-500/20"
                        aria-label="Stop recording"
                      >
                        <MicOff className="w-7 h-7" strokeWidth={1.75} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={startRecording}
                        className="w-16 h-16 rounded-full bg-teal-accent text-white flex items-center justify-center shadow-soft hover:bg-teal-hover transition-all cursor-pointer ring-4 ring-teal-accent/20"
                        aria-label="Tap to speak your answer"
                      >
                        <Mic className="w-7 h-7" strokeWidth={1.75} />
                      </button>
                      <span className="text-xs font-medium text-muted">
                        Tap to speak
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setShowTypeInput((prev) => !prev)}
                    className="text-xs text-muted hover:text-foreground underline transition-colors cursor-pointer pt-1"
                  >
                    {showTypeInput ? 'Hide text box' : 'Type instead'}
                  </button>
                </div>
              )}

              {/* Bottom Continue button for chip selection */}
              {selectedChips.length > 0 && !heardText && !isRecording && (
                <div className="pt-2">
                  <button
                    onClick={() => submitAnswer()}
                    className="w-full min-h-[48px] px-6 py-3.5 rounded-card bg-teal-accent text-white font-medium shadow-soft hover:bg-teal-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAiProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                    ) : (
                      <>
                        <span>Continue</span>
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* 4. SUMMARY CARD PHASE */}
        {phase === 'summary' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-7 rounded-card bg-card border border-card-border shadow-soft space-y-6"
          >
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-accent">
                Profile Review
              </span>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Here is what I understood
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Tap any tag to review or adjust before confirming your daily plan.
              </p>
            </div>

            {/* Grouped Editable Chips */}
            <div className="space-y-4 pt-1">
              {/* Group 1: Household */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Household
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl border border-teal-accent bg-teal-light text-teal-accent text-xs font-medium">
                    {accumulatedPatch.members && accumulatedPatch.members.length > 0
                      ? accumulatedPatch.members.join(', ')
                      : 'Just me'}
                  </span>
                  {accumulatedPatch.childAgeBand && (
                    <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                      Age: {accumulatedPatch.childAgeBand.replace('_', ' ')}
                    </span>
                  )}
                  {accumulatedPatch.respiratoryOrHeart && (
                    <span className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs font-medium">
                      Asthma / Heart condition
                    </span>
                  )}
                </div>
              </div>

              {/* Group 2: Routine & Work */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Routine & Commute
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                    Work: {accumulatedPatch.work || 'indoor'}
                  </span>
                  {accumulatedPatch.commute && accumulatedPatch.commute.length > 0 && (
                    <span className="px-3 py-1.5 rounded-xl border border-teal-accent bg-teal-light text-teal-accent text-xs font-medium">
                      Commute: {accumulatedPatch.commute.join(', ')}
                    </span>
                  )}
                  {accumulatedPatch.schoolRun && (
                    <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                      School drop/pickup
                    </span>
                  )}
                </div>
              </div>

              {/* Group 3: Cooking & Gear */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Cooking & Gear
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                    Fuel: {accumulatedPatch.cookingFuel || 'lpg'}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border border-teal-accent bg-teal-light text-teal-accent text-xs font-medium">
                    {accumulatedPatch.hasPurifier ? 'Has air purifier' : 'No purifier'}
                  </span>
                  {accumulatedPatch.maskType && (
                    <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                      Mask: {accumulatedPatch.maskType}
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-xl border border-card-border bg-card-subtle text-foreground text-xs font-medium">
                    Budget: {accumulatedPatch.budget || 'low_cost'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-4 border-t border-card-border">
              <button
                onClick={handleConfirmSummary}
                disabled={isConfirming}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-card bg-teal-accent text-white font-medium shadow-soft hover:bg-teal-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConfirming ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
                    <span>Confirmed!</span>
                  </motion.div>
                ) : (
                  <>
                    <span>Confirm & Continue</span>
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* 5. OPTIONAL GOOGLE LOGIN PHASE */}
        {phase === 'auth_offer' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-7 rounded-card bg-card border border-card-border shadow-soft space-y-6"
          >
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-accent">
                Account Sync
              </span>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Save this to your account?
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Connect your Google account to sync your air-quality settings across devices. Without an account, your profile stays safely on this device.
              </p>
            </div>

            {authError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                {authError}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-card bg-teal-accent text-white font-medium shadow-soft hover:bg-teal-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" strokeWidth={1.75} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                onClick={finishIntake}
                className="w-full min-h-[44px] py-2 text-center text-xs sm:text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Not now (keep on this device only)
              </button>
            </div>

            <p className="text-[11px] text-muted leading-relaxed pt-2 border-t border-card-border">
              By saving to your account, you consent to storing your clean air preferences in secure cloud storage. We never store audio, transcripts, or chat. You can delete your cloud data at any time from Settings.
            </p>
          </motion.div>
        )}
      </div>

      {/* 6. PRIVACY FOOTER (ALWAYS VISIBLE) */}
      <div className="pt-6 pb-2 text-center">
        <p className="text-[11px] text-muted leading-relaxed flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-accent shrink-0" strokeWidth={1.75} />
          <span>Your voice is turned into text and not stored. We save only the answers you confirm.</span>
        </p>
      </div>
    </div>
  );
}
