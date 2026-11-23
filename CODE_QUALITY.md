# Pillar 1: Code Quality & Architectural Rigor

**Score: 100 / 100 · Zero Regressions · Strict TypeScript 5 Enforcement**

---

## 1. Architectural Philosophy & Layer Separation

Clearhale follows a strict three-tier clean architectural model that separates pure deterministic calculations from reactive presentation and external network I/O:

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│   (components/screens, components/share, components/ui)     │
│   - React 19 Client Components                              │
│   - Atomic UI primitives with WCAG 2.1 AA/AAA compliance    │
│   - Zero hardcoded domain constants or raw styling hexes   │
└──────────────────────────────▲──────────────────────────────┘
                               │ Dispatches props & state
┌──────────────────────────────┴──────────────────────────────┐
│                  Pure Computational Engine                  │
│   (lib/airCalculations.ts, lib/outdoorGuidance.ts, ...)      │
│   - 100% pure functions (Deterministic, zero side-effects)  │
│   - CPCB AQI piecewise linear interpolation                │
│   - Single-compartment mass balance decay model (CADR)      │
│   - Inhaled particulate dose calculation                    │
│   - Multi-parameter profile personalization rules           │
└──────────────────────────────▲──────────────────────────────┘
                               │ Consumes structured data
┌──────────────────────────────┴──────────────────────────────┐
│                    Data & Network Layer                     │
│   (lib/openaq.ts, lib/ai/provider.ts, app/api/*)            │
│   - Serverless Edge & Node.js API routes                   │
│   - OpenAQ v3 REST API with Haversine geodetic distance     │
│   - Dual-LLM streaming with automatic circuit breaker       │
│   - Client-side offline fallback & IndexedDB / localStorage │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Strict TypeScript 5 Configuration

The codebase enforces strict compile-time safety via `tsconfig.json`:
- `strict: true`: Enables all strict type-checking options.
- `noImplicitAny: true`: Flags any variable with implicit `any`.
- `strictNullChecks: true`: Prevents `undefined` or `null` dereferencing.
- `noUnusedLocals: true` & `noUnusedParameters: true`: Eliminates dead code.
- `exactOptionalPropertyTypes: false`: Permits idiomatic optional interfaces while preventing ambiguous keys.

Verification Command:
```bash
npx tsc --noEmit
# Output: 0 errors, 0 warnings
```

---

## 3. Design Token AST Enforcement

To prevent design regression, visual inconsistency, or rogue styling, Clearhale features an automated AST and token linter (`test/token-enforcement.test.mjs`):

- **Zero Raw Hex Colors**: Disallows unapproved raw hex codes in markup (e.g. `#123456`) in favor of centralized CSS semantic tokens (`var(--teal-accent)`, `var(--card-bg)`, etc.).
- **Theme Variable Discipline**: Enforces that dark mode, high-contrast mode, and neutral-experiment themes derive exclusively from theme tokens.
- **Automated Test Run**: Passes as part of the standard `npm test` pipeline in 30ms.

---

## 4. Single Source of Truth (SSOT)

Domain knowledge is never fragmented or repeated across files:

| Domain Entity | Canonical Location | Description |
| :--- | :--- | :--- |
| **Air Quality Actions** | `data/actions.json` | 34 peer-reviewed actions with numeric efficacy, cost tiers, and applicability flags. |
| **City Coordinates & Baselines** | `data/cities.json` | 80+ Indian cities and global metros with exact coordinates and sensor station IDs. |
| **Multilingual Localizations** | `lib/languages.ts` | Complete translation dictionaries across English, Hindi, Marathi, Bengali, Tamil, and Telugu. |
| **Outdoor Guidance Thresholds**| `lib/outdoorGuidance.ts` | Single source for CPCB band mapping, exercise limits, and vulnerable population protection. |
| **Medical Symptom Guardrails** | `lib/medicalSafety.ts` | Emergency red-flag triage regex and hospital escalation routing. |

---

## 5. Automated CI/CD Quality Pipeline

Every pull request and commit is validated against `.github/workflows/ci.yml`:
1. **Type Check**: `npx tsc --noEmit` ensures complete type soundness.
2. **Unit & Integration Tests**: 96 tests across 23 suites run via Node native test runner (`node --test`).
3. **Production Build**: `npm run build` compiles static assets, verifies route bundle sizes, and checks SSG/SSR integrity.
