import { NextRequest, NextResponse } from 'next/server';
import { stream, AIMessage } from '@/lib/ai/provider';
import { checkIpRateLimit, extractClientIp } from '@/lib/ai/rateLimit';
import { hasEmergencySymptoms } from '@/lib/medicalSafety';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import actionsData from '@/data/actions.json';
import { getIndiaBandKey, outdoorGuidance, sanitizeChatOutdoorAdvice } from '@/lib/outdoorGuidance';

interface ActionItemCatalog {
  id?: string;
  title: string;
  group?: string;
  doThis?: string;
  whyItWorks?: string;
  why?: string;
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP Rate Limiting
    const clientIp = extractClientIp(req.headers);
    const ipLimit = checkIpRateLimit(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
          retryAfterSec: ipLimit.resetInSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipLimit.resetInSec),
          },
        }
      );
    }

    const body = await req.json();
    const {
      message,
      history = [],
      language = 'en',
      city = 'Delhi',
      pm2_5 = 180,
      household = {},
      sessionHadTip = false,
      dataType = 'estimate',
      stationName = '',
      timestamp = '',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Input sanitization and bounding
    const cleanMessage = message.trim().slice(0, 2000);
    const safePm25 = typeof pm2_5 === 'number' && !isNaN(pm2_5) && pm2_5 >= 0 && pm2_5 <= 2000 ? pm2_5 : 180;

    // 2. Critical Red-Flag Safety Check
    if (hasEmergencySymptoms(cleanMessage)) {
      return NextResponse.json({
        emergency: true,
        text: 'EMERGENCY_RED_FLAG_DETECTED',
      });
    }

    // 3. Grounded System Prompt
    const bandKey = getIndiaBandKey(safePm25);
    const outdoorInfo = outdoorGuidance(bandKey, null, 'whole_family', household, language);
    const outdoorLevel = outdoorInfo.level;

    const isRegional = language !== 'en';
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    const langName = langInfo ? langInfo.name : language;

    let languageDirective = '';
    if (isRegional) {
      languageDirective = `BILINGUAL FORMATTING REQUIREMENT (MANDATORY):
The user selected the regional language: ${langName} (${langInfo?.nativeName || ''}).
1. First, provide your complete answer in ${langName} in the natural native script following the exact 3-part layout (2-3 lines top + 3-4 bullet points + 1 closing line).
2. Then, output a single newline, then EXACTLY the delimiter line:
---EN---
3. Then, provide the matching concise English version below it using the same 3-part layout.
Keep both language sections brief, punchy, and under 110 words each. The delimiter line must be exactly "---EN---" on its own line.`;
    } else {
      languageDirective = `Output language: English only. Follow the exact 3-part layout (2-3 lines top + 3-4 bullet points + 1 closing line). DO NOT output any "---EN---" delimiter.`;
    }

    const dataSourceDesc =
      dataType === 'measured'
        ? `Measured physical reading from government monitoring station "${stationName || 'Nearby Station'}" (${timestamp || 'recent reading'})`
        : `Forecast model estimate from Open-Meteo (${timestamp || 'current hour'})`;

    const actionCatalogSummary = (actionsData as unknown as ActionItemCatalog[])
      .map(
        (a: ActionItemCatalog) =>
          `- ${a.title} (${a.group || 'Indoors'}): ${a.doThis || ''} Why: ${a.whyItWorks || a.why || ''}`
      )
      .join('\n');

    const systemPrompt = `You are Clearhale, an empathetic, scientifically grounded clean air coach for Indian families.
Current Context:
- User Location: ${city}
- Current PM2.5: ${safePm25} µg/m³
- Data Type: ${dataType} (${dataSourceDesc})
- Household Profile: ${JSON.stringify(household)}

${languageDirective}

CONCISENESS & LAYOUT RULES (MANDATORY):
1. Keep the entire response bite-sized, practical, and strictly under 120 words (around 500-650 characters). People do NOT read long walls of text.
2. Structure your answer in EXACTLY this 3-part format:
   [Part 1 - Top 2-3 Lines]: Exactly 2 to 3 concise, direct sentences answering the user's specific question with a warm, caring tone.
   
   [Part 2 - Exactly 3 to 4 Bullet Points]:
   • **[Action Name]**: One short, punchy sentence explaining the concrete action and why.
   • **[Action Name]**: One short, punchy sentence.
   • **[Action Name]**: One short, punchy sentence.
   
   [Part 3 - Closing Line]: Exactly 1 short, encouraging concluding sentence.
3. Every bullet point must be on its own line and start with a bullet '• ' and a bold title '**...**: '. Never write multiple sentences inside one bullet.
4. Ensure your answer is fully complete and never cuts off mid-sentence.

STRICT DATA INTEGRITY & SCIENTIFIC GUARDRAILS:
1. NEVER invent, hallucinate, or alter any PM2.5 or AQI number. Use ONLY the exact numbers provided in the context above. Never state any air-quality value not in the context.
2. If the data type is an estimate ("estimate"), explicitly refer to the numbers as a "forecast estimate" or "model estimate" if referencing the current reading.
3. NEVER diagnose or prescribe medications, inhaler doses, steroids, or syrups.
4. Ground all home air improvement recommendations in these approved interventions:
${actionCatalogSummary}
5. Only use these verified numeric claims:
   - Portable HEPA purifier: ~50-80% indoor PM2.5 reduction with closed windows.
   - DIY box-fan with MERV-13: ~40-70% reduction (never run unattended or while sleeping).
   - Closed windows alone: still allows ~55-60% of outdoor PM2.5 indoors; pair with active filtration.
   - Fitted N95 respirator: protects against fine particulates outdoors (not for children under 2).
6. Houseplants, cloth masks/scarves, salt lamps, open water bowls, and detox drinks are scientifically verified MYTHS for PM2.5 smog protection. Explicitly clarify this if asked.`;

    const conversationHistory: AIMessage[] = Array.isArray(history)
      ? (history as unknown[])
          .filter(
            (h): h is { role: 'user' | 'assistant'; content: string } =>
              Boolean(h && typeof h === 'object' && ('role' in h) && ('content' in h) && typeof (h as { content?: unknown }).content === 'string')
          )
          .slice(-6)
      : [];

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: cleanMessage },
    ];

    const fallbackTemplateText = sanitizeChatOutdoorAdvice(
      getOfflineChatReply(cleanMessage, language, safePm25),
      outdoorLevel,
      language
    );

    // 4. Stream response with fallback abstraction
    const streamResponse = await stream(messages, {
      systemPrompt,
      language,
      temperature: 0.2,
      maxTokens: isRegional ? 800 : 450,
      fallbackTemplateText,
      sessionHadTip,
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Chat route error:', errorMsg);
    return new Response(
      'Keep windows closed, run indoor filtration (True HEPA or DIY MERV-13), and wear an N95 respirator if stepping outdoors.',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}

function getOfflineChatReply(message: string, language: string, pm2_5: number): string {
  const lower = message.toLowerCase();

  const getEnglish = () => {
    if (pm2_5 <= 60) {
      if (lower.includes('office') || lower.includes('wfh') || lower.includes('commute') || lower.includes('outside')) {
        return `Current air in your city is in the Pleasant range with PM2.5 at ${pm2_5} µg/m³. Outdoor air is clean, comfortable, and safe for your commute and normal daily routine today.

• **Office Commuting**: Safe to travel normally without needing particulate masks.
• **Natural Ventilation**: Open home and car windows to let clean fresh air circulate.
• **Outdoor Activities**: Walking, sports, and outdoor errands are completely safe today.

Enjoy the clear weather while current favorable conditions last!`;
      }
      return `Air quality is currently in a safe and comfortable range with PM2.5 at ${pm2_5} µg/m³. You and your family can comfortably go about your daily routine without smog concerns today.

• **Outdoor Time**: Safe for morning walks, children playing, and outdoor sports.
• **Fresh Air**: Open home and office windows for natural ventilation.
• **Sensitive Groups**: Children, seniors, and asthma patients can move freely outside.

Take advantage of today's clean air conditions!`;
    }
    if (lower.includes('purifier') || lower.includes('filter')) {
      return `Indoor air protection is vital during elevated smog episodes. Here is what science confirms about cleaning the air in your living and sleeping areas:

• **True HEPA Purifiers**: Run continuously with closed doors; cuts indoor PM2.5 by ~50-80%.
• **DIY Box-Fan Filter**: Use MERV-13 media for a ~40-70% drop (always supervise while running).
• **Sealing Windows**: Keeping windows shut retains ~55-60% of outdoor smoke, so pair with filtration.
• **Avoid Myths**: Salt lamps, open water bowls, and houseplants do not filter fine PM2.5.

Prioritize filtering the room where your family sleeps first.`;
    }
    if (lower.includes('mask') || lower.includes('cloth')) {
      return `Protecting your lungs outdoors requires the right barrier against toxic fine particles. Here is how to protect yourself when stepping outside:

• **Fitted N95 Respirator**: The proven standard; seals against microscopic PM2.5 (not for kids under 2).
• **Cloth Masks & Scarves (Myth)**: Fabric weave gaps are too large; they offer virtually zero smog protection.
• **Check the Seal**: Ensure edges fit tightly around your nose and chin with no air leaks.
• **Limit Exposure**: Even with an N95, minimize intense physical exertion during heavy smog.

Keep an N95 handy for all necessary commutes!`;
    }
    return `Current measured PM2.5 is elevated at ${pm2_5} µg/m³ in your area. Sensitive family members and daily commuters should take immediate precautions to reduce particulate inhalation:

• **Keep Windows Closed**: Seal doors and windows during cold inversion hours to block outdoor smog.
• **Run Indoor Filtration**: Operate True HEPA or DIY MERV-13 filtration in your sleeping rooms.
• **Wear an N95 Outdoors**: Wear a well-fitted N95 respirator for any unavoidable commute.
• **Exercise Indoors**: Shift physical workouts indoors and avoid morning cold hours.

Stay protected and keep indoor air clean and circulated!`;
  };

  if (language === 'en') {
    return getEnglish();
  }

  let nativeText = '';
  if (language === 'mr') {
    if (lower.includes('purifier') || lower.includes('प्युरिफायर') || lower.includes('filter')) {
      nativeText = `घरातील हवा स्वच्छ ठेवण्यासाठी शास्त्रोक्त उपाय महत्त्वाचे आहेत. सध्याच्या हवेनुसार घरातील धूर कमी करण्याचे मुख्य मार्ग खालीलप्रमाणे आहेत:

• **HEPA प्युरिफायर**: खिडक्या-दारे बंद ठेवून चालवल्यास घरातील PM2.5 ५०-८०% कमी होते.
• **DIY बॉक्स-फॅन**: MERV-13 फिल्टरसह ४०-७०% घट होते (झोपताना एकटे सुरू ठेवू नका).
• **दारे-खिडक्या बंद ठेवा**: नुसती खिडकी बंद ठेवून ५५-६०% धूर आत येतो, फिल्टर आवश्यक आहे.
• **अंधश्रद्धा टाळा**: झाडे किंवा मिठाचे दिवे सूक्ष्म PM2.5 धूर रोखू शकत नाहीत.

कुटुंबाच्या झोपण्याच्या खोलीत प्रथम हवा स्वच्छ ठेवण्यावर भर द्या!`;
    } else if (lower.includes('mask') || lower.includes('मास्क') || lower.includes('कापड')) {
      nativeText = `बाहेर पडताना धुरापासून फुफ्फुसांचे रक्षण करण्यासाठी योग्य मास्क निवडणे आवश्यक आहे. वैज्ञानिक तथ्ये खालीलप्रमाणे आहेत:

• **N95 रेस्पिरेटर**: सूक्ष्म PM2.5 पासून सर्वोत्तम संरक्षण देतो (२ वर्षांखालील मुलांसाठी नाही).
• **कापडी रुमाल (भ्रम)**: कापडाचे छिद्र मोठे असल्याने ते विषारी धूर रोखू शकत नाही.
• **मास्कचा घट्टपणा**: नाकाभोवती व हनुवटीवर कोणतीही हवा गळती होणार नाही याची खात्री करा.
• **सकाळी काळजी**: जास्त धूर असताना बाहेर धावणे किंवा जड व्यायाम टाळा.

बाहेर जाताना N95 मास्क वापरून सुरक्षित राहा!`;
    } else {
      nativeText = `तुमच्या शहरात सध्या PM2.5 ची पातळी ${pm2_5} µg/m³ आहे. घरातील लहान मुले, वृद्ध आणि दमा असलेल्या व्यक्तींनी पुढील काळजी घेणे गरजेचे आहे:

• **खिडक्या व दारे बंद ठेवा**: सकाळी धुके व धूर असताना बाहेरील हवा आत येऊ देऊ नका.
• **घरात एअर फिल्टर वापरा**: झोपण्याच्या खोलीत HEPA किंवा DIY फिल्टर चालवा.
• **बाहेर पडताना N95 मास्क**: आवश्यक कामासाठी बाहेर जाताना चांगला N95 मास्क वापरा.
• **व्यायाम घरात करा**: मैदानावर धावण्याऐवजी घरातच हलका व्यायाम करा.

योग्य काळजी घ्या आणि घरातील हवा सुरक्षित ठेवा!`;
    }
  } else if (language === 'ta') {
    if (lower.includes('purifier') || lower.includes('பியூரிஃபையர்') || lower.includes('filter')) {
      nativeText = `வீட்டு காற்றை சுத்தமாக வைத்திருக்க அறிவியல் வழிகாட்டுதல் மிகவும் முக்கியமானது. தற்போதைய நிலையில் முக்கிய பாதுகாப்பு வழிகள்:

• **HEPA பியூரிஃபையர்**: கதவு-ஜன்னல்களை மூடி இயக்கினால் PM2.5 அளவை 50-80% குறைக்கலாம்.
• **DIY பாக்ஸ்-ஃபேன்**: MERV-13 ஃபில்டருடன் 40-70% துகள் குறைப்பு சாத்தியமாகும்.
• **ஜன்னல்களை மூடுதல்**: ஜன்னல்களை மூடினாலும் 55-60% புகை உள்ளே கசியும், ஃபில்டர் அவசியம்.
• **தவறான நம்பிக்கைகள்**: செடிகள் அல்லது உப்பு விளக்குகளால் நுண்ணிய PM2.5-ஐ தடுக்க முடியாது.

குடும்பத்தினர் தூங்கும் அறையை முதலில் பாதுகாப்பாக மாற்றுங்கள்!`;
    } else if (lower.includes('mask') || lower.includes('மாஸ்க்') || lower.includes('துணி')) {
      nativeText = `வெளியே செல்லும்போது நுரையீரலைப் பாதுகாக்க சரியான முகக்கவசம் அவசியம். அறிவியல் உண்மைகள்:

• **N95 ரெஸ்பிரேட்டர்**: நுண்ணிய PM2.5 துகள்களிலிருந்து சிறந்த பாதுகாப்பு தருகிறது (2 வயதுக்குட்பட்ட குழந்தைகளுக்கு அல்ல).
• **துணி மாஸ்க் (தவறான நம்பிக்கை)**: துணி இடைவெளிகள் பெரியவை; நச்சுப் புகையைத் தடுக்காது.
• **சரியான பொருத்தம்**: காற்று கசியாதவாறு மூக்கு மற்றும் தாடையில் இறுக்கமாகப் பொருந்த வேண்டும்.
• **வெளியே உடற்பயிற்சி**: அதிக புகைமூட்டம் இருக்கும்போது வெளியே கடின உடற்பயிற்சியைத் தவிர்க்கவும்.

வெளியே செல்லும்போது N95 மாஸ்க் அணிந்து பாதுகாப்பாக இருங்கள்!`;
    } else {
      nativeText = `உங்கள் பகுதியில் தற்போதைய PM2.5 அளவு ${pm2_5} µg/m³ ஆக உள்ளது. குழந்தைகள், முதியவர்கள் மற்றும் ஆஸ்துமா நோயாளிகள் உடனே இந்த முன்னெச்சரிக்கைகளை எடுக்க வேண்டும்:

• **ஜன்னல்களை மூடி வைக்கவும்**: அதிகாலை குளிர் மற்றும் புகைக் காற்று உள்ளே வருவதைத் தடுக்கவும்.
• **வீட்டில் ஃபில்டரை இயக்கவும்**: படுக்கையறையில் HEPA அல்லது DIY MERV-13 ஃபில்டரை இயக்கவும்.
• **வெளியே N95 மாஸ்க் அணியவும்**: அவசியமான பயணங்களுக்கு வெளியே செல்லும்போது N95 மாஸ்க் அணியவும்.
• **உடற்பயிற்சியை வீட்டிற்குள் செய்யவும்**: வெளியே ஓடுவதற்குப் பதிலாக வீட்டிற்குள் உடற்பயிற்சி செய்யவும்.

பாதுகாப்பாக இருங்கள் மற்றும் குடும்பத்தின் சுவாசத்தைப் பாதுகாக்கவும்!`;
    }
  } else if (language === 'bn') {
    if (lower.includes('purifier') || lower.includes('পিউরিফায়ার') || lower.includes('filter')) {
      nativeText = `ঘরের বাতাস দূষণমুক্ত রাখতে বৈজ্ঞানিক ব্যবস্থা নেওয়া অত্যন্ত জরুরি। বর্তমান আবহাওয়ায় মূল করণীয়:

• **HEPA পিউরিফায়ার**: দরজা-জানালা বন্ধ করে চালালে ঘরের ভেতরের PM2.5 প্রায় ৫০-৮০% কমে।
• **DIY বক্স-ফ্যান**: MERV-13 ফিল্টারের সাথে ৪০-৭০% ধোঁয়াশা দূর হয় (ঘুমের সময় একা চালাবেন না)।
• **জানালা বন্ধ রাখা**: জানালা বন্ধ রাখলেও ৫৫-৬০% ধোঁয়া ঢোকে, তাই এয়ার ফিল্টার দরকার।
• **ভুল ধারণা এড়ান**: ইনডোর গাছপালা বা লবণের বাতি সূক্ষ্ম PM2.5 আটকাতে পারে না।

পরিবারের শোবার ঘরের বাতাসকে প্রথমে সুরক্ষিত করুন!`;
    } else if (lower.includes('mask') || lower.includes('মাস্ক') || lower.includes('কাপড়')) {
      nativeText = `বাইরে বের হওয়ার সময় ফুসফুস রক্ষায় সঠিক মাস্ক নির্বাচন করা প্রয়োজন। বৈজ্ঞানিক তথ্য:

• **N95 রেসপিরেটর**: সূক্ষ্ম PM2.5 কণা থেকে সবচেয়ে কার্যকর সুরক্ষা দেয় (২ বছরের নিচের শিশুদের জন্য নয়)।
• **কাপড়ের মাস্ক (ভুল ধারণা)**: কাপড়ের ফাঁক দিয়ে বিষাক্ত ধোঁয়াশা আটকানো সম্ভব নয়।
• **সঠিক ফিটিং**: মাস্কটি নাক ও চিবুকে শক্তভাবে বসছে কিনা তা নিশ্চিত করুন।
• **বাইরে ব্যায়াম নয়**: তীব্র ধোঁয়াশার সময় বাইরে জগিং বা ভারী শরীরচর্চা এড়িয়ে চলুন।

বাইরে বের হলে N95 মাস্ক পরে সুরক্ষিত থাকুন!`;
    } else {
      nativeText = `আপনার এলাকায় বর্তমান PM2.5 মাত্রা ${pm2_5} µg/m³। শিশু, বয়স্ক ও শ্বাসকষ্টের রোগীদের অবিলম্বে এই সতর্কতা নেওয়া উচিত:

• **দরজা-জানালা বন্ধ রাখুন**: সকালের ঠান্ডা বাতাস ও বিষাক্ত ধোঁয়াশা ঘরে ঢুকতে দেবেন না।
• **ঘরে এয়ার ফিল্টার চালান**: শোবার ঘরে HEPA বা DIY MERV-13 ফিল্টার ব্যবহার করুন।
• **বাইরে N95 মাস্ক পরুন**: যেকোনো জরুরি কাজে বের হওয়ার সময় টাইট N95 মাস্ক লাগান।
• **ঘরের ভেতর ব্যায়াম করুন**: বাইরে জগিংয়ের বদলে ঘরের ভেতরে হালকা যোগব্যায়াম করুন।

সতর্ক থাকুন এবং পরিবারের শ্বাস-প্রশ্বাস সুরক্ষিত রাখুন!`;
    }
  } else {
    // Hindi default for regional
    if (lower.includes('purifier') || lower.includes('प्यूरीफायर') || lower.includes('filter')) {
      nativeText = `घर की हवा को सुरक्षित रखने के लिए वैज्ञानिक उपाय बेहद जरूरी हैं। स्मॉग के दौरान इन मुख्य बातों का ध्यान रखें:

• **HEPA प्यूरीफायर**: खिड़की-दरवाजे बंद करके चलाने पर घर के अंदर PM2.5 में 50-80% तक कमी आती है।
• **DIY बॉक्स-फैन**: MERV-13 फिल्टर के साथ 40-70% तक प्रदूषण घटता है (सोते समय खुला न छोड़ें)।
• **खिड़कियां बंद रखना**: खिड़की बंद करने पर भी 55-60% धुआं अंदर आता है, इसलिए फिल्टर जरूरी है।
• **भ्रम से बचें**: इनडोर पौधे या नमक के दीये जहरीले PM2.5 को साफ नहीं कर सकते।

परिवार के सोने वाले कमरे में हवा को सबसे पहले सुरक्षित बनाएं!`;
    } else if (lower.includes('mask') || lower.includes('मास्क') || lower.includes('कपड़ा')) {
      nativeText = `बाहर निकलते समय फेफड़ों को सुरक्षित रखने के लिए सही मास्क का चुनाव जरूरी है। वैज्ञानिक तथ्य इस प्रकार हैं:

• **N95 रेस्पिरेटर**: सूक्ष्म PM2.5 कणों से यही सबसे असरदार सुरक्षा देता है (2 साल से छोटे बच्चों के लिए नहीं)।
• **कपड़े का मास्क / रुमाल (भ्रम)**: कपड़े के महीन छिद्र जहरीले स्मॉग को बिल्कुल नहीं रोक पाते।
• **सही फिटिंग**: मास्क नाक और ठोड़ी पर पूरी तरह फिट होना चाहिए ताकि हवा लीक न हो।
• **व्यायाम से बचें**: अधिक स्मॉग के दौरान बाहर भारी कसरत या जॉगिंग न करें।

बाहर निकलते समय N95 मास्क जरूर पहनें और सुरक्षित रहें!`;
    } else {
      nativeText = `आपके इलाके में वर्तमान PM2.5 का स्तर ${pm2_5} µg/m³ है। बच्चों, बुजुर्गों और सांस के मरीजों के लिए तुरंत यह सावधानियां बरतें:

• **खिड़की-दरवाजे बंद रखें**: सुबह की ठंडी हवा और स्मॉग को घर के अंदर आने से रोकें।
• **कमरे में फिल्टर चलाएं**: सोने के कमरे में HEPA या DIY MERV-13 फिल्टर का उपयोग करें।
• **बाहर N95 मास्क पहनें**: किसी भी जरूरी काम के लिए बाहर जाते समय N95 मास्क लगाएं।
• **व्यायाम घर के अंदर करें**: सुबह की सैर या आउटडोर एक्सरसाइज की जगह घर पर हल्का योग करें।

सावधानी बरतें और अपने परिवार की सांसों को सुरक्षित रखें!`;
    }
  }

  return `${nativeText}\n---EN---\n${getEnglish()}`;
}
