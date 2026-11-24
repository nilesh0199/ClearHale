'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp, AppTab } from '@/context/AppContext';
import { Bi } from './Bi';
import { ClearhaleLockup } from './brand/ClearhaleLockup';
import { HomeScreen } from './screens/HomeScreen';
import { PlanScreen } from './screens/PlanScreen';
import { AskScreen } from './screens/AskScreen';
import { CareScreen } from './screens/CareScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { WelcomeStep } from './onboarding/WelcomeStep';
import { ThemeStep } from './onboarding/ThemeStep';
import { LanguageStep } from './onboarding/LanguageStep';
import { LocationStep } from './onboarding/LocationStep';
import { HouseholdStep } from './onboarding/HouseholdStep';
import { BuildingPlanStep } from './onboarding/BuildingPlanStep';
import { IntakeChoiceStep } from './onboarding/IntakeChoiceStep';
import { IntakeChatScreen } from './intake/IntakeChatScreen';
import { findNearestCatalogCity } from '@/lib/citiesData';
import {
  Home,
  ClipboardList,
  MessageSquare,
  BookOpen,
  Settings,
  Download,
  Wind,
  LucideIcon,
} from 'lucide-react';

export function AppLayout() {
  const {
    activeTab,
    setActiveTab,
    onboardingStep,
    isIntakeChatOpen,
    closeChatIntake,
    profile,
    airData,
    currentBand,
    isInstallable,
    triggerInstall,
    t,
  } = useApp();

  const navigationItems: { id: AppTab; key: string; enShort: string; icon: LucideIcon }[] = [
    { id: 'home', key: 'tabs.home', enShort: 'Home', icon: Home },
    { id: 'plan', key: 'tabs.plan', enShort: 'Plan', icon: ClipboardList },
    { id: 'ask', key: 'tabs.ask', enShort: 'Ask', icon: MessageSquare },
    { id: 'care', key: 'tabs.care', enShort: 'Care', icon: BookOpen },
    { id: 'profile', key: 'tabs.profile', enShort: 'Settings', icon: Settings },
  ];

  // Stable indicator refs & styles (immune to rapid clicks and page scroll jumps)
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const desktopBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [desktopPill, setDesktopPill] = useState<{ top: number; height: number } | null>(null);

  const mobileBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mobilePill, setMobilePill] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [showDesktopSiteTip, setShowDesktopSiteTip] = useState(false);

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

  // Detect if mobile browser has "Desktop site" toggled on (forces innerWidth to ~980px while physical screen.width is ~360-412px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkDesktopSite = () => {
      const isDesktopModeOnPhone =
        window.innerWidth > 600 &&
        window.screen.width > 0 &&
        window.innerWidth > window.screen.width + 120 &&
        (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
      setShowDesktopSiteTip(isDesktopModeOnPhone);
    };
    checkDesktopSite();
    window.addEventListener('resize', checkDesktopSite);
    return () => window.removeEventListener('resize', checkDesktopSite);
  }, []);

  // Disable automatic browser scroll restoration for seamless single-page tab transitions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Reset scroll to top whenever active tab changes
  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0 });
      if (typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };

    resetScroll();
    // Re-verify on next animation frame and after mount in case child components calculate height
    const rafId = requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [activeTab]);

  useEffect(() => {
    const updatePills = () => {
      const dBtn = desktopBtnRefs.current[activeTab];
      if (dBtn) {
        setDesktopPill({
          top: dBtn.offsetTop,
          height: dBtn.offsetHeight,
        });
      }
      const mBtn = mobileBtnRefs.current[activeTab];
      if (mBtn) {
        setMobilePill({
          left: mBtn.offsetLeft + 2,
          top: mBtn.offsetTop + 2,
          width: mBtn.offsetWidth - 4,
          height: mBtn.offsetHeight - 4,
        });
      }
    };

    updatePills();
    window.addEventListener('resize', updatePills);
    return () => window.removeEventListener('resize', updatePills);
  }, [activeTab]);

  // Isolate desktop sidebar scrolling: mouse scroll over sidebar must not scroll main area or window
  useEffect(() => {
    const sidebar = desktopSidebarRef.current;
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      const hasOverflow = sidebar.scrollHeight > sidebar.clientHeight;
      if (hasOverflow) {
        const isAtTop = sidebar.scrollTop <= 0 && e.deltaY < 0;
        const isAtBottom =
          sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 1 && e.deltaY > 0;
        if (isAtTop || isAtBottom) {
          e.preventDefault();
        }
      } else {
        // When sidebar fits in viewport, completely prevent wheel events from scrolling window/main
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const hasOverflow = sidebar.scrollHeight > sidebar.clientHeight;
      if (!hasOverflow) {
        e.preventDefault();
      }
    };

    sidebar.addEventListener('wheel', handleWheel, { passive: false });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      sidebar.removeEventListener('wheel', handleWheel);
      sidebar.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // When in the Ask chat tab or desktop Home screen, prevent the window / document from scrolling
  useEffect(() => {
    // Only lock body/document scroll when onboarding is complete and intake modal is closed
    if (onboardingStep !== 'complete' || isIntakeChatOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    if (activeTab === 'ask') {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }

    if (activeTab === 'home' && typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          window.scrollTo(0, 0);
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [activeTab, onboardingStep, isIntakeChatOpen]);

  // Handle Onboarding Steps (wrapped in a dedicated smooth scroll container for any screen height)
  if (onboardingStep !== 'complete') {
    return (
      <div className="h-screen h-[100dvh] max-h-screen w-full bg-background text-foreground overflow-y-auto overscroll-contain">
        {showDesktopSiteTip && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-semibold">📱 'Desktop Site' Mode Detected:</span>
              <span>For normal full-size mobile layout, uncheck <strong>'Desktop site'</strong> in your browser menu (⋮).</span>
            </div>
            <button
              onClick={() => setShowDesktopSiteTip(false)}
              className="p-1 rounded text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 text-xs shrink-0 cursor-pointer"
              aria-label="Dismiss desktop mode tip"
            >
              ✕
            </button>
          </div>
        )}
        {onboardingStep === 'welcome' && <WelcomeStep />}
        {onboardingStep === 'theme' && <ThemeStep />}
        {onboardingStep === 'language' && <LanguageStep />}
        {onboardingStep === 'location' && <LocationStep />}
        {onboardingStep === 'intake-choice' && <IntakeChoiceStep />}
        {onboardingStep === 'intake-chat' && <IntakeChatScreen mode="onboarding" />}
        {onboardingStep === 'household' && <HouseholdStep />}
        {onboardingStep === 'building' && <BuildingPlanStep />}
      </div>
    );
  }

  // Modal/Full-screen Intake from Settings/Profile
  if (isIntakeChatOpen) {
    return <IntakeChatScreen mode="settings" onClose={closeChatIntake} />;
  }

  return (
    <div
      className={`bg-background text-foreground flex flex-col lg:flex-row antialiased relative lg:h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden ${
        activeTab === 'ask'
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {showDesktopSiteTip && (
        <div className="lg:hidden bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-2 sticky top-0 z-50 backdrop-blur-md w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold shrink-0">📱 'Desktop Site' Detected:</span>
            <span className="truncate">For full-size mobile view, uncheck <strong>'Desktop site'</strong> in browser menu (⋮).</span>
          </div>
          <button
            onClick={() => setShowDesktopSiteTip(false)}
            className="p-1 rounded text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 text-xs shrink-0 cursor-pointer"
            aria-label="Dismiss desktop mode tip"
          >
            ✕
          </button>
        </div>
      )}
      <a
        href="#recommendations-container"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-accent focus:text-white focus:rounded-xl focus:shadow-float focus:outline-none"
      >
        Skip to recommendations
      </a>
      {/* ================= DESKTOP SIDEBAR (1024px and up) ================= */}
      <aside
        ref={desktopSidebarRef}
        className="hidden lg:flex flex-col justify-between w-64 bg-card border-r border-card-border p-6 shrink-0 h-full max-h-screen overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none z-30"
      >
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center">
            <ClearhaleLockup size={38} subtitle="Breathe clearer" />
          </div>

          {/* Quick City Status Badge in Sidebar */}
          <div className="mt-6 p-3 rounded-card bg-card-subtle border border-card-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate max-w-[120px]">
                {displayCityName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${currentBand.bgColor}`}
              >
                {currentBand.label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-foreground">
                {airData.current.pm2_5}
              </span>
              <span className="text-xs text-muted">µg/m³ PM2.5</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="mt-6 space-y-1 relative" aria-label="Desktop Navigation">
            {/* Single persistent sliding indicator: locally bounded inside nav, cannot fly offscreen or glitch */}
            {desktopPill && (
              <motion.div
                aria-hidden="true"
                className={`absolute left-0 right-0 rounded-card pointer-events-none ${
                  profile.accentMode === 'mono'
                    ? 'bg-neutral-900 border border-neutral-800 shadow-sm'
                    : 'bg-teal-light border border-teal-accent/20'
                }`}
                initial={false}
                animate={{
                  top: desktopPill.top,
                  height: desktopPill.height,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}

            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab={item.id}
                  ref={(el) => {
                    desktopBtnRefs.current[item.id] = el;
                  }}
                  onClick={() => {
                    if (activeTab === item.id) {
                      if (mainRef.current) {
                        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      if (mainRef.current) {
                        mainRef.current.scrollTo({ top: 0 });
                      }
                      window.scrollTo({ top: 0 });
                      setActiveTab(item.id);
                    }
                  }}
                  className={`relative w-full min-h-[44px] px-3.5 py-2.5 rounded-card flex items-center gap-3 text-sm font-medium transition-colors ${
                    isActive
                      ? profile.accentMode === 'mono'
                        ? 'text-neutral-50 font-semibold'
                        : 'text-teal-accent font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-card-subtle'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0 relative z-10" strokeWidth={1.75} />
                  <div className="relative z-10">
                    <Bi k={item.key} layout="desktop-nav" />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-6 border-t border-card-border">
          {isInstallable && (
            <button
              onClick={triggerInstall}
              className="w-full min-h-[44px] px-3 py-2 rounded-card bg-teal-light border border-teal-accent/20 text-teal-accent text-xs font-semibold hover:bg-teal-light/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Install Clearhale App</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main
        ref={mainRef}
        className={`flex-1 min-w-0 ${
          activeTab === 'ask'
            ? 'h-[100dvh] max-h-[100dvh] flex flex-col p-3 sm:p-4 pb-[76px] sm:pb-[80px] lg:p-6 lg:pb-6 overflow-hidden'
            : activeTab === 'home'
            ? 'p-4 sm:p-6 lg:p-0 lg:h-full lg:overflow-hidden'
            : 'p-4 sm:p-6 lg:p-8 lg:h-full lg:overflow-y-auto lg:overscroll-contain desktop-scroll-slim'
        }`}
      >
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'plan' && <PlanScreen />}
        {activeTab === 'ask' && (
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0 h-full">
            <AskScreen />
          </div>
        )}
        {(activeTab === 'care' || activeTab === 'learn') && <CareScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* ================= MOBILE BOTTOM TAB BAR (<1024px) ================= */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-card-border z-40 px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-soft"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* Single persistent sliding indicator on mobile */}
          {mobilePill && (
            <motion.div
              aria-hidden="true"
              className={`absolute rounded-xl pointer-events-none ${
                profile.accentMode === 'mono'
                  ? 'bg-neutral-900 border border-neutral-800 shadow-sm'
                  : 'bg-teal-light/80 dark:bg-teal-950/60 border border-teal-accent/25'
              }`}
              initial={false}
              animate={{
                left: mobilePill.left,
                top: mobilePill.top,
                width: mobilePill.width,
                height: mobilePill.height,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            />
          )}

          {navigationItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-tab={item.id}
                ref={(el) => {
                  mobileBtnRefs.current[item.id] = el;
                }}
                onClick={() => {
                  if (activeTab === item.id) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 0 });
                    setActiveTab(item.id);
                  }
                }}
                className={`relative min-h-[48px] min-w-[56px] flex flex-col items-center justify-center px-1.5 py-1 rounded-xl transition-colors cursor-pointer ${
                  isActive
                    ? profile.accentMode === 'mono'
                      ? 'text-neutral-50 font-semibold'
                      : 'text-teal-accent font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 relative z-10" strokeWidth={1.75} />
                <span className="text-[10px] font-medium leading-none mt-1 relative z-10">
                  {item.enShort}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
