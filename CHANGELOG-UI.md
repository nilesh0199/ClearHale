# Clearhale UI v2 Changelog & Upgrade Guide

This document records the human-designed, premium interface overhaul implemented in `clearhale-ui-v2`, inspired by **React Bits** (`reactbits.dev`) and **Motion** (`motion.dev`), preserving 100% of the underlying science, rules engines, bilingual translations, term chips, and accessibility.

---

## 1. Design Direction & Core Philosophy

- **Restrained Health Aesthetics**: Shifted away from generic "AI SaaS" templates (which typically feature purple/blue neon glows, glassmorphism overload, and decorative gradient spheres) toward a calming, medical-grade palette: deep teal (`#0D5C52`), fresh mint (`#10B981` / `#4FAE8F`), subtle cream cards (`#FAF8F5`), and dark slate.
- **Data-Driven Environmental Haze**: Background ambient haze particle density dynamically maps to real-time outdoor PM2.5 severity (clear air = sparse, severe = dense), and visibly thins out as users check off actions or simulate indoor mitigation.
- **Consistent Desktop Spotlight**: Interactive cards utilize desktop mouse-tracked radial spotlights (`SpotlightCard`) with subdued teal highlights that vanish on mobile touchscreens to maintain high-performance scrolling.
- **Micro-Spring Navigation**: Segmented controls (Care tabs, Family perspectives, Category chips, Desktop sidebar, Mobile bottom tab bar) use Framer Motion `layoutId` sliding pills with critically damped spring physics (`stiffness: 450, damping: 35`).
- **Strict Motion Respect**: `useReducedMotion()` is honored across all components. When enabled, scale pulses and particles disable or settle to static states, maintaining instant accessibility.

---

## 2. Per-Screen Upgrades & Component Attribution

### Welcome Screen (`/components/onboarding/WelcomeStep.tsx`)
- **React Bits `Particles`**: Floating atmospheric canvas particles responding to the theme with low GPU footprint.
- **React Bits `BlurText`**: Spring-eased blur-to-focus headline text reveal for the welcome tagline.
- **Motion Hero Breathing Mark**: Generous 168px opening presentation of the custom leaf-lung mark with soft ambient depth glow and gentle 8-second breathing expansion.
- **Quick Tap Skip**: Screen tap immediately completes the entrance animation for returning users.

### Onboarding Steps (`/components/onboarding/*`)
- **ThemeStep**: Interactive `SpotlightCard` selections with tactile spring check indicators.
- **LanguageStep**: Spotlight cards for all 5 Indian regional languages + English, with native typography.
- **LocationStep & HouseholdStep**: Micro-spring tap feedback on city chips and family member badges (Child/Baby, Elderly, Pregnant, Asthma).
- **BuildingPlanStep**: React Bits `ShinyText` animated gradient shimmer while generating localized action plans.

### Home Screen (`/components/screens/HomeScreen.tsx`)
- **Atmospheric Live Particles**: Haze particles dynamically bound to real-time PM2.5 and action completion thinning.
- **React Bits `CountUp`**: Smooth, monotonic count-up on hero PM2.5, US AQI, and PM10 metrics with tabular numerals.
- **Sliding Family Indicator**: Framer Motion `layoutId="active-family-pill"` on the household filter bar with full ARIA tablist keyboard navigation.
- **Mobile Header**: Custom leaf-lung logo pinned at the top-left corner with city location and live update indicators to its right.
- **Spotlight Cards**: Next 2 Hours AI decision panel, Top Recommended Actions, and 24-Hour Forecast cards upgraded with desktop-only cursor tracking.
- **Read Aloud on "Next 2 Hours"**: Integrated `<SpeakerButton>` in the card header with sentence-by-sentence active text highlighting during speech playback.
- **Floating "Ask by Voice" Action Button (`AskByVoiceFab`)**:
  - Theme-aligned floating pill button with ambient pulsing glow halo and spring physics.
  - Instantly switches the user to the Ask Clearhale screen and opens the microphone with zero manual friction.
  - Respects `prefers-reduced-motion` and automatically hides if speech recognition is unsupported or disabled in settings.
- **WhatsApp & Social Air Quality Card Sharing (`ShareModal`, `AirQualityCard`)**:
  - Two convenient entry triggers: "Share" button in the Home top bar and a contextual "Share air card with family" link directly under the Next 2 Hours card.
  - Smooth slide-up preview sheet on mobile and centered modal on desktop with backdrop blur.
  - Interactive audience perspective chips (`Everyone`, `School parents`, `Elders at home`, `Outdoor workers`) that dynamically update guidance and top 3 actions without exposing any private household or personal health information.
  - Client-side high-resolution (1080×1350, 4:5 aspect ratio) PNG card generation using `html-to-image` and `document.fonts.ready` with Noto Sans Devanagari, Bengali, and Tamil font preloading.
  - High-contrast, light-only card canvas featuring Clearhale branding, city name, AQI band color ring, large PM2.5 metric, Next 2 Hours decision, top 3 actions with cost tags (`Free`, `Low-cost`, `If you can afford`), Open-Meteo attribution, and subtle tagline.
  - Web Share API file sharing (`navigator.canShare({ files })`) with native fallback to WhatsApp URL (`https://wa.me/?text=...`) and instant image download.
  - One-tap "Copy Text" button for clipboard sharing and floating "Ready" toast notification.

### Plan Screen (`/components/screens/PlanScreen.tsx`)
- **Interactive Simulator `SpotlightCard`**: What-If indoor exposure simulator equipped with a live particle haze background that visibly thins as the indoor reduction percentage increases.
- **React Bits `CountUp`**: Animated tabular numerals for Outdoor Baseline, Estimated Indoor, and Percent Reduction.
- **Action Cards**: Staggered list entrance (`AnimatedList`), desktop spotlight borders, and tactile canvas-confetti burst upon task completion.

### Ask Clearhale Screen (`/components/screens/AskScreen.tsx`)
- **React Bits `ShinyText`**: Animated shimmer on the AI thinking indicator (`"Consulting science catalog and local air data..."`).
- **Prompt Chips**: Micro-spring tap animations and subtle hover borders.
- **Automatic Term Highlighting**: Live regex matching against the glossary to render clickable `<Term>` chips in AI responses.
- **Free Built-in Voice Typing (Speech to Text)**:
  - Feature-detected Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with zero paid external APIs or keys.
  - Large 48px microphone button beside Send with four states: `idle`, `listening` (animated ripple ring and 4-bar dynamic audio waveform), `processing`, and `error`.
  - Automatic language-to-recognition locale mapping (`en-IN`, `hi-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`, `gu-IN`, `pa-IN`), falling back gracefully to `en-IN`.
  - Interim streaming transcript displayed live in the standard `<textarea>` as the user speaks.
  - Smart Confidence Handling: transcripts with low confidence (< 0.6) or very short word counts remain safely in the box for manual typing/editing. High-confidence sentences trigger a 1.5s countdown toast (*"Sending in 1.5s, tap to edit"*) with immediate Send Now and Cancel options.
  - Non-blocking Standard `<textarea>`: maintains 100% full compatibility with external dictation tools (e.g. Wispr Flow, Gboard / iOS voice keyboard) and paste events.
  - Instant Red-Flag Emergency Triage: voice transcripts run through `hasEmergencySymptoms()` identically to typed input, displaying 112 emergency calling actions for acute respiratory distress.
  - Friendly bilingual error alerts for mic permissions (with clear unlock steps), network errors, and unsupported browsers.
- **Natural Read Aloud (Text to Speech)**:
  - `<SpeakerButton>` on every assistant response bubble with Play, Pause, and Stop states and $\ge 44$px tap targets.
  - Speech synthesis sentence-by-sentence queueing via `splitIntoSentences()` to permanently prevent the 15-second browser speech cutoff/hang bug.
  - Real-time sentence highlighting in the message bubble corresponding to the exact sentence currently being read aloud by the device voice.
  - Native language voice prioritization, with graceful fallback to English when regional device voices are absent.
  - Auto-cancellation of active speech playback whenever the user switches tabs, starts speaking into the mic, or navigates away.

### Care Screen (`/components/screens/CareScreen.tsx`, `BreatheTab`, `MythsTab`, `TermsTab`)
- **Top Segmented Control**: 3-way sliding pill indicator (`#breathe`, `#learn`, `#terms`) with URL hash synchronization and keyboard arrow navigation.
- **Breathe Tab Hero Countdown & Phase Clock**:
  - Monotonic clock using `performance.now()` and `requestAnimationFrame` for drift-free timing even during tab throttling.
  - Ring Center: Displays only the active phase label ("Breathe in", "Hold", "Breathe out") and the prominent phase seconds countdown numeral (`4` or `6` seconds, counting down 4...3...2...1 or 6...5...4...3...2...1) with no whole session timer in the center.
  - UI Clock Perimeter Ring: Green outer perimeter line reduces clockwise with each second of the phase, matching the intuitive circular countdown behavior of mobile phone timers.
  - Bottom Session Timer Card: Dedicated timer panel displaying overall session time (`03:00 left`), elapsed time, total target duration, and a continuous horizontal progress bar.
  - Subtle mint inner circle expanding on inhale (0.72 to 1.0) and contracting on exhale.
  - Four cardinal tick marks at 12, 3, 6, and 9 o'clock with gentle quarter-completion pulses and optional haptic feedback.
  - De-cluttered ring interior: Guidance cues placed cleanly underneath the ring to eliminate text clipping.
- **Myths Tab**:
  - Prominent emergency health warning card (`tel:112`) with `SpotlightCard`.
  - Independent 2-column masonry layout on desktop to prevent row-stretching and awkward whitespace gaps when expanding accordions.
  - Sliding pill indicator on category filter chips.
- **Terms Tab (Plain-Language Glossary)**:
  - "Read your air in 10 seconds" compact 6-band CPCB card with desktop spotlight.
  - Sliding pill on category filters (`All`, `Basics`, `Pollutants`, `Protection`, `Causes`).
  - Search filter with live result counter and clear button.
  - Four-part accordion layout (`What it means`, `Think of it like`, `Why it matters`, `What you can do`) inside `SpotlightCard` containers.

### Settings / Profile Screen (`/components/screens/ProfileScreen.tsx`)
- **Spotlight Cards**: All configuration panels (Install PWA, Theme, City, Language, Voice & Speech, Household, Demo & Reset) wrapped with subtle spotlight highlights.
- **Voice & Speech Configuration Card**:
  - Voice typing (Microphone) master toggle.
  - 1.5-second auto-send countdown toggle.
  - Auto-read AI replies toggle.
  - Speech rate selector (0.8x Slow, 1.0x Normal, 1.2x Fast).
  - Bilingual mode toggle to read both native and English sections.
  - Local voice picker dropdown listing all voices detected on the user's OS and browser.
  - Clear, user-friendly privacy disclaimer: *"Your browser or device may process your voice to turn it into text."* (localized bilingually).
- **Modal Spring Transition**: Reset confirmation dialog with spring scale-in and backdrop blur.

### App Navigation & Layout (`/components/AppLayout.tsx`)
- **Desktop Sidebar Navigation**: Animated sliding pill (`layoutId="desktop-nav-pill"`) tracking the active tab with smooth spring motion.
- **Mobile Bottom Navigation**: Animated sliding pill (`layoutId="mobile-nav-pill"`) tracking active tab on touch devices.

---

## 3. What Was Intentionally Left Unchanged & Why

1. **CPCB & US AQI Calculation Engines (`lib/aqi.ts`)**:
   - Indian national air quality standards (CPCB 6-band system) and break-point algorithms remain untouched to ensure 100% scientific and regulatory accuracy.
2. **Rules Engine Action Catalog (`lib/rulesEngine.ts`)**:
   - The 20+ peer-reviewed mitigation actions (N95, HEPA, DIY box fans, cooking ventilation, morning smog avoidance) remain strictly intact without altered thresholds.
3. **Bilingual Rendering Architecture (`components/Bi.tsx`, `lib/languages.ts`)**:
   - The strict bilingual rule (English mode = English only; Regional languages = Native + English caption) remains preserved across the entire interface.
4. **Data Privacy & Zero Tracking**:
   - Household configurations, selected filters, and cached air readings remain strictly in browser `localStorage`. No user telemetry or analytics tracking was added.
5. **PWA Offline & Service Worker Functionality**:
   - Manifest configurations and service worker caching policies are fully preserved.
