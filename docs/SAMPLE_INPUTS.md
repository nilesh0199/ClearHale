# Clearhale Sample Verification Inputs & Test Scenarios

This document provides structured test inputs, household profiles, multilingual voice/text queries, and expected deterministic system behaviors for evaluating Clearhale.

---

## 1. Six Test Cities Across India

| City | Latitude / Longitude | Typical AQI Band | Expected Station Behavior | Language Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Delhi (NCR)** | `28.6139° N, 77.2090° E` | Poor / Very Poor / Severe | Matches nearest DPCC / CPCB monitor; enforces mask and purifier routines. | Offers Hindi & English suggestions. |
| **Pune (Maharashtra)** | `18.5204° N, 73.8567° E` | Satisfactory / Moderate | Enforces wrong-city boundary (rejects Mumbai stations > 100 km away). | Offers Marathi & English suggestions. |
| **Bengaluru (Karnataka)** | `12.9716° N, 77.5946° E` | Good / Satisfactory | Permits outdoor workout recommendations during clean daytime windows. | Offers Kannada & English suggestions. |
| **Kolkata (West Bengal)**| `22.5726° N, 88.3639° E` | Moderate / Poor | Selects nearest WBPCB monitor; activates kitchen ventilation focus. | Offers Bengali & English suggestions. |
| **Nagpur (Maharashtra)** | `21.1458° N, 79.0882° E` | Satisfactory / Moderate | Fallbacks cleanly to Open-Meteo grid if local monitor lacks fresh PM2.5. | Offers Marathi & English suggestions. |
| **London (International)**| `51.5074° N, 0.1278° W` | Good / Satisfactory | Strictly locks language options to English only; hides regional Indian hints. | English only. |

---

## 2. Five Diverse Household Profiles

### Profile A: Multi-Generational Family with Asthma
- **Members**: Child (Age 4), Elderly Parent (Age 72), Adult with Asthma.
- **Cooking Fuel**: LPG with kitchen exhaust.
- **Equipment**: Owns portable HEPA air purifier in bedroom; has N95 masks.
- **Expected Plan**:
  1. Top Priority: "Run HEPA purifier in bedroom clean-air sanctuary" (`Free` operating action, `Strong` evidence).
  2. "Block bedroom door gap with towel" (`Free`, `Moderate` evidence).
  3. "Ensure N95 masks fit child and adults properly" (Audience-specific for Asthma/Elderly).
  4. Outdoor workouts: Strictly blocked if PM2.5 > 60 µg/m³.

### Profile B: Outdoor Daily Wage Worker
- **Members**: Solo adult outdoor street vendor / construction worker.
- **Commute**: Outdoor walking / cycling (> 4 hours daily outdoors).
- **Equipment**: No purifier, limited budget (`Free` & `Low-cost` only).
- **Expected Plan**:
  1. Top Priority: "Wear fitted N95 mask during peak traffic/smog commute hours" (`Low-cost`).
  2. "Pick lightest hour for outdoor tasks (midday dispersion)" (`Free`).
  3. "Nasal saline rinse after work shift" (`Low-cost`, `Strong`).
  4. Share poster: Specifically tailors outdoor worker guidance with shift safety precautions.

### Profile C: Infant & Young Parents Apartment
- **Members**: Infant under 2 years old, Two working parents.
- **Housing**: High-rise apartment with balcony, no air purifier.
- **Expected Plan**:
  1. "Keep windows latched during thermal inversion (morning/evening)" (`Free`).
  2. "Never use adult N95 mask on infant under 2" (Critical pediatric safety note).
  3. "DIY Box-Fan Filter with MERV-13" (`Low-cost` alternative before buying commercial unit).

### Profile D: Rural / Semi-Urban with Biomass Chulha
- **Members**: 5 members, elderly grandmother, biomass/wood fuel cooking.
- **Housing**: Ground-floor home with natural cross-ventilation.
- **Expected Plan**:
  1. "Cook outdoors or beside open exterior doorway" (`Free`, High impact).
  2. "Keep children and elders out of cooking area during stove lighting" (`Free`).
  3. Sustainable swap recommendation: Transition to clean fuel / improved stove.

### Profile E: Healthy Fitness Enthusiast
- **Members**: Solo young adult, daily outdoor runner.
- **Goal**: Safe marathon training and running routines.
- **Expected Plan**:
  1. Real-time Best Time Window: Calculates 24-hour lowest PM2.5 window between 7 AM and 11 PM.
  2. If air is Good/Satisfactory: "Good day for outside workout" appears on Home and Plan.
  3. If air is Poor: Warning to shift workout indoors (e.g., jump rope, yoga, indoor calisthenics).

---

## 3. Ten Multilingual Test Questions (with Expected Behavior)

| # | Language | User Query | Expected System Behavior |
| :- | :--- | :--- | :--- |
| **1** | English | *"Can I go for a jog in the park right now?"* | Reads live PM2.5: If <= 60, approves and suggests optimal hour; if > 60, warns against aerobic exercise outdoors and suggests indoor routine. |
| **2** | Hindi | *"क्या मुझे अपने 1 साल के बच्चे को N95 मास्क पहनाना चाहिए?"* | Deterministic pediatric safety rule: Explains in clear Hindi that infants under 2 should never wear N95 due to suffocation risk; advise indoor clean air. |
| **3** | Marathi | *"घरात अगरबत्ती आणि डासांची अगरबत्ती लावणे सुरक्षित आहे का?"* | Cites WHO/EPA evidence in Marathi: Explains that burning incense and coils emits heavy particulate soot; recommends non-burning alternatives. |
| **4** | English | *"I feel sudden severe tightness in my chest and can't breathe."* | **Emergency Red-Flag Intercept**: Immediately suspends AI conversation, displays red emergency alert with single-tap link to call emergency services (`tel:112`). |
| **5** | Hindi | *"एयर प्यूरीफायर नहीं है, घर की हवा कैसे साफ रखें?"* | Recommends zero-cost actions: sealing window gaps, wet mopping instead of dry brooming, bathroom exhaust reverse airflow, and DIY box fan. |
| **6** | Marathi | *"सकाळी मॉर्निंग वॉकला जाण्यासाठी सर्वोत्तम वेळ कोणती आहे?"* | Analyzes hourly forecast data: recommends specific lowest-smog daytime window (e.g. 1:00 PM to 4:00 PM) rather than peak-smog sunrise hours. |
| **7** | English | *"Does jaggery or herbal tea clean air soot from my lungs?"* | **Myth Buster**: Clarifies that swallowed food passes into the digestive tract, whereas PM2.5 enters lung alveoli and bloodstream; debunk false detox claims. |
| **8** | Tamil | *"என் பாட்டிக்கு ஆஸ்துமா உள்ளது, இன்று என்ன செய்ய வேண்டும்?"* | Recognizes Tamil language, routes to Gemini multilingual backend, provides elder asthma precautions (staying in clean-air room, keeping inhaler ready). |
| **9** | English | *"I bought a new Philips HEPA air purifier today."* | **Dynamic Profile Update**: Ask coach recognizes equipment change and proactively offers a single-click button to update household profile to "Owns Purifier". |
| **10**| Marathi | *"बाहेर हवेचा दर्जा कसा आहे?"* | Summarizes current PM2.5, CPCB air quality band, and one clear actionable recommendation in natural Marathi using terms like "छान" or "मध्यम". |
