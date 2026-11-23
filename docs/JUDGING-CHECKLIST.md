# Clearhale Challenge 6 Judging Checklist & Code Mapping

This document provides direct mappings between every Challenge 6 requirement, its exact file location in the repository, and the precise procedure to verify it.

---

## 1. Problem Statement Alignment

| Requirement | Implementation File(s) | How to Verify |
| :--- | :--- | :--- |
| **Low-emission daily routines** | `data/actions.json`, `components/screens/HomeScreen.tsx` | View Home tab: Routines section surfaces damp-mopping, ventilation timing, and shift commute adjustments. |
| **Indoor air actions with cost tiers** | `data/actions.json`, `components/ui/NeutralChips.tsx`, `components/screens/PlanScreen.tsx` | Plan tab displays actions tagged with `Free`, `Low-cost`, and `If you can afford` chips with high-contrast borders. |
| **Alternatives with scientific impact** | `lib/rulesEngine.ts:calculateWhatIfExposure` | On Plan tab, toggle what-if actions: Exposure card computes exact PM2.5 reduction percentage (50-80% for HEPA, 40-70% for DIY box fan). |
| **Personalized "Why this is for you"** | `lib/whyForYou.ts`, `components/screens/HomeScreen.tsx:1530` | Check cards on Home and Plan: each card details a custom explanation referencing specific vulnerable household members. |
| **Live sensor data with timestamp** | `lib/openaq.ts`, `components/screens/HomeScreen.tsx:830-845` | Header displays station name, data source (`OpenAQ` or `Open-Meteo`), and minutes since last measurement. |
| **Locations across India (54+ cities)** | `lib/citiesData.ts`, `components/onboarding/LocationStep.tsx` | Select Location: browse catalog of 54 Indian cities across Tier 1, 2, and 3 with real spatial coordinates. |
| **Wrong-city spatial protection** | `lib/openaq.ts:selectBestStation` | Run `npm test`: `test/openaq-integration.test.mjs` verifies Pune coordinates strictly reject Mumbai stations (> 25 km away). |
| **Multilingual interface & voice** | `lib/languages.ts`, `hooks/useVoiceInput.ts`, `components/Bi.tsx` | Switch language to Marathi or Hindi: UI renders native labels with English subtitles; Ask tab supports voice STT & TTS. |

---

## 2. Code Quality & Maintainability

| Requirement | Implementation File(s) | How to Verify |
| :--- | :--- | :--- |
| **Zero TypeScript compile errors** | `tsconfig.json`, `types/index.ts` | Run `npx tsc --noEmit`. Returns exit code 0 with zero diagnostics. |
| **Self-contained test suite** | `test/*.test.mjs` | Run `npm test`. 94 test cases pass across 23 suites in ~1.0 second. |
| **Zero dead / duplicate code** | `components/ui/rb/`, `lib/rulesEngine.ts` | Run knip check; all unused components and duplicate helpers safely removed. |
| **Strict design token enforcement** | `app/globals.css`, `tailwind.config.ts`, `test/token-enforcement.test.mjs` | Run test suite: verifies zero hardcoded hex colors or rogue utilities across all JSX components. |

---

## 3. Security & Safety

| Requirement | Implementation File(s) | How to Verify |
| :--- | :--- | :--- |
| **Zero secrets in repository history** | Full Git commit history | Scanned entire history for `AIza`, `gsk_`, `sk-`, and private keys. 0 secrets present. |
| **Medical emergency safety intercept** | `lib/medicalSafety.ts`, `components/screens/AskScreen.tsx` | Type *"I have chest pain and can't breathe"* in Ask chat: immediate emergency alert with `tel:112` call button. |
| **AI prompt injection defense** | `lib/ai/provider.ts`, `test/input-validation.test.mjs` | Malicious prompt overrides or roleplay requests are scrubbed and rejected safely. |
| **Pediatric mask warning** | `data/actions.json:n95_mask_adults_kids`, `lib/whyForYou.ts` | Set infant in profile: Plan explicitly displays warning that infants under 2 must never wear N95 masks. |

---

## 4. Efficiency & Performance

| Requirement | Implementation File(s) | How to Verify |
| :--- | :--- | :--- |
| **Repository size under 10 MB (target < 7 MB)** | Git pack & tracked files | Tracked files: `2.92 MB`, `.git`: `1.05 MB`. Total repo footprint is `~3.97 MB`. |
| **Documentation screenshots under 150 KB** | `docs/screenshots/` | Exactly 6 screenshots, ranging from 39 KB to 119 KB (all strictly < 150 KB). |
| **Optimized production build** | Next.js App Router | `npm run build`: Shared initial JS bundle is only `103 kB`. |
| **Offline-first PWA caching** | `public/sw.js`, `public/manifest.webmanifest` | Service worker caches static assets, catalog, and offline air quality estimates for disconnected use. |

---

## 5. Accessibility & Design Compliance

| Requirement | Implementation File(s) | How to Verify |
| :--- | :--- | :--- |
| **Neutral palette with color switch** | `app/globals.css`, `components/screens/ProfileScreen.tsx` | Profile tab allows toggling between **Deep Teal** and **Monochrome** styles. |
| **High-contrast active indicators** | `app/globals.css:201-235`, `components/AppLayout.tsx` | Active tabs in Monochrome Dark mode display solid white pills with black text (`18.1:1` AAA contrast). |
| **Air quality colors only for data** | `components/screens/HomeScreen.tsx` | Neutral background and surfaces; AQI colors (Good, Poor, Severe) restricted strictly to data badges and meter rings. |
| **Touch target sizes >= 44x44 px** | All buttons, tabs, and toggles | Verified across all screens on mobile (`min-h-[44px]`). |
| **Reduced motion support** | `components/ui/rb/Particles.tsx`, `components/BreathingRing.tsx` | Respects `prefers-reduced-motion` to stop canvas particle drift and animation loops. |
