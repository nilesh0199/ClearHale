# Clearhale Known Limitations & Operational Boundaries

In adherence to strict engineering transparency and audit standards, this document catalogues the architectural trade-offs, provider constraints, and operational boundaries of Clearhale.

---

## 1. Upstream Dependency Audit Warnings (`npm audit`)

Running `npm audit --omit=dev` reports 6 vulnerabilities (1 moderate, 5 high):
- `@grpc/grpc-js`: Transitive dependency inherited through `@firebase/firestore` (Firebase SDK v10.14.1).
- `postcss`: Bundled internally within Next.js v15.5.29 compilation chain.

**Why Not Overridden**:
The project constraints explicitly mandate: *"Do not upgrade or add dependencies, and do not change the version in package.json."* Executing `npm audit fix --force` would install breaking major versions (`firebase@9.14.0` and `next@16.4.6`). The app does not expose public gRPC listener ports or evaluate arbitrary user-supplied PostCSS strings, making the operational risk negligible.

---

## 2. Unused Package Dependencies (`clsx`, `tailwind-merge`)

Static analysis tool `knip` flags `clsx` and `tailwind-merge` as unused runtime dependencies in `package.json`.
- **Reason for Retention**: The project rule mandates leaving `package.json` versions and lockfile consistency untouched. Rather than risk regenerating lockfile metadata during the evaluation phase, these lightweight packages are retained without active imports.

---

## 3. Public API & Free-Tier Quotas

1. **OpenAQ v3 Live Sensor API**:
   - The public OpenAQ v3 API enforces a rate limit on unauthenticated and community requests.
   - **Mitigation in Code**: When an OpenAQ endpoint returns HTTP `429 Too Many Requests` or timeouts exceed 6.0 seconds (`lib/openaq.ts`), Clearhale transparently falls back to Open-Meteo's hourly spatial grid model, visibly labelling the measurement as **"Open-Meteo Model Estimate"** with the exact timestamp.
2. **Groq & Google Gemini LLM Endpoints**:
   - Groq Cloud and Gemini Developer APIs operate under per-minute rate limits.
   - **Mitigation in Code**: `lib/ai/provider.ts` implements automatic primary-to-secondary failover and records a 60-second cooldown period upon receiving HTTP 429 / 5xx. If both providers are rate-limited, the system safely renders a pre-compiled, peer-reviewed offline safety template.

---

## 4. Voice & Speech Recognition Language Boundaries

1. **Speech-to-Text (STT) and Text-to-Speech (TTS)**:
   - Voice interaction is actively tested and verified for **Hindi, Marathi, Bengali, Tamil, Telugu, and English**.
   - For other regional languages (Kannada, Malayalam, Gujarati, Punjabi), the UI provides complete text translations, but the microphone and speaker controls are gracefully disabled (`test/language-capabilities.test.mjs`). Voice is only enabled once phonetic models are verified to avoid misinterpreting health questions.

---

## 5. Non-Medical Advisory Boundary

1. **Not a Clinical Device**:
   - Clearhale is an environmental mitigation planning tool, not a certified medical diagnostic device.
   - It does not diagnose diseases, predict clinical outcomes, or replace a licensed physician's prescription.
2. **Emergency Protocol**:
   - Clearhale detects acute respiratory distress symptoms (e.g., severe chest pain, blue lips, severe dyspnea) via deterministic regex (`lib/medicalSafety.ts`) and immediately halts AI generation, directing the user to dial emergency response services (`tel:112`).
