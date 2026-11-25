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
import { ActionDetailModal } from '../actions/ActionDetailModal';
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
import { FamilyView, FamilyMember, ActionItem } from '@/types';
import { getAQIBand } from '@/lib/aqi';
import { findNearestCatalogCity } from '@/lib/citiesData';
import { CostChip } from '../ui/NeutralChips';
import confetti from 'canvas-confetti';
import {
  Globe,
  RefreshCw,
  Clock,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Info,
  Users,
  Baby,
  HeartPulse,
  Heart,
  Activity,
  Briefcase,
  HardHat,
  AlertTriangle,
  Share2,
  Maximize2,
  Minimize2,
  X,
  Settings,
  Check,
  MapPin,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  LucideIcon,
  Bell,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  hasBeenPromptedForNotifications,
  markNotificationPrompted,
  requestNotificationPermission,
  checkAndTriggerSevereAlert,
  sendTestNotification,
  isNeverAskNotifications,
  setNeverAskNotifications,
  isDailyAlertNudgeDismissed,
  dismissDailyAlertNudge,
} from '@/lib/notifications';
import { getByokHeaders } from '@/lib/byok';

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
  const [selectedModalAction, setSelectedModalAction] = useState<ActionItem | null>(null);
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

  // Full-screen desktop detection: activates when in true F11 / browser full screen on desktop (no tabs or taskbar)
  const [isDesktopFullScreen, setIsDesktopFullScreen] = useState(false);
  const [manualFullscreen, setManualFullscreen] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);
  const isFullScreenLayout =
    (isDesktopFullScreen || manualFullscreen) && isDesktopDevice;

  // Severe Air Quality Notifications: Daily In-Slot Nudge (harmonized with family warning banner)
  const [dailyAlertNudgeDismissed, setDailyAlertNudgeDismissed] = useState(true);

  const handleEnableNotifications = async () => {
    setDailyAlertNudgeDismissed(true);
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      sendTestNotification(profile.city.name);
    }
  };

  const handleNeverAskAgain = () => {
    setDailyAlertNudgeDismissed(true);
    setNeverAskNotifications(true);
  };

  const handleDismissDailyAlertNudge = () => {
    setDailyAlertNudgeDismissed(true);
    dismissDailyAlertNudge(todayDateStr);
  };

  // Background trigger when air quality crosses into Very Poor (>120) or Severe (>250)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (airData && airData.current && typeof airData.current.pm2_5 === 'number' && airData.current.pm2_5 > 120) {
      checkAndTriggerSevereAlert(airData.current.pm2_5, profile.city.name, currentBand.label);
    }
  }, [airData?.current?.pm2_5, profile.city.name, currentBand.label]);

  useEffect(() => {
    const checkFullScreen = () => {
      if (typeof window === 'undefined') return;
      const isDesktop = window.innerWidth >= 1024;
      setIsDesktopDevice(isDesktop);
      const isFsApi = Boolean(document.fullscreenElement);
      const isDisplayModeFs = window.matchMedia('(display-mode: fullscreen)').matches;
      // When in browser F11 fullscreen on Windows, innerHeight matches screen height within 12px (exclude automated test runners)
      const isWindowFs = Boolean(
        typeof navigator !== 'undefined' &&
        !navigator.webdriver &&
        window.screen &&
        window.screen.height > 0 &&
        window.innerHeight >= window.screen.height - 12
      );

      const isFs = isDesktop && (isFsApi || isDisplayModeFs || isWindowFs);
      setIsDesktopFullScreen(isFs);
      if (!isFs && !document.fullscreenElement) {
        setManualFullscreen(false);
      }
    };

    checkFullScreen();
    window.addEventListener('resize', checkFullScreen);
    document.addEventListener('fullscreenchange', checkFullScreen);
    const mq = window.matchMedia('(display-mode: fullscreen)');
    mq.addEventListener?.('change', checkFullScreen);

    return () => {
      window.removeEventListener('resize', checkFullScreen);
      document.removeEventListener('fullscreenchange', checkFullScreen);
      mq.removeEventListener?.('change', checkFullScreen);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && manualFullscreen) {
        setManualFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [manualFullscreen]);

  // Compact mode detection for small laptop screens or zoomed display on desktop
  useEffect(() => {
    const checkCompact = () => {
      if (typeof window === 'undefined') return;
      if (isFullScreenLayout) {
        setIsCompact(false);
        return;
      }
      const isDesktop = window.innerWidth >= 1024;
      const isConstrained = window.innerHeight < 640;
      setIsCompact(isDesktop && isConstrained);
    };

    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, [isFullScreenLayout]);

  // ResizeObserver on left column container to guarantee it never overflows without compacting
  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;
    const el = leftColRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (isFullScreenLayout) {
          setIsCompact(false);
          return;
        }
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
  }, [isFullScreenLayout]);

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

  const displayCityName = React.useMemo(() => {
    const raw = profile.city?.name || '';
    if (
      !raw ||
      raw.toLowerCase().includes('current location') ||
      raw.toLowerCase().includes('my current location') ||
      profile.city?.admin === 'Local GPS'
    ) {
      const n = findNearestCatalogCity(profile.city?.lat ?? 28.6139, profile.city?.lon ?? 77.2090);
      return n.admin && !n.name.toLowerCase().includes(n.admin.toLowerCase())
        ? `${n.name}, ${n.admin}`
        : n.name;
    }
    return raw;
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

  // Check if daily alert nudge in family warning slot should be visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isDismissedToday = isDailyAlertNudgeDismissed(todayDateStr);
      const neverAsk = isNeverAskNotifications();
      const perm = getNotificationPermission();
      if (isNotificationSupported() && perm !== 'granted' && !neverAsk && !isDismissedToday) {
        setDailyAlertNudgeDismissed(false);
      } else {
        setDailyAlertNudgeDismissed(true);
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // When Home tab opens or hourly data updates, always position 24h scale at 'Now' (scrollLeft: 0)
  useEffect(() => {
    const container = forecastScrollRef.current;
    if (!container) return;

    setForecastSliderIndex(0);
    container.scrollTo({
      left: 0,
      behavior: 'instant',
    });
    setCanScrollLeft(false);
    setCanScrollRight(container.scrollWidth > container.clientWidth + 5);
  }, [airData.hourly]);

  const handleScrollForecast = (direction: 'left' | 'right') => {
    const container = forecastScrollRef.current;
    if (!container) return;
    const scrollAmount = Math.max(180, Math.round(container.clientWidth * 0.6));
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const activeFamilyView = profile.activeFamilyFilter || 'whole_family';

  // Auto-scroll the active family tab into center view on mobile whenever activeFamilyView changes
  useEffect(() => {
    const container = tabListRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(`#family-tab-${activeFamilyView}`);
    if (!activeBtn) return;

    const timer = setTimeout(() => {
      const cRect = container.getBoundingClientRect();
      const bRect = activeBtn.getBoundingClientRect();
      if (bRect.left < cRect.left + 8 || bRect.right > cRect.right - 8) {
        const desiredLeft =
          activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, desiredLeft),
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeFamilyView, shouldReduceMotion]);

  const [forecastSliderIndex, setForecastSliderIndex] = useState(0);
  const isDraggingSliderRef = useRef(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const rafIdRef = useRef<number | null>(null);

  // Synchronize horizontal scroll container when slider changes
  const scrollToHourIndex = (idx: number, immediate: boolean = false) => {
    if (!forecastScrollRef.current) return;
    const container = forecastScrollRef.current;
    const total = airData.hourly.length;
    if (total === 0) return;

    const targetChild = container.children[idx] as HTMLElement | undefined;
    if (targetChild) {
      const targetLeft = targetChild.offsetLeft - container.offsetLeft - 16;
      if (immediate) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          container.scrollLeft = Math.max(0, targetLeft);
        });
      } else {
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth',
        });
      }
    } else {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = (idx / Math.max(1, total - 1)) * maxScroll;
      if (immediate) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          container.scrollLeft = targetScroll;
        });
      } else {
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        });
      }
    }
  };

  // Synchronize slider thumb and scroll arrows when user scrolls or swipes cards directly
  const handleForecastScroll = () => {
    if (!forecastScrollRef.current) return;
    const container = forecastScrollRef.current;

    // Update left/right scroll arrow enablement
    setCanScrollLeft(container.scrollLeft > 6);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 6);

    if (isDraggingSliderRef.current) return;
    const total = airData.hourly.length;
    if (total <= 1) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return;

    const ratio = Math.min(1, Math.max(0, container.scrollLeft / maxScroll));
    const closestIdx = Math.round(ratio * (total - 1));
    setForecastSliderIndex(closestIdx);
  };

  const scrollToNow = () => {
    if (!forecastScrollRef.current) return;
    const container = forecastScrollRef.current;
    container.scrollTo({
      left: 0,
      behavior: 'smooth',
    });
    setForecastSliderIndex(0);
    setTimeout(() => {
      setCanScrollLeft(false);
      setCanScrollRight(container.scrollWidth > container.clientWidth - 6);
    }, 320);
  };

  const scrollToBestHour = () => {
    if (!forecastScrollRef.current || !bestHourCardRef.current) return;
    const container = forecastScrollRef.current;
    const card = bestHourCardRef.current;
    const desiredLeft = card.offsetLeft - container.clientWidth / 2 + card.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, desiredLeft),
      behavior: 'smooth',
    });
    const bestIdx = airData.hourly.findIndex((h) => h.isBestHour);
    if (bestIdx !== -1) {
      setForecastSliderIndex(bestIdx);
    }
    setTimeout(() => {
      setCanScrollLeft(container.scrollLeft > 6);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 6);
    }, 320);
  };

  const topActions = getTop3Actions(profile, currentBand.key, activeFamilyView);
  const particleDensity = Math.min(7, Math.max(1.2, airData.current.pm2_5 / 35));
  const thinFactor = Math.min(0.75, (profile.checkedActions?.length || 0) * 0.18);

  const isPregnantSelected = profile.household?.members?.includes('pregnant') || false;
  const isAsthmaSelected =
    profile.household?.members?.includes('asthma_heart') ||
    (profile.household?.members as (FamilyMember | string)[])?.includes('asthma') ||
    profile.household?.respiratoryOrHeart === true ||
    false;

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
    icon: LucideIcon;
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
    ...(isAsthmaSelected
      ? [
          {
            id: 'asthma' as FamilyView,
            key: 'home.familyFilter.asthma',
            icon: Activity,
            shortEn: 'Asthma',
            shortHi: 'दमा',
            shortMr: 'दमा',
            shortBn: 'অ্যাজমা',
            fullLabelEn: 'Asthma / Heart',
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

  const getTabLabel = (tabId: FamilyView): string => {
    const filterKey = tabId === 'whole_family' ? 'all' : tabId === 'outdoor_worker' ? 'worker' : tabId;
    return (t.home.familyFilter as Record<string, string>)?.[filterKey] || tabId;
  };

  const getTabShortLabel = (tab: (typeof familyTabs)[0]): string => {
    const lang = profile.language;
    if (lang === 'hi') return tab.shortHi;
    if (lang === 'mr') return tab.shortMr;
    if (lang === 'bn') return tab.shortBn;
    if (lang === 'ta') {
      const taMap: Record<FamilyView, string> = {
        whole_family: 'குடும்பம்',
        child: 'குழந்தை',
        elderly: 'பெரியவர்',
        pregnant: 'கர்ப்பிணி',
        asthma: 'ஆஸ்துமா',
        outdoor_worker: 'பணியாளர்',
      };
      return taMap[tab.id] || tab.shortEn;
    }
    return tab.shortEn;
  };

  const handleFamilyChange = (view: FamilyView) => {
    updateProfile({ activeFamilyFilter: view });
    if (typeof window !== 'undefined') {
      localStorage.setItem('clearhale_family_view', view);
    }
    setSelectedModalAction(null);
    setIsGuidanceExpanded(false);

    if (rightColRef.current) {
      rightColRef.current.scrollTo({
        top: 0,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }

    const currentH = new Date().getHours();
    const isNightPeriod = currentH >= 0 && currentH < 6;
    const cacheKey = `${profile.city.name}_${currentBand.key}_${view}_${profile.language}_${isNightPeriod ? 'night' : 'day'}`;
    const instantFallback = getFallbackNext2Hours(
      currentBand.key,
      view,
      profile.language,
      profile,
      currentH
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

  // 3-second intro card whenever persona tab changes
  const [isDecisionTransitioning, setIsDecisionTransitioning] = useState(false);
  const decisionTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsDecisionTransitioning(true);
    if (decisionTransitionTimerRef.current) {
      clearTimeout(decisionTransitionTimerRef.current);
    }
    decisionTransitionTimerRef.current = setTimeout(() => {
      setIsDecisionTransitioning(false);
    }, 3000);

    return () => {
      if (decisionTransitionTimerRef.current) {
        clearTimeout(decisionTransitionTimerRef.current);
      }
    };
  }, [activeFamilyView]);

  const getNext2HoursIntro = (view: FamilyView, lang: string) => {
    const personaMap: Record<string, Record<FamilyView, string>> = {
      hi: {
        whole_family: 'पूरे परिवार के लिए',
        child: 'शिशु और बच्चों के लिए',
        elderly: 'बुजुर्गों के लिए',
        pregnant: 'गर्भवती माताओं के लिए',
        asthma: 'दमा और हृदय रोगियों के लिए',
        outdoor_worker: 'बाहर काम करने वालों के लिए',
      },
      mr: {
        whole_family: 'संपूर्ण कुटुंबासाठी',
        child: 'लहान मुलांसाठी',
        elderly: 'ज्येष्ठ नागरिकांसाठी',
        pregnant: 'गर्भवती मातांसाठी',
        asthma: 'दमा आणि हृदयविकार असणाऱ्यांसाठी',
        outdoor_worker: 'बाहेर काम करणाऱ्यांसाठी',
      },
      bn: {
        whole_family: 'পুরো পরিবারের জন্য',
        child: 'শিশু ও বাচ্চাদের জন্য',
        elderly: 'প্রবীণদের জন্য',
        pregnant: 'গর্ভবতী মায়েদের জন্য',
        asthma: 'অ্যাজমা ও হৃদরোগীদের জন্য',
        outdoor_worker: 'বাইরে কর্মরতদের জন্য',
      },
      ta: {
        whole_family: 'முழு குடும்பத்திற்கும்',
        child: 'குழந்தைகளுக்கான',
        elderly: 'முதியவர்களுக்கான',
        pregnant: 'கர்ப்பிணிப் பெண்களுக்கு',
        asthma: 'ஆஸ்துமா மற்றும் இதய நோயாளிகளுக்கு',
        outdoor_worker: 'வெளியில் வேலை செய்வோருக்கு',
      },
      te: {
        whole_family: 'మొత్తం కుటుంబం కోసం',
        child: 'పిల్లల కోసం',
        elderly: 'పెద్దల కోసం',
        pregnant: 'గర్భిణుల కోసం',
        asthma: 'ఆస్తమా మరియు గుండె రోగుల కోసం',
        outdoor_worker: 'బయట పనిచేసేవారి కోసం',
      },
      en: {
        whole_family: 'Whole Family',
        child: 'Baby & Kids',
        elderly: 'Elderly Members',
        pregnant: 'Expecting Mothers',
        asthma: 'Asthma & Heart Patients',
        outdoor_worker: 'Outdoor Workers',
      },
    };

    const personaName = personaMap[lang]?.[view] || personaMap.en[view] || 'Whole Family';
    const nowH = new Date().getHours();
    const isNightH = nowH >= 0 && nowH < 6;

    if (lang === 'hi') {
      return {
        title: isNightH
          ? `अगले 2 घंटे (रात का आराम: ${personaName})...`
          : `अगले 2 घंटे का निर्णय: ${personaName}...`,
        subtitle: isNightH
          ? 'हवा की गुणवत्ता के अनुसार सुकून भरी नींद की सलाह'
          : 'ताज़ा हवा की गुणवत्ता के अनुसार सुरक्षित सलाह तैयार हो रही है',
      };
    }
    if (lang === 'mr') {
      return {
        title: isNightH
          ? `पुढील २ तास (रात्रीची विश्रांती: ${personaName})...`
          : `पुढील २ तासांचा निर्णय: ${personaName}...`,
        subtitle: isNightH
          ? 'हवेच्या गुणवत्तेनुसार शांत झोपेचा सल्ला'
          : 'हवेच्या गुणवत्तेनुसार सुरक्षित सल्ला तयार होत आहे',
      };
    }
    return {
      title: isNightH
        ? `Next 2 hours (Night Rest for ${personaName})...`
        : `Next 2 hours decision for ${personaName}...`,
      subtitle: isNightH
        ? 'Restful sleep guidance for current air quality'
        : 'Matching guidance with current air quality',
    };
  };

  // Fetch or update Next 2 hours AI text whenever air data, persona, city, or language changes
  useEffect(() => {
    let isCancelled = false;
    const currentH = new Date().getHours();
    const isNightPeriod = currentH >= 0 && currentH < 6;
    const cacheKey = `${profile.city.name}_${currentBand.key}_${activeFamilyView}_${profile.language}_${isNightPeriod ? 'night' : 'day'}`;
    const instantFallback = getFallbackNext2Hours(
      currentBand.key,
      activeFamilyView,
      profile.language,
      profile,
      currentH
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
          headers: getByokHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            pm2_5: airData.current.pm2_5,
            aqiBand: currentBand.key,
            familyView: activeFamilyView,
            language: profile.language,
            city: profile.city.name,
            dataType: airData.dataType || (airData.current.isForecast ? 'estimate' : 'measured'),
            stationName: airData.station?.name || '',
            timestamp: airData.station?.measuredAtLocal || airData.current.time,
            hour: currentH,
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

        const trimmed = accumulated.trim();
        if (trimmed) {
          let finalText = trimmed;
          if (profile.language !== 'en') {
            const hasDelimiter = trimmed.includes('---EN---');
            const parts = trimmed.split('---EN---');
            const nativePart = parts[0]?.trim() || '';
            const enPart = parts[1]?.trim() || '';
            const isDangling = /[\s\u00A0](आणि|आणि\s*$|किंवा|व|तर|पण|और|एवं|तथा|and|or|but)$/i.test(nativePart);
            const isTruncated = !hasDelimiter || !enPart || nativePart.length < 15 || isDangling;

            if (isTruncated) {
              console.warn('[HomeScreen] 2-hour AI text was incomplete, resolving to verified rules baseline:', trimmed);
              finalText = instantFallback;
            }
          }
          if (!isCancelled) {
            setNext2HoursText(finalText);
            decisionCache.current[cacheKey] = finalText;
          }
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

  const renderForecastCard = () => (
    <SpotlightCard
      id="forecast-section"
      spotlightColor="rgba(45, 212, 191, 0.1)"
      className={`scroll-mt-4 bg-card rounded-card border border-card-border shadow-soft ${
        isFullScreenLayout ? 'p-4' : 'p-5'
      } min-w-0 max-w-full overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {t.home.forecast24h}
          </h2>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Current Time / Now Button */}
          <button
            type="button"
            onClick={scrollToNow}
            className="text-xs text-muted hover:text-teal-accent font-medium flex items-center gap-1.5 transition-colors cursor-pointer group"
            title="Scroll to current hour (Now)"
          >
            <Clock className="w-3.5 h-3.5 text-teal-accent group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span>
              Current: <span className="underline underline-offset-2">Now</span>
            </span>
          </button>

          <span className="w-1 h-1 rounded-full bg-card-border" />

          {/* Cleanest Window Button */}
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
      </div>

      {/* Horizontal Scroll Strip with Left (<) and Right (>) Navigation Buttons */}
      <div className="relative flex items-center gap-1.5 sm:gap-2">
        {/* Left Arrow Button (<) */}
        <button
          type="button"
          onClick={() => handleScrollForecast('left')}
          disabled={!canScrollLeft}
          className={`shrink-0 w-8 h-8 rounded-full border border-card-border flex items-center justify-center transition-all ${
            canScrollLeft
              ? 'bg-card text-foreground hover:bg-card-subtle hover:border-teal-accent/50 hover:text-teal-accent shadow-xs cursor-pointer active:scale-95'
              : 'bg-card/40 text-muted/30 border-card-border/40 cursor-not-allowed opacity-40'
          }`}
          title="Scroll 24-hour scale left"
          aria-label="Scroll 24-hour scale left"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
        </button>

        {/* Scrollable Cards Container (Touch-swipe enabled on mobile & trackpads) */}
        <div
          ref={forecastScrollRef}
          onScroll={handleForecastScroll}
          className="flex-1 min-w-0 flex gap-2.5 overflow-x-auto pt-1.5 pb-2.5 px-1 no-scrollbar touch-pan-x overscroll-x-contain select-none scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {airData.hourly.map((h, i) => {
          const isSelected = i === forecastSliderIndex;
          const displayPM = i === 0 ? airData.current.pm2_5 : h.pm2_5;
          return (
            <div
              key={i}
              ref={h.isBestHour ? bestHourCardRef : undefined}
              onClick={() => {
                setForecastSliderIndex(i);
                scrollToHourIndex(i, false);
              }}
              className={`shrink-0 w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between min-h-[108px] ${
                h.isBestHour
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500'
                  : isSelected
                  ? 'border-teal-accent bg-teal-accent/10 shadow-sm ring-2 ring-teal-accent'
                  : 'border-card-border bg-card-subtle/50 hover:bg-card-subtle'
              }`}
              title={`Hour ${h.hour}: ${displayPM} µg/m³`}
            >
              <div className="text-[11px] font-medium text-muted flex items-center justify-center gap-1">
                <span>{h.hour}</span>
                {i === 0 ? (
                  <span className="text-[9px] font-semibold text-teal-accent bg-teal-accent/10 px-1 py-0.2 rounded">
                    Now
                  </span>
                ) : h.hour === '00:00' ? (
                  <span className="text-[9px] font-semibold text-muted bg-card-border/60 px-1 py-0.2 rounded">
                    +1d
                  </span>
                ) : null}
              </div>
              <div className="text-base font-semibold text-foreground my-1">
                {displayPM}
              </div>
              <div className="text-[10px] text-muted">µg/m³</div>
              {h.isBestHour ? (
                <div className="mt-1 text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">
                  Best air
                </div>
              ) : isSelected && i !== 0 ? (
                <div className="mt-1 text-[9px] font-semibold text-teal-accent bg-teal-accent/10 px-1 py-0.5 rounded">
                  Selected
                </div>
              ) : (
                <div className="mt-1 text-[9px] h-[18px] opacity-0 pointer-events-none select-none" aria-hidden="true">
                  &nbsp;
                </div>
              )}
            </div>
          );
        })}
        </div>

        {/* Right Arrow Button (>) */}
        <button
          type="button"
          onClick={() => handleScrollForecast('right')}
          disabled={!canScrollRight}
          className={`shrink-0 w-8 h-8 rounded-full border border-card-border flex items-center justify-center transition-all ${
            canScrollRight
              ? 'bg-card text-foreground hover:bg-card-subtle hover:border-teal-accent/50 hover:text-teal-accent shadow-xs cursor-pointer active:scale-95'
              : 'bg-card/40 text-muted/30 border-card-border/40 cursor-not-allowed opacity-40'
          }`}
          title="Scroll 24-hour scale right"
          aria-label="Scroll 24-hour scale right"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
        </button>
      </div>
    </SpotlightCard>
  );

  return (
    <div className="w-full space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto lg:space-y-0 lg:pb-0 lg:max-w-none lg:h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:grid lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:overflow-hidden">
      {/* Row 1: Top Bar (fixed on desktop, never scrolls, with page background) */}
      <header className="w-full bg-background relative z-30 pt-2 lg:pt-6 lg:pb-3.5 px-0 lg:px-8 shrink-0">
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex items-center justify-between">
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
                {displayCityName}
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
          {/* Fullscreen Desktop Toggle Button (Strictly Desktop only: completely hidden on mobile) */}
          {isDesktopDevice && (
            <button
              type="button"
              onClick={() => {
                if (typeof document !== 'undefined') {
                  if (!document.fullscreenElement && !manualFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    setManualFullscreen(true);
                  } else {
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
                    setManualFullscreen(false);
                  }
                }
              }}
              className="hidden lg:flex min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-full border border-card-border bg-card text-xs font-semibold text-foreground hover:border-teal-accent/40 shadow-soft transition-colors items-center gap-1 sm:gap-1.5 cursor-pointer"
              title={isFullScreenLayout ? 'Exit Fullscreen' : 'Fullscreen View (F11)'}
              aria-label={isFullScreenLayout ? 'Exit Fullscreen' : 'Fullscreen View (F11)'}
            >
              {isFullScreenLayout ? (
                <Minimize2 className="w-3.5 h-3.5 text-teal-accent" strokeWidth={1.75} />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-teal-accent" strokeWidth={1.75} />
              )}
              <span>{isFullScreenLayout ? 'Window' : 'Fullscreen'}</span>
            </button>
          )}

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

      {/* Row 2: Family Tabs (fixed on desktop, never scrolls, with page background) */}
      <div className="w-full bg-background relative z-10 py-0 lg:py-2.5 px-0 lg:px-8 shrink-0">
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto space-y-2">
          {/* Family View Segmented Switcher (Mobile: Dynamic pill switcher with smooth expansion & scrolling, Desktop: Full pills) */}
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Family filter perspective"
            className={`bg-card-subtle p-1 rounded-2xl sm:rounded-card relative select-none w-full border border-card-border/60 ${
              familyTabs.length >= 5
                ? 'flex items-stretch gap-1 overflow-x-auto scrollbar-none [scrollbar-width:none] [-webkit-overflow-scrolling:touch]'
                : 'grid grid-cols-4 sm:flex sm:gap-1'
            }`}
          >
            {familyTabs.map((tab, idx) => {
              const isActive = activeFamilyView === tab.id;
              const hasManyTabs = familyTabs.length >= 5;
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
                  className={`relative z-10 min-h-[44px] sm:min-h-[46px] py-1.5 px-2 rounded-xl transition-all duration-300 ease-out flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
                    hasManyTabs
                      ? isActive
                        ? 'flex-[1.6] min-w-[96px] sm:min-w-[120px] lg:flex-[1.3] text-teal-accent font-semibold shadow-2xs'
                        : 'flex-none w-10 sm:w-11 lg:flex-1 lg:w-auto text-muted hover:text-foreground opacity-80 hover:opacity-100'
                      : 'flex-1 sm:px-3.5 ' + (isActive ? 'text-teal-accent font-semibold' : 'text-muted hover:text-foreground')
                  } ${
                    isActive && profile.accentMode === 'mono' ? '!text-neutral-50' : ''
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
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  {/* Icon */}
                  <tab.icon
                    className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-300 ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                  />

                  {/* Label: Always visible when active; on desktop (lg:), visible on all tabs */}
                  <div
                    className={`relative z-10 ml-1.5 flex flex-col items-start leading-none min-w-0 ${
                      hasManyTabs
                        ? isActive
                          ? 'flex'
                          : 'hidden lg:flex'
                        : 'flex'
                    }`}
                  >
                    <span className={`text-xs tracking-tight whitespace-nowrap truncate max-w-full ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {/* On desktop (lg:), show full localized label; on mobile/tablet, show concise label */}
                      <span className="hidden lg:inline">{getTabLabel(tab.id)}</span>
                      <span className="lg:hidden">{getTabShortLabel(tab)}</span>
                    </span>
                    {profile.language !== 'en' && isActive && (
                      <span className="text-[7.5px] opacity-75 font-normal leading-none mt-0.5 uppercase tracking-wider truncate max-w-full lg:hidden">
                        {tab.shortEn}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

      {/* Daily Dismissible Nudges Slot: Strictly ONE banner on screen at a time */}
      {!warnNudgeDismissed &&
        (currentBand.key === 'poor' ||
          currentBand.key === 'very_poor' ||
          currentBand.key === 'severe') ? (
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
        ) : (!dailyAlertNudgeDismissed &&
             !isNeverAskNotifications() &&
             getNotificationPermission() !== 'granted') ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/25 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-accent/20 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-teal-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  Turn on Severe Air Alerts?
                </p>
                <p className="text-xs text-muted truncate">
                  Get warned if {profile.city.name} air drops to Very Poor or Severe.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 rounded-xl bg-teal-accent hover:bg-teal-hover text-white text-xs font-semibold shadow-soft transition-colors cursor-pointer"
              >
                Enable
              </button>
              <button
                type="button"
                onClick={handleNeverAskAgain}
                className="hidden sm:inline-block text-[11px] text-muted hover:text-foreground hover:underline px-1 cursor-pointer"
                title="Don't ask again on this device"
              >
                Don't ask again
              </button>
              <button
                type="button"
                onClick={handleDismissDailyAlertNudge}
                aria-label="Dismiss notification alert prompt for today"
                className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ) : null}

        </div>
      </div>

      {/* Row 3: Two-Column Body (Left ring card fixed in view, Right column scrolls) */}
      <div className={`w-full min-h-0 h-full ${isFullScreenLayout ? 'overflow-y-auto lg:overflow-visible' : 'overflow-hidden'} px-0 lg:px-8 pt-0 lg:pt-3 pb-0`}>
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto h-full min-h-0 transition-all">
          <div className={`grid grid-cols-1 lg:grid-cols-12 ${isFullScreenLayout ? 'gap-4 lg:items-stretch' : 'gap-6 items-start'} h-full min-h-0 min-w-0 max-w-full`}>
            {/* Left Column: Center Breathing Ring & Air Severity Card */}
            <div
              ref={leftColRef}
              onWheel={handleLeftCardWheel}
              className={`lg:col-span-5 ${isFullScreenLayout ? 'self-stretch flex flex-col' : 'h-full min-h-0 lg:overflow-y-auto lg:overscroll-contain flex flex-col'} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
            >
              <section className={`relative overflow-hidden bg-card rounded-card border border-card-border shadow-soft flex flex-col items-center text-center transition-all ${isFullScreenLayout ? 'flex-1 w-full justify-between p-5' : isCompact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'}`}>
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
                size={isFullScreenLayout ? 215 : isCompact ? 190 : 240}
                strokeWidth={isFullScreenLayout ? 4 : 3.5}
                mode="ambient"
              >
                <div className="flex flex-col items-center relative z-10">
                  <span className={`${!isFullScreenLayout && isCompact ? 'text-[11px]' : 'text-xs'} uppercase tracking-wider text-muted font-medium`}>
                    <Term k="pm25">
                      <Bi k="home.pm25Level" en="PM2.5 Level" />
                    </Term>
                  </span>
                  <div className={`${!isFullScreenLayout && isCompact ? 'text-4xl my-0' : 'text-5xl my-0.5'} font-semibold tracking-tight text-foreground tabular-nums`}>
                    <CountUp to={airData.current.pm2_5} duration={1.2} />
                  </div>
                  <span className={`${!isFullScreenLayout && isCompact ? 'text-[11px]' : 'text-xs'} text-muted`}>
                    <Term k="ug_m3">µg/m³</Term>
                  </span>

                  {/* AQI Band Chip: strictly centered and enclosed inside the ring */}
                  <Term k="bands" noUnderline className={`${!isFullScreenLayout && isCompact ? 'mt-1.5' : 'mt-2'} inline-block`}>
                    <div
                      className={`px-3.5 py-1 rounded-full ${!isFullScreenLayout && isCompact ? 'text-[11px]' : 'text-xs'} font-semibold border shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${currentBand.bgColor}`}
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
                  className={`${!isFullScreenLayout && isCompact ? 'mt-1.5' : 'mt-2.5'} flex items-center justify-center gap-1.5`}
                  aria-busy="true"
                  aria-label="Loading air quality source"
                >
                  <div className="h-3.5 w-48 sm:w-56 rounded-md bg-card-border/40 animate-pulse" />
                  <div className="w-3.5 h-3.5 rounded-full bg-card-border/40 animate-pulse" />
                </div>
              ) : (
                <div className={`${!isFullScreenLayout && isCompact ? 'mt-1.5 text-[11px]' : 'mt-2.5 text-xs'} flex items-center justify-center gap-1.5 text-muted max-w-sm sm:max-w-md mx-auto text-center px-2`}>
                  <span className="line-clamp-2 leading-snug sm:leading-normal">
                    {airData.dataType === 'measured' && airData.station
                      ? airData.station.isAverage && (airData.station.stationCount ?? 1) > 1
                        ? `City average of ${airData.station.stationCount} stations (${airData.station.name}), ${
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
                        : `Measured at ${airData.station.name}, ${airData.station.distanceKm} km away, ${
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
                isFullScreenLayout
                  ? 'mt-2 space-y-1.5'
                  : isCompact
                  ? 'mt-2 space-y-1.5'
                  : 'mt-4 sm:mt-5 space-y-2'
              } max-w-lg text-center w-full`}
            >
              <p className={`${!isFullScreenLayout && isCompact ? 'text-xs sm:text-sm leading-snug' : 'text-sm sm:text-base leading-relaxed'} font-medium text-foreground`}>
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
                          : activeFamilyView === 'asthma'
                          ? 'home.asthmaVuln'
                          : activeFamilyView === 'outdoor_worker'
                          ? 'home.workerVuln'
                          : 'home.familyVuln'
                      }
                      layout="inline"
                    />
                  </span>
                  <span className={!isFullScreenLayout && isCompact && !isGuidanceExpanded ? 'line-clamp-3 inline' : 'inline'}>
                    {getBandPersonaAdvice(
                      currentBand.key,
                      activeFamilyView,
                      profile.language
                    )}
                  </span>
                  {!isFullScreenLayout && isCompact && (
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
            <div className={`${isFullScreenLayout ? 'mt-2.5 pt-2.5 text-xs' : isCompact ? 'mt-2 pt-2 text-[11px]' : 'mt-4 pt-4 sm:mt-5 sm:pt-5 text-xs'} flex items-center justify-center gap-4 text-muted border-t border-card-border/60 w-full max-w-xs relative z-10 tabular-nums`}>
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
              className={`min-w-0 max-w-full lg:col-span-7 ${
                isFullScreenLayout
                  ? 'space-y-3 lg:space-y-3 h-auto pb-0 self-stretch'
                  : 'space-y-4 lg:space-y-4 h-full min-h-0 lg:overflow-y-auto lg:overscroll-contain pb-8 lg:pb-32'
              } lg:pr-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/70 focus-visible:ring-offset-2 rounded-2xl desktop-scroll-slim`}
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
            {loadingDecision && !isDecisionTransitioning && (
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
          {isDecisionTransitioning ? (
            <motion.div
              key={`intro-${activeFamilyView}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsDecisionTransitioning(false)}
              className="py-3 px-1 flex items-center justify-between gap-3 cursor-pointer group"
              title="Click to view full decision immediately"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-accent/15 border border-teal-accent/30 flex items-center justify-center text-teal-accent shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {activeFamilyView === 'child' ? (
                    <Baby className="w-5 h-5" strokeWidth={1.75} />
                  ) : activeFamilyView === 'elderly' ? (
                    <HeartPulse className="w-5 h-5" strokeWidth={1.75} />
                  ) : activeFamilyView === 'pregnant' ? (
                    <Heart className="w-5 h-5" strokeWidth={1.75} />
                  ) : activeFamilyView === 'asthma' ? (
                    <Activity className="w-5 h-5" strokeWidth={1.75} />
                  ) : activeFamilyView === 'outdoor_worker' ? (
                    <HardHat className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Users className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                    <span className="truncate">{getNext2HoursIntro(activeFamilyView, profile.language).title}</span>
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-accent" />
                    </span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5 truncate font-normal">
                    {getNext2HoursIntro(activeFamilyView, profile.language).subtitle}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-muted font-medium bg-card-subtle px-2 py-0.5 rounded-full border border-card-border shrink-0 hidden sm:inline-flex">
                3s preview
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={activeFamilyView + '-' + (next2HoursText || '')}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {(() => {
                const fallbackText = getFallbackNext2Hours(
                  currentBand.key,
                  activeFamilyView,
                  profile.language,
                  profile,
                  new Date().getHours()
                );
                let fullText = next2HoursText || fallbackText;

                // Guard against partial or truncated regional responses
                if (profile.language !== 'en') {
                  const rawParts = fullText.split('---EN---');
                  const rawNative = rawParts[0]?.trim() || '';
                  const rawEn = rawParts[1]?.trim() || '';
                  const isDangling = /[\s\u00A0](आणि|आणि\s*$|किंवा|व|तर|पण|और|एवं|तथा|and|or|but)$/i.test(rawNative);
                  if (!rawEn || isDangling || rawNative.length < 15) {
                    fullText = fallbackText;
                  }
                }

                const isCurrentSpeaking = activeSpeakingId === 'next_2_hours';
                const parts = fullText.split('---EN---');
                const nativePart = parts[0]?.trim();
                const enPart = parts[1]?.trim();

                if (enPart && profile.language !== 'en') {
                  return (
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg text-foreground font-semibold sm:font-medium leading-relaxed">
                        {renderHighlightedSentences(
                          nativePart,
                          isCurrentSpeaking,
                          currentSentenceIndex,
                          currentSentences
                        )}
                      </p>
                      <div className="border-t border-teal-accent/20 pt-1.5">
                        <p className="text-xs sm:text-sm text-muted leading-relaxed font-normal">
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
                  <p className="text-base sm:text-lg text-foreground font-semibold sm:font-medium leading-relaxed">
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
          )}
        </AnimatePresence>
      </SpotlightCard>

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
                : activeFamilyView === 'asthma'
                ? (profile.language === 'mr' ? 'दमा व हृदयविकारासाठी विशेष' : profile.language === 'hi' ? 'दमा व हृदय रोगियों के लिए' : 'Ranked for Asthma & Heart')
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
              const { enTitle, nativeTitle } = getActionBi(action.id, action.title, currentBand.key);

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
                    className={`rounded-card border transition-all shadow-soft overflow-hidden group cursor-pointer ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-card-border hover:border-teal-accent/40 hover:shadow-md'
                    }`}
                  >
                  <div
                    onClick={() => setSelectedModalAction(action)}
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
                      className="w-4 h-4 text-muted/70 group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all mt-1"
                      strokeWidth={1.75}
                    />
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>

      {/* 24-Hour Forecast Strip (Renders in Right Column in normal desktop / mobile mode) */}
      {!isFullScreenLayout && renderForecastCard()}
    </div>

    {/* In Full-Screen Desktop Mode, 24-Hour Forecast sits at the bottom spanning across BOTH cards */}
    {isFullScreenLayout && (
      <div className="hidden lg:block lg:col-span-12 w-full pt-1">
        {renderForecastCard()}
      </div>
    )}
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
                          <span className="text-muted">
                            {airData.station.isAverage && (airData.station.stationCount ?? 1) > 1
                              ? 'Consensus Mode:'
                              : 'Station Name:'}
                          </span>
                          <span className="font-semibold text-foreground text-right truncate max-w-[200px]">
                            {airData.station.isAverage && (airData.station.stationCount ?? 1) > 1
                              ? `City-wide Inverse-Distance Average (${airData.station.stationCount} Stations)`
                              : airData.station.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted">
                            {airData.station.isAverage && (airData.station.stationCount ?? 1) > 1
                              ? 'Closest Station:'
                              : 'Distance to Location:'}
                          </span>
                          <span className="font-medium text-foreground">
                            {airData.station.isAverage && (airData.station.stationCount ?? 1) > 1
                              ? `${airData.station.name} (${airData.station.distanceKm} km away)`
                              : `${airData.station.distanceKm} km away`}
                          </span>
                        </div>
                        {/* Area Reporting Stations Breakdown */}
                        {airData.station.nearbyStations && airData.station.nearbyStations.length > 1 && (
                          <div className="mt-2 pt-2 border-t border-card-border/60">
                            <div className="text-[11px] text-muted mb-1.5 font-medium">Reporting Stations in City:</div>
                            <div className="space-y-1">
                              {airData.station.nearbyStations.map((st, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px]">
                                  <span className="text-foreground/80 truncate max-w-[180px]">
                                    {st.name.split(',')[0]} ({st.distanceKm} km)
                                  </span>
                                  <span className="font-semibold text-foreground">{st.pm2_5} µg/m³</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted">Data Provider:</span>
                          <span className="font-medium text-foreground text-right">
                            {airData.station.provider} (OpenAQ v3)
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

      {/* Action Detail Pop-up Modal */}
      <ActionDetailModal
        action={selectedModalAction}
        isOpen={Boolean(selectedModalAction)}
        onClose={() => setSelectedModalAction(null)}
        isChecked={selectedModalAction ? (profile.checkedActions?.includes(selectedModalAction.id) || false) : false}
        onToggleCheck={handleActionCheck}
      />
    </div>
  );
}
