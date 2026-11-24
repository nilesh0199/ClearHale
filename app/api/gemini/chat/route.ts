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
1. First, provide your complete helpful answer in ${langName} in the natural native script.
2. Then, output a single newline, then EXACTLY the delimiter line:
---EN---
3. Then, provide a concise, structured English version of the response below it.
Never omit either part. The delimiter line must be exactly "---EN---" on its own line.`;
    } else {
      languageDirective = `Output language: English only. DO NOT output any "---EN---" delimiter.`;
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

    const systemPrompt = `You are Clearhale, an empathetic, scientifically rigorous air-quality and smog advisor for families in India navigating severe winter smog.
Current Context:
- User Location: ${city}
- Current PM2.5: ${safePm25} µg/m³
- Data Type: ${dataType} (${dataSourceDesc})
- Household Profile: ${JSON.stringify(household)}

${languageDirective}

STRICT DATA INTEGRITY & SCIENTIFIC GUARDRAILS:
1. NEVER invent, hallucinate, or alter any PM2.5 or AQI number. Use ONLY the exact numbers provided in the context above. Never state any air-quality value not in the context.
2. If the data type is an estimate ("estimate"), explicitly refer to the numbers as a "forecast estimate" or "model estimate" if referencing the current reading.
3. NEVER diagnose or prescribe medications, inhaler doses, steroids, or syrups.
4. Ground all home air improvement recommendations in these approved interventions:
${actionCatalogSummary}
5. Only use these verified numeric claims:
   - Portable HEPA purifier in the main room: may cut indoor PM2.5 by about 50-80% when run continuously with doors and windows closed.
   - DIY box-fan filter with MERV-13 filters: about 40-70% reduction in studies; include electrical and fire safety notes, never leave it running unattended while sleeping.
   - Keeping windows and doors closed during a smog episode: indoor PM2.5 still tends to be about 55-60% of outdoor levels, so pair it with filtration.
   - A well-fitted N95 respirator: reduces fine-particle exposure when outdoors is unavoidable; fit matters; not for children under 2.
6. Houseplants, cloth masks/scarves, salt lamps, open water bowls, and detox drinks are scientifically verified MYTHS for PM2.5 smog protection. Explicitly clarify this if asked.
7. Structure your answer with clear bullet points, actionable tips, and a caring, protective tone. Ensure your response is fully complete and never cuts off mid-sentence. Always conclude with an encouraging closing sentence.`;

    const conversationHistory: AIMessage[] = Array.isArray(history)
      ? (history as unknown[])
          .filter(
            (h): h is { role: 'user' | 'assistant'; content: string } =>
              Boolean(h && typeof h === 'object' && ('role' in h) && ('content' in h) && typeof (h as any).content === 'string')
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
      maxTokens: 1000,
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
        return `Air is in the Pleasant / Good range (${pm2_5} µg/m³):\n\n• **Office & Commuting:** It is completely safe to commute to office today! Outdoor air quality is comfortable and well within safe limits.\n• **Indoor Ventilation:** Feel free to open windows for natural fresh air ventilation.\n• **Outdoor Activities:** Walking, jogging, and outdoor exercise are safe to enjoy without needing a mask.`;
      }
      return `Good Air Guidance for current PM2.5 (${pm2_5} µg/m³):\n\n1. **Air is Clean & Safe:** Current levels are comfortable for normal everyday activities.\n2. **Open Windows:** Perfect time for natural ventilation to refresh indoor air.\n3. **Outdoor Time:** Enjoy outdoor walks, errands, and sports safely without masks.\n4. **Sensitive Members:** Safe for children and seniors to spend time outside.`;
    }
    if (lower.includes('purifier') || lower.includes('filter')) {
      return `Evidence-based Air Cleaning Guidance:\n\n• **Portable True HEPA Purifier:** May reduce indoor PM2.5 by about 50-80% when run continuously with doors and windows closed.\n• **Low-Cost DIY Box-Fan Filter:** Studies demonstrate about 40-70% particle reduction using MERV-13 media taped to a box fan. (Safety note: Always check fan temperature, use fused plugs, and never leave running unattended or while sleeping).\n• **Sealing Windows & Doors:** Keeping windows shut keeps indoor PM2.5 at roughly 55-60% of outdoor levels, meaning active filtration is still recommended.`;
    }
    if (lower.includes('mask') || lower.includes('cloth')) {
      return `Masking & Protection Facts:\n\n• **A well-fitted N95 respirator:** Effectively reduces fine-particle exposure when stepping outdoors is unavoidable. A tight seal is critical; not suitable for children under 2.\n• **Cloth masks & handkerchiefs (Myth):** Woven fabrics have microscopic gaps far larger than PM2.5 particles and provide virtually zero respiratory protection against toxic winter smog.`;
    }
    return `Core Recommendations for current PM2.5 (${pm2_5} µg/m³):\n\n1. **Keep windows & doors closed** during cold morning hours (reduces exposure to ~57% of outdoor levels).\n2. **Run HEPA or DIY MERV-13 filtration** in sleeping rooms.\n3. **Wear an N95 respirator** for any necessary commute.\n4. **Shift outdoor exercise indoors** and avoid morning cold hours.`;
  };

  if (language === 'en') {
    return getEnglish();
  }

  let nativeText = '';
  if (language === 'mr') {
    if (lower.includes('purifier') || lower.includes('प्युरिफायर') || lower.includes('filter')) {
      nativeText = `हवा शुद्ध करण्याचे वैज्ञानिक उपाय:\n\n• **पोर्टेबल HEPA प्युरिफायर:** खिडक्या व दारे बंद करून सतत चालवल्यास घरातील PM2.5 मध्ये ५०-८०% घट होऊ शकते.\n• **कमी खर्चाचा DIY बॉक्स-फॅन:** MERV-13 फिल्टरसह ४०-७०% घट दिसून आली आहे (सुरक्षा: झोपताना सुरू ठेवू नका).\n• **खिडक्या बंद ठेवणे:** खिडक्या बंद ठेवल्या तरी ५५-६०% धूर आत येतो, म्हणून फिल्टर आवश्यक आहे.`;
    } else if (lower.includes('mask') || lower.includes('मास्क') || lower.includes('कापड')) {
      nativeText = `मास्कची खरी माहिती:\n\n• **N95 रेस्पिरेटर:** बाहेर पडताना N95 मास्क सर्वोत्तम संरक्षण देतो (२ वर्षांखालील मुलांसाठी नाही).\n• **कापडी मास्क / रुमाल:** हा केवळ भ्रम आहे; कापडाचे छिद्र सूक्ष्म PM2.5 रोखू शकत नाहीत.`;
    } else {
      nativeText = `आजच्या हवेनुसार (${pm2_5} µg/m³) मुख्य कृती:\n\n1. खिडक्या व दारे बंद ठेवा.\n2. बाहेर जाताना N95 मास्क वापरा.\n3. सकाळी धुके असताना बाहेर व्यायाम टाळा.\n4. फरशी ओल्या कपड्याने पुसा.`;
    }
  } else if (language === 'ta') {
    if (lower.includes('purifier') || lower.includes('பியூரிஃபையர்') || lower.includes('filter')) {
      nativeText = `காற்று சுத்திகரிப்பு அறிவியல் வழிகாட்டுதல்:\n\n• **போர்ட்டபிள் HEPA பியூரிஃபையர்:** கதவு மற்றும் ஜன்னல்களை மூடி தொடர்ந்து இயக்கினால் வீட்டிற்குள் PM2.5 அளவை 50-80% குறைக்கலாம்.\n• **குறைந்த செலவு DIY பாக்ஸ்-ஃபேன்:** MERV-13 ஃபில்டருடன் 40-70% துகள் குறைப்பு சாத்தியமாகும்.\n• **ஜன்னல்களை மூடுதல்:** ஜன்னல்களை மூடினாலும் 55-60% காற்று உள்ளே கசியும், எனவே ஃபில்டர் அவசியம்.`;
    } else if (lower.includes('mask') || lower.includes('மாஸ்க்') || lower.includes('துணி')) {
      nativeText = `முகக்கவசம் பற்றிய உண்மை விவரம்:\n\n• **N95 ரெஸ்பிரேட்டர்:** வெளியே செல்லும்போது சிறந்த பாதுகாப்பைத் தரும் (2 வயதுக்குட்பட்ட குழந்தைகளுக்கு அல்ல).\n• **துணி மாஸ்க் / கைக்குட்டை:** இது ஒரு தவறான நம்பிக்கை; நுண்ணிய PM2.5 துகள்களை துணியால் தடுக்க முடியாது.`;
    } else {
      nativeText = `இன்றைய காற்று தரத்திற்கு (${pm2_5} µg/m³) முக்கிய வழிகாட்டுதல்:\n\n1. கதவு மற்றும் ஜன்னல்களை மூடி வைக்கவும்.\n2. வெளியே செல்லும்போது N95 மாஸ்க் அணியவும்.\n3. அதிகாலை வெளிப்புற உடற்பயிற்சியைத் தவிர்க்கவும்.\n4. வீட்டை ஈரமான துணியால் துடைக்கவும்.`;
    }
  } else if (language === 'bn') {
    if (lower.includes('purifier') || lower.includes('পিউরিফায়ার') || lower.includes('filter')) {
      nativeText = `বায়ু পরিশোধনের বৈজ্ঞানিক নির্দেশিকা:\n\n• **পোর্টেবল HEPA পিউরিফায়ার:** দরজা-জানালা বন্ধ করে চালালে ঘরের ভেতরের PM2.5 প্রায় ৫০-৮০% কমানো যায়।\n• **স্বল্প খরচের DIY বক্স-ফ্যান:** MERV-13 ফিল্টারের সাথে ৪০-৭০% ধোঁয়াশা দূর হয়।\n• **জানালা বন্ধ রাখা:** জানালা বন্ধ রাখলেও ৫৫-৬০% দূষণ ঘরে ঢোকে, তাই এয়ার ফিল্টার দরকার।`;
    } else if (lower.includes('mask') || lower.includes('মাস্ক') || lower.includes('কাপড়')) {
      nativeText = `মাস্ক সংক্রান্ত সঠিক তথ্য:\n\n• **N95 রেসপিরেটর:** বাইরে বের হলে সর্বোচ্চ সুরক্ষা দেয় (২ বছরের নিচের শিশুদের জন্য নয়)।\n• **কাপড়ের মাস্ক / রুমাল:** এটি একটি ভ্রান্ত ধারণা; কাপড়ের ফাঁক দিয়ে সূক্ষ্ম PM2.5 আটকানো যায় না।`;
    } else {
      nativeText = `আজকের বায়ুর মাত্রা (${pm2_5} µg/m³) অনুযায়ী সুরক্ষা পরামর্শ:\n\n১. দরজা ও জানালা বন্ধ রাখুন।\n২. বাইরে বের হলে টাইট N95 মাস্ক পরুন।\n৩. ভোরের ধোঁয়াশায় বাইরে ব্যায়াম এড়িয়ে চলুন।\n৪. ঘরে ভেজা কাপড় দিয়ে মুছুন।`;
    }
  } else {
    // Hindi default for regional
    if (lower.includes('purifier') || lower.includes('प्यूरीफायर') || lower.includes('filter')) {
      nativeText = `हवा शुद्ध करने के उपाय (वैज्ञानिक आधार):\n\n• **पोर्टेबल HEPA प्यूरीफायर:** यदि खिड़की-दरवाजे बंद करके लगातार चलाया जाए, तो यह घर के अंदर PM2.5 को लगभग 50-80% तक कम कर सकता है।\n• **कम लागत वाला DIY बॉक्स-फैन:** MERV-13 फिल्टर के साथ पंखा लगाने पर अध्ययनों में 40-70% तक की कमी देखी गई है (सावधानी: सोते समय इसे खुला न छोड़ें)।\n• **खिड़कियां बंद रखना:** स्मॉग में खिड़की-दरवाजे बंद रखने पर भी बाहरी प्रदूषण का 55-60% हिस्सा अंदर रिसता है, इसलिए इसे एयर फिल्टर के साथ जोड़ना सबसे अच्छा है।`;
    } else if (lower.includes('mask') || lower.includes('मास्क') || lower.includes('कपड़ा')) {
      nativeText = `मास्क की सही जानकारी:\n\n• **N95 रेस्पिरेटर:** बाहर जाने पर अच्छी तरह फिट N95 मास्क महीन कणों से प्रभावी सुरक्षा देता है (2 साल से छोटे बच्चों के लिए नहीं)।\n• **कपड़े का मास्क / रुमाल:** यह केवल बड़ा कचरा रोकता है, लेकिन PM2.5 से कोई सुरक्षा नहीं देता। इसे स्मॉग सुरक्षा का भ्रम माना गया है।`;
    } else {
      nativeText = `आज के वायु स्तर (${pm2_5} µg/m³) के अनुसार मुख्य सुरक्षा कदम:\n\n1. खिड़की और दरवाजे बंद रखें।\n2. बाहर निकलने पर टाइट N95 मास्क पहनें।\n3. सुबह की धूप निकलने से पहले बाहर सैर या कसरत करने से बचें।\n4. घर में गीला पोछा लगाएं, सूखी झाड़ू न लगाएं।`;
    }
  }

  return `${nativeText}\n---EN---\n${getEnglish()}`;
}
