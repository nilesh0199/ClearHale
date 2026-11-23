'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useVoice, splitIntoSentences } from '@/context/VoiceContext';
import { Bi } from '../Bi';
import { Term } from '../Term';
import { BreathingRing } from '../BreathingRing';
import { Particles } from '../ui/rb/Particles';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { CountUp } from '../ui/rb/CountUp';
import { SpeakerButton } from '../voice/SpeakerButton';
import { AskByVoiceFab } from '../voice/AskByVoiceFab';
import { ShareModal } from '../share/ShareModal';
import { ShareAudience } from '../share/AirQualityCard';
import {
  getTop3Actions,
  getFallbackNext2Hours,
  getPersonaRiskNote,
} from '@/lib/rulesEngine';
import { whyForYou } from '@/lib/whyForYou';
import { getBandPersonaAdvice } from '@/lib/bandAdvice';
import {
  ACTIONS_I18N,
  SUPPORTED_LANGUAGES,
  getRegionalLanguageForCity,
  getLanguageOption,
  isIndianCity,
} from '@/lib/languages';
import { FamilyView } from '@/types';
import { getAQIBand } from '@/lib/aqi';
import { CostChip } from '../ui/NeutralChips';
import confetti from 'canvas-confetti';
import {
  Globe,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Info,
  Users,
  Baby,
  HeartPulse,
  Heart,
  Briefcase,
  HardHat,
  AlertTriangle,
  Share2,
  X,
  Settings,
  Check,
  MapPin,
  ArrowRight,
  ArrowUp,
  ChevronDown,
} from 'lucide-react';

function renderHighlightedSentences(
  text: string,
  isSpeaking: boolean,
  currentSentenceIdx: number,
  currentSentences: string[]
) {
  if (!isSpeaking || currentSentences.length === 0) {
    return text;
  }
  const sentences = splitIntoSentences(text);
  return (
    <>
      {sentences.map((sentence, idx) => {
        const isHighlight = idx === currentSentenceIdx;
        return (
          <span
            key={idx}
            className={`transition-all duration-200 inline ${
              isHighlight
                ? 'bg-teal-500/20 dark:bg-teal-400/25 text-teal-950 dark:text-teal-50 rounded px-1 -mx-0.5 py-0.5 font-medium shadow-xs'
                : ''
            }`}
          >
            {sentence}{' '}
          </span>
        );
      })}
    </>
  );
}

export function HomeScreen() {
  const {
    profile,
    updateProfile,
    airData,
    loadingAir,
    refreshAirData,
    currentBand,
    toggleActionChecked,
    t,
    getActionBi,
    setActiveTab,
  } = useApp();

  const { activeSpeakingId, currentSentenceIndex, currentSentences } = useVoice();

  const [next2HoursText, setNext2HoursText] = useState<string>('');
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareAudience, setShareAudience] = useState<ShareAudience>('whole_family');
  const shouldReduceMotion = useReducedMotion();
  const disableEffects = shouldReduceMotion || profile.reduceEffects;

  // Daily dismissible nudge: "Warn your family group?" when Poor or worse
  const [warnNudgeDismissed, setWarnNudgeDismissed] = useState(true);

  // Desktop sticky layout refs & compact mode
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState(false);

  // Compact mode detection for small laptop screens or zoomed display on desktop
  useEffect(() => {
    const checkCompact = () => {
      if (typeof window === 'undefined') return;
      const isDesktop = window.innerWidth >= 1024;
      const isConstrained = window.innerHeight < 640;
      setIsCompact(isDesktop && isConstrained);
    };

    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  // ResizeObserver on left column container to guarantee it never overflows without compacting
  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;
    const el = leftColRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (window.innerWidth >= 1024) {
          const height = entry.contentRect.height;
          if (height > 0 && height < 500) {
            setIsCompact(true);
          } else if (window.innerHeight >= 640) {
            setIsCompact(false);
          }
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mouse wheel over left card forwards scroll to the right column container so it never feels dead
  const handleLeftCardWheel = (e: React.WheelEvent) => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;
    const rightCol = rightColRef.current;
    if (!rightCol) return;

    const leftCol = leftColRef.current;
    if (leftCol && leftCol.scrollHeight > leftCol.clientHeight) {
      const atTop = leftCol.scrollTop <= 0 && e.deltaY < 0;
      const atBottom =
        leftCol.scrollTop + leftCol.clientHeight >= leftCol.scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBottom) {
        return; // Left column has internal overflow; let it scroll itself
      }
    }

    rightCol.scrollBy({
      top: e.deltaY,
      behavior: 'auto',
    });
  };

  // Keyboard navigation for the right scroll container (Page Up, Page Down, Home, End, Space, Arrow keys)
  const handleRightColKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    const container = e.currentTarget;
    const pageAmount = Math.max(100, container.clientHeight * 0.8);
    const lineAmount = 48;
    const behavior = shouldReduceMotion ? 'auto' : 'smooth';

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        container.scrollBy({ top: lineAmount, behavior });
        break;
      case 'ArrowUp':
        e.preventDefault();
        container.scrollBy({ top: -lineAmount, behavior });
        break;
      case 'PageDown':
        e.preventDefault();
        container.scrollBy({ top: pageAmount, behavior });
        break;
      case 'PageUp':
        e.preventDefault();
        container.scrollBy({ top: -pageAmount, behavior });
        break;
      case 'Home':
        e.preventDefault();
        container.scrollTo({ top: 0, behavior });
        break;
      case 'End':
        e.preventDefault();
        container.scrollTo({ top: container.scrollHeight, behavior });
        break;
      case ' ':
        e.preventDefault();
        container.scrollBy({
          top: e.shiftKey ? -pageAmount : pageAmount,
          behavior,
        });
        break;
      default:
        break;
    }
  };

  // Language modal & long-press detection
  const [showLangModal, setShowLangModal] = useState(false);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const langListRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // One-time language switcher hint for newcomers
  const [showLangHint, setShowLangHint] = useState(false);
  const langHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const forceHint = urlParams.get('hint') === '1' || urlParams.get('hint') === 'true';
        const hasDismissed = localStorage.getItem('clearhale_lang_hint_dismissed_v2');
        if (!hasDismissed || forceHint) {
          // Delay briefly (700ms) so newcomers notice the top bar and language switcher
          const t = setTimeout(() => setShowLangHint(true), 700);
          return () => clearTimeout(t);
        }
      }
    } catch (_) {}
  }, []);

  const dismissLangHint = () => {
    setShowLangHint(false);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('clearhale_lang_hint_dismissed_v2', 'true');
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!showLangHint) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (langHintRef.current && !langHintRef.current.contains(e.target as Node)) {
        dismissLangHint();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showLangHint]);

  const isOutsideIndia = React.useMemo(() => {
    return !isIndianCity(profile.city);
  }, [profile.city]);

  const suggestedLangCode = getRegionalLanguageForCity(profile.city);
  const suggestedLangOption = getLanguageOption(suggestedLangCode);

  // If viewing an international city outside India, ensure language defaults to English
  useEffect(() => {
    if (isOutsideIndia && profile.language !== 'en') {
      updateProfile({ language: 'en' });
    }
  }, [isOutsideIndia, profile.language, updateProfile]);

  // Band label for the circle only: in English, keep English ("Good"); in regional languages, strip English parentheticals like " (Good)"
  const circleBandLabel = React.useMemo(() => {
    if (profile.language === 'en') {
      return currentBand.label;
    }
    const bandInfo = getAQIBand(airData.current.pm2_5, profile.language);
    const clean = (bandInfo.label || '').replace(/\s*\([^)]*\)/g, '').trim();
    return clean || currentBand.label;
  }, [profile.language, airData.current.pm2_5, currentBand.label]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPressTriggeredRef.current = false;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (_) {}
      }
      dismissLangHint();
      setShowLangModal(true);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearLongPress();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearLongPress();
    if (isLongPressTriggeredRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchCancel = () => {
    clearLongPress();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isLongPressTriggeredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      dismissLangHint();
      setShowLangModal(true);
    }, 500);
  };

  const handleMouseUp = () => {
    clearLongPress();
  };

  const handleMouseLeave = () => {
    clearLongPress();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    dismissLangHint();
    setShowLangModal(true);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    dismissLangHint();
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (isOutsideIndia) {
      setShowLangModal(true);
      return;
    }
    // Tap toggles between English and the suggested regional language
    if (profile.language === 'en') {
      updateProfile({ language: suggestedLangCode });
    } else {
      updateProfile({ language: 'en' });
    }
  };

  // Prevent background scroll bleed when Language Selector modal is open
  useEffect(() => {
    if (!showLangModal) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const originalBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
    };
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Bulletproof body lock: fixing body position prevents viewport movement regardless of wheel or touch events
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';

    // Native non-passive event listeners to preventDefault on wheel/touch outside scrollable list
    const overlay = modalOverlayRef.current;
    let cleanupListeners = () => {};

    if (overlay) {
      const handleWheel = (e: WheelEvent) => {
        const list = langListRef.current;
        if (list && list.contains(e.target as Node)) {
          const atTop = list.scrollTop <= 0 && e.deltaY < 0;
          const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1 && e.deltaY > 0;
          if (atTop || atBottom) {
            e.preventDefault();
          }
        } else {
          e.preventDefault();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const list = langListRef.current;
        if (!list || !list.contains(e.target as Node)) {
          e.preventDefault();
        }
      };

      overlay.addEventListener('wheel', handleWheel, { passive: false });
      overlay.addEventListener('touchmove', handleTouchMove, { passive: false });

      cleanupListeners = () => {
        overlay.removeEventListener('wheel', handleWheel);
        overlay.removeEventListener('touchmove', handleTouchMove);
      };
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLangModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.left = originalBodyStyle.left;
      document.body.style.right = originalBodyStyle.right;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.touchAction = originalBodyStyle.touchAction;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupListeners();
    };
  }, [showLangModal]);

  const todayDateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('clearhale_nudge_warn_family');
      if (stored !== todayDateStr) {
        setWarnNudgeDismissed(false);
      }
    } catch (e) {}
  }, [todayDateStr]);

  const handleDismissWarnNudge = () => {
    setWarnNudgeDismissed(true);
    try {
      localStorage.setItem('clearhale_nudge_warn_family', todayDateStr);
    } catch (e) {}
  };

  const handleOpenShare = (aud: ShareAudience = 'whole_family') => {
    setShareAudience(aud);
    setIsShareModalOpen(true);
  };

  // In-memory cache for persona decision text by city + band + persona + lang
  const decisionCache = useRef<Record<string, string>>({});
  const tabListRef = useRef<HTMLDivElement>(null);
  const forecastScrollRef = useRef<HTMLDivElement>(null);
  const bestHourCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the 24h forecast strip so the highlighted cleanest window is in the visible area (never cut off)
  useEffect(() => {
    const container = forecastScrollRef.current;
    const bestCard = bestHourCardRef.current;
    if (!container || !bestCard) return;

    const timer = setTimeout(() => {
      if (!container || !bestCard) return;
      const cRect = container.getBoundingClientRect();
      const tRect = bestCard.getBoundingClientRect();

      // Check if partially or fully out of view
      const isCutOffRight = tRect.right > cRect.right - 10;
      const isCutOffLeft = tRect.left < cRect.left + 10;

      if (isCutOffRight || isCutOffLeft) {
        const desiredLeft =
          bestCard.offsetLeft - container.clientWidth / 2 + bestCard.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, desiredLeft),
          behavior: 'smooth',
        });
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [airData.hourly]);

  const scrollToBestHour = () => {
    if (!forecastScrollRef.current || !bestHourCardRef.current) return;
    const container = forecastScrollRef.current;
    const card = bestHourCardRef.current;
    const desiredLeft = card.offsetLeft - container.clientWidth / 2 + card.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, desiredLeft),
      behavior: 'smooth',
    });
  };

  const scrollForecast = (direction: 'left' | 'right') => {
    if (!forecastScrollRef.current) return;
    const delta = forecastScrollRef.current.clientWidth * 0.7;
    forecastScrollRef.current.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  };

  const activeFamilyView = profile.activeFamilyFilter || 'whole_family';
  const topActions = getTop3Actions(profile, currentBand.key, activeFamilyView);
  const particleDensity = Math.min(7, Math.max(1.2, airData.current.pm2_5 / 35));
  const thinFactor = Math.min(0.75, (profile.checkedActions?.length || 0) * 0.18);

  const isPregnantSelected = profile.household?.members?.includes('pregnant') || false;

  const [showDataCreditModal, setShowDataCreditModal] = useState(false);

  // Lock body scroll when data credit sheet is open
  useEffect(() => {
    if (showDataCreditModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showDataCreditModal]);

  const familyTabs: {
    id: FamilyView;
    key: string;
    icon: any;
    shortEn: string;
    shortHi: string;
    shortMr: string;
    shortBn: string;
    fullLabelEn: string;
  }[] = [
    {
      id: 'whole_family',
      key: 'home.familyFilter.all',
      icon: Users,
      shortEn: 'Family',
      shortHi: 'परिवार',
      shortMr: 'कुटुंब',
      shortBn: 'পরিবার',
      fullLabelEn: 'Whole Family',
    },
    {
      id: 'child',
      key: 'home.familyFilter.child',
      icon: Baby,
      shortEn: 'Child',
      shortHi: 'बच्चे',
      shortMr: 'मुले',
      shortBn: 'বাচ্চা',
      fullLabelEn: 'Baby & Kids',
    },
    {
      id: 'elderly',
      key: 'home.familyFilter.elderly',
      icon: HeartPulse,
      shortEn: 'Elders',
      shortHi: 'बुजुर्ग',
      shortMr: 'ज्येष्ठ',
      shortBn: 'বয়স্ক',
      fullLabelEn: 'Elderly (60+)',
    },
    ...(isPregnantSelected
      ? [
          {
            id: 'pregnant' as FamilyView,
            key: 'home.familyFilter.pregnant',
            icon: Heart,
            shortEn: 'Pregnant',
            shortHi: 'गर्भवती',
            shortMr: 'गरोदर',
            shortBn: 'গর্ভবতী',
            fullLabelEn: 'Pregnant Person',
          },
        ]
      : []),
    {
      id: 'outdoor_worker',
      key: 'home.familyFilter.worker',
      icon: HardHat,
      shortEn: 'Workers',
      shortHi: 'कामगार',
      shortMr: 'कामगार',
      shortBn: 'শ্রমিক',
      fullLabelEn: 'Outdoor Worker',
    },
  ];

  const handleFamilyChange = (view: FamilyView) => {
    updateProfile({ activeFamilyFilter: view });
    if (typeof window !== 'undefined') {
      localStorage.setItem('clearhale_family_view', view);
    }
    setExpandedActionId(null);
    setIsGuidanceExpanded(false);

    if (rightColRef.current) {
      rightColRef.current.scrollTo({
        top: 0,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }

    const cacheKey = `${profile.city.name}_${currentBand.key}_${view}_${profile.language}`;
    const instantFallback = getFallbackNext2Hours(
      currentBand.key,
      view,
      profile.language
    );

    if (decisionCache.current[cacheKey]) {
      setNext2HoursText(decisionCache.current[cacheKey]);
    } else {
      setNext2HoursText(instantFallback);
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % familyTabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + familyTabs.length) % familyTabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = familyTabs.length - 1;
    }

    if (nextIndex !== index) {
      const nextTab = familyTabs[nextIndex];
      handleFamilyChange(nextTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  // Fetch or update Next 2 hours AI text whenever air data, persona, city, or language changes
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = `${profile.city.name}_${currentBand.key}_${activeFamilyView}_${profile.language}`;
    const instantFallback = getFallbackNext2Hours(
      currentBand.key,
      activeFamilyView,
      profile.language
    );

    // If already in memory cache, display immediately without refetching
    if (decisionCache.current[cacheKey]) {
      setNext2HoursText(decisionCache.current[cacheKey]);
      setLoadingDecision(false);
      return;
    }

    // Instantly set rules-engine baseline
    setNext2HoursText(instantFallback);
    setLoadingDecision(true);

    async function loadNext2Hours() {
      try {
        const res = await fetch('/api/gemini/next-hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pm2_5: airData.current.pm2_5,
            aqiBand: currentBand.key,
            familyView: activeFamilyView,
            language: profile.language,
            city: profile.city.name,
            dataType: airData.dataType || (airData.current.isForecast ? 'estimate' : 'measured'),
            stationName: airData.station?.name || '',
            timestamp: airData.station?.measuredAtLocal || airData.current.time,
          }),
        });

        if (!res.ok) throw new Error('API failed');

        let accumulated = '';
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            if (!isCancelled) {
              setNext2HoursText(accumulated);
            }
          }
        } else {
          accumulated = await res.text();
          if (!isCancelled) setNext2HoursText(accumulated);
        }

        if (accumulated.trim()) {
          decisionCache.current[cacheKey] = accumulated.trim();
        }
      } catch (err) {
        if (!isCancelled) {
          setNext2HoursText(instantFallback);
          decisionCache.current[cacheKey] = instantFallback;
        }
      } finally {
        if (!isCancelled) setLoadingDecision(false);
      }
    }

    loadNext2Hours();

    return () => {
      isCancelled = true;
    };
  }, [airData.current.pm2_5, currentBand.key, activeFamilyView, profile.language, profile.city.name]);

  const handleActionCheck = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasChecked = profile.checkedActions?.includes(actionId) || false;
    toggleActionChecked(actionId);

    if (!wasChecked) {
      // Small celebratory particle effect
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#0D5C52', '#10B981', '#EAF5F3'],
        });
      } catch (e) {
        // canvas fallback
      }
    }
  };

  const timeDiffMinutes = Math.max(
    1,
    Math.round((Date.now() - airData.updatedAt) / (60 * 1000))
  );

  return (
    <div className="w-full space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto lg:space-y-0 lg:pb-0 lg:max-w-none lg:h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:grid lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:overflow-hidden">
      {/* Row 1: Top Bar (fixed on desktop, never scrolls, with page background & hairline bottom border) */}
      <header className="w-full bg-background lg:border-b lg:border-card-border/60 relative z-30 pt-1 lg:pt-3.5 lg:pb-3 px-0 lg:px-8 shrink-0">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Screen Logo (at left top corner, location to right) */}
          <div className="lg:hidden shrink-0">
            <div className="relative w-11 h-11 rounded-xl bg-card border border-card-border p-1.5 shadow-soft flex items-center justify-center">
              <img
                src="/brand/logo.png"
                alt="Clearhale"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
                {profile.city.name}
              </h1>
              <button
                onClick={() => refreshAirData()}
                disabled={loadingAir}
                aria-label="Refresh air quality"
                className="p-1 rounded-full text-muted hover:text-foreground transition-colors shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingAir ? 'animate-spin text-teal-accent' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-muted font-normal leading-tight mt-0.5 truncate">
              <Bi k="home.subtitle" en="Today's air for your family" />
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted flex-wrap">
              {airData.isDemo ? (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50 text-[10px] sm:text-[11px] font-medium whitespace-nowrap">
                  <Info className="w-3 h-3" strokeWidth={1.75} />
                  {t.demoBadge}
                </span>
              ) : airData.isCached ? (
                <span className="text-[11px] text-muted whitespace-nowrap">
                  {t.cachedBadge}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-teal-accent font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-accent animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Share Button (Icon + Label) */}
          <button
            onClick={() => handleOpenShare('whole_family')}
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-full border border-card-border bg-card text-xs font-semibold text-foreground hover:border-teal-accent/40 shadow-soft transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            title="Share Air Quality Card"
            aria-label="Share Air Quality Card"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-accent" strokeWidth={1.75} />
            <span>
              <Bi k="share.button" en="Share" layout="inline" />
            </span>
          </button>

          {/* Suggested Regional Language Toggle & Long-Press Switcher */}
          <div className="relative z-40" ref={langHintRef}>
            <button
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
              onClick={handleButtonClick}
              className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-full border bg-card text-xs font-semibold text-foreground shadow-soft transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none active:scale-95 ${
                showLangHint
                  ? 'border-teal-accent ring-2 ring-teal-accent ring-offset-2 ring-offset-background shadow-md'
                  : 'border-card-border hover:border-teal-accent/40'
              }`}
              title={isOutsideIndia ? 'Language: English • Hold for all languages' : 'Tap to toggle language • Hold for options & settings'}
              aria-label={isOutsideIndia ? 'Language: English' : 'Toggle language or hold to change'}
            >
              <Globe className="w-3.5 h-3.5 text-teal-accent" strokeWidth={1.75} />
              <span>{isOutsideIndia ? 'English' : (profile.language === 'en' ? suggestedLangOption.nativeName : 'English')}</span>
              <ChevronDown
                className={`w-3 h-3 transition-colors ${
                  showLangHint ? 'text-teal-accent animate-bounce' : 'text-muted'
                }`}
                strokeWidth={2}
              />
            </button>

            {/* One-time hint for newcomers */}
            <AnimatePresence>
              {showLangHint && !isShareModalOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  role="tooltip"
                  id="lang-switcher-hint"
                  className="absolute right-0 top-full mt-2.5 z-50 w-64 sm:w-72 max-w-[calc(100vw-2rem)] p-3 bg-card rounded-2xl border-2 border-teal-accent shadow-xl"
                >
                  {/* Upward pointing triangle / arrow pointing directly to the language button above */}
                  <div className="absolute -top-[9px] right-7 w-4 h-4 bg-card border-t-2 border-l-2 border-teal-accent rotate-45 z-20" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-card-border/60">
                      <div className="flex items-center gap-1.5">
                        <ArrowUp className="w-3.5 h-3.5 text-teal-accent animate-bounce shrink-0" strokeWidth={2.5} />
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                          Language Button Above
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={dismissLangHint}
                        aria-label="Close language hint"
                        className="text-muted hover:text-foreground p-1 -mr-1 rounded-lg hover:bg-card-subtle transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {isOutsideIndia ? (
                        <>
                          <span className="font-bold text-teal-800 dark:text-teal-200">English</span> is recommended for international locations.
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-teal-800 dark:text-teal-200">Tap</span> this button above to quickly switch language.
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">
                      <span className="font-bold text-foreground">Long press</span> to choose from 10 Indian languages.
                    </p>

                    {/* Regional language translation preview if current language is not English and inside India */}
                    {!isOutsideIndia && profile.language !== 'en' && (
                      <div className="mt-2 pt-1.5 border-t border-card-border/60 text-[11px] text-muted leading-snug">
                        {profile.language === 'hi' ? (
                          <span>ऊपर दिए बटन पर टैप करके भाषा बदलें • सभी 10 भाषाओं के लिए दबाकर रखें।</span>
                        ) : profile.language === 'mr' ? (
                          <span>वरील बटनावर टॅप करून भाषा बदला • सर्व 10 भाषांसाठी दाबून ठेवा.</span>
                        ) : (
                          <span>Tap the button above to switch • Long press for all languages.</span>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={dismissLangHint}
                        className="px-3 py-1 rounded-xl bg-teal-accent hover:bg-teal-hover text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </header>

      {/* Row 2: Family Tabs (fixed on desktop, never scrolls, with page background & hairline bottom border) */}
      <div className="w-full bg-background lg:border-b lg:border-card-border/60 relative z-10 py-0 lg:py-2.5 px-0 lg:px-8 shrink-0">
        <div className="w-full max-w-5xl mx-auto space-y-2">
          {/* Family View Segmented Switcher (Mobile: Compact 4-column control, Desktop: Full pills) */}
          <div
            ref={tabListRef}
            role="tablist"
        aria-label="Family filter perspective"
        className={`bg-card-subtle p-1 rounded-2xl sm:rounded-card relative select-none w-full border border-card-border/60 ${
          familyTabs.length === 5 ? 'grid grid-cols-5' : 'grid grid-cols-4'
        } sm:flex sm:gap-1`}
      >
        {familyTabs.map((tab, idx) => {
          const isActive = activeFamilyView === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`family-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`family-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleFamilyChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              title={tab.fullLabelEn}
              aria-label={`Filter by ${tab.fullLabelEn}`}
              className={`relative z-10 min-h-[48px] h-14 sm:h-auto sm:min-h-[48px] sm:flex-1 py-1.5 px-1 sm:px-3.5 sm:py-2.5 rounded-xl transition-colors flex flex-col sm:flex-row items-center justify-center focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
                isActive
                  ? profile.accentMode === 'mono'
                    ? 'text-neutral-50 font-semibold'
                    : 'text-teal-accent font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-family-pill"
                  className={`absolute inset-0.5 rounded-xl ${
                    profile.accentMode === 'mono'
                      ? 'bg-neutral-900 shadow-sm border border-neutral-800'
                      : 'bg-card shadow-soft border border-card-border'
                  }`}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              {/* Icon: on top on mobile, on left on tablet/desktop */}
              <tab.icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 relative z-10" />

              {/* Mobile (< 640px): Compact stacked label with bilingual caption */}
              <div className="sm:hidden flex flex-col items-center justify-center leading-none mt-1 relative z-10 w-full px-0.5">
                {profile.language === 'en' ? (
                  <span className="text-[11px] font-semibold tracking-tight truncate max-w-full">
                    {tab.shortEn}
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold tracking-tight leading-tight truncate max-w-full">
                      {profile.language === 'hi'
                        ? tab.shortHi
                        : profile.language === 'mr'
                        ? tab.shortMr
                        : profile.language === 'bn'
                        ? tab.shortBn
                        : tab.shortEn}
                    </span>
                    <span className="text-[8px] opacity-75 font-normal leading-none mt-0.5 uppercase tracking-wider truncate max-w-full">
                      {tab.shortEn}
                    </span>
                  </>
                )}
              </div>

              {/* Tablet & Desktop (>= 640px): Full horizontal label with Bi component */}
              <span className="hidden sm:inline relative z-10 ml-1.5 text-xs font-medium whitespace-nowrap">
                <Bi k={tab.key} layout="inline" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Daily Dismissible Nudge: "Warn your family group?" when Poor or worse */}
      {!warnNudgeDismissed &&
        (currentBand.key === 'poor' ||
          currentBand.key === 'very_poor' ||
          currentBand.key === 'severe') && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="font-medium text-foreground">
                Warn your family group?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenShare('whole_family')}
                className="px-3.5 py-1.5 rounded-xl bg-teal-accent hover:bg-teal-hover text-white font-medium text-xs shadow-soft transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Share Poster</span>
              </button>
              <button
                type="button"
                onClick={handleDismissWarnNudge}
                className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Dismiss warning nudge for today"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Row 3: Two-Column Body (Left ring card fixed in view, Right column scrolls) */}
      <div className="w-full min-h-0 h-full overflow-hidden px-0 lg:px-8 pt-0 lg:pt-4 pb-0">
        <div className="w-full max-w-5xl mx-auto h-full min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch h-full min-h-0">
            {/* Left Column: Center Breathing Ring & Air Severity Card */}
            <div
              ref={leftColRef}
              onWheel={handleLeftCardWheel}
              className="lg:col-span-5 h-full min-h-0 lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col"
            >
              <section className={`relative overflow-hidden bg-card rounded-card border border-card-border shadow-soft flex flex-col items-center justify-between text-center transition-all min-h-full ${isCompact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'}`}>
            {/* Flat subtle band tint behind the ring card (no gradient, no glow) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{ backgroundColor: currentBand.ringHex }}
            />
            {/* Live data-driven atmospheric haze particles */}
            {!disableEffects && (
              <Particles
                density={particleDensity}
                thinFactor={thinFactor}
                color={
                  currentBand.key === 'good'
                    ? 'rgba(16, 185, 129, 0.20)'
                    : currentBand.key === 'satisfactory'
                    ? 'rgba(132, 204, 22, 0.20)'
                    : currentBand.key === 'moderate'
                    ? 'rgba(245, 158, 11, 0.20)'
                    : currentBand.key === 'poor'
                    ? 'rgba(249, 115, 22, 0.22)'
                    : currentBand.key === 'very_poor'
                    ? 'rgba(239, 68, 68, 0.24)'
                    : 'rgba(220, 38, 38, 0.26)'
                }
                speed={0.25}
                className="opacity-70"
              />
            )}

            <div className="flex flex-col items-center w-full">
              <BreathingRing
                colorHex={currentBand.ringHex}
                size={isCompact ? 204 : 240}
                strokeWidth={3.5}
                mode="ambient"
              >
                <div className="flex flex-col items-center relative z-10">
                  <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} uppercase tracking-wider text-muted font-medium`}>
                    <Term k="pm25">
                      <Bi k="home.pm25Level" en="PM2.5 Level" />
                    </Term>
                  </span>
                  <div className={`${isCompact ? 'text-4xl my-0' : 'text-5xl my-0.5'} font-semibold tracking-tight text-foreground tabular-nums`}>
                    <CountUp to={airData.current.pm2_5} duration={1.2} />
                  </div>
                  <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} text-muted`}>
                    <Term k="ug_m3">µg/m³</Term>
                  </span>

                  {/* AQI Band Chip: strictly centered and enclosed inside the ring */}
                  <Term k="bands" noUnderline className={`${isCompact ? 'mt-1.5' : 'mt-2'} inline-block`}>
                    <div
                      className={`px-3.5 py-1 rounded-full ${isCompact ? 'text-[11px]' : 'text-xs'} font-semibold border shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${currentBand.bgColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: currentBand.ringHex }} />
                      <span className="whitespace-nowrap">{circleBandLabel}</span>
                    </div>
                  </Term>
                </div>
              </BreathingRing>

              {/* Data Label under the ring: Always visible source and timestamp with info button */}
              {loadingAir ? (
                <div
                  className={`${isCompact ? 'mt-1.5' : 'mt-3'} flex items-center justify-center gap-1.5`}
                  aria-busy="true"
                  aria-label="Loading air quality source"
                >
                  <div className="h-3.5 w-48 sm:w-56 rounded-md bg-card-border/40 animate-pulse" />
                  <div className="w-3.5 h-3.5 rounded-full bg-card-border/40 animate-pulse" />
                </div>
              ) : (
                <div className={`${isCompact ? 'mt-1.5 text-[11px]' : 'mt-3 text-xs'} flex items-center justify-center gap-1.5 text-muted max-w-sm sm:max-w-md mx-auto text-center px-2`}>
                  <span className="truncate leading-normal">
                    {airData.dataType === 'measured' && airData.station
                      ? `Measured at ${airData.station.name}, ${airData.station.distanceKm} km away, ${
                          airData.station.minutesAgo ??
                          Math.max(
                            1,
                            Math.round(
                              (Date.now() -
                                new Date(airData.station.measuredAtUtc || airData.updatedAt).getTime()) /
                                60000
                            )
                          )
                        } min ago`
                      : `Forecast estimate, Open-Meteo, updated ${Math.max(
                          1,
                          Math.round((Date.now() - airData.updatedAt) / 60000)
                        )} min ago`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDataCreditModal(true)}
                    aria-label="View air quality measurement details and data source"
                    className="inline-flex items-center justify-center p-0.5 rounded-full text-muted/80 hover:text-teal-accent hover:bg-card-subtle transition-colors cursor-pointer shrink-0"
                    title="Air quality reading details"
                  >
                    <Info className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>

            {/* Plain Language Status Line & Animated Persona-Specific Risk Note */}
            <div
              className={`${
                isCompact
                  ? 'mt-2 space-y-1.5'
                  : 'mt-4 lg:mt-0 lg:my-auto lg:translate-y-7 space-y-2'
              } max-w-lg text-center w-full my-auto`}
            >
              <p className={`${isCompact ? 'text-xs sm:text-sm leading-snug' : 'text-sm sm:text-base leading-relaxed'} font-medium text-foreground`}>
                {currentBand.statusLine}
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFamilyView}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="px-3.5 py-2 rounded-xl bg-card-subtle border border-card-border text-xs leading-relaxed text-muted text-center"
                >
                  <span className="font-semibold text-teal-accent mr-1 inline-block">
                    <Bi
                      k={
                        activeFamilyView === 'child'
                          ? 'home.childVuln'
                          : activeFamilyView === 'elderly'
                          ? 'home.seniorVuln'
                          : activeFamilyView === 'pregnant'
                          ? 'home.pregnantVuln'
                          : activeFamilyView === 'outdoor_worker'
                          ? 'home.workerVuln'
                          : 'home.familyVuln'
                      }
                      layout="inline"
                    />
                  </span>
                  <span className={isCompact && !isGuidanceExpanded ? 'line-clamp-3 inline' : 'inline'}>
                    {getBandPersonaAdvice(
                      currentBand.key,
                      activeFamilyView,
                      profile.language
                    )}
                  </span>
                  {isCompact && (
                    <button
                      type="button"
                      onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
                      className="ml-1.5 text-[11px] font-semibold text-teal-accent hover:underline cursor-pointer inline-block"
                    >
                      {isGuidanceExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Secondary metric chips (US AQI & PM10) */}
            <div className={`${isCompact ? 'mt-2 pt-2 text-[11px]' : 'mt-4 pt-4 text-xs'} flex items-center justify-center gap-4 text-muted border-t border-card-border/60 w-full max-w-xs relative z-10 tabular-nums`}>
              <div>
                <Term k="aqi">
                  <span className="text-muted/70 hover:text-teal-accent transition-colors cursor-pointer">
                    US AQI:{' '}
                    <span className="font-semibold text-foreground">
                      <CountUp to={airData.current.us_aqi} duration={1.0} />
                    </span>{' '}
                    <span className="text-[10px] text-muted/60 hover:underline">(different scale)</span>
                  </span>
                </Term>
              </div>
              <div className="w-1 h-1 rounded-full bg-card-border" />
              <div>
                <span className="text-muted/70">
                  <Term k="pm10"><Bi k="home.pm10Label" en="PM10" /></Term>:{' '}
                </span>
                <span className="font-semibold text-foreground">
                  <CountUp to={airData.current.pm10} duration={1.0} /> <Term k="ug_m3">µg/m³</Term>
                </span>
              </div>
            </div>
          </section>
        </div>

            {/* Right Column: Decisions, Top Actions, and Hourly Forecast */}
            <div
              ref={rightColRef}
              tabIndex={0}
              role="region"
              id="recommendations-container" aria-label="Recommendations"
              onKeyDown={handleRightColKeyDown}
              className="lg:col-span-7 space-y-6 h-full min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2.5 pb-0 lg:pb-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/70 focus-visible:ring-offset-2 rounded-2xl desktop-scroll-slim"
            >

      {/* "Next 2 Hours" Clear Decision Card */}
      <SpotlightCard
        id={`family-tabpanel-${activeFamilyView}`}
        role="tabpanel"
        aria-labelledby={`family-tab-${activeFamilyView}`}
        spotlightColor="rgba(45, 212, 191, 0.14)"
        className="scroll-mt-4 bg-card rounded-card border border-teal-accent/25 p-5 shadow-soft"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-accent">
              <Bi k="home.nextTwoHours" layout="inline" />
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-accent/15 text-teal-accent font-semibold border border-teal-accent/30 capitalize">
              <Bi
                k={`home.familyFilter.${
                  activeFamilyView === 'whole_family'
                    ? 'all'
                    : activeFamilyView === 'outdoor_worker'
                    ? 'worker'
                    : activeFamilyView
                }`}
                layout="inline"
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            {loadingDecision && (
              <span className="text-[11px] text-teal-accent/80 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={1.75} />
                <Bi k="home.refining" en="Refining..." layout="inline" />
              </span>
            )}
            <SpeakerButton
              id="next_2_hours"
              text={
                next2HoursText ||
                getFallbackNext2Hours(
                  currentBand.key,
                  activeFamilyView,
                  profile.language
                )
              }
              size="sm"
              variant="pill"
              showLabel
            />
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFamilyView + '-' + (next2HoursText || '')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const fullText =
                next2HoursText ||
                getFallbackNext2Hours(
                  currentBand.key,
                  activeFamilyView,
                  profile.language
                );
              const isCurrentSpeaking = activeSpeakingId === 'next_2_hours';
              const parts = fullText.split('---EN---');
              const nativePart = parts[0]?.trim();
              const enPart = parts[1]?.trim();

              if (enPart && profile.language !== 'en') {
                return (
                  <div className="space-y-2">
                    <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                      {renderHighlightedSentences(
                        nativePart,
                        isCurrentSpeaking,
                        currentSentenceIndex,
                        currentSentences
                      )}
                    </p>
                    <div className="border-t border-teal-accent/20 pt-1.5">
                      <p className="text-xs text-muted leading-relaxed font-normal">
                        {renderHighlightedSentences(
                          enPart,
                          isCurrentSpeaking,
                          currentSentenceIndex,
                          currentSentences
                        )}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                  {renderHighlightedSentences(
                    nativePart || fullText,
                    isCurrentSpeaking,
                    currentSentenceIndex,
                    currentSentences
                  )}
                </p>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </SpotlightCard>

      {/* Share link under "Next 2 hours" card */}
      <div className="flex justify-end pt-1 -mt-4 px-1">
        <button
          onClick={() =>
            handleOpenShare(
              activeFamilyView === 'outdoor_worker'
                ? 'outdoor_worker'
                : activeFamilyView === 'child'
                ? 'child'
                : activeFamilyView === 'elderly'
                ? 'elderly'
                : 'whole_family'
            )
          }
          className="text-xs text-teal-accent hover:underline flex items-center gap-1.5 font-medium transition-colors cursor-pointer min-h-[36px]"
        >
          <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          <Bi k="share.shareCard" en="Share air card with family" layout="inline" />
        </button>
      </div>

      {/* Top 3 Actions with Cost Tags */}
      <section id="top-actions-section" className="space-y-3 scroll-mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              <Bi k="home.topActions" layout="inline" />
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-card-subtle text-muted font-medium border border-card-border">
              {activeFamilyView === 'child'
                ? (profile.language === 'mr' ? 'लहान मुलांसाठी विशेष' : profile.language === 'hi' ? 'बच्चों के लिए विशेष' : 'Ranked for Baby & Kids')
                : activeFamilyView === 'elderly'
                ? (profile.language === 'mr' ? 'ज्येष्ठांसाठी विशेष' : profile.language === 'hi' ? 'बुजुर्गों के लिए विशेष' : 'Ranked for Elderly')
                : activeFamilyView === 'pregnant'
                ? (profile.language === 'mr' ? 'गर्भवतींसाठी विशेष' : profile.language === 'hi' ? 'गर्भवती महिलाओं के लिए' : 'Ranked for Pregnancy')
                : activeFamilyView === 'outdoor_worker'
                ? (profile.language === 'mr' ? 'कामगारांसाठी विशेष' : profile.language === 'hi' ? 'कर्मियों के लिए विशेष' : 'Ranked for Worker')
                : (profile.language === 'mr' ? 'संपूर्ण कुटुंबासाठी' : profile.language === 'hi' ? 'पूरे परिवार के लिए' : 'Balanced for Family')}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('plan')}
            className="text-xs font-medium text-teal-accent hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Bi k="home.viewFullPlan" en="View Full Plan" layout="inline" />
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFamilyView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="space-y-2.5"
          >
            {topActions.map((action) => {
              const isChecked = profile.checkedActions?.includes(action.id) || false;
              const isExpanded = expandedActionId === action.id;
              const { enTitle, nativeTitle } = getActionBi(action.id, action.title, currentBand.key);
              const nativeWhy = ACTIONS_I18N[profile.language]?.[action.id]?.why;

              return (
                <motion.div
                  key={action.id}
                  layout
                  whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                >
                  <SpotlightCard
                    spotlightColor={
                      isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(45, 212, 191, 0.12)'
                    }
                    className={`rounded-card border transition-all shadow-soft overflow-hidden group ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-card-border hover:border-teal-accent/40 hover:shadow-md'
                    }`}
                  >
                  <div
                    onClick={() =>
                      setExpandedActionId(isExpanded ? null : action.id)
                    }
                    className="p-4 flex items-start gap-3 cursor-pointer"
                  >
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={(e) => handleActionCheck(action.id, e)}
                      className="mt-0.5 p-1 rounded-full text-muted hover:text-teal-accent transition-colors cursor-pointer"
                      aria-label={`Mark ${action.title} as completed`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" strokeWidth={1.75} />
                      ) : (
                        <Circle className="w-5 h-5 text-muted/30 hover:text-muted" strokeWidth={1.75} />
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {profile.language === 'en' ? (
                          <h3
                            className={`text-sm font-semibold text-foreground ${
                              isChecked ? 'line-through text-muted' : ''
                            }`}
                          >
                            {action.title}
                          </h3>
                        ) : (
                          <div className="flex flex-col">
                            <h3
                              className={`text-sm font-semibold text-foreground ${
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
                        {/* Cost Tag */}
                        <CostChip tier={action.cost_tier} />
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {whyForYou(action, profile, airData)}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-1 border-t border-card-border/60 bg-card-subtle text-xs text-muted space-y-2"
                    >
                      <div>
                        <strong className="text-foreground font-semibold">
                          Do this:{' '}
                        </strong>
                        <span>{action.doThis}</span>
                      </div>
                      <div>
                        <strong className="text-foreground font-semibold">
                          Why it works:{' '}
                        </strong>
                        <span>{action.whyItWorks || action.why}</span>
                      </div>
                      <div>
                        <strong className="text-foreground font-semibold">
                          Cost and time:{' '}
                        </strong>
                        <span>{action.cost_tier} • {action.timeNeeded}</span>
                      </div>
                      <div>
                        <strong className="text-foreground font-semibold">
                          Evidence:{' '}
                        </strong>
                        <span>{action.evidence}</span>
                      </div>
                      {action.careful && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <strong className="font-semibold block">Be careful about:</strong>
                            <span>{action.careful}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SpotlightCard>
            </motion.div>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </section>

      {/* 24-Hour Forecast Strip */}
      <SpotlightCard
        id="forecast-section"
        spotlightColor="rgba(45, 212, 191, 0.1)"
        className="scroll-mt-4 bg-card rounded-card border border-card-border shadow-soft p-5"
      >
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t.home.forecast24h}
            </h2>
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollForecast('left')}
                className="p-1 rounded-lg border border-card-border hover:bg-card-subtle text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Scroll forecast left"
                aria-label="Scroll forecast left"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => scrollForecast('right')}
                className="p-1 rounded-lg border border-card-border hover:bg-card-subtle text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Scroll forecast right"
                aria-label="Scroll forecast right"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToBestHour}
            className="text-xs text-teal-accent hover:text-teal-600 dark:hover:text-teal-400 font-medium flex items-center gap-1.5 transition-colors cursor-pointer group"
            title="Scroll to highlighted cleanest window"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform" />
            <span>
              Highlighted: <span className="underline underline-offset-2">{t.home.bestWindow}</span>
            </span>
          </button>
        </div>

        {/* Horizontal Scroll Strip */}
        <div
          ref={forecastScrollRef}
          className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
        >
          {airData.hourly.map((h, i) => (
            <div
              key={i}
              ref={h.isBestHour ? bestHourCardRef : undefined}
              className={`shrink-0 w-20 p-2.5 rounded-xl border text-center transition-all ${
                h.isBestHour
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500'
                  : 'border-card-border bg-card-subtle/50 hover:bg-card-subtle'
              }`}
            >
              <div className="text-[11px] font-medium text-muted flex items-center justify-center gap-1">
                <span>{h.hour}</span>
                {i === 0 && (
                  <span className="text-[9px] font-semibold text-teal-accent bg-teal-accent/10 px-1 py-0.2 rounded">
                    Now
                  </span>
                )}
              </div>
              <div className="text-base font-semibold text-foreground my-1">
                {h.pm2_5}
              </div>
              <div className="text-[10px] text-muted">µg/m³</div>
              {h.isBestHour && (
                <div className="mt-1 text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">
                  Best air
                </div>
              )}
            </div>
          ))}
        </div>
      </SpotlightCard>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ask by Voice Button */}
      <AskByVoiceFab />

      {/* Share Air Quality Card Preview Sheet / Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        defaultAudience={shareAudience}
      />

      {/* Air Quality Reading Details & Source Sheet (Desktop: Popover Modal, Mobile: Bottom Sheet) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showDataCreditModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop dismiss */}
                <div
                  className="absolute inset-0"
                  onClick={() => setShowDataCreditModal(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 35 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.1 }
                      : { type: 'spring', damping: 28, stiffness: 350 }
                  }
                  className="relative z-10 w-full sm:max-w-md bg-card border border-card-border rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-float text-left max-h-[90vh] overflow-y-auto"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-card-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-accent/10 border border-teal-accent/30 flex items-center justify-center text-teal-accent shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground leading-tight">
                          Air Data Source & Reading Details
                        </h3>
                        <p className="text-[11px] text-muted mt-0.5">
                          {profile.language === 'hi'
                            ? 'वायु गुणवत्ता डेटा स्रोत व विवरण'
                            : profile.language === 'mr'
                            ? 'हवा गुणवत्ता डेटा स्रोत व तपशील'
                            : profile.language === 'bn'
                            ? 'বায়ুর মান ডেটা উৎস ও বিবরণ'
                            : 'Verified measurement and model transparency'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDataCreditModal(false)}
                      className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-card-subtle transition-colors cursor-pointer"
                      aria-label="Close air quality details"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Data Type Badge & Empty State */}
                    {airData.dataType === 'measured' && airData.station ? (
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/50">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>
                            {profile.language === 'hi'
                              ? 'मापन किया गया स्टेशन डेटा'
                              : profile.language === 'mr'
                              ? 'मापन केलेले स्टेशन डेटा'
                              : profile.language === 'bn'
                              ? 'পরিমাপ করা স্টেশন ডেটা'
                              : 'Measured Government Station Data'}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1.5">
                          Direct physical sensor reading via OpenAQ from official government monitoring.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800/50">
                          <span>
                            {profile.language === 'hi'
                              ? 'पूर्वानुमान मॉडल अनुमान'
                              : profile.language === 'mr'
                              ? 'हवामान मॉडेल अंदाज'
                              : profile.language === 'bn'
                              ? 'পূর্বাভাস মডেল অনুমান'
                              : 'Forecast Model Estimate'}
                          </span>
                        </div>
                        {/* Clear Empty State */}
                        <div className="mt-2.5 p-3 rounded-xl bg-card-subtle border border-card-border text-xs text-muted leading-relaxed">
                          <p className="font-medium text-foreground">
                            {profile.language === 'hi'
                              ? '25 किमी के दायरे में कोई सरकारी स्टेशन नहीं मिला, पूर्वानुमान मॉडल अनुमान दिखाया जा रहा है'
                              : profile.language === 'mr'
                              ? '25 किमी परिसरात कोणतेही केंद्र आढळले नाही, हवामान मॉडेल अंदाज दाखवला आहे'
                              : profile.language === 'bn'
                              ? '২৫ কিমির মধ্যে কোনো স্টেশন পাওয়া যায়নি, পূর্বাভাস মডেল অনুমান দেখানো হচ্ছে'
                              : 'No station within 25 km, showing a forecast estimate.'}
                          </p>
                          <p className="mt-1 text-[11px] opacity-80">
                            Clearhale does not guess local numbers: when physical monitors are unavailable, satellite and wind spread estimates are shown.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Measured Station Details */}
                    {airData.dataType === 'measured' && airData.station && (
                      <div className="p-3.5 rounded-xl bg-card-subtle border border-card-border space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-muted">Station Name:</span>
                          <span className="font-semibold text-foreground text-right truncate max-w-[200px]">
                            {airData.station.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted">Data Provider:</span>
                          <span className="font-medium text-foreground text-right">
                            {airData.station.provider} (OpenAQ v3)
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted">Distance to Location:</span>
                          <span className="font-medium text-foreground">
                            {airData.station.distanceKm} km away
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted">Measurement Time:</span>
                          <span className="font-medium text-foreground">
                            {(() => {
                              try {
                                const d = new Date(airData.station.measuredAtLocal || airData.station.measuredAtUtc);
                                return isNaN(d.getTime())
                                  ? airData.station.measuredAtLocal
                                  : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              } catch {
                                return airData.station.measuredAtLocal;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Model Value Beside Measured Value Comparison */}
                    <div>
                      <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                        Reading Comparison
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-card-subtle border border-card-border">
                          <div className="text-[11px] text-muted">
                            {airData.dataType === 'measured' ? 'Measured (Ground)' : 'Current Reading'}
                          </div>
                          <div className="text-xl font-bold text-foreground mt-0.5">
                            {airData.current.pm2_5}{' '}
                            <span className="text-xs font-normal text-muted">µg/m³</span>
                          </div>
                          <div className="text-[10px] text-muted mt-1">
                            {airData.dataType === 'measured' ? 'Local physical sensor' : 'Open-Meteo'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card-subtle border border-card-border">
                          <div className="text-[11px] text-muted">Forecast Model</div>
                          <div className="text-xl font-bold text-foreground mt-0.5">
                            {airData.modelPM2_5 ?? airData.current.pm2_5}{' '}
                            <span className="text-xs font-normal text-muted">µg/m³</span>
                          </div>
                          <div className="text-[10px] text-muted mt-1">
                            Open-Meteo 11km model
                          </div>
                        </div>
                      </div>

                      {/* Noted Difference (> 40%) */}
                      {airData.station?.differenceNoted && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                          <span className="font-semibold">Observation: </span>
                          Measured reading and forecast model differ by {airData.station.differencePercent}%. Clearhale retains the verified ground station reading for "Now".
                        </div>
                      )}
                    </div>

                    {/* Plain sentence explaining "measured" vs "estimate" (Bilingual Rule) */}
                    <div className="p-3.5 rounded-xl bg-card-subtle border border-card-border text-xs leading-relaxed text-muted space-y-1.5">
                      <p className="text-foreground font-medium">
                        {profile.language === 'hi'
                          ? 'मापन किया गया बनाम मॉडल अनुमान'
                          : profile.language === 'mr'
                          ? 'मापन केलेले विरुद्ध मॉडेल अंदाज'
                          : profile.language === 'bn'
                          ? 'পরিমাপ করা বনাম মডেল পূর্বাভাস'
                          : 'Understanding Measured vs. Estimate'}
                      </p>
                      {profile.language !== 'en' && (
                        <p className="text-foreground/90">
                          {profile.language === 'hi'
                            ? 'मापन किया गया डेटा नजदीकी सरकारी वायु गुणवत्ता निगरानी केंद्रों से आता है। जब 25 किमी के दायरे में कोई सक्रिय सेंसर नहीं होता, तो ओपन-मिटियो उपग्रह व वायुमंडलीय मॉडलों द्वारा पूर्वानुमान अनुमान प्रदान करता है।'
                            : profile.language === 'mr'
                            ? 'मापन केलेला डेटा जवळच्या सरकारी प्रदूषण नियंत्रण केंद्रांवरून येतो. 25 किमी परिसरात सक्रिय सेन्सर नसल्यास ओपन-मिटियो उपग्रह मॉडेलवर आधारित अंदाज दाखवतो.'
                            : profile.language === 'bn'
                            ? 'পরিমাপ করা ডেটা নিকটবর্তী সরকারি পর্যবেক্ষণ কেন্দ্র থেকে সংগৃহীত। ২৫ কিমির মধ্যে সক্রিয় সেন্সর না থাকলে ওপেন-মিটিও মডেল থেকে পূর্বাভাস অনুমান দেখানো হয়।'
                            : ''}
                        </p>
                      )}
                      <p>
                        Measured data comes from physical government air monitoring stations. Forecast estimates are calculated by Open-Meteo using atmospheric models when physical sensors are updating or beyond 25 km.
                      </p>
                    </div>

                    {/* Navigation Links to Care and Terms */}
                    <div className="pt-2 border-t border-card-border flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDataCreditModal(false);
                          setActiveTab('care');
                        }}
                        className="text-teal-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <span>Health Guidance (Care)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowDataCreditModal(false);
                          setActiveTab('learn');
                        }}
                        className="text-muted hover:text-foreground transition-colors font-medium cursor-pointer"
                      >
                        Terms & Scientific Base
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Long-Press Language Selector Modal / Bottom Sheet */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showLangModal && (
              <div
                ref={modalOverlayRef}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain select-none"
              >
                {/* Backdrop click to dismiss */}
                <div
                  className="absolute inset-0 overscroll-contain touch-none"
                  onClick={() => setShowLangModal(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 w-full sm:max-w-md bg-card border border-card-border rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-float text-left max-h-[85vh] flex flex-col overscroll-contain"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-card-border touch-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-teal-accent/10 border border-teal-accent/30 flex items-center justify-center text-teal-accent shrink-0">
                        <Globe className="w-4 h-4 text-teal-accent" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground leading-tight">
                          Select Language
                        </h3>
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {profile.city.name} • Suggested:{' '}
                          <span className="font-semibold text-teal-accent">
                            {suggestedLangOption.nativeName}
                          </span>
                          {suggestedLangOption.code !== 'en' && ` (${suggestedLangOption.name})`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLangModal(false)}
                      className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-card-subtle transition-colors cursor-pointer shrink-0 ml-2"
                      aria-label="Close language selector"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Language Grid with isolated touch-pan-y & overscroll-contain */}
                  <div
                    ref={langListRef}
                    className="overflow-y-auto py-3 space-y-1.5 pr-1 max-h-[50vh] sm:max-h-[55vh] overscroll-contain touch-pan-y [scrollbar-width:thin]"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = profile.language === lang.code;
                        const isSuggested = lang.code === suggestedLangCode;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              updateProfile({ language: lang.code });
                              setShowLangModal(false);
                            }}
                            className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer min-h-[64px] ${
                              isSelected
                                ? 'border-teal-accent bg-teal-accent/10 text-teal-950 dark:text-teal-50 shadow-xs'
                                : 'border-card-border bg-card hover:bg-card-subtle text-foreground'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 w-full">
                              <span className="text-sm font-bold tracking-tight">
                                {lang.nativeName}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-teal-accent shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-1 w-full">
                              <span className="text-[11px] text-muted font-medium truncate">
                                {lang.name}
                              </span>
                              {isSuggested && (
                                <span className="text-[9px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  Regional
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Open Settings Button */}
                  <div className="pt-3 border-t border-card-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLangModal(false);
                        setActiveTab('profile');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-card-border bg-card-subtle hover:bg-teal-accent/10 hover:border-teal-accent/40 text-foreground text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-teal-accent" />
                      <span>Open Full Settings</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
