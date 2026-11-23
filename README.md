<p align="center">
  <img src="public/brand/logo.png" width="128" height="128" alt="Clearhale Logo Mark" />
</p>

<h1 align="center">Clearhale</h1>

<p align="center">
  <strong>Breathe clearer, one smart choice at a time.</strong><br>
  <em>A human-designed, scientific winter smog companion and plain-language air guide for families in India.</em>
</p>

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-care-suite-breathe-learn-terms">Care Suite</a> •
  <a href="#-light-voice-layer-stt--tts">Voice Layer</a> •
  <a href="#-whatsapp--social-share-air-card">Share Card</a> •
  <a href="#-indoor-exposure-math--simulator">Scientific Simulator</a> •
  <a href="#-design-system--micro-interactions">Design System</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

## 🍃 Overview

During North India's intense winter temperature inversions, particulate pollution ($\text{PM}_{2.5}$) frequently surges past $250\text{–}500\ \mu\text{g/m}^3$ (Severe to Hazardous). Most existing weather and air quality apps overwhelm users with apocalyptic red warnings, technical sensor jargon, and generic advice.

**Clearhale** takes a fundamentally different, human-centered approach:
- **Calm, Medical-Grade Aesthetic**: Restrained deep teal (`#0D5C52`) and soothing mint (`#10B981`) tones replace panic-inducing red/purple neon glows.
- **Immediate Decisions, Not Raw Numbers**: Clear directive advice for the immediate 2-hour window based on atmospheric boundary layers.
- **Strictly Grounded Science**: Peer-reviewed indoor mitigation numbers (Corsi-Rosenthal box fans, portable HEPA, window infiltration physics) with interactive What-If exposure simulations.
- **Care Suite for Indian Families**: A 3-segmented Care hub providing indoor calm breathing exercises, evidence-based myth busting, and a plain-language air quality glossary featuring relatable Indian analogies.
- **Zero-Cost, Privacy-First Architecture**: 100% free-tier APIs (Open-Meteo) and browser-native features (Web Speech API, LocalStorage, client-side card rendering). Zero telemetry, zero tracking, zero mandatory logins.

---

## 🌟 Key Features

### 1. Home Dashboard & Breathing Air Ring
- **CPCB 6-Band National Air Quality Index (NAQI)**:
  - **Good**: $0\text{–}30\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (Air is clean. Play outdoors freely.)
  - **Satisfactory**: $31\text{–}60\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (Acceptable air. Highly sensitive individuals may feel mild throat tickle.)
  - **Moderate**: $61\text{–}90\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (Noticeable haze. Children and seniors should limit heavy outdoor sports.)
  - **Poor**: $91\text{–}120\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (Breathing discomfort on long exposure. Move outdoor exercise indoors.)
  - **Very Poor**: $121\text{–}250\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (High respiratory risk. Wear a tight N95 mask outdoors and run indoor HEPA.)
  - **Severe**: $> 250\ \mu\text{g/m}^3\ \text{PM}_{2.5}$ (Emergency hazard for everyone. Seal gaps, avoid going out, keep air filtered.)
- **Micro-Interactions (React Bits)**:
  - `CountUp`: Smooth rolling numeric counters for $\text{PM}_{2.5}$, US AQI, and $\text{PM}_{10}$ metrics.
  - `Particles`: Dynamic background canvas haze that visibly thins out as mitigation actions are applied.
  - `SpotlightCard`: Mouse-tracked radial light reflections on cards (desktop only; disabled on touch devices for fluid 60fps scrolling).
- **Next 2 Hours Clear Decision Card**:
  - Contextual directive guidance streamed via server-side AI with instant offline template fallback.
  - One-tap `<SpeakerButton>` for natural read-aloud with sentence-by-sentence text highlighting.
- **24-Hour Forecast & Dispersion**:
  - Hourly forecast bar highlighting the day's cleanest atmospheric window (**"Best air"**) for essential outdoor errands.
- **Family Perspectives**:
  - Smooth sliding pill selector (`Whole Family`, `Baby & Kids`, `Elderly`, `Outdoor Worker`) tailoring guidance to vulnerable household members.
- **Floating "Ask by Voice" Action Button (FAB)**:
  - Theme-aligned floating button on mobile with ambient pulse halo that jumps directly to Ask Clearhale and opens the microphone.

---

### 2. 🧘 Care Suite (Breathe • Learn • Terms)

Located under the **Care** tab with URL hash navigation (`#breathe`, `#learn`, `#terms`) and memory of the last active view:

#### A. Breathe (Guided Indoor Calm Breathing)
- **Intuitive Phone-Timer Perimeter Clock**:
  - **Center Ring**: Displays ONLY the current phase label ("Breathe in", "Hold", "Breathe out") and the prominent seconds countdown numeral (`4 SEC` or `6 SEC`).
  - **Clock Perimeter Line**: Crisp outer green perimeter circle that reduces clockwise with each second of the phase, matching the familiar countdown ring of mobile phone timers.
  - **Soft Mint Inner Circle**: Gently expands on inhale ($0.72 \to 1.0$) and contracts on exhale.
  - **Dedicated Session Time Card**: Positioned cleanly below the ring, displaying total session time (`03:00 left`), elapsed time, target duration, and a continuous progress bar.
  - **Monotonic Precision**: Driven by `performance.now()` and `requestAnimationFrame` for drift-free timing even when the browser tab is backgrounded.
  - **Quarter Tick Marks & Haptics**: Cardinal marks at 12, 3, 6, and 9 o'clock with soft pulse and optional device vibration.
  - **Safety Notice**: Clear reminder: *"Only practice deep breathing indoors with filtered air; never deep-breathe outdoor winter smog."*

#### B. Learn (Smog Myth-Busters)
- **Emergency Respiratory Warning**: High-visibility warning card detailing red-flag signs (stridor, blue lips, chest indrawing, sudden confusion) with a direct `Call 112` button.
- **2-Column Masonry Grid**: Prevents vertical layout shifting when expanding accordion cards.
- **Scientific Debunking**:
  - *Cloth scarves & dupattas*: Provide $< 15\%$ filtration against sub-micron $\text{PM}_{2.5}$.
  - *Houseplants*: NASA clean-air studies tested volatile organic compounds (VOCs) in sealed chambers; plants have near-zero effect on particulate soot and dust.
  - *Early morning aeration*: Traps intense ground-level smog during winter temperature inversions; air out homes only during sunny mid-day hours.
  - *Over-sealing without ventilation*: Can cause hazardous $\text{CO}_2$ buildup ($> 1500\text{ ppm}$); recommend short cross-ventilation during cleanest forecast hours.

#### C. Terms (Plain-Language Air Glossary for Indian Families)
- **"Read Your Air in 10 Seconds" Card**:
  - Compact visual breakdown of the six CPCB colour bands, their official $\text{PM}_{2.5}$ ranges, and the single most critical action to take.
- **Category Filter Chips & Live Search**:
  - Categorized under `All`, `Basics`, `Pollutants`, `Protection`, and `Causes` with instant fuzzy search filtering.
- **4-Part Accordion Structure (Class 6 Reading Level)**:
  1. **What it means**: Short, everyday explanation without intimidating jargon.
  2. **Think of it like**: Relatable everyday Indian analogies (e.g. *AQI as a fever thermometer*, *$\text{PM}_{2.5}$ as microscopic soot smaller than a single hair strand*, *HEPA filters as fine chai strainers*, *Inversions as cold blankets trapping jalebi smoke*).
  3. **Why it matters**: Direct health impact on lungs, heart, and bloodstream.
  4. **What you can do**: Concrete, low-cost practical intervention.

---

### 3. 🎙️ Light Voice Layer (STT & TTS)

Built exclusively using browser-native Web Speech APIs—zero paid cloud speech engines or third-party tracking.

- **Voice Input (Speech-to-Text)**:
  - Feature-detected `SpeechRecognition` / `webkitSpeechRecognition`.
  - Automatic locale mapping across 10 Indian regional languages (`en-IN`, `hi-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`, `gu-IN`, `pa-IN`) with fallback to `en-IN`.
  - Large 48px microphone button beside Send with live animated 4-bar dynamic waveform audio feedback.
  - Real-time interim transcript streaming directly into a standard `<textarea>` (maintaining full compatibility with external dictation tools like Wispr Flow and mobile keyboard mics).
  - High-confidence auto-send timer (1.5s countdown with one-tap Cancel/Edit) and graceful manual edit hold for short or low-confidence speech.
  - Automatic emergency symptom detection on voice transcripts (`hasEmergencySymptoms()`).
- **Read Aloud (Text-to-Speech)**:
  - `speechSynthesis` integration on the "Next 2 Hours" decision card and every AI assistant response.
  - Sentence-by-sentence queueing engine to prevent the notorious 15-second browser speech freeze bug.
  - Real-time sentence highlighting in chat bubbles matching the active audio playback.
  - Native Indian accent voice prioritizing with fallback to standard English device voices.
  - Configurable speech rate (0.8x Slow, 1.0x Normal, 1.2x Fast) and bilingual mode toggle in Settings.

---

### 4. 📤 WhatsApp & Social Share Air Quality Card

Generates crisp, high-resolution $1080 \times 1350$ (4:5 aspect ratio) image cards designed specifically for WhatsApp family chats and school parent groups.

- **Client-Side Canvas Rendering**:
  - Rendered from an offscreen DOM node using `html-to-image` and `document.fonts.ready` with Google Fonts preloading for Indian scripts (Devanagari, Bengali, Tamil, etc.).
  - Always rendered on a clean, high-contrast light background (`#FAF9F6`) for maximum legibility in WhatsApp image previews regardless of user theme.
- **4 Audience Perspectives**:
  - `Everyone`: General household air safety and indoor protection.
  - `School parents`: School commute masking, outdoor sports restrictions, morning assembly advice.
  - `Elders at home`: Rescue inhaler accessibility, morning walk deferral, room filtration.
  - `Outdoor workers`: Facial seal checks for physical labor, shifting heavy tasks to mid-day cleanest window.
- **Card Contents**:
  - Clearhale leaf-lung brand mark, city name, date, and live timestamp.
  - Large $\text{PM}_{2.5}$ hero metric encircled by the official CPCB color ring.
  - Actionable "Next 2 Hours Decision" line.
  - Top 3 recommended actions categorized with cost tags (`Free`, `Low-cost`, `If you can afford`).
  - Attribution to Open-Meteo Air Quality Model and subtle tagline.
- **Sharing Workflow**:
  - Native Web Share API integration (`navigator.share({ files })`).
  - Automatic fallback to direct WhatsApp Web link (`https://wa.me/?text=...`) and instant high-res PNG download.
  - One-tap "Copy Text" button and floating "Ready" toast notification.
  - **Privacy Guarantee**: Never includes household profile details, personal names, health conditions, or exact GPS coordinates.

---

### 5. 🔬 Indoor Exposure Math & Simulator

On the **Action Plan** screen, Clearhale features an interactive **What-If Indoor Exposure Simulator** grounded in residential aerosol mechanics:

$$\text{Indoor PM}_{2.5} = \text{Outdoor PM}_{2.5} \times (\text{Windows Closed ? } 0.575 : 1.0) \times (1 - \text{Filter Reduction})$$

- **Baseline Infiltration**: In typical Indian urban residential construction, keeping windows and doors closed provides an infiltration factor of $\sim 55\text{–}60\%$ ($0.575$ baseline) compared to raw outdoor smog.
- **DIY Box-Fan Filter (MERV-13)**: Corsi-Rosenthal style single-fan or 4-filter cube reduces indoor particulate concentrations by $40\text{–}70\%$ ($55\%$ modeled average). Includes electrical safety warnings (never run unattended or on frayed cords).
- **Portable True HEPA Purifier**: Continuous closed-room filtration reduces particulate concentrations by $50\text{–}80\%$ ($65\%$ modeled average).
- **Visual Feedback**: As the user toggles window seals and filtration modes, background atmospheric particles visibly thin out, animated numbers count down, and completing actions triggers celebration confetti.

---

### 6. 🌐 Multi-Provider AI Architecture & Safety Guardrails

Clearhale utilizes a resilient, dual-provider server-side AI architecture (`lib/ai/provider.ts`):

- **Primary & Secondary Routing**: Configure `AI_PRIMARY=gemini` or `AI_PRIMARY=groq` via environment variables.
- **5-Second Timeout & Automatic Fallback**: If the primary provider fails to deliver tokens within 5 seconds or encounters rate limits (`429`), the request seamlessly falls back to the secondary provider.
- **Mid-Stream Resiliency**: If an error occurs mid-stream, partial tokens are preserved and the remainder streams from the backup provider with an unobtrusive notice (*"Connection slow, here is the rest from a backup."*).
- **Medical Red-Flag Triage**:
  - Voice transcripts and typed messages are automatically scanned by `hasEmergencySymptoms()`.
  - Acute respiratory red flags immediately trigger a prominent **"Seek Emergency Care Now"** card with a direct `tel:112` call button.
  - AI responses strictly refuse to diagnose illnesses or prescribe pharmaceuticals.

---

### 7. 🎨 Design System & Micro-Interactions

| Element | Specification | Rationale |
| :--- | :--- | :--- |
| **Primary Accent** | Deep Teal (`#0D5C52`, Light: `#EAF5F3`) | Medical-grade, calming, non-alarmist |
| **Secondary Mint** | Fresh Mint (`#10B981` / `#4FAE8F`) | Positive reinforcement, clean breathing |
| **Background (Light)**| Warm Off-White (`#FAF9F6`) | Reduces eye fatigue compared to pure white |
| **Background (Dark)** | Rich Slate Dark (`#0B0F17`) | Deep OLED black with glowing teal borders |
| **Typography** | `Plus Jakarta Sans` + `Noto Sans` (Indian Scripts) | High legibility across 10 Indian languages |
| **Touch Targets** | $\ge 44\text{px} \times 44\text{px}$ across all mobile buttons | Accessible for elders and one-handed phone use |
| **Reduced Motion** | Strictly honors `prefers-reduced-motion` | Fallback to instant transitions and static rings |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x, v20.x, or v22.x)
- npm, pnpm, or yarn

### 1. Installation
```bash
git clone <repository-url>
cd clearhale-ui-v2
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# OpenAQ API (Government Air Quality Ground Data)
OPENAQ_API_KEY=your_openaq_api_key_here

# Groq API (Primary AI & Whisper STT)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
STT_MODEL=whisper-large-v3

# Google Gemini API (Fallback AI & Speech TTS)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
TTS_MODEL=gemini-2.0-flash

# Provider Selection & Routing
AI_PRIMARY=groq
# Optional per-language routing override (JSON format):
AI_LANGUAGE_ROUTING={"en":"groq","hi":"groq","mr":"gemini","bn":"gemini","ta":"gemini","te":"gemini"}
```

> **Note**: Clearhale is fully functional offline even without external AI keys using its built-in rule engines and science catalogs.

---

## 🎙️ AI & Voice Services (Groq + Gemini Architecture)

### 1. Dual-Provider Routing & Fallbacks
- **Primary Provider**: **Groq** (`llama-3.3-70b-versatile`) delivers ultra-fast streaming responses.
- **Fallback Provider**: **Google Gemini** (`gemini-2.0-flash`) seamlessly takes over if Groq experiences timeouts (5s to first token), 429 rate limits, or 5xx server errors.
- **Per-Language Routing Table**: Configured in `lib/ai/config.ts` and overridable via `AI_LANGUAGE_ROUTING`:
  - **English (`en`) & Hindi (`hi`)**: Routed to Groq for maximum speed.
  - **Regional Languages (`mr`, `bn`, `ta`, `te`, etc.)**: Routed to Gemini for superior regional script understanding.
- **Cooldown Cache**: Any provider returning 429 is automatically paused for 60 seconds.
- **Privacy & Brand Shield**: Provider identity is never exposed to the client.

### 2. Speech-to-Text (`/api/stt`) & `useVoiceInput()`
- **Server Endpoint**: Receives audio clips via `multipart/form-data`, validates MIME type and file size (max 25MB, 8s timeout), and sends to Groq's Whisper endpoint (`whisper-large-v3` or `whisper-large-v3-turbo`).
- **ISO-639-1 Language Hints**: Passed directly to Whisper (`hi`, `mr`, `bn`, `ta`, `te`, `en`) for higher regional transcription accuracy.
- **Client Hook (`useVoiceInput()`)**: Records up to 30s with `MediaRecorder`. If `/api/stt` is unavailable or rate-limited, automatically falls back to the browser's `webkitSpeechRecognition`.
- **Heard Step**: Exposes `heardText` and `setHeardText` for editable confirmation before sending.

#### Sample STT Request (`curl`):
```bash
curl -X POST http://localhost:3000/api/stt \
  -F "file=@sample_speech.webm;type=audio/webm" \
  -F "language=hi"
```
**Sample Response:**
```json
{
  "text": "आज हवा बहुत खराब है, क्या खिड़की बंद रखनी चाहिए?",
  "language": "hi"
}
```

### 3. Text-to-Speech (`/api/tts`) & `useSpeech()`
- **Server Endpoint**: Generates spoken audio via Gemini API (`responseModalities: ["AUDIO"]`). Automatically packs raw 24kHz PCM into valid 44-byte RIFF/WAV audio streams.
- **Safety**: Max 600 characters per request; user text is strictly treated as data (never instructions to AI); audio is streamed directly and never stored on the server disk.
- **Client Hook (`useSpeech()`)**: Splits replies into sentences, plays the first sentence immediately while pre-fetching subsequent sentences in parallel. Caches audio by hash of text and language.
- **Browser Fallback**: If the Gemini API is rate-limited or fails on the free tier, automatically falls back to browser-native `speechSynthesis`.

#### Sample TTS Request (`curl`):
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Keep doors and windows closed and run an indoor HEPA purifier.", "language": "en"}' \
  --output speech.wav
```

### 4. Language Capability Table
Configured in `lib/ai/config.ts`:
- **Voice Enabled (`sttEnabled: true, ttsEnabled: true`)**: Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), English (`en`).
- **Text-Only (`sttEnabled: false, ttsEnabled: false`)**: Kannada (`kn`), Malayalam (`ml`), Gujarati (`gu`), Punjabi (`pa`), Odia (`or`) until tested.

---

## 🛰️ OpenAQ v3 Live Government Data & Model Fallback

Clearhale combines physical ground sensor measurements with atmospheric dispersion models:

### 1. OpenAQ v3 Server Pipeline (`/api/air-quality`)
- **Key Header**: `X-API-Key: process.env.OPENAQ_API_KEY` (never leaked to client).
- **Proximity Filtering**: Queries `/v3/locations` within a maximum 25 km radius (`parameters_id=2` for PM2.5).
- **Selection Algorithm**: Chooses the nearest station whose latest reading is no older than 3 hours.
- **Physical Validation**: Drops impossible values (negative values or $> 1500\text{ }\mu\text{g/m}^3$) and skips stale sensors.
- **Wrong-City Protection**: Hard 25 km radius limit ensures distant stations are never selected (e.g., Pune coordinates never use a Mumbai station).
- **Model Combination**:
  - **"Now"**: Uses the verified physical ground reading when available and fresh.
  - **24-Hour Forecast**: Continues using the Open-Meteo atmospheric dispersion model.
  - **Difference Flag**: If measured and model values differ by $> 40\%$, Clearhale retains the measured ground reading for "Now" and highlights the variance in the details sheet.
- **Resilience**: 6-second timeout with `AbortSignal`, 429 rate limit backoff cooldown (45s), and 10-minute server-side in-memory caching.

#### Sample Combined Air Quality Request (`curl`):
```bash
curl -X GET "http://localhost:3000/api/air-quality?lat=28.6139&lon=77.2090"
```
**Sample Response:**
```json
{
  "current": {
    "pm2_5": 168,
    "pm10": 240,
    "us_aqi": 332,
    "time": "Live",
    "isForecast": false
  },
  "hourly": [...],
  "source": "Measured at Mandir Marg, Delhi - DPCC, 2.8 km away",
  "dataType": "measured",
  "station": {
    "id": 8118,
    "name": "Mandir Marg, Delhi - DPCC",
    "provider": "DPCC",
    "distanceKm": 2.8,
    "measuredPM2_5": 168,
    "measuredPM10": 240,
    "measuredAtLocal": "2026-11-21T20:00:00+05:30",
    "modelPM2_5": 145,
    "differencePercent": 16,
    "differenceNoted": false
  }
}
```

---

## 🔍 How to Test

### 1. Test Sample Cities
In the onboarding location step or search, quick test chips are provided for 6 Indian cities:
- **Delhi** (`28.6139, 77.2090`): Heavy ground station coverage (CPCB / DPCC). Expect: **Measured at station** (e.g. Mandir Marg or Anand Vihar) with distance and timestamp.
- **Noida** (`28.5355, 77.3910`): UPPCB / CPCB monitoring stations within 5–15 km. Expect: **Measured at station** with verified ground data.
- **Mumbai** (`19.0760, 72.8777`): MPCB / CPCB coastal monitors. Expect: **Measured at station** (e.g. Bandra or Worli).
- **Kolkata** (`22.5726, 88.3639`): WBPCB reference monitors. Expect: **Measured at station** with ground PM2.5.
- **Pune** (`18.5204, 73.8567`): MPCB stations in range. Wrong-city check ensures it *never* receives Mumbai stations (~120 km away).
- **Nagpur** (`21.1458, 79.0882`): Central India monitor or fallback to Open-Meteo estimate if ground monitor is beyond 25 km.

### 2. What to Expect in the UI
- **Under the Ring**: Always shows one small muted line:
  - **Measured**: `"Measured at {station}, {x.x} km away, {n} min ago"`
  - **Estimate**: `"Forecast estimate, Open-Meteo, updated {n} min ago"`
- **Info Icon (Details Sheet)**: Click the small info icon beside the line to open the slide-up bottom sheet (desktop: popover modal):
  - Data Type badge (`Measured Government Station Data` or `Forecast Model Estimate`).
  - Station name, provider (e.g. CPCB), exact distance, and local measurement time.
  - Side-by-side comparison: **Measured (Station)** vs **Forecast (Open-Meteo)**.
  - If variance $> 40\%$, a clear note explaining the difference while retaining the local ground measurement.
  - Plain sentence explaining "measured" vs "estimate" with full bilingual support.
  - Direct navigation links to **Care** (health guidance) and **Terms** (scientific sources).
  - Empty state when no station is within 25 km: `"No station within 25 km, showing a forecast estimate"`.

### 3. How to Simulate API Failures & Test Fallback
1. **Simulate OpenAQ Failure / Offline**:
   - In `.env.local`, set `OPENAQ_API_KEY=""` or leave it empty.
   - Restart dev server and refresh Home.
   - Result: App smoothly transitions to `"Forecast estimate, Open-Meteo, updated {n} min ago"`. The details sheet displays the clean empty state: *"No station within 25 km, showing a forecast estimate"*.
2. **Simulate Total Offline (Both OpenAQ & Open-Meteo Offline)**:
   - Turn off Wi-Fi or disconnect network in browser DevTools.
   - Result: Service Worker loads the app shell, and `AppContext` automatically serves the cached reading or stored baseline scenario (`generateDemoAirData()`) without crashes or unhandled exceptions.
3. **Simulate AI Provider Failure**:
   - In `.env.local`, set `DEBUG_FORCE_FALLBACK=true`.
   - Ask AI a question in Ask tab.
   - Result: Primary provider immediately fails over to the secondary provider after 5s without exposing provider identities to the user.

---

## 🔒 Firebase Setup (Optional Google Login & Cloud Profile)

Clearhale includes optional cloud profile syncing via Firebase Auth (Google Sign-In) and Cloud Firestore (free Spark plan). If Firebase credentials are not provided, Clearhale functions 100% locally on the device with zero degradation.

### Step-by-Step Firebase Setup Guide

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
   - Name it (e.g. `clearhale-app`), disable Google Analytics (keep it lightweight and private), and create project.

2. **Enable Google Sign-In Provider**:
   - In the left sidebar, navigate to **Build > Authentication > Sign-in method**.
   - Click **Google**, toggle **Enable**, select your project support email, and click **Save**.

3. **Enable Cloud Firestore Database**:
   - In the left sidebar, navigate to **Build > Firestore Database**.
   - Click **Create database**, choose **Production mode**, and pick an Asian server location (e.g., `asia-south1` Mumbai).
   - Click **Enable**.

4. **Deploy Security Rules (`firestore.rules`)**:
   - In Firestore Database, open the **Rules** tab.
   - Replace default rules with the provided `firestore.rules` file in the project root:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         function isAuthenticated() { return request.auth != null; }
         function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
         match /users/{userId}/profile/{docId} {
           allow read, write, delete: if isOwner(userId);
         }
         match /{document=**} {
           allow read, write: false;
         }
       }
     }
     ```
   - Click **Publish**. Alternatively, deploy using Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Authorize Hosting Domains**:
   - In **Authentication > Settings > Authorized domains**, ensure `localhost` is listed.
   - Add your production Vercel deployment domain (e.g., `your-app.vercel.app`).

6. **Add Environment Variables**:
   - In Project Settings (**General > Web apps**), click the **</>** icon to register a web app.
   - Copy the configuration keys to `.env.local`:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clearhale-app.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=clearhale-app
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clearhale-app.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
     NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
     ```

---

## 🧪 Automated Testing
Run the 28 unit tests covering OpenAQ v3 selection, stale skipping, impossible value dropping, wrong-city rejection, 429/timeout handling, AI routing, and STT/TTS validation:
```bash
npm test
```
All 28 tests run deterministically using Node's native test runner (`node --test`).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📱 Progressive Web App (PWA) & Offline Support

Clearhale is engineered as a standalone Progressive Web App:
- **Service Worker (`sw.js`)**: Caches app shell, fonts, brand logos, and fallback offline responses.
- **Web App Manifest (`manifest.webmanifest`)**: Configured with maskable app icons, theme colors, and standalone display.
- **Custom Install Prompt**: Accessible from Settings to install Clearhale directly to the Android / iOS home screen.
- **Demo Mode**: 1-tap Delhi Smog Scenario preset allowing offline testing with stored realistic winter smog data.

---

## 📜 Scientific Attribution & Licenses

- **Air Quality Forecast & Reanalysis**: Open-Meteo Air Quality API (Copernicus CAMS & NOAA GFS ensemble, CC-BY 4.0).
- **Geocoding**: Open-Meteo Geocoding API.
- **Aerosol & Filtration Mechanics**: Peer-reviewed residential air filtration studies (Corsi-Rosenthal MERV-13 trials & HEPA particle count reductions).
- **Emergency Protocols**: Ministry of Health & Family Welfare (MoHFW) / National Center for Disease Control (NCDC) respiratory triage guidelines.
- **Component Libraries**: React Bits (`reactbits.dev`, MIT), Framer Motion (`motion.dev`, MIT), Lucide Icons (`lucide.dev`, ISC), Canvas Confetti (`github.com/catdad/canvas-confetti`, MIT).

---

<p align="center">
  Made with care for cleaner air across India. 🇮🇳
</p>
