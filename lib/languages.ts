import type { LanguageOption, SupportedLanguage, CityLocation } from '@/types';
import actionsData from '@/data/actions.json';

export {
  DEFAULT_LANGUAGE_CAPABILITIES,
  getLanguageCapability,
  isSttSupported,
  isTtsSupported,
  getLanguageAiProvider,
  type LanguageCapability,
} from './ai/config';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
];

export const VOICE_LANGUAGE_LOCALES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

export const UI_TRANSLATIONS = {
  en: {
    appName: 'Clearhale',
    tagline: 'Breathe clearer, one smart choice at a time.',
    getStarted: 'Get started',
    tryDemo: 'Try demo (Delhi preset)',
    demoBadge: 'Demo Mode (Offline Preset)',
    cachedBadge: 'Cached Data',
    minutesAgo: 'min ago',
    tabs: {
      home: 'Home',
      plan: 'Action Plan',
      ask: 'Ask Clearhale',
      care: 'Care',
      learn: 'Care',
      profile: 'Settings',
    },
    home: {
      subtitle: "Today's air for your family",
      nextTwoHours: 'Next 2 Hours Decision',
      topActions: 'Top Recommended Actions',
      forecast24h: '24-Hour Forecast & Air Spread',
      bestWindow: 'Cleanest Window',
      updated: 'Updated',
      sourceNote: 'Open-Meteo Air Quality Model (Forecast Estimate)',
      familyFilter: {
        all: 'Whole Family',
        child: 'Baby & Kids',
        elderly: 'Elderly',
        pregnant: 'Pregnant Person',
        worker: 'Outdoor Worker',
      },
      pm25Label: 'PM2.5 (µg/m³)',
      aqiLabel: 'US AQI',
      pm10Label: 'PM10',
      viewFullPlan: 'View Full Plan',
      pm25Level: 'PM2.5 Level',
      childVuln: 'Baby & Child Vulnerability:',
      seniorVuln: 'Senior Vulnerability:',
      pregnantVuln: 'Pregnancy Vulnerability:',
      workerVuln: 'Worker Vulnerability:',
      familyVuln: 'Family Guidance:',
      refining: 'Refining...',
    },
    plan: {
      title: 'Action Plan',
      subtitle: 'Instant science-backed routines tailored to your home and today\'s smog.',
      whatIfTitle: 'What-If Indoor Exposure Simulator',
      whatIfNote: 'Estimate based on 57.5% outside air leaking in with closed windows and filter midpoint efficiency.',
      outdoorBaseline: 'Outdoor PM2.5',
      estimatedIndoor: 'Est. Indoor PM2.5',
      reduction: 'Smoke reduction',
      assumptionsTitle: 'Scientific Assumptions',
      expandDetails: 'Details & Safety',
      evidence: 'Evidence',
      cost: 'Cost',
      markDone: 'Mark as done',
      done: 'Completed today',
      windowsDoors: 'Exterior Windows & Doors',
      closed: 'Closed (57.5% Leaks In)',
      open: 'Open (100% Leaks In)',
      filterType: 'Indoor Air Filter Active',
      none: 'None',
      hepa: 'Portable True HEPA (65% cut)',
      diyBox: 'DIY MERV-13 Fan (55% cut)',
      viewAssumptions: 'View Scientific Modeling Assumptions',
      prioritizingFor: 'Prioritizing actions for:',
      personaMatched: 'Persona-matched actions appear first',
      expectedEffect: 'Expected Effect',
      safetyNote: 'Safety Note',
      scientificCitation: 'Scientific Citation',
    },
    ask: {
      title: 'Ask Clearhale AI',
      subtitle: 'Ask about your child, masking, cooking, or purifiers. Grounded in peer-reviewed science.',
      placeholder: 'Ask a question in your preferred language...',
      send: 'Send',
      chips: [
        'No purifier, what now?',
        'Can my child play outside today?',
        'Which mask works best for school commutes?',
        'Is morning walking safe today?',
      ],
      emergencyWarning: 'Immediate Medical Alert',
      call112: 'Call 112 (Emergency Services)',
      medicalDisclaimer: 'Air-quality guidance only, not medical advice.',
      groundedSafe: 'Grounded & Safe',
      consulting: 'Consulting science catalog...',
    },
    care: {
      title: 'Care & Air Knowledge',
      subtitle: 'Guided breathing sessions, smog myth busters, and plain-language air quality terms.',
      tabs: {
        breathe: 'Breathe',
        learn: 'Learn',
        terms: 'Terms',
      },
    },
    learn: {
      title: 'Smog Science & Myths',
      subtitle: 'Separate effective air defenses from ineffective popular myths.',
      tabs: {
        breathe: 'Breathe',
        learn: 'Learn',
        terms: 'Terms',
      },
      breathe: {
        title: 'Indoor Calm Breathing',
        subtitle: 'Gentle rhythmic breathing for filtered indoor air.',
        in: 'Breathe in',
        hold: 'Hold',
        out: 'Breathe out',
        ready: 'Ready',
        calmPattern: 'Calm (4s / 6s)',
        boxPattern: 'Box (4-4-4-4)',
        duration1m: '1 min',
        duration3m: '3 min',
        duration5m: '5 min',
        start: 'Start Breathing',
        pause: 'Pause',
        resume: 'Resume',
        reset: 'Reset',
        haptics: 'Haptic Buzz',
        hapticsOn: 'Haptics: On',
        hapticsOff: 'Haptics: Off',
        notice: 'Do this indoors, ideally in a cleaner-air room. Not for use outdoors on bad air days.',
        wellDone: 'Well done!',
        completedText: 'Session complete. Your nervous system is calmer.',
        goAgain: 'Go again',
        elapsed: 'Elapsed',
      },
      emergency: {
        title: 'Breathing emergency signs',
        subtitle: 'Seek immediate medical attention if you or family members show any of these red flags:',
        call112: 'Call 112',
        helplineNote: 'National Emergency Helpline (Free, All States)',
      },
      filters: {
        all: 'All',
        masks: 'Masks',
        indoor: 'Indoor air',
        cooking: 'Cooking',
      },
      myths: {
        badge: 'Myth',
        whatToDo: 'What to do instead:',
      },
      mythBusters: 'Myth Busters',
      emergencySigns: 'When to Seek Emergency Care',
      calmBreathing: 'Calm Breathing Session',
      startBreathing: 'Start 2-min Indoor Breathing',
      pauseBreathing: 'Pause Session',
      reset: 'Reset',
      breathingNotice: 'Notice: Practice strictly indoors with filtered air. Never practice deep breathing exercises outdoors in smog.',
      inhale: 'Inhale gently...',
      exhale: 'Exhale slowly...',
      cyclesCompleted: 'cycles completed',
    },
    profile: {
      title: 'Household & Preferences',
      subtitle: 'Keep your city and household profile updated for customized guidance.',
      location: 'Location & City',
      language: 'Response Language',
      household: 'Household Setup',
      appearance: 'Appearance',
      installPwa: 'Install App (PWA)',
      installSub: 'Install on your home screen for quick offline smog updates.',
      installNow: 'Install Now',
      appInstalled: 'App Installed / Ready',
      personaliseChat: 'Personalise with a chat',
      redoChat: 'Redo the chat',
      intakeChatSub: 'Quick 2-minute conversation with voice or text to tailor your routines, rooms, and vulnerable members.',
      cloudSyncTitle: 'Account & Cloud Sync (Google)',
      cloudSyncLocalOnly: 'Your clean-air profile currently stays on this device only.',
      signedInAs: 'Signed in as',
      cloudSyncSignedIn: 'Profile synced to secure cloud storage.',
      continueGoogle: 'Continue with Google',
      cloudSave: 'Save current to cloud',
      cloudSaved: 'Saved!',
      signOut: 'Sign Out',
      cloudConsent: 'Consent: By saving to your account, you consent to storing your clean air preferences in secure cloud storage (users/{uid}/profile). We never store audio, transcripts, or chat. You can delete your cloud data at any time.',
      clearChat: 'Clear Chat History',
      clearChatSub: 'Deletes saved conversation messages from this device.',
      chatCleared: 'Chat history cleared',
      resetData: 'Reset All Data',
      resetConfirm: 'Are you sure you want to clear your local profile and cached readings?',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      cancel: 'Cancel',
      confirmReset: 'Yes, Reset Everything',
    },
    voice: {
      title: 'Voice & Speech',
      subtitle: 'Free speech-to-text voice input and natural text-to-speech read aloud.',
      inputToggle: 'Voice Typing (Microphone)',
      inputSub: 'Speak your questions in Ask Clearhale instead of typing.',
      autoSend: 'Auto-Send After Voice',
      autoSendSub: 'Sends recognized speech automatically after 1.5 seconds unless canceled.',
      autoRead: 'Read AI Replies Aloud Automatically',
      autoReadSub: 'Automatically speak assistant responses when generated.',
      speed: 'Speech Speed',
      readBoth: 'Read Both Languages in Bilingual Mode',
      readBothSub: 'Speaks native translation followed by English translation.',
      picker: 'Preferred Voice on This Device',
      defaultVoice: 'System Default Voice',
      privacyNote: 'Your browser or device may process your voice to turn it into text.',
      unsupportedSTT: 'Voice typing is not supported in this browser. You can use your phone’s keyboard microphone.',
      unsupportedTTS: 'No voice for this language on this device.',
      listening: 'Listening... Speak now',
      processing: 'Processing speech...',
      sendingIn: 'Sending in 1.5s',
      tapToEdit: 'Tap to edit or cancel',
      cancelSend: 'Cancel',
      sendNow: 'Send now',
      askByVoice: 'Ask by voice',
      play: 'Play',
      pause: 'Pause',
      stop: 'Stop',
      permissionDenied: 'Microphone permission denied. Tap the lock icon in your address bar and set Microphone to Allow.',
      noSpeech: 'No speech was heard. Please try speaking again.',
      networkError: 'Voice recognition network error. Please check your internet connection.',
      fallbackToEnglish: 'Switched voice recognition to English (India) as regional voice input is not supported in this browser.',
    },
    onboarding: {
      selectLanguage: 'Choose your language',
      languageSub: 'AI responses and guidance will appear in this language.',
      selectLocation: 'Where do you live?',
      useGps: 'Use current location',
      searchCity: 'Search Indian city or district...',
      householdTitle: 'Tell us about your home',
      householdSub: 'Tap what applies (all optional). This customizes your daily plan.',
      vulnerable: 'Who lives with you?',
      fuel: 'Primary cooking fuel',
      commute: 'Daily commute',
      work: 'Primary work environment',
      budget: 'Action budget preference',
      asthma: 'Asthma / Heart',
      buildingPlan: 'Personalizing your smog plan...',
      continue: 'Continue',
      skip: 'Skip to Home',
      intakeChoiceTitle: 'How would you like to set up?',
      intakeChoiceSub: 'Personalising helps us recommend filters, routines, and safe hours tailored to your family.',
      choicePersonalise: 'Personalise in about 2 minutes (voice or text)',
      choicePersonaliseSub: 'A quick 4-question conversation to understand your rooms, cooking, commute, and vulnerable members.',
      choiceQuick: 'Skip, use quick setup',
      choiceQuickSub: 'Pick your household options from a simple checklist in 30 seconds.',
    },
    share: {
      button: 'Share',
      shareCard: 'Share air card with family',
      title: 'Share Air Quality Card',
      subtitle: 'Send a clean, privacy-safe air card to WhatsApp family or school groups.',
      audiences: {
        all: 'Everyone',
        child: 'School parents',
        elderly: 'Elders at home',
        worker: 'Outdoor workers',
      },
      btnShare: 'Share Image',
      btnDownload: 'Download Image',
      btnCopy: 'Copy Text',
      readyToast: 'Ready! Text copied to clipboard',
      downloadToast: 'Card image downloaded',
      generating: 'Generating crisp card...',
      forecastSource: 'Forecast estimate from Open-Meteo',
      subtleTagline: 'Share clean air with your family',
      oldData: 'Old data, {min}m ago',
      demoData: 'Demo data • Not live',
      next2Hours: 'Next 2 Hours',
      topActions: 'Top 3 Recommended Actions',
      costFree: 'Free',
      costLow: 'Low-cost',
      costAfford: 'If you can afford',
      captionTemplate: 'Air in {city} today: {band} (PM2.5 {pm25} µg/m³). Next 2 hours: {decision}. Via Clearhale: {url}',
      directWhatsapp: 'Open in WhatsApp',
    },
  },

  hi: {
    appName: 'Clearhale (क्लियरहेल)',
    tagline: 'हर समझदार निर्णय के साथ साफ सांसें लें।',
    getStarted: 'शुरू करें',
    tryDemo: 'डेमो देखें (दिल्ली प्रीसेट)',
    demoBadge: 'डेमो मोड (ऑफ़लाइन प्रीसेट)',
    cachedBadge: 'कैश्ड डेटा',
    minutesAgo: 'मिनट पहले',
    tabs: {
      home: 'होम',
      plan: 'कार्य योजना',
      ask: 'Clearhale से पूछें',
      care: 'देखभाल',
      learn: 'देखभाल',
      profile: 'सेटिंग्स',
    },
    home: {
      subtitle: 'आपके परिवार के लिए आज की हवा',
      nextTwoHours: 'अगले 2 घंटे का स्पष्ट निर्णय',
      topActions: 'शीर्ष अनुशंसित कदम',
      forecast24h: '24 घंटे का पूर्वानुमान व स्वच्छ समय',
      bestWindow: 'सबसे स्वच्छ समय',
      updated: 'अपडेटेड',
      sourceNote: 'ओपन-मेटियो वायु गुणवत्ता मॉडल (पूर्वानुमान अनुमान)',
      familyFilter: {
        all: 'पूरा परिवार',
        child: 'शिशु व छोटे बच्चे',
        elderly: 'बुजुर्ग',
        pregnant: 'गर्भवती महिलाएं',
        worker: 'बाहरी कर्मी',
      },
      pm25Label: 'PM2.5 (माइक्रोग्राम/मी³)',
      aqiLabel: 'यूएस एक्यूआई',
      pm10Label: 'PM10',
      viewFullPlan: 'पूरी योजना देखें',
      pm25Level: 'PM2.5 स्तर',
      childVuln: 'शिशु व छोटे बच्चों की संवेदनशीलता:',
      seniorVuln: 'बुजुर्गों की संवेदनशीलता:',
      pregnantVuln: 'गर्भवती महिलाओं की संवेदनशीलता:',
      workerVuln: 'कर्मियों की संवेदनशीलता:',
      familyVuln: 'पारिवारिक मार्गदर्शन:',
      refining: 'सलाह तैयार की जा रही है...',
    },
    plan: {
      title: 'कार्य योजना',
      subtitle: 'आपके घर और आज के प्रदूषण स्तर के अनुसार तत्काल वैज्ञानिक कदम।',
      whatIfTitle: 'इंडोर वायु सुधार सिम्युलेटर (What-If)',
      whatIfNote: 'अनुमान खिड़कियां बंद होने पर 57.5% बेसलाइन और फिल्टर दक्षता पर आधारित है।',
      outdoorBaseline: 'बाहरी PM2.5',
      estimatedIndoor: 'अनुमानित घर का PM2.5',
      reduction: 'प्रदूषण में कुल कमी',
      assumptionsTitle: 'वैज्ञानिक आधार',
      expandDetails: 'विवरण व सुरक्षा',
      evidence: 'प्रमाण',
      cost: 'लागत',
      markDone: 'पूरा चिह्नित करें',
      done: 'आज पूरा किया गया',
      windowsDoors: 'बाहरी खिड़कियां व दरवाजे',
      closed: 'बंद (57.5% रिसाव)',
      open: 'खुली (100% प्रदूषण)',
      filterType: 'घर में सक्रिय एयर फिल्टर',
      none: 'कोई नहीं',
      hepa: 'पोर्टेबल HEPA (65% कमी)',
      diyBox: 'DIY MERV-13 फैन (55% कमी)',
      viewAssumptions: 'वैज्ञानिक गणना के आधार देखें',
      prioritizingFor: 'प्राथमिकता दी जा रही है:',
      personaMatched: 'सटीक कदम पहले दिखाए गए हैं',
      expectedEffect: 'अपेक्षित प्रभाव',
      safetyNote: 'सुरक्षा निर्देश',
      scientificCitation: 'वैज्ञानिक संदर्भ',
    },
    ask: {
      title: 'Clearhale AI से पूछें',
      subtitle: 'बच्चों, मास्क, खाना पकाने या प्यूरीफायर पर अपने सवाल पूछें।',
      placeholder: 'अपनी भाषा में कोई भी सवाल पूछें...',
      send: 'भेजें',
      chips: [
        'प्यूरीफायर नहीं है, अब क्या करें?',
        'क्या मेरा बच्चा आज बाहर खेल सकता है?',
        'स्कूल जाने के लिए कौन सा मास्क सही है?',
        'क्या आज सुबह टहलना सुरक्षित है?',
      ],
      emergencyWarning: 'आपातकालीन स्वास्थ्य चेतावनी',
      call112: '112 पर कॉल करें (इमरजेंसी)',
      medicalDisclaimer: 'केवल वायु गुणवत्ता मार्गदर्शन, चिकित्सकीय सलाह नहीं।',
      groundedSafe: 'प्रमाणित व सुरक्षित',
      consulting: 'वैज्ञानिक सूची देखी जा रही है...',
    },
    care: {
      title: 'देखभाल व वायु ज्ञान',
      subtitle: 'श्वास अभ्यास, स्मॉग भ्रम निवारण और सरल वायु शब्दावली।',
      tabs: {
        breathe: 'श्वास अभ्यास',
        learn: 'सत्य और सुरक्षा',
        terms: 'शब्दावली',
      },
    },
    learn: {
      title: 'स्मॉग विज्ञान और भ्रम',
      subtitle: 'असरदार तरीकों और अप्रमाणित दावों के बीच अंतर समझें।',
      tabs: {
        breathe: 'श्वास अभ्यास',
        learn: 'सत्य और सुरक्षा',
        terms: 'शब्दावली',
      },
      breathe: {
        title: 'इंडोर शांत श्वास',
        subtitle: 'घर के अंदर साफ हवा में शांत और लयबद्ध श्वास।',
        in: 'श्वास अंदर लें',
        hold: 'श्वास रोकें',
        out: 'श्वास छोड़ें',
        ready: 'तैयार',
        calmPattern: 'शांत (४ से. / ६ से.)',
        boxPattern: 'बॉक्स (४-४-४-४)',
        duration1m: '१ मिनट',
        duration3m: '३ मिनट',
        duration5m: '५ मिनट',
        start: 'श्वास शुरू करें',
        pause: 'रोकें',
        resume: 'जारी रखें',
        reset: 'रीसेट',
        haptics: 'वाइब्रेशन कंपन',
        hapticsOn: 'वाइब्रेशन: चालू',
        hapticsOff: 'वाइब्रेशन: बंद',
        notice: 'यह अभ्यास केवल घर के अंदर साफ हवा में करें। प्रदूषण के दिनों में बाहर न करें।',
        wellDone: 'बहुत बढ़िया!',
        completedText: 'श्वास सत्र पूरा हुआ। आपका मन और तंत्रिका तंत्र शांत है।',
        goAgain: 'पुनः करें',
        elapsed: 'बीता समय',
      },
      emergency: {
        title: 'गंभीर श्वसन लक्षणे - आपातकाल',
        subtitle: 'यदि इनमें से कोई भी गंभीर लक्षण दिखे तो तुरंत डॉक्टर या अस्पताल जाएं:',
        call112: '112 पर कॉल करें',
        helplineNote: 'राष्ट्रीय आपातकालीन हेल्पलाइन (निःशुल्क, सभी राज्य)',
      },
      filters: {
        all: 'सभी',
        masks: 'मास्क',
        indoor: 'घर की हवा',
        cooking: 'रसोई',
      },
      myths: {
        badge: 'भ्रम',
        whatToDo: 'इसके बजाय क्या करें:',
      },
      mythBusters: 'भ्रम निवारण',
      emergencySigns: 'गंभीर लक्षण - डॉक्टर कब दिखाएं',
      calmBreathing: 'शांत सांस सत्र',
      startBreathing: '2 मिनट का इंडोर श्वास सत्र शुरू करें',
      pauseBreathing: 'सत्र रोकें',
      reset: 'रीसेट करें',
      breathingNotice: 'ध्यान दें: केवल घर के अंदर साफ हवा में करें। स्मॉग में बाहर कभी गहरी सांस न लें।',
      inhale: 'धीरे सांस अंदर लें...',
      exhale: 'धीरे सांस छोड़ें...',
      cyclesCompleted: 'चक्र पूरे हुए',
    },
    profile: {
      title: 'परिवार व प्राथमिकताएं',
      subtitle: 'सटीक सलाह के लिए अपना शहर और घरेलू जानकारी अपडेट रखें।',
      location: 'स्थान व शहर',
      language: 'एआई प्रतिक्रिया भाषा',
      household: 'घर की जानकारी',
      appearance: 'दिखावट (थीम)',
      installPwa: 'ऐप इंस्टॉल करें (PWA)',
      installSub: 'तुरंत ऑफ़लाइन स्मॉग अपडेट के लिए होम स्क्रीन पर जोड़ें।',
      installNow: 'अभी इंस्टॉल करें',
      appInstalled: 'ऐप इंस्टॉल है / तैयार',
      personaliseChat: 'बातचीत से प्रोफ़ाइल बनाएं',
      redoChat: 'बातचीत फिर से करें',
      intakeChatSub: 'दिनचर्या, कमरों और परिजनों के अनुसार सलाह के लिए 2 मिनट की आसान बातचीत।',
      cloudSyncTitle: 'खाता व क्लाउड सिंक (Google)',
      cloudSyncLocalOnly: 'आपकी स्वच्छ हवा प्रोफ़ाइल अभी केवल इसी डिवाइस पर सुरक्षित है।',
      signedInAs: 'लॉग इन किया गया:',
      cloudSyncSignedIn: 'प्रोफ़ाइल सुरक्षित क्लाउड स्टोरेज पर सिंक है।',
      continueGoogle: 'Google से जारी रखें',
      cloudSave: 'क्लाउड पर सेव करें',
      cloudSaved: 'सहेजा गया!',
      signOut: 'साइन आउट',
      cloudConsent: 'सहमति: अपने खाते में सहेजकर, आप अपनी स्वच्छ हवा प्राथमिकताओं को सुरक्षित क्लाउड में संग्रहीत करने की सहमति देते हैं (users/{uid}/profile)। हम ऑडियो, ट्रांसक्रिप्ट या चैट कभी संग्रहीत नहीं करते। आप किसी भी समय अपना डेटा हटा सकते हैं।',
      clearChat: 'चैट इतिहास साफ़ करें',
      clearChatSub: 'इस डिवाइस से सहेजे गए AI संदेश हटाएं।',
      chatCleared: 'चैट इतिहास साफ़ कर दिया गया',
      resetData: 'डेटा रीसेट करें',
      resetConfirm: 'क्या आप अपनी प्रोफ़ाइल और डेटा साफ़ करना चाहते हैं?',
      light: 'लाइट',
      dark: 'डार्क',
      system: 'सिस्टम',
      cancel: 'रद्द करें',
      confirmReset: 'हाँ, सब कुछ रीसेट करें',
    },
    voice: {
      title: 'आवाज व भाषण (Voice)',
      subtitle: 'मुफ़्त वॉइस टाइपिंग और प्राकृतिक टेक्स्ट-टू-स्पीच सुनना।',
      inputToggle: 'वॉइस टाइपिंग (माइक)',
      inputSub: 'टाइप करने के बजाय बोलकर सवाल पूछें।',
      autoSend: 'बोलने के बाद ऑटो-सेंड',
      autoSendSub: 'रद्द न करने पर 1.5 सेकंड बाद सवाल अपने आप भेजा जाएगा।',
      autoRead: 'एआई उत्तर अपने आप बोलकर सुनाएं',
      autoReadSub: 'नया उत्तर आने पर अपने आप पढ़कर सुनाएं।',
      speed: 'बोलने की गति',
      readBoth: 'द्विभाषी मोड में दोनों भाषाएं पढ़ें',
      readBothSub: 'पहले हिन्दी फिर अंग्रेजी अनुवाद सुनाएं।',
      picker: 'इस डिवाइस पर आवाज (Voice)',
      defaultVoice: 'सिस्टम डिफॉल्ट आवाज',
      privacyNote: 'आपका ब्राउज़र या डिवाइस आपकी आवाज को टेक्स्ट में बदलने के लिए प्रोसेस कर सकता है।',
      unsupportedSTT: 'इस ब्राउज़र में वॉइस टाइपिंग समर्थित नहीं है। आप अपने फोन के कीबोर्ड माइक का उपयोग कर सकते हैं।',
      unsupportedTTS: 'इस डिवाइस पर इस भाषा के लिए कोई वॉइस उपलब्ध नहीं है।',
      listening: 'सुन रहे हैं... कृपया बोलें',
      processing: 'आवाज पहचानी जा रही है...',
      sendingIn: '1.5 सेकंड में भेजा जा रहा है',
      tapToEdit: 'संपादन या रद्द करने के लिए टैप करें',
      cancelSend: 'रद्द करें',
      sendNow: 'अभी भेजें',
      askByVoice: 'बोलकर पूछें',
      play: 'सुनें',
      pause: 'रोकें',
      stop: 'बंद करें',
      permissionDenied: 'माइक की अनुमति अस्वीकृत। अपने ब्राउज़र के एड्रेस बार में लॉक/सेटिंग्स आइकन दबाकर माइक की अनुमति दें।',
      noSpeech: 'कोई आवाज नहीं सुनाई दी। कृपया दोबारा बोलें।',
      networkError: 'वॉइस पहचान नेटवर्क त्रुटि। इंटरनेट कनेक्शन जांचें।',
      fallbackToEnglish: 'क्षेत्रीय इनपुट समर्थित न होने के कारण अंग्रेजी (भारत) में बदला गया।',
    },
    onboarding: {
      selectLanguage: 'अपनी भाषा चुनें',
      languageSub: 'एआई उत्तर और मार्गदर्शन इस भाषा में मिलेंगे।',
      selectLocation: 'आप कहाँ रहते हैं?',
      useGps: 'वर्तमान स्थान का उपयोग करें',
      searchCity: 'भारतीय शहर या जिला खोजें...',
      householdTitle: 'अपने घर के बारे में बताएं',
      householdSub: 'जो लागू हो उसे चुनें (वैकल्पिक)। इससे आपकी योजना सटीक बनती है।',
      vulnerable: 'घर में कौन है?',
      fuel: 'खाना पकाने का ईंधन',
      commute: 'रोज़ाना का आवागमन',
      work: 'कार्यस्थल',
      budget: 'खर्च की प्राथमिकता',
      asthma: 'दमा / हृदय रोग',
      buildingPlan: 'आपकी स्मॉग सुरक्षा योजना तैयार की जा रही है...',
      continue: 'आगे बढ़ें',
      skip: 'होम पर जाएं',
      intakeChoiceTitle: 'आप सेटअप कैसे करना चाहेंगे?',
      intakeChoiceSub: 'प्रोफ़ाइल बनाने से आपको अपने घर, यात्रा और परिवार के अनुसार सही मार्गदर्शन मिलता है।',
      choicePersonalise: 'लगभग 2 मिनट में कस्टमाइज़ करें (आवाज़ या टाइप)',
      choicePersonaliseSub: 'आपके घर, खाना पकाने, सफ़र और परिवार की ज़रूरतों को समझने के लिए एक छोटी बातचीत।',
      choiceQuick: 'छोड़ें, त्वरित सेटअप का उपयोग करें',
      choiceQuickSub: '30 सेकंड में साधारण चेकलिस्ट से अपनी प्राथमिकताएं चुनें।',
    },
    share: {
      button: 'साझा करें (Share)',
      shareCard: 'परिवार के साथ एयर कार्ड शेयर करें (Share)',
      title: 'वायु गुणवत्ता कार्ड साझा करें (Share Card)',
      subtitle: 'व्हाट्सएप परिवार या स्कूल ग्रुप्स के लिए स्वच्छ और सुरक्षित एयर कार्ड भेजें।',
      audiences: {
        all: 'सभी के लिए (Everyone)',
        child: 'स्कूल के बच्चे व अभिभावक (School parents)',
        elderly: 'घर के बुजुर्ग (Elders at home)',
        worker: 'बाहरी कामगार (Outdoor workers)',
      },
      btnShare: 'इमेज शेयर करें (Share Image)',
      btnDownload: 'इमेज डाउनलोड करें (Download)',
      btnCopy: 'टेक्स्ट कॉपी करें (Copy Text)',
      readyToast: 'तैयार! टेक्स्ट क्लिपबोर्ड पर कॉपी हो गया',
      downloadToast: 'कार्ड इमेज डाउनलोड हो गई',
      generating: 'सुंदर कार्ड तैयार हो रहा है...',
      forecastSource: 'Open-Meteo का पूर्वानुमान मॉडल',
      subtleTagline: 'परिवार के साथ स्वच्छ हवा की जानकारी साझा करें',
      oldData: 'पुराना डेटा, {min} मिनट पहले',
      demoData: 'डेमो डेटा • लाइव सेंसर नहीं',
      next2Hours: 'अगले 2 घंटे (Next 2 Hours)',
      topActions: 'शीर्ष 3 अनुशंसित कदम (Top 3 Actions)',
      costFree: 'मुफ़्त (Free)',
      costLow: 'कम खर्च (Low-cost)',
      costAfford: 'बजट हो तो (Affordable)',
      captionTemplate: 'आज {city} में वायु गुणवत्ता: {band} (PM2.5: {pm25} µg/m³)। अगले 2 घंटे: {decision}। Clearhale द्वारा: {url}',
      directWhatsapp: 'व्हाट्सएप पर खोलें',
    },
  },

  mr: {
    appName: 'Clearhale (क्लियरहेल)',
    tagline: 'प्रत्येक समंजस निर्णयासोबत स्वच्छ श्वास घ्या.',
    getStarted: 'सुरू करा',
    tryDemo: 'डेमो पहा (दिल्ली प्रीसेट)',
    demoBadge: 'डेमो मोड (ऑफलाइन)',
    cachedBadge: 'कॅश डेटा',
    minutesAgo: 'मि. पूर्वी',
    tabs: {
      home: 'होम',
      plan: 'कृती योजना',
      ask: 'Clearhale ला विचारा',
      care: 'काळजी',
      learn: 'काळजी',
      profile: 'सेटिंग्ज',
    },
    home: {
      subtitle: 'तुमच्या कुटुंबासाठी आजची हवा',
      nextTwoHours: 'पुढील २ तासांचा स्पष्ट निर्णय',
      topActions: 'शीर्ष शिफारस केलेल्या कृती',
      forecast24h: '२४ तासांचा अंदाज व स्वच्छ हवा',
      bestWindow: 'सर्वात स्वच्छ वेळ',
      updated: 'अपडेट केले',
      sourceNote: 'ओपन-मेटिओ हवा गुणवत्ता मॉडेल (अंदाज)',
      familyFilter: {
        all: 'पूर्ण कुटुंब',
        child: 'लहान मुले व बाळ',
        elderly: 'ज्येष्ठ',
        pregnant: 'गर्भवती महिला',
        worker: 'कामगार',
      },
      pm25Label: 'PM2.5 (मायक्रोग्रॅम/मी³)',
      aqiLabel: 'यूएस एक्यूआय',
      pm10Label: 'PM10',
      viewFullPlan: 'पूर्ण योजना पहा',
      pm25Level: 'PM2.5 पातळी',
      childVuln: 'लहान मुलांची संवेदनशीलता:',
      seniorVuln: 'ज्येष्ठांची संवेदनशीलता:',
      pregnantVuln: 'गर्भवती महिलांची संवेदनशीलता:',
      workerVuln: 'कामगारांची संवेदनशीलता:',
      familyVuln: 'कौटुंबिक मार्गदर्शन:',
      refining: 'सल्ला तयार होत आहे...',
    },
    plan: {
      title: 'कृती योजना',
      subtitle: 'आपल्या घरासाठी आणि आजच्या धुरक्यासाठी शास्त्रीय कृती.',
      whatIfTitle: 'घरातील हवा सुधारणा सिम्युलेटर',
      whatIfNote: 'खिडक्या बंद असताना ५७.५% इन्फिल्ट्रेशन आणि फिल्टर कार्यक्षमतेवर आधारित अंदाज.',
      outdoorBaseline: 'बाहेरील PM2.5',
      estimatedIndoor: 'घरातील अंदाजित PM2.5',
      reduction: 'धुरक्यात एकूण घट',
      assumptionsTitle: 'वैज्ञानिक गृहीतके',
      expandDetails: 'तपशील व सुरक्षा',
      evidence: 'पुरावा',
      cost: 'खर्च',
      markDone: 'पूर्ण म्हणून चिन्हांकित करा',
      done: 'आज पूर्ण झाले',
      windowsDoors: 'बाहेरील खिडक्या व दारे',
      closed: 'बंद (५७.५% इन्फिल्ट्रेशन)',
      open: 'उघडी (१००% प्रदूषण)',
      filterType: 'घरातील सक्रिय एअर फिल्टर',
      none: 'काहीही नाही',
      hepa: 'पोर्टेबल HEPA (६५% घट)',
      diyBox: 'DIY MERV-13 फॅन (५५% घट)',
      viewAssumptions: 'वैज्ञानिक गृहीतके पहा',
      prioritizingFor: 'प्राधान्य दिले जात आहे:',
      personaMatched: 'अनुकूल कृती प्रथम दर्शविल्या आहेत',
      expectedEffect: 'अपेक्षित परिणाम',
      safetyNote: 'सुरक्षा सूचना',
      scientificCitation: 'वैज्ञानिक संदर्भ',
    },
    ask: {
      title: 'Clearhale AI ला विचारा',
      subtitle: 'मुलांची सुरक्षा, मास्क, स्वयंपाक किंवा प्युरिफायरबाबत प्रश्न विचारा.',
      placeholder: 'आपल्या भाषेत प्रश्न विचारा...',
      send: 'पाठवा',
      chips: [
        'प्युरिफायर नाही, आता काय करावे?',
        'माझे मूल आज बाहेर खेळू शकते का?',
        'शाळेत जाताना कोणता मास्क वापरावा?',
        'आज सकाळी चालणे सुरक्षित आहे का?',
      ],
      emergencyWarning: 'तातडीचा वैद्यकीय इशारा',
      call112: '११२ वर कॉल करा (आपत्कालीन)',
      medicalDisclaimer: 'केवळ हवेच्या गुणवत्तेबाबत मार्गदर्शन, वैद्यकीय सल्ला नाही.',
      groundedSafe: 'प्रमाणित व सुरक्षित',
      consulting: 'वैज्ञानिक सूची तपासत आहे...',
    },
    care: {
      title: 'काळजी व वायु ज्ञान',
      subtitle: 'मार्गदर्शित श्वास सत्रे, धुरके गैरसमज निवारण आणि सोपे शब्दार्थ.',
      tabs: {
        breathe: 'श्वास व्यायाम',
        learn: 'माहिती व सुरक्षा',
        terms: 'शब्दार्थ',
      },
    },
    learn: {
      title: 'धुरके विज्ञान आणि समज-गैरसमज',
      subtitle: 'प्रभावी उपाय आणि खोट्या दाव्यांमधील फरक समजून घ्या.',
      tabs: {
        breathe: 'श्वास व्यायाम',
        learn: 'माहिती व सुरक्षा',
        terms: 'शब्दार्थ',
      },
      breathe: {
        title: 'इनडोअर शांत श्वास',
        subtitle: 'घरातील गाळलेल्या हवेत शांत व लयबद्ध श्वास व्यायाम.',
        in: 'श्वास आत घ्या',
        hold: 'श्वास रोखा',
        out: 'श्वास बाहेर सोडा',
        ready: 'तयार',
        calmPattern: 'शांत (४ से. / ६ से.)',
        boxPattern: 'चौकोनी (४-४-४-४)',
        duration1m: '१ मिनिट',
        duration3m: '३ मिनिट',
        duration5m: '५ मिनिट',
        start: 'श्वास सुरू करा',
        pause: 'थांबवा',
        resume: 'पुढे चालू ठेवा',
        reset: 'रीसेट',
        haptics: 'कंपन',
        hapticsOn: 'कंपन: चालू',
        hapticsOff: 'कंपन: बंद',
        notice: 'हे फक्त घरात स्वच्छ हवेच्या खोलीत करा. प्रदूषणाच्या दिवसांत बाहेर करू नका.',
        wellDone: 'खूप छान!',
        completedText: 'श्वास सत्र पूर्ण झाले. तुमचे मन व शरीर शांत झाले आहे.',
        goAgain: 'पुन्हा करा',
        elapsed: 'झालेला वेळ',
      },
      emergency: {
        title: 'गंभीर श्वास लक्षणे - आपत्कालीन',
        subtitle: 'कुटुंबात यापैकी कोणतीही लक्षणे आढळल्यास ताबडतोब वैद्यकीय मदत घ्या:',
        call112: '११२ वर कॉल करा',
        helplineNote: 'राष्ट्रीय आपत्कालीन हेल्पलाइन (मोफत, सर्व राज्ये)',
      },
      filters: {
        all: 'सर्व',
        masks: 'मास्क',
        indoor: 'घरातील हवा',
        cooking: 'स्वयंपाक',
      },
      myths: {
        badge: 'समज',
        whatToDo: 'त्याऐवजी काय करावे:',
      },
      mythBusters: 'गैरसमज निवारण',
      emergencySigns: 'डॉक्टरांकडे कधी जावे',
      calmBreathing: 'शांत श्वास सत्र',
      startBreathing: '२ मिनिटांचे इनडोअर श्वास सत्र सुरू करा',
      pauseBreathing: 'सत्र थांबवा',
      reset: 'रीसेट करा',
      breathingNotice: 'सूचना: फक्त घरातील गाळलेल्या हवेत करा. बाहेर धुरक्यात कधीही दीर्घ श्वास घेऊ नका.',
      inhale: 'हळूच श्वास आत घ्या...',
      exhale: 'हळूच श्वास बाहेर सोडा...',
      cyclesCompleted: 'आवर्तने पूर्ण झाली',
    },
    profile: {
      title: 'घर आणि प्राधान्ये',
      subtitle: 'योग्य सल्ल्यासाठी आपले शहर व घराची माहिती अद्ययावत ठेवा.',
      location: 'स्थान व शहर',
      language: 'उत्तराची भाषा',
      household: 'घराची माहिती',
      appearance: 'दिखावट (थीम)',
      installPwa: 'अ‍ॅप इन्स्टॉल करा (PWA)',
      installSub: 'ऑफलाइन अपडेटसाठी होम स्क्रीनवर जोडा.',
      installNow: 'आता इन्स्टॉल करा',
      appInstalled: 'अ‍ॅप इन्स्टॉल आहे / तयार',
      personaliseChat: 'संवादातून प्रोफाइल तयार करा',
      redoChat: 'पुन्हा संवाद साधा',
      intakeChatSub: 'दिनचर्या, खोल्या आणि कुटुंबीयांसाठी अचूक सल्ल्यासाठी २ मिनिटांचा सोपा संवाद.',
      cloudSyncTitle: 'खाते आणि क्लाउड सिंक (Google)',
      cloudSyncLocalOnly: 'तुमची स्वच्छ हवा प्रोफाइल सध्या फक्त याच डिव्हाइसवर साठवली आहे.',
      signedInAs: 'साइन इन केले आहे:',
      cloudSyncSignedIn: 'प्रोफाइल सुरक्षित क्लाउड स्टोरेजवर सिंक आहे.',
      continueGoogle: 'Google सह सुरू ठेवा',
      cloudSave: 'क्लाउडवर सेव्ह करा',
      cloudSaved: 'सेव्ह झाले!',
      signOut: 'साइन आउट',
      cloudConsent: 'संमती: खात्यात सेव्ह करून, तुम्ही तुमची माहिती सुरक्षित क्लाउडवर ठेवण्यास संमती देता (users/{uid}/profile). आम्ही ऑडिओ किंवा चॅट कधीही साठवत नाही. तुम्ही तुमचा डेटा कधीही हटवू शकता.',
      clearChat: 'चॅट इतिहास साफ करा',
      clearChatSub: 'या डिव्हाइसवरून सेव्ह केलेले AI संदेश हटवा.',
      chatCleared: 'चॅट इतिहास साफ केला',
      resetData: 'सर्व डेटा रीसेट करा',
      resetConfirm: 'आपण स्थानिक प्रोफाइल आणि डेटा साफ करू इच्छिता?',
      light: 'लाइट',
      dark: 'डार्क',
      system: 'सिस्टम',
      cancel: 'रद्द करा',
      confirmReset: 'होय, सर्व रीसेट करा',
    },
    voice: {
      title: 'आवाज आणि भाषण (Voice)',
      subtitle: 'मोफत व्हॉइस टायपिंग आणि नैसर्गिक टेक्स्ट-टू-स्पीच वाचन.',
      inputToggle: 'व्हॉइस टायपिंग (माइक)',
      inputSub: 'टाइप करण्याऐवजी बोलून प्रश्न विचारा.',
      autoSend: 'बोलल्यानंतर आपोआप पाठवा (Auto-Send)',
      autoSendSub: 'रद्द न केल्यास १.५ सेकंदांनंतर प्रश्न आपोआप पाठवला जाईल.',
      autoRead: 'AI ची उत्तरे आपोआप वाचून दाखवा',
      autoReadSub: 'नवीन उत्तर आल्यावर आपोआप ऐकवा.',
      speed: 'बोलण्याचा वेग',
      readBoth: 'द्विभाषिक मोडमध्ये दोन्ही भाषा वाचा',
      readBothSub: 'आधी मराठी आणि नंतर इंग्रजी भाषांतर ऐकवा.',
      picker: 'या डिव्हाइसवरील आवाज (Voice)',
      defaultVoice: 'सिस्टमचा डीफॉल्ट आवाज',
      privacyNote: 'आपला ब्राउझर किंवा डिव्हाइस आपला आवाज टेक्स्टमध्ये रूपांतरित करण्यासाठी प्रक्रिया करू शकते.',
      unsupportedSTT: 'या ब्राउझरमध्ये व्हॉइस टायपिंग समर्थित नाही. आपण फोनच्या कीबोर्ड माइकचा वापर करू शकता.',
      unsupportedTTS: 'या डिव्हाइसवर या भाषेसाठी आवाज उपलब्ध नाही.',
      listening: 'ऐकत आहे... कृपया बोला',
      processing: 'आवाज ओळखत आहे...',
      sendingIn: '१.५ सेकंदात पाठवत आहे',
      tapToEdit: 'बदल किंवा रद्द करण्यासाठी टॅप करा',
      cancelSend: 'रद्द करा',
      sendNow: 'आत्ताच पाठवा',
      askByVoice: 'आवाजाने विचारा',
      play: 'ऐका',
      pause: 'थांबवा',
      stop: 'बंद करा',
      permissionDenied: 'माइकची परवानगी नाकारली. अ‍ॅड्रेस बारमधील कुलूप/सेटिंग्ज आयकॉन दाबून माइक सुरू करा.',
      noSpeech: 'काहीही ऐकू आले नाही. कृपया पुन्हा बोला.',
      networkError: 'व्हॉइस नेटवर्क त्रुटी. कृपया इंटरनेट तपासा.',
      fallbackToEnglish: 'प्रादेशिक इनपुट समर्थित नसल्याने इंग्रजी (भारत) निवडले आहे.',
    },
    onboarding: {
      selectLanguage: 'आपली भाषा निवडा',
      languageSub: 'AI ची उत्तरे आणि मार्गदर्शन या भाषेत मिळतील.',
      selectLocation: 'आपण कुठे राहता?',
      useGps: 'सध्याचे स्थान वापरा',
      searchCity: 'भारतीय शहर किंवा जिल्हा शोधा...',
      householdTitle: 'आपल्या घराविषयी सांगा',
      householdSub: 'लागू असलेले पर्याय निवडा (ऐच्छिक).',
      vulnerable: 'घरात कोण आहे?',
      fuel: 'स्वयंपाकाचे इंधन',
      commute: 'दररोजचा प्रवास',
      work: 'कामाचे ठिकाण',
      budget: 'खर्चाचे प्राधान्य',
      asthma: 'दमा / हृदयविकार',
      buildingPlan: 'आपली वैयक्तिक धुरके सुरक्षा योजना तयार होत आहे...',
      continue: 'पुढे चला',
      skip: 'होमवर जा',
      intakeChoiceTitle: 'तुम्ही सेटअप कसे करू इच्छिता?',
      intakeChoiceSub: 'प्रोफाइल तयार केल्याने तुम्हाला तुमच्या खोल्या, प्रवास आणि कुटुंबासाठी अचूक मार्गदर्शन मिळते.',
      choicePersonalise: 'सुमारे 2 मिनिटांत वैयक्तिकृत करा (आवाज किंवा टाइप)',
      choicePersonaliseSub: 'तुमचे घर, स्वयंपाक, प्रवास आणि कुटुंबातील सदस्यांना समजून घेण्यासाठी एक संक्षिप्त संवाद.',
      choiceQuick: 'वगळा, जलद सेटअप वापरा',
      choiceQuickSub: '30 सेकंदांत सामान्य चेकलिस्ट पर्यायांची निवड करा.',
    },
    share: {
      button: 'शेअर करा (Share)',
      shareCard: 'कुटुंबासोबत एअर कार्ड शेअर करा (Share)',
      title: 'हवेची गुणवत्ता कार्ड शेअर करा (Share Card)',
      subtitle: 'व्हॉट्सअॅप कुटुंब किंवा शाळा ग्रुप्ससाठी सुरक्षित एअर कार्ड पाठवा.',
      audiences: {
        all: 'सर्वांसाठी (Everyone)',
        child: 'शाळा व पालक (School parents)',
        elderly: 'घरातील ज्येष्ठ नागरिक (Elders at home)',
        worker: 'बाहेर काम करणारे (Outdoor workers)',
      },
      btnShare: 'इमेज शेअर करा (Share Image)',
      btnDownload: 'इमेज डाउनलोड करा (Download)',
      btnCopy: 'मजकूर कॉपी करा (Copy Text)',
      readyToast: 'तयार! मजकूर क्लिपबोर्डवर कॉपी झाला',
      downloadToast: 'कार्ड इमेज डाउनलोड झाली',
      generating: 'कार्ड तयार होत आहे...',
      forecastSource: 'Open-Meteo हवामान अंदाज मॉडेल',
      subtleTagline: 'स्वच्छ हवेची काळजी आपल्या कुटुंबासोबत शेअर करा',
      oldData: 'जुना डेटा, {min} मिनिटांपूर्वी',
      demoData: 'डेमो डेटा • थेट सेन्सर नाही',
      next2Hours: 'पुढचे २ तास (Next 2 Hours)',
      topActions: 'शीर्ष ३ शिफारसी (Top 3 Actions)',
      costFree: 'मोफत (Free)',
      costLow: 'कमी खर्च (Low-cost)',
      costAfford: 'सक्षम असल्यास (Affordable)',
      captionTemplate: 'आज {city} मधील हवेची गुणवत्ता: {band} (PM2.5: {pm25} µg/m³). पुढचे २ तास: {decision}. Clearhale द्वारे: {url}',
      directWhatsapp: 'व्हॉट्सअॅपवर उघडा',
    },
  },
  ta: {
    appName: 'Clearhale',
    tagline: 'ஒவ்வொரு மூச்சிலும் தெளிவான காற்று, உங்கள் குடும்பத்தின் பாதுகாப்பு.',
    getStarted: 'தொடங்குங்கள்',
    tryDemo: 'டெமோ பார்க்கவும் (டெல்லி முன்னிருப்பு)',
    demoBadge: 'டெமோ பயன்முறை',
    cachedBadge: 'சேமிக்கப்பட்ட தரவு',
    minutesAgo: 'நிமிடம் முன்',
    tabs: {
      home: 'Home',
      plan: 'Action Plan',
      ask: 'Ask Clearhale',
      care: 'Care',
      learn: 'Care',
      profile: 'Settings',
    },
    home: {
      subtitle: 'உங்கள் குடும்பத்திற்கான இன்றைய காற்று',
      nextTwoHours: 'அடுத்த 2 மணிநேர வழிகாட்டுதல்',
      topActions: 'பரிந்துரைக்கப்பட்ட சிறந்த நடவடிக்கைகள்',
      forecast24h: '24 மணிநேர முன்னறிவிப்பு',
      bestWindow: 'தூய்மையான காற்று நேரம்',
      updated: 'புதுப்பிக்கப்பட்டது',
      sourceNote: 'ஓபன்-மீட்டியோ காற்றுத் தர மாதிரி',
      familyFilter: {
        all: 'முழுக் குடும்பம்',
        child: 'குழந்தைகள்',
        elderly: 'பெரியவர்கள்',
        pregnant: 'கர்ப்பிணி தாய்மார்கள்',
        worker: 'வெளிப்புற பணியாளர்கள்',
      },
      pm25Label: 'PM2.5 (µg/m³)',
      aqiLabel: 'US AQI',
      pm10Label: 'PM10',
      viewFullPlan: 'முழு செயல் திட்டத்தைக் காண்க',
      pm25Level: 'PM2.5 அளவு',
      childVuln: 'குழந்தைகள் பாதுகாப்பு:',
      seniorVuln: 'முதியவர்கள் பாதுகாப்பு:',
      pregnantVuln: 'கர்ப்பிணி பாதுகாப்பு:',
      workerVuln: 'பணியாளர் பாதுகாப்பு:',
      familyVuln: 'குடும்ப வழிகாட்டுதல்:',
      refining: 'புதுப்பிக்கப்படுகிறது...',
    },
    plan: {
      title: 'செயல் திட்டம்',
      subtitle: 'இன்றைய காற்றுத் தரத்திற்கு ஏற்ப அறிவியல் அடிப்படையிலான எளிய வழிகாட்டுதல்கள்.',
      whatIfTitle: 'உட்புற காற்று உருவகப்படுத்துதல்',
      whatIfNote: 'மூடிய ஜன்னல்கள் மற்றும் ஏர் ஃபில்டர் மதிப்பீடு.',
      outdoorBaseline: 'வெளிப்புற PM2.5',
      estimatedIndoor: 'உட்புற PM2.5 (மதிப்பீடு)',
      reduction: 'மாசு குறைப்பு',
      assumptionsTitle: 'அறிவியல் அனுமானங்கள்',
      expandDetails: 'விவரங்கள் & பாதுகாப்பு',
      evidence: 'ஆதாரம்',
      cost: 'செலவு',
      markDone: 'முடிந்தது எனக் குறிக்கவும்',
      done: 'இன்று முடிக்கப்பட்டது',
      windowsDoors: 'ஜன்னல்கள் மற்றும் கதவுகள்',
      closed: 'மூடப்பட்டது (57.5% ஊடுருவல்)',
      open: 'திறக்கப்பட்டது (100% ஊடுருவல்)',
      filterType: 'உட்புற ஏர் ஃபில்டர்',
      none: 'எதுவுமில்லை',
      hepa: 'போர்ட்டபிள் True HEPA (65% குறைப்பு)',
      diyBox: 'DIY MERV-13 ஃபேன் (55% குறைப்பு)',
      viewAssumptions: 'அறிவியல் அனுமானங்களைக் காண்க',
      prioritizingFor: 'முன்னுரிமை அளிக்கப்படுகிறது:',
      personaMatched: 'நபருக்கு ஏற்ற நடவடிக்கைகள் முதலில் தோன்றும்',
      expectedEffect: 'எதிர்பார்க்கப்படும் பலன்',
      safetyNote: 'பாதுகாப்பு குறிப்பு',
    },
    ask: {
      title: 'Clearhale-ஐ கேளுங்கள்',
      subtitle: 'மாசுபாடு மற்றும் காற்றுத் தரம் குறித்து தமிழில் கேளுங்கள்.',
      placeholder: 'எ.கா., குழந்தைகள் இன்று மாலையில் வெளியே விளையாடலாமா?',
      send: 'அனுப்பு',
      clear: 'அழி',
      disclaimer: 'காற்றின் தரம் குறித்த வழிகாட்டுதல் மட்டுமே, மருத்துவ ஆலோசனை அல்ல.',
      listening: 'கேட்கிறது... பேசுங்கள்',
      tapToSpeak: 'பேச மைக்-ஐ அழுத்தவும்',
      examples: [
        'இன்று குழந்தைகளை பூங்காவில் விளையாட அனுமதிக்கலாமா?',
        'மலிவான முறையில் ஏர் ஃபில்டர் செய்வது எப்படி?',
        'ஜன்னல்களை எப்போது திறப்பது நல்லது?',
      ],
    },
    learn: {
      title: 'காற்றுத் தரம் மற்றும் பாதுகாப்பு வழிகாட்டி',
      subtitle: 'அறிவியல் உண்மை மற்றும் எளிய வழிமுறைகள்.',
      tabBreathe: 'சுவாசப் பயிற்சி',
      tabLearn: 'கட்டுக்கதைகளும் உண்மைகளும்',
      tabTerms: 'அறிவியல் சொற்களஞ்சியம்',
    },
    profile: {
      title: 'அமைப்புகள் & விருப்பத்தேர்வுகள்',
      subtitle: 'தனிப்பயனாக்கப்பட்ட வழிகாட்டுதலுக்காக உங்கள் விவரங்களை புதுப்பித்து வைக்கவும்.',
      location: 'இருப்பிடம் & நகரம்',
      household: 'குடும்ப உறுப்பினர்கள்',
      cookingFuel: 'சமையல் எரிபொருள்',
      commute: 'பயண முறை',
      workType: 'வேலை வகை',
      budget: 'செலவு விருப்பம்',
      language: 'பதில் மொழி',
      theme: 'தோற்றம்',
      installPwa: 'செயலியை நிறுவு (PWA)',
      installSub: 'ஆஃப்லைன் புதுப்பிப்புகளுக்கு முகப்புத் திரையில் சேர்க்கவும்.',
      installNow: 'இப்போதே நிறுவு',
      appInstalled: 'செயலி தயாராக உள்ளது',
      personaliseChat: 'உரையாடலுடன் தனிப்பயனாக்குங்கள்',
      redoChat: 'உரையாடலை மீண்டும் செய்க',
      intakeChatSub: 'உங்கள் வழக்கம், அறைகள் மற்றும் குடும்பத்தினருக்கு ஏற்ப 2 நிமிட எளிய உரையாடல்.',
      cloudSyncTitle: 'கணக்கு மற்றும் கிளவுட் ஒத்திசைவு (Google)',
      cloudSyncLocalOnly: 'உங்கள் தூய காற்று சுயவிவரம் தற்போது இந்த சாதனத்தில் மட்டுமே உள்ளது.',
      signedInAs: 'உள்நுழைந்துள்ளீர்கள்:',
      cloudSyncSignedIn: 'சுயவிவரம் பாதுகாப்பான கிளவுடில் ஒத்திசைக்கப்பட்டது.',
      continueGoogle: 'Google உடன் தொடரவும்',
      cloudSave: 'கிளவுடில் சேமி',
      cloudSaved: 'சேமிக்கப்பட்டது!',
      signOut: 'வெளியேறு',
      cloudConsent: 'ஒப்புதல்: உங்கள் விருப்பங்களை பாதுகாப்பான கிளவுடில் சேமிக்க ஒப்புக்கொள்கிறீர்கள் (users/{uid}/profile). ஆடியோ அல்லது அரட்டையை நாங்கள் சேமிப்பதில்லை. எப்போது வேண்டுமானாலும் உங்கள் தரவை நீக்கலாம்.',
      clearChat: 'அரட்டை வரலாற்றை அழிக்கவும்',
      clearChatSub: 'சேமிக்கப்பட்ட AI உரையாடல் பதிவுகளை நீக்குகிறது.',
      chatCleared: 'அரட்டை வரலாறு அழிக்கப்பட்டது',
      resetData: 'அனைத்து தரவையும் மீட்டமை',
      save: 'சேமி',
      saved: 'சேமிக்கப்பட்டது!',
      reset: 'அனைத்து தரவையும் மீட்டமை',
      resetConfirm: 'நிச்சயமாக மீட்டமைக்க விரும்புகிறீர்களா?',
    },
    voice: {
      title: 'குரல் மற்றும் ஒலி அமைப்புகள்',
      subtitle: 'குரல் உள்ளீடு மற்றும் ஒலி அமைப்புகளை நிர்வகிக்கவும்.',
      enableVoice: 'குரல் உள்ளீட்டை இயக்கு',
      autoSend: 'பேசியவுடன் தானாக அனுப்பு',
      autoRead: 'பதில்களை சத்தமாக வாசி',
      speechRate: 'பேசும் வேகம்',
      readBoth: 'இரண்டு மொழிகளிலும் வாசி',
      preferredVoice: 'விருப்பமான குரல்',
      listening: 'கேட்கிறது...',
      speakNow: 'இப்போது பேசுங்கள்',
      tapToStop: 'நிறுத்த அழுத்தவும்',
      processing: 'செயலாக்குகிறது...',
      sendingIn: 'அனுப்பப்படுகிறது:',
      cancelSend: 'ரத்து செய்',
      sendNow: 'உடனே அனுப்பு',
      askByVoice: 'குரல் மூலம் கேளுங்கள்',
      play: 'கேளுங்கள்',
      pause: 'நிறுத்துங்கள்',
    },
    footerDisclaimer: 'இந்த செயலி பொதுவான விழிப்புணர்விற்காக மட்டுமே, மருத்துவ ஆலோசனை அல்ல.',
  },
  bn: {
    appName: 'Clearhale',
    tagline: 'পরিষ্কার বাতাসে বাঁচুন, পরিবারের সুরক্ষায় সঠিক সিদ্ধান্ত নিন।',
    getStarted: 'শুরু করুন',
    tryDemo: 'ডেমো দেখুন (দিল্লি প্রিসেট)',
    demoBadge: 'ডেমো মোড',
    cachedBadge: 'সংরক্ষিত তথ্য',
    minutesAgo: 'মিনিট আগে',
    tabs: {
      home: 'Home',
      plan: 'Action Plan',
      ask: 'Ask Clearhale',
      care: 'Care',
      learn: 'Care',
      profile: 'Settings',
    },
    home: {
      subtitle: 'আপনার পরিবারের জন্য আজকের বাতাস',
      nextTwoHours: 'পরবর্তী ২ ঘণ্টার সিদ্ধান্ত',
      topActions: 'শীর্ষ প্রস্তাবিত পদক্ষেপ',
      forecast24h: '২৪ ঘণ্টার পূর্বাভাস',
      bestWindow: 'পরিচ্ছন্ন বাতাসের সময়',
      updated: 'আপডেট করা হয়েছে',
      sourceNote: 'ওপেন-মেটিও বাতাসের মান পূর্বাভাস',
      familyFilter: {
        all: 'পুরো পরিবার',
        child: 'শিশু ও কিশোর',
        elderly: 'প্রবীণ সদস্য',
        pregnant: 'গর্ভবতী মা',
        worker: 'বহিরাঙ্গন কর্মী',
      },
      pm25Label: 'PM2.5 (µg/m³)',
      aqiLabel: 'US AQI',
      pm10Label: 'PM10',
      viewFullPlan: 'সম্পূর্ণ কর্মপরিকল্পনা দেখুন',
      pm25Level: 'PM2.5 মাত্রা',
      childVuln: 'শিশুদের সতর্কতা:',
      seniorVuln: 'প্রবীণদের সতর্কতা:',
      pregnantVuln: 'গর্ভবতীদের সতর্কতা:',
      workerVuln: 'কর্মীদের সতর্কতা:',
      familyVuln: 'পারিবারিক পরামর্শ:',
      refining: 'আপডেট হচ্ছে...',
    },
    plan: {
      title: 'কর্মপরিকল্পনা',
      subtitle: 'বায়ুদূষণের বিরুদ্ধে বিজ্ঞানসম্মত সহজ রুটিন।',
      whatIfTitle: 'ইনডোর এক্সপোজার সিমুলেটর',
      whatIfNote: 'বন্ধ জানালা ও ফিল্টারের কার্যকরিতা হিসাব।',
      outdoorBaseline: 'বাইরের PM2.5',
      estimatedIndoor: 'ঘরের ভেতরের PM2.5',
      reduction: 'দূষণ হ্রাস',
      assumptionsTitle: 'বিজ্ঞানসম্মত ভিত্তি',
      expandDetails: 'বিস্তারিত ও নিরাপত্তা',
      evidence: 'প্রমাণ',
      cost: 'খরচ',
      markDone: 'সম্পন্ন হিসেবে চিহ্নিত করুন',
      done: 'আজ সম্পন্ন হয়েছে',
      windowsDoors: 'জানালা ও দরজা',
      closed: 'বন্ধ (৫৭.৫% অনুপ্রবেশ)',
      open: 'খোলা (১০০% অনুপ্রবেশ)',
      filterType: 'ইনডোর এয়ার ফিল্টার',
      none: 'কোনোটিই নয়',
      hepa: 'পোর্টেবল True HEPA (৬৫% কমায়)',
      diyBox: 'DIY MERV-13 ফ্যান (৫৫% কমায়)',
      viewAssumptions: 'বৈজ্ঞানিক অনুমান দেখুন',
      prioritizingFor: 'অগ্রাধিকার দেওয়া হচ্ছে:',
      personaMatched: 'সদস্যের উপযোগী পদক্ষেপ প্রথমে দৃশ্যমান',
      expectedEffect: 'প্রত্যাশিত ফলাফল',
      safetyNote: 'নিরাপত্তা তথ্য',
    },
    ask: {
      title: 'Clearhale-কে জিজ্ঞাসা করুন',
      subtitle: 'বায়ুদূষণ ও স্বাস্থ্য সুরক্ষা নিয়ে বাংলায় জানুন।',
      placeholder: 'যেমন: আজ কি বাচ্চাদের বাইরে খেলতে দেওয়া নিরাপদ?',
      send: 'পাঠান',
      clear: 'মুছুন',
      disclaimer: 'বায়ুর মান সংক্রান্ত সাধারণ তথ্য, চিকিৎসকের পরামর্শের বিকল্প নয়।',
      listening: 'শুনছি... কথা বলুন',
      tapToSpeak: 'কথা বলতে মাইকে চাপুন',
      examples: [
        'ঘন ধোঁয়াশায় কি বাচ্চাদের বাইরে খেলতে দেওয়া যাবে?',
        'কম খরচে ঘরের ভেতর এয়ার ফিল্টার কীভাবে বানাবেন?',
        'দিনের কোন সময়ে জানালা খোলা রাখা সবচেয়ে ভালো?',
      ],
    },
    learn: {
      title: 'যত্ন ও সচেতনতা নির্দেশিকা',
      subtitle: 'শ্বাস-প্রশ্বাস, সঠিক অভ্যাস এবং বৈজ্ঞানিক তথ্য।',
      tabBreathe: 'শ্বাস-প্রশ্বাসের ব্যায়াম',
      tabLearn: 'ভ্রান্ত ধারণা বনাম বিজ্ঞান',
      tabTerms: 'পরিভাষাকোষ',
    },
    profile: {
      title: 'সেটিংস ও পছন্দসমূহ',
      subtitle: 'সঠিক নির্দেশনার জন্য আপনার প্রোফাইল আপডেট রাখুন।',
      location: 'অবস্থান ও শহর',
      household: 'পরিবারের তথ্য',
      cookingFuel: 'রান্নার জ্বালানি',
      commute: 'যাতায়াতের মাধ্যম',
      workType: 'কাজের ধরণ',
      budget: 'বাজেট অগ্রাধিকার',
      language: 'উত্তর প্রদানের ভাষা',
      theme: 'থিম নির্বাচন',
      installPwa: 'অ্যাপ ইনস্টল করুন (PWA)',
      installSub: 'দ্রুত অফলাইন আপডেটের জন্য হোম স্ক্রিনে যোগ করুন।',
      installNow: 'এখনই ইনস্টল করুন',
      appInstalled: 'অ্যাপ প্রস্তুত আছে',
      personaliseChat: 'কথোপকথনের মাধ্যমে প্রোফাইল তৈরি করুন',
      redoChat: 'কথোপকথন আবার করুন',
      intakeChatSub: 'আপনার দৈনন্দিন রুটিন এবং পরিবারের জন্য ২ মিনিটের সহজ কথোপকথন।',
      cloudSyncTitle: 'অ্যাকাউন্ট ও ক্লাউড সিঙ্ক (Google)',
      cloudSyncLocalOnly: 'আপনার পরিচ্ছন্ন বাতাসের প্রোফাইল বর্তমানে কেবল এই ডিভাইসেই সংরক্ষিত রয়েছে।',
      signedInAs: 'সাইন ইন করা হয়েছে:',
      cloudSyncSignedIn: 'প্রোফাইল ক্লাউডে সুরক্ষিতভাবে সংরক্ষিত।',
      continueGoogle: 'Google দিয়ে চালিয়ে যান',
      cloudSave: 'ক্লাউডে সেভ করুন',
      cloudSaved: 'সংরক্ষিত হয়েছে!',
      signOut: 'সাইন আউট',
      cloudConsent: 'সম্মতি: আপনার অ্যাকাউন্টে সেভ করার মাধ্যমে আপনি ডেটা ক্লাউডে সংরক্ষণে সম্মতি দিচ্ছেন (users/{uid}/profile)। আমরা কোনো অডিও বা চ্যাট সংরক্ষণ করি না। আপনি যে কোনো সময় আপনার ডেটা মুছে ফেলতে পারেন।',
      clearChat: 'চ্যাট ইতিহাস মুছুন',
      clearChatSub: 'এই ডিভাইস থেকে সংরক্ষিত AI কথোপকথন মুছুন।',
      chatCleared: 'চ্যাট ইতিহাস মোছা হয়েছে',
      resetData: 'সব তথ্য রিসেট করুন',
      save: 'সংরক্ষণ',
      saved: 'সংরক্ষিত হয়েছে!',
      reset: 'সব তথ্য রিসেট করুন',
      resetConfirm: 'আপনি কি নিশ্চিত?',
    },
    voice: {
      title: 'ভয়েস ও অডিও সেটিংস',
      subtitle: 'ভয়েস ইনপুট ও অডিও প্রতিক্রিয়া পরিচালনা করুন।',
      enableVoice: 'ভয়েস ইনপুট সক্রিয় করুন',
      autoSend: 'কথা শেষে স্বয়ংক্রিয়ভাবে পাঠান',
      autoRead: 'উত্তর পড়ে শোনান',
      speechRate: 'বলার গতি',
      readBoth: 'দ্বিভাষিক প্রতিক্রিয়া',
      preferredVoice: 'পছন্দের ভয়েস',
      listening: 'শুনছি...',
      speakNow: 'এখন বলুন',
      tapToStop: 'থামাতে চাপুন',
      processing: 'প্রক্রিয়াকরণ হচ্ছে...',
      sendingIn: 'পাঠানো হচ্ছে:',
      cancelSend: 'বাতিল',
      sendNow: 'এখন পাঠান',
      askByVoice: 'ভয়েসে জিজ্ঞাসা করুন',
      play: 'শুনুন',
      pause: 'থামান',
    },
    footerDisclaimer: 'এই অ্যাপটি সাধারণ শিক্ষামূলক তথ্যের জন্য তৈরি; এটি চিকিৎসার বিকল্প নয়।',
  },
};

export const ACTIONS_I18N: Record<string, Record<string, { title: string; why?: string }>> = {
  hi: {
    bedroom_sanctuary: {
      title: 'बेडरूम को साफ हवा का कमरा बनाएं',
      why: 'कमरे को बंद रखने से फिल्टर की हवा साफ रहती है और सोते समय स्वच्छ सांस मिलती है।',
    },
    bedroom_door_towel: {
      title: 'दरवाजे के नीचे तौलिया लगाएं',
      why: 'दरवाजे के नीचे की दरार को रोकने से बाहर की गंदी हवा कमरे में नहीं आती।',
    },
    stop_incense_coils: {
      title: 'अगरबत्ती, धूप और कॉइल बंद करें',
      why: 'अगरबत्ती और कॉइल जलाने से कमरे में भारी मात्रा में जहरीला धुआं और बारीक कण भर जाते हैं।',
    },
    kitchen_exhaust_chimney: {
      title: 'रसोई की चिमनी या एग्जॉस्ट चलाएं',
      why: 'एग्जॉस्ट पंखा खाना पकाने के धुएं और तेल के बारीक कणों को तुरंत बाहर निकाल देता है।',
    },
    lids_and_pressure_cookers: {
      title: 'ढक्कन और प्रेशर कुकर का उपयोग करें',
      why: 'ढककर पकाने से खाना जल्दी बनता है और गैस या चूल्हे का धुआं बहुत कम निकलता है।',
    },
    lower_frying_heat: {
      title: 'तलते समय आंच धीमी रखें',
      why: 'तेल को ज्यादा गर्म करने से जहरीले बारीक कण और धुएं के रसायन हवा में घुलते हैं।',
    },
    switch_to_induction: {
      title: 'इंडक्शन कुकटॉप का उपयोग करें',
      why: 'बिजली का इंडक्शन बिना आग के खाना पकाता है जिससे घर में धुआं और गैस नहीं फैलती।',
    },
    biomass_ventilation: {
      title: 'लकड़ी-कोयले का चूल्हा बाहर जलाएं',
      why: 'लकड़ी या उपलों के चूल्हे से भारी जहरीला धुआं निकलता है, इसलिए खुली जगह में खाना बनाएं।',
    },
    damp_mopping_floors: {
      title: 'सूखी झाड़ू की जगह गीला पोंछा लगाएं',
      why: 'सूखी झाड़ू जमी हुई धूल को हवा में उड़ाती है, जबकि गीला पोंछा धूल को चिपका कर साफ करता है।',
    },
    choose_hepa_not_ozone: {
      title: 'ओजोन वाले नहीं, HEPA प्यूरीफायर चुनें',
      why: 'HEPA फिल्टर धूल को सुरक्षित छानता है, जबकि आयोनाइजर और ओजोन फेफड़ों को नुकसान पहुंचाते हैं।',
    },
    avoid_aerosol_sprays: {
      title: 'रूम फ्रेशनर और स्प्रे से बचें',
      why: 'केमिकल एयर फ्रेशनर से निकलने वाले वाष्प हवा में मिलकर बारीक प्रदूषण कण बना देते हैं।',
    },
    maintain_purifier_filters: {
      title: 'प्यूरीफायर के फिल्टर समय पर बदलें',
      why: 'जाम फिल्टर से हवा का बहाव रुक जाता है और प्यूरीफायर कमरे की हवा ठीक से साफ नहीं कर पाता।',
    },
    shut_windows_smog: {
      title: 'भारी स्मॉग के दौरान खिड़कियां बंद रखें',
      why: 'खिड़की-दरवाजे बंद रखने से बाहर का जहरीला स्मॉग सीधे घर में नहीं घुस पाता।',
    },
    air_out_cleanest_hour: {
      title: 'सबसे साफ घंटे में हवा बदलें',
      why: 'दोपहर में जब बाहर प्रदूषण सबसे कम हो, तब थोड़ी देर खिड़की खोलकर ताजी हवा लें।',
    },
    seal_gaps_weatherstripping: {
      title: 'खिड़की-दरवाजों की दरारें सील करें',
      why: 'वेदरस्ट्रिप टेप लगाने से बाहर की धूल और धुआं दरारों से घर में नहीं आता।',
    },
    recirculating_ac_fan: {
      title: 'खिड़कियां बंद रखकर पंखा या एसी चलाएं',
      why: 'स्प्लिट एसी या पंखा अंदर की हवा को ही घुमाता है और बाहर का धुआं अंदर नहीं खींचता।',
    },
    hepa_purifier: {
      title: 'पोर्टेबल HEPA प्यूरीफायर चलाएं',
      why: 'दरवाजे-खिड़कियां बंद रखकर लगातार चलाने पर यह कमरे के बारीक प्रदूषण को काफी कम कर देता है।',
    },
    diy_box_fan: {
      title: 'DIY बॉक्स-फैन फिल्टर बनाएं',
      why: 'कम खर्च में बॉक्स फैन पर MERV-13 फिल्टर लगाकर कमरे की हवा साफ की जा सकती है।',
    },
    n95_respirator: {
      title: 'बाहर जाते समय N95 मास्क पहनें',
      why: 'प्रमाणित N95 मास्क चेहरे पर अच्छी तरह चिपक कर बारीक स्मॉग को सांस में जाने से रोकता है।',
    },
    move_exercise_indoors: {
      title: 'भारी व्यायाम घर के अंदर करें',
      why: 'तेज कसरत में सांस गहरी चलती है जिससे बाहर का जहरीला धुआं सीधे फेफड़ों में भर जाता है।',
    },
    shift_outdoor_offpeak: {
      title: 'बाहर के काम दोपहर में निपटाएं',
      why: 'सुबह और शाम स्मॉग जमीन के पास जमा रहता है, जबकि दोपहर की धूप में धुआं छंट जाता है।',
    },
    cleaner_travel_routes: {
      title: 'कम ट्रैफिक वाले साफ रास्ते चुनें',
      why: 'गाड़ियों के जाम से थोड़ी दूरी पर भी धुएं और जहरीले कणों का स्तर काफी कम हो जाता है।',
    },
    stop_waste_burning: {
      title: 'पत्ते और कचरा कभी न जलाएं',
      why: 'प्लास्टिक और सूखे पत्ते जलाने से जमीन पर अत्यधिक जहरीला धुआं और कालिख फैलती है।',
    },
    report_burning_sameer: {
      title: 'समीर ऐप पर खुली आग की शिकायत करें',
      why: 'फोटो खींचकर शिकायत दर्ज करने से प्रदूषण नियंत्रण बोर्ड और नगर निगम तुरंत कार्रवाई करते हैं।',
    },
    advocate_cleaner_spaces: {
      title: 'स्कूल और दफ्तर में साफ हवा की मांग करें',
      why: 'सामूहिक प्रयासों से स्कूल और ऑफिस में एयर फिल्टर लगते हैं जिससे सबका बचाव होता है।',
    },
    commute_clean_choices: {
      title: 'यात्रा के दौरान धुएं से बचाव के साधन चुनें',
      why: 'गाड़ी में शीशे बंद करके रीसर्क्युलेशन चलाएं और ऑटो की जगह बंद मेट्रो को प्राथमिकता दें।',
    },
    myth_houseplants: {
      title: 'भ्रम: घर के पौधे कमरा साफ करते हैं',
      why: 'पौधे घर की सुंदरता बढ़ाते हैं लेकिन हवा के बारीक कणों (PM2.5) को नहीं छान सकते; इसके लिए HEPA जरूरी है।',
    },
    myth_cloth_masks: {
      title: 'भ्रम: कपड़े का मास्क PM2.5 रोकता है',
      why: 'कपड़े के धागों के बीच का छेद बहुत बड़ा होता है जिससे जहरीला धुआं सीधे अंदर चला जाता है।',
    },
    myth_salt_lamps: {
      title: 'भ्रम: सॉल्ट लैंप हवा साफ करते हैं',
      why: 'सॉल्ट लैंप सिर्फ रात की धीमी रोशनी के लिए हैं, ये हवा के जहरीले कणों को नहीं खींच सकते।',
    },
    myth_water_onion: {
      title: 'भ्रम: पानी या कटा प्याज प्रदूषण सोखता है',
      why: 'कटोरी में रखा पानी या प्याज हवा के धुएं को नहीं सोखता; खुले पानी से मच्छर पनप सकते हैं।',
    },
    myth_wet_cloths_windows: {
      title: 'भ्रम: खिड़की पर गीला कपड़ा स्मॉग रोकता है',
      why: 'गीला कपड़ा हवा को सील नहीं कर पाता और बाहर का धुआं किनारों से घर में घुस जाता है।',
    },
    myth_detox_drinks: {
      title: 'भ्रम: डिटॉक्स पेयांमुळे फुप्फुसातील धूर धुतला जातो',
      why: 'श्वासातून घेतलेला धूर थेट फुप्फुसात जातो, तर पेय पचनसंस्थेत जाते; ते फुप्फुसातील धूर साफ करू शकत नाही.',
    },
    windows_doors_closed: {
      title: 'धुरक्याच्या काळात खिडक्या आणि दारे बंद ठेवा',
      why: 'हिवाळ्यातील हवेच्या दाबामुळे बाहेरचे प्रदूषित कण घरात शिरण्यापासून रोखते.',
    },
  },
};

// Safe property path resolver
export function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
    curr = curr[part];
  }
  return typeof curr === 'string' ? curr : undefined;
}

// Bilingual string getter
export function getBiString(
  lang: SupportedLanguage,
  key: string,
  dynamicDict?: Record<string, string>,
  defaultEn?: string
): { en: string; native: string } {
  const en = defaultEn || getNestedValue(UI_TRANSLATIONS.en, key) || key;

  if (lang === 'en') {
    return { en, native: en };
  }

  let native: string | undefined = undefined;
  if (lang === 'hi') {
    native = getNestedValue(UI_TRANSLATIONS.hi, key);
  } else if (lang === 'mr') {
    native = getNestedValue(UI_TRANSLATIONS.mr, key);
  } else if ((UI_TRANSLATIONS as any)[lang]) {
    native = getNestedValue((UI_TRANSLATIONS as any)[lang], key);
  }

  // Dynamic AI translation dictionary for other regional languages
  if (!native && dynamicDict && dynamicDict[key]) {
    native = dynamicDict[key];
  }

  // Fall back to English per string if translation is missing
  if (!native) {
    native = en;
  }

  return { en, native };
}

// Clean-air action titles when air quality is Good or Satisfactory (celebrates outdoor workouts, fresh air, park walks)
export const CLEAN_AIR_ACTION_TITLES: Record<string, { en: string; hi: string; mr: string; bn?: string; ta?: string }> = {
  move_exercise_indoors: {
    en: 'Exercise outdoors in parks & open grounds',
    hi: 'पार्क या खुले मैदान में बाहर कसरत करें',
    mr: 'बागेत किंवा मोकळ्या मैदानात बाहेर व्यायाम करा',
    bn: 'পার্কে বা খোলা মাঠে ব্যায়াম করুন',
    ta: 'பூங்காவில் வெளிப்புற உடற்பயிற்சி செய்யுங்கள்',
  },
  shut_windows_smog: {
    en: 'Open windows for fresh air',
    hi: 'खिड़कियां खोलकर ताज़ी हवा का संचार करें',
    mr: 'खिडक्या उघडून घरात ताजी हवा खेळती ठेवा',
    bn: 'তাজা বাতাসের জন্য জানালা খুলুন',
    ta: 'புதிய காற்றோட்டத்திற்கு ஜன்னல்களைத் திறக்கவும்',
  },
  shift_outdoor_offpeak: {
    en: 'Enjoy pleasant outdoor walks and routines',
    hi: 'बाहर सुखद सैर और दैनिक कार्यों का आनंद लें',
    mr: 'मोकळ्या हवेत फिरण्याचा व कामांचा आनंद घ्या',
    bn: 'বাইরে হাঁটাচলা উপভোগ করুন',
    ta: 'வெளியில் நடைப்பயிற்சி செய்யுங்கள்',
  },
  bedroom_sanctuary: {
    en: 'Aerate bedroom with clean natural air',
    hi: 'बेडरूम में प्राकृतिक ताज़ी हवा आने दें',
    mr: 'बेडरूममध्ये नैसर्गिक ताजी हवा येऊ द्या',
    bn: 'বেডরুমে তাজা বাতাস প্রবেশ করতে দিন',
    ta: 'படுக்கையறையில் புதிய காற்றோட்டம் விடுங்கள்',
  },
  windows_doors_closed: {
    en: 'Open windows for fresh air',
    hi: 'खिड़कियां खोलकर ताज़ी हवा का संचार करें',
    mr: 'खिडक्या उघडून घरात ताजी हवा खेळती ठेवा',
    bn: 'তাজা বাতাসের জন্য জানালা খুলুন',
    ta: 'புதிய காற்றோட்டத்திற்கு ஜன்னல்களைத் திறக்கவும்',
  },
  child_play_school_timing: {
    en: 'Encourage outdoor play, sports & playground games',
    hi: 'बच्चों को बाहर मैदान में खेलने दें',
    mr: 'मुलांना मैदानात मोकळे खेळू द्या',
    bn: 'বাচ্চাদের বাইরে খেলতে দিন',
    ta: 'குழந்தைகளை வெளியில் விளையாட ஊக்குவிக்கவும்',
  },
  elderly_clean_room: {
    en: 'Enjoy pleasant morning or evening garden walks',
    hi: 'पार्क या बगीचे में सुखद सैर करें',
    mr: 'बागेत किंवा पार्कमध्ये फेरफटका मारा',
    bn: 'বাগানে সকালের বা সন্ধ্যার হাঁটা উপভোগ করুন',
    ta: 'பூங்காவில் இனிமையான நடைப்பயிற்சி செய்யுங்கள்',
  },
  pregnant_avoid_smog_errands: {
    en: 'Take peaceful outdoor walks in green parks',
    hi: 'हरे-भरे पार्क में सुकून भरी सैर करें',
    mr: 'हिरव्यागार बागेत शांत फेरफटका मारा',
    bn: 'সবুজ পার্কে শান্তিপূর্ণ হাঁটা উপভোগ করুন',
    ta: 'பசுமையான பூங்காவில் அமைதியான நடைப்பயிற்சி',
  },
  pregnant_sanctuary_filtration: {
    en: 'Enjoy natural fresh air & outdoor green spaces',
    hi: 'प्राकृतिक ताज़ी हवा और हरियाली का आनंद लें',
    mr: 'नैसर्गिक ताजी हवा आणि हिरवळीचा आनंद घ्या',
    bn: 'প্রাকৃতিক তাজা বাতাস উপভোগ করুন',
    ta: 'இயற்கையான புதிய காற்றை அனுபவிக்கவும்',
  },
  n95_respirator: {
    en: 'Breathe freely outdoors without a mask',
    hi: 'बिना मास्क के खुली और ताज़ी हवा में सांस लें',
    mr: 'विना मास्क मोकळ्या आणि ताज्या हवेत श्वास घ्या',
    bn: 'মাস্ক ছাড়াই খোলা বাতাসে শ্বাস নিন',
    ta: 'முகமூடி இல்லாமல் புதிய காற்றை சுவாசிக்கவும்',
  },
  shift_commute_hours: {
    en: 'Enjoy active walking or cycling commutes',
    hi: 'पैदल चलने या साइकिल चलाने का आनंद लें',
    mr: 'चालत किंवा सायकलने प्रवासाचा आनंद घ्या',
    bn: 'পায়ে হেঁটে বা সাইকেলে যাতায়াত করুন',
    ta: 'நடந்து அல்லது சைக்கிளில் பயணம் செய்யுங்கள்',
  },
  hepa_purifier: {
    en: 'Run purifier on eco-mode or open windows',
    hi: 'प्यूरिफायर को इको-मोड पर रखें या प्राकृतिक हवा आने दें',
    mr: 'प्युरिफायर इको-मोडवर ठेवा किंवा नैसर्गिक हवा येऊ द्या',
    bn: 'পিউরিফায়ার ইকো-মোডে রাখুন',
    ta: 'இயற்கை காற்றோட்டத்தைப் பயன்படுத்துங்கள்',
  },
};

// Action card i18n title resolver
export function getActionI18n(
  lang: SupportedLanguage,
  actionId: string,
  fallbackTitle: string,
  dynamicDict?: Record<string, string>,
  aqiBandKey: string = 'poor'
): { enTitle: string; nativeTitle: string } {
  const isCleanAir = aqiBandKey === 'good' || aqiBandKey === 'satisfactory';

  if (isCleanAir && CLEAN_AIR_ACTION_TITLES[actionId]) {
    const item = CLEAN_AIR_ACTION_TITLES[actionId];
    const enTitle = item.en;
    if (lang === 'en') {
      return { enTitle, nativeTitle: enTitle };
    }
    const nativeTitle = (item as any)[lang] || item.en;
    return { enTitle, nativeTitle };
  }

  const enTitle = fallbackTitle;
  if (lang === 'en') {
    return { enTitle, nativeTitle: enTitle };
  }

  const nativeObj = ACTIONS_I18N[lang]?.[actionId];
  if (nativeObj?.title) {
    return { enTitle, nativeTitle: nativeObj.title };
  }

  // Dynamic fallback from AI dict
  const dynamicKey = `action.${actionId}.title`;
  if (dynamicDict?.[dynamicKey]) {
    return { enTitle, nativeTitle: dynamicDict[dynamicKey] };
  }

  return { enTitle, nativeTitle: enTitle };
}

// Collect flat English dictionary for AI batch translation
export function getFlatEnglishDictionary(): Record<string, string> {
  const flat: Record<string, string> = {};

  function traverse(obj: any, prefix = '') {
    for (const k in obj) {
      if (typeof obj[k] === 'string') {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        flat[fullKey] = obj[k];
      } else if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        traverse(obj[k], prefix ? `${prefix}.${k}` : k);
      }
    }
  }

  traverse(UI_TRANSLATIONS.en);

  // Also include exact English titles of all catalog actions
  if (Array.isArray(actionsData)) {
    for (const a of actionsData as Array<{ id: string; title: string }>) {
      if (a?.id && a?.title) {
        flat[`action.${a.id}.title`] = a.title;
      }
    }
  }

  return flat;
}


export function isIndianCity(city?: CityLocation | null): boolean {
  if (!city) return true;
  const country = (city.country || '').trim().toLowerCase();
  if (country) {
    if (country === 'india' || country === 'in' || country === 'ind' || country === 'bharat') {
      return true;
    }
    return false;
  }

  // If country is missing, check coordinates against India bounding box
  if (typeof city.lat === 'number' && typeof city.lon === 'number') {
    if (city.lat < 6.0 || city.lat > 37.5 || city.lon < 68.0 || city.lon > 97.5) {
      return false;
    }
  }

  const name = (city.name || '').trim().toLowerCase();
  const internationalHubs = [
    'tokyo', 'london', 'paris', 'new york', 'dubai', 'singapore', 'sydney',
    'berlin', 'beijing', 'shanghai', 'hong kong', 'bangkok', 'toronto',
    'san francisco', 'los angeles', 'chicago', 'moscow', 'rome', 'seoul',
    'madrid', 'amsterdam', 'kuala lumpur', 'jakarta', 'karachi', 'lahore',
    'dhaka', 'colombo', 'kathmandu'
  ];
  if (internationalHubs.includes(name)) {
    return false;
  }

  return true;
}

// Determine regional language suggested for an Indian city/state
// Any city outside India strictly suggests only English ('en')
export function getRegionalLanguageForCity(city?: CityLocation | null): SupportedLanguage {
  if (!city) return 'hi';
  if (!isIndianCity(city)) {
    return 'en';
  }
  const name = (city.name || '').toLowerCase();
  const admin = (city.admin || '').toLowerCase();
  const text = `${name} ${admin} ${(city.country || '')}`.toLowerCase();

  // Tamil (Tamil Nadu / Puducherry)
  if (
    text.includes('tamil') ||
    text.includes('puducherry') ||
    text.includes('pondicherry') ||
    text.includes('chennai') ||
    text.includes('coimbatore') ||
    text.includes('madurai') ||
    text.includes('tiruchirappalli') ||
    text.includes('trichy') ||
    text.includes('salem') ||
    text.includes('tirunelveli') ||
    text.includes('vellore') ||
    text.includes('erode') ||
    text.includes('thanjavur')
  ) {
    return 'ta';
  }

  // Marathi (Maharashtra / Goa)
  if (
    text.includes('maharashtra') ||
    text.includes('mumbai') ||
    text.includes('pune') ||
    text.includes('nagpur') ||
    text.includes('nashik') ||
    text.includes('thane') ||
    text.includes('aurangabad') ||
    text.includes('sambhajinagar') ||
    text.includes('solapur') ||
    text.includes('kolhapur') ||
    text.includes('navi mumbai') ||
    text.includes('goa')
  ) {
    return 'mr';
  }

  // Bengali (West Bengal / Tripura)
  if (
    text.includes('bengal') ||
    text.includes('tripura') ||
    text.includes('kolkata') ||
    text.includes('calcutta') ||
    text.includes('howrah') ||
    text.includes('siliguri') ||
    text.includes('durgapur') ||
    text.includes('asansol') ||
    text.includes('agartala')
  ) {
    return 'bn';
  }

  // Telugu (Telangana / Andhra Pradesh)
  if (
    text.includes('telangana') ||
    text.includes('andhra') ||
    text.includes('hyderabad') ||
    text.includes('visakhapatnam') ||
    text.includes('vizag') ||
    text.includes('vijayawada') ||
    text.includes('guntur') ||
    text.includes('warangal') ||
    text.includes('tirupati')
  ) {
    return 'te';
  }

  // Kannada (Karnataka)
  if (
    text.includes('karnataka') ||
    text.includes('bengaluru') ||
    text.includes('bangalore') ||
    text.includes('mysuru') ||
    text.includes('mysore') ||
    text.includes('hubli') ||
    text.includes('mangalore') ||
    text.includes('mangaluru') ||
    text.includes('belgaum') ||
    text.includes('belagavi')
  ) {
    return 'kn';
  }

  // Malayalam (Kerala / Lakshadweep)
  if (
    text.includes('kerala') ||
    text.includes('lakshadweep') ||
    text.includes('thiruvananthapuram') ||
    text.includes('trivandrum') ||
    text.includes('kochi') ||
    text.includes('cochin') ||
    text.includes('kozhikode') ||
    text.includes('calicut') ||
    text.includes('thrissur')
  ) {
    return 'ml';
  }

  // Gujarati (Gujarat)
  if (
    text.includes('gujarat') ||
    text.includes('ahmedabad') ||
    text.includes('surat') ||
    text.includes('vadodara') ||
    text.includes('baroda') ||
    text.includes('rajkot') ||
    text.includes('gandhinagar') ||
    text.includes('bhavnagar') ||
    text.includes('jamnagar')
  ) {
    return 'gu';
  }

  // Punjabi (Punjab / Chandigarh)
  if (
    text.includes('punjab') ||
    text.includes('chandigarh') ||
    text.includes('amritsar') ||
    text.includes('ludhiana') ||
    text.includes('jalandhar') ||
    text.includes('patiala') ||
    text.includes('mohali')
  ) {
    return 'pa';
  }

  // Odia (Odisha / Orissa)
  if (
    text.includes('odisha') ||
    text.includes('orissa') ||
    text.includes('bhubaneswar') ||
    text.includes('cuttack') ||
    text.includes('rourkela') ||
    text.includes('puri')
  ) {
    return 'or';
  }

  // Northern / Central / Default -> Hindi
  return 'hi';
}

export function getLanguageOption(code: SupportedLanguage): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
