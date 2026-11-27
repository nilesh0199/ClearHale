export type MythCategory = 'all' | 'masks' | 'indoor' | 'cooking';

export interface MythItem {
  id: string;
  category: 'masks' | 'indoor' | 'cooking';
  // Titles
  titleEn: string;
  titleHi: string;
  titleMr: string;
  titleBn?: string;
  titleTa?: string;
  titleTe?: string;
  // Verdicts
  verdictKey: string;
  verdictEn: string;
  verdictHi?: string;
  verdictMr?: string;
  verdictBn?: string;
  verdictTa?: string;
  verdictTe?: string;
  // Myth Claims
  mythTextEn: string;
  mythTextHi: string;
  mythTextMr: string;
  mythTextBn?: string;
  mythTextTa?: string;
  mythTextTe?: string;
  // Explanations (The Scientific Reality)
  explanationEn: string;
  explanationHi: string;
  explanationMr: string;
  explanationBn?: string;
  explanationTa?: string;
  explanationTe?: string;
  // Actionable Advice (What to do instead)
  whatToDoEn: string;
  whatToDoHi: string;
  whatToDoMr: string;
  whatToDoBn?: string;
  whatToDoTa?: string;
  whatToDoTe?: string;
  // Backward-compatible getters
  mythText: string;
  explanation: string;
  whatToDo: string;
}

export const MYTH_ITEMS: MythItem[] = [
  {
    id: 'cloth_masks',
    category: 'masks',
    titleEn: 'Cloth Masks, Scarves & Dupattas',
    titleHi: 'कपड़े के मास्क, गमछा और दुपट्टा',
    titleMr: 'कापडी मास्क, रुमाल आणि ओढणी',
    titleBn: 'কাপড়ের মাস্ক, রুমাল ও ওড়না',
    titleTa: 'துணி முகமூடிகள், தாவணி மற்றும் துப்பட்டா',
    titleTe: 'గుడ్డ మాస్కులు, కండువాలు మరియు దుపట్టాలు',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Ineffective for PM2.5',
    verdictHi: 'PM2.5 के लिए निष्प्रभावी',
    verdictMr: 'PM2.5 साठी निरुपयोगी',
    verdictBn: 'PM2.5 এর জন্য অকার্যকর',
    verdictTa: 'PM2.5 துகள்களுக்கு பயனற்றது',
    verdictTe: 'PM2.5 కి పనికిరాదు',
    mythTextEn: 'Wrapping a dupatta, cloth handkerchief, or surgical mask stops winter smog.',
    mythTextHi: 'दुपट्टा, गमछा, कपड़े का रुमाल या सर्जिकल मास्क लपेटने से सर्दियों का जहरीला स्मॉग रुक जाता है।',
    mythTextMr: 'ओढणी, कापडी रुमाल किंवा साधा सर्जिकल मास्क बांधल्याने हिवाळ्यातील विषारी धुरके (स्मॉग) अडवता येते.',
    mythTextBn: 'ওড়না, কাপড়ের রুমাল বা সার্জিক্যাল মাস্ক বাঁধলে শীতের বিষাক্ত ধোঁয়াশা আটকে যায়।',
    mythTextTa: 'துப்பட்டா, துணி கைக்குட்டை அல்லது அறுவை சிகிச்சை முகமூடியை கட்டினால் குளிர்கால காற்று மாசுபாடு தடுக்கப்படும்.',
    mythTextTe: 'దుపట్టా, గుడ్డ రుమాలు లేదా సర్జికల్ మాస్క్ ధరిస్తే శీతాకాలపు పొగమంచు ఆగిపోతుంది.',
    explanationEn:
      'Cloth fabric weaves have large microscopic gaps between 50 and 200 microns. Fine winter smog particles (PM2.5) are smaller than 2.5 microns and pass effortlessly through cloth fibers into your lungs.',
    explanationHi:
      'कपड़े के धागों के बीच 50 से 200 माइक्रोन के बड़े छेद होते हैं। जबकि जहरीले PM2.5 कण 2.5 माइक्रोन से भी छोटे होते हैं, जो कपड़े के छेदों से आसानी से निकलकर फेफड़ों और खून में पहुंच जाते हैं। सर्जिकल मास्क भी किनारों से लीक होते हैं।',
    explanationMr:
      'कापडाच्या धाग्यांमध्ये ५० ते २०० मायक्रॉनच्या सूक्ष्म फटी असतात. विषारी PM2.5 कण २.५ मायक्रॉनपेक्षा लहान असल्याने कापडातून सहज फुप्फुसात शिरतात. साधे सर्जिकल मास्कही बाजूने गळतात.',
    explanationBn:
      'কাপড়ের সুতোর মাঝে ৫০ থেকে ২০০ মাইক্রনের ফাঁক থাকে। বিষাক্ত PM2.5 কণা ২.৫ মাইক্রনের চেয়েও ছোট হওয়ায় কাপড়ের ফাঁক গলে অনায়াসে ফুসফুসে প্রবেশ করে। সার্জিক্যাল মাস্কও পাশ দিয়ে বাতাস টেনে নেয়।',
    explanationTa:
      'துணி இழைகளுக்கு இடையே 50 முதல் 200 மைக்ரான் இடைவெளி உள்ளது. நச்சு PM2.5 துகள்கள் 2.5 மைக்ரானுக்கும் குறைவானவை என்பதால், அவை துணி வழியாக நேராக நுரையீரலுக்குள் எளிதாகச் சென்றுவிடும்.',
    explanationTe:
      'బట్ట దారాల మధ్య 50 నుండి 200 మైక్రాన్ల రంధ్రాలు ఉంటాయి. విషపూరిత PM2.5 కణాలు 2.5 మైక్రాన్ల కంటే చిన్నవి కాబట్టి, అవి గుడ్డ గుండా నేరుగా ఊపిరితిత్తులలోకి ప్రవేశిస్తాయి.',
    whatToDoEn:
      'Wear a certified, well-fitted N95 or FFP2 respirator with tight facial seal during outdoor commutes. (Never use on infants or children under 2).',
    whatToDoHi:
      'बाहर निकलते समय चेहरे पर पूरी तरह सील बैठने वाला प्रमाणित N95 या FFP2 रेस्पिरेटर पहनें। (ध्यान दें: 2 वर्ष से कम उम्र के बच्चों और शिशुओं को मास्क न लगाएं)।',
    whatToDoMr:
      'बाहेर पडताना चेहऱ्याला घट्ट बसणारा प्रमाणित N95 किंवा FFP2 मास्क वापरा. (महत्त्वाचे: २ वर्षांखालील लहान बालकांना मास्क लावू नका).',
    whatToDoBn:
      'বাইরে বেরোনোর সময় মুখ ভালোভাবে ঢেকে রাখে এমন প্রত্যয়িত N95 বা FFP2 মাস্ক পরুন। (মনে রাখবেন: ২ বছরের কম বয়সী শিশুদের মাস্ক পরাবেন না)।',
    whatToDoTa:
      'வெளியே செல்லும்போது முகத்தை இறுக்கமாக மூடும் சான்றளிக்கப்பட்ட N95 அல்லது FFP2 மாஸ்க் அணியுங்கள். (2 வயதுக்குட்பட்ட குழந்தைகளுக்கு முகமூடி அணிவிக்கக் கூடாது).',
    whatToDoTe:
      'బయటికి వెళ్ళేటప్పుడు ముఖానికి గట్టిగా సరిపోయే సర్టిఫైడ్ N95 లేదా FFP2 రెస్పిరేటర్ ధరించండి. (2 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న పిల్లలకు మాస్క్ వేయవద్దు).',
    mythText: 'Wrapping a dupatta, cloth handkerchief, or surgical mask stops winter smog.',
    explanation:
      'Cloth fabric weaves have large microscopic gaps between 50 and 200 microns. Fine winter smog particles (PM2.5) are smaller than 2.5 microns and pass effortlessly through cloth fibers into your lungs.',
    whatToDo:
      'Wear a certified, well-fitted N95 or FFP2 respirator with tight facial seal during outdoor commutes. (Never use on infants or children under 2).',
  },
  {
    id: 'houseplants',
    category: 'indoor',
    titleEn: 'Houseplants Clean Smog Indoors',
    titleHi: 'घर के इनडोर पौधे (हाउसप्लांट्स)',
    titleMr: 'घरातील शोभेची झाडे',
    titleBn: 'ঘরের গাছপালা (ইনডোর প্ল্যান্টস)',
    titleTa: 'வீட்டுத் தாவரங்கள் உட்புற காற்றைச் சுத்தப்படுத்தும்',
    titleTe: 'ఇంట్లో పెంచే మొక్కలు పొగమంచును శుభ్రపరుస్తాయి',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Myth for Smog',
    verdictHi: 'स्मॉग के लिए भ्रम',
    verdictMr: 'प्रदूषणासाठी गैरसमज',
    verdictBn: 'ধোঁয়াশার ক্ষেত্রে ভুল ধারণা',
    verdictTa: 'காற்று மாசுபாட்டிற்கு தவறானது',
    verdictTe: 'పొగమంచు విషయంలో అపోహ',
    mythTextEn: 'Snake plants, spider plants, and money plants remove winter smoke from bedrooms.',
    mythTextHi: 'स्नेक प्लांट, मनी प्लांट और तुलसी जैसे पौधे कमरे से सर्दियों का जहरीला धुआं और स्मॉग सोख लेते हैं।',
    mythTextMr: 'स्नेक प्लांट किंवा मनी प्लांट घरात ठेवल्याने खोलीतील हिवाळ्यातील विषारी धूर आणि प्रदूषण स्वच्छ होते.',
    mythTextBn: 'স্নেক প্ল্যান্ট বা মানি প্ল্যান্ট ঘরের বাতাস থেকে শীতের ধোঁয়াশা ও বিষাক্ত ধূলিকণা দূর করে।',
    mythTextTa: 'ஸ்நேக் பிளாண்ட் மற்றும் மணி பிளாண்ட் படுக்கையறையில் உள்ள குளிர்கால நச்சுப் புகையை அகற்றிவிடும்.',
    mythTextTe: 'స్నేక్ ప్లాంట్, మనీ ప్లాంట్ వంటి మొక్కలు బెడ్‌రూమ్‌లోని శీతాకాలపు పొగను తొలగిస్తాయి.',
    explanationEn:
      'The famous NASA experiment evaluated sealed miniature chambers with massive plant-to-air ratios. In real homes with outside air leaking in, potted plants remove zero PM2.5 particles, and damp soil can breed mold and allergens.',
    explanationHi:
      'नासा (NASA) का प्रसिद्ध शोध सीलबंद छोटे चैंबर में हुआ था जहाँ हवा बहुत कम और पौधे बहुत ज्यादा थे। असली घरों में बाहर की हवा लगातार रिसती रहती है, जहाँ पौधे शून्य PM2.5 कण हटाते हैं, और गमलों की गीली मिट्टी से फंगस और एलर्जी पनप सकती है।',
    explanationMr:
      'नासाचा (NASA) प्रसिद्ध प्रयोग लहान हवाबंद प्रयोगशाळेत झाला होता. प्रत्यक्ष घरांमध्ये बाहेरची हवा सतत आत येत असते, जिथे कुंडीतील झाडे ०% PM2.5 कण गाळतात. उलट कुंडीतील ओल्या मातीमुळे बुरशी व ॲलर्जी वाढू शकते.',
    explanationBn:
      'নাসার (NASA) বিখ্যাত গবেষণাটি সম্পূর্ণ বায়ুরোধী ক্ষুদ্র ল্যাবে হয়েছিল। বাস্তব ঘরে যেখানে বাইরের বাতাস অনবরত ঢোকে, সেখানে টবের গাছ 0% PM2.5 দূষণ দূর করে। উপরন্তু ভেজা মাটি থেকে ছত্রাক ও অ্যালার্জি ছড়াতে পারে।',
    explanationTa:
      'நாசாவின் (NASA) ஆய்வு சீல் வைக்கப்பட்ட சிறிய அறைகளில் நடந்தது. ஆனால் உண்மையான வீடுகளில் காற்று உள்ளே வருவதால், இந்தத் தாவரங்கள் 0% PM2.5 துகள்களை மட்டுமே நீக்குகின்றன; மேலும் ஈரமான மண் பூஞ்சையை உருவாக்கலாம்.',
    explanationTe:
      'నాసా (NASA) ప్రసిద్ధ పరిశోధన పూర్తిగా మూసివేసిన చిన్న ల్యాబ్‌లో జరిగింది. బయటి గాలి లీక్ అయ్యే నిజమైన ఇళ్లలో, మొక్కలు 0% PM2.5 కణాలను మాత్రమే ఫిల్టర్ చేస్తాయి; పైగా తడి మట్టి అలర్జీలకు దారితీయవచ్చు.',
    whatToDoEn:
      'Run a mechanical True HEPA purifier or a DIY box-fan with MERV-13 filter in a closed bedroom.',
    whatToDoHi:
      'कमरे की खिड़कियां बंद करके ट्रू HEPA एयर प्यूरीफायर चलाएं या MERV-13 फिल्टर वाला किफायती DIY बॉक्स-फैन इस्तेमाल करें।',
    whatToDoMr:
      'खोलीच्या खिडक्या बंद ठेवून मेकॅनिकल ट्रू HEPA एअर प्युरिफायर किंवा MERV-13 फिल्टर बसवलेला DIY बॉक्स-फॅन वापरा.',
    whatToDoBn:
      'ঘরের দরজা-জানালা বন্ধ রেখে ট্রু HEPA এয়ার পিউরিফায়ার বা MERV-13 ফিল্টারযুক্ত সাশ্রয়ী DIY বক্স-ফ্যান চালান।',
    whatToDoTa:
      'அறை கதவு-ஜன்னல்களை மூடி வைத்து, மெக்கானிக்கல் True HEPA பியூரிஃபையர் அல்லது MERV-13 ஃபில்டர் கொண்ட DIY பாக்ஸ்-ஃபேன் பயன்படுத்துங்கள்.',
    whatToDoTe:
      'గది కిటికీలు మూసివేసి, ట్రూ HEPA ఎయిర్ ప్యూరిఫైయర్ లేదా MERV-13 ఫిల్టర్‌తో కూడిన DIY బాక్స్-ఫ్యాన్‌ను ఉపయోగించండి.',
    mythText: 'Snake plants and money plants remove winter smoke from bedrooms.',
    explanation:
      'The famous NASA experiment evaluated sealed lab chambers with massive plant-to-air ratios. In real homes with outside air leaking in, potted plants remove zero PM2.5 particles, and damp soil can breed mold.',
    whatToDo:
      'Run a mechanical True HEPA purifier or a DIY box-fan with MERV-13 filter in a closed bedroom.',
  },
  {
    id: 'morning_airing',
    category: 'indoor',
    titleEn: 'Airing Out Rooms During Early Morning Smog',
    titleHi: 'सुबह-सुबह खिड़कियां और दरवाजे खोलना',
    titleMr: 'पहाटे किंवा सकाळी खिडक्या उघडणे',
    titleBn: 'ভোরবেলা ঘরের জানালা খুলে বাতাস খাওয়ানো',
    titleTa: 'அதிகாலை பனிமூட்டத்தின் போது ஜன்னல்களைத் திறப்பது',
    titleTe: 'తెల్లవారుజామున గది కిటికీలు తెరవడం',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Hazardous Timing',
    verdictHi: 'खतरनाक समय',
    verdictMr: 'धोकादायक वेळ',
    verdictBn: 'বিপজ্জনক সময়',
    verdictTa: 'ஆபத்தான நேரம்',
    verdictTe: 'ప్రమాదకరమైన సమయం',
    mythTextEn: 'Opening windows at 6 AM lets in fresh morning air.',
    mythTextHi: 'सुबह 6 बजे खिड़कियां खोलने से ताजी और शुद्ध सुबह की हवा घर में आती है।',
    mythTextMr: 'सकाळी ६ वाजता खिडक्या उघडल्याने घरात ताजी, स्वच्छ सकाळची हवा येते.',
    mythTextBn: 'সকাল ৬টায় জানালা খুললে ঘরের ভেতর তাজা সকালের স্বাস্থ্যকর বাতাস আসে।',
    mythTextTa: 'காலை 6 மணிக்கு ஜன்னல்களைத் திறந்தால் புத்துணர்ச்சியூட்டும் காலைக் காற்று உள்ளே வரும்.',
    mythTextTe: 'ఉదయం 6 గంటలకు కిటికీలు తెరిస్తే స్వచ్ఛమైన గాలి ఇంట్లోకి వస్తుంది.',
    explanationEn:
      'In northern winter weather, cold ground air traps heavy vehicle smoke right at ground level between 5 AM and 10 AM. Opening windows then floods your home with toxic dust and smoke particles.',
    explanationHi:
      'सर्दियों में रात की ठंड की वजह से गाड़ियों और कचरे का जहरीला धुआं सुबह 5 से 10 बजे जमीन की सतह पर जम जाता है। इस समय खिड़कियां खोलने से घर जहरीले धुएं और धूल से भर जाता है।',
    explanationMr:
      'हिवाळ्यात जमिनीजवळ गारवा असल्यामुळे वाहनांचा व कचऱ्याचा विषारी धूर सकाळी ५ ते १० च्या दरम्यान जमिनीवरच साचून राहतो. अशा वेळी खिडक्या उघडल्यास विषारी वायू थेट घरात शिरतो.',
    explanationBn:
      'শীতকালে ঠান্ডার কারণে ভোর ৫টা থেকে সকাল ১০টা পর্যন্ত গাড়ির ধোঁয়া ও ধূলিকণা মাটির কাছে আটকে থাকে। এই সময় জানালা খুললে বিষাক্ত ধোঁয়াশা পুরো ঘরে ছড়িয়ে পড়ে।',
    explanationTa:
      'குளிர்காலத்தில் காலை 5 மணி முதல் 10 மணி வரை வாகனப் புகை தரை மட்டத்திலேயே தேங்கி நிற்கும். அப்போது ஜன்னல்களைத் திறந்தால் படுக்கையறைக்குள் நச்சுக்காற்று அதிகம் நிறையும்.',
    explanationTe:
      'శీతాకాలంలో ఉదయం 5 నుండి 10 గంటల మధ్య వాహనాల పొగ, దుమ్ము నేల మట్టంలోనే చిక్కుకుపోతాయి. ఆ సమయంలో కిటికీలు తెరిస్తే గది విషపూరిత పొగమంచుతో నిండిపోతుంది.',
    whatToDoEn:
      'Keep exterior windows shut during the morning. Air out briefly for 10–15 minutes only in the afternoon when the sun warms the air and the smoke spreads out.',
    whatToDoHi:
      'सुबह के समय बाहरी खिड़कियां कसकर बंद रखें। दोपहर में जब धूप निकलती है और धुआं ऊपर उठता है, केवल तभी 10-15 मिनट के लिए खिड़कियां खोलें।',
    whatToDoMr:
      'सकाळच्या वेळी बाहेरील खिडक्या बंद ठेवा. दुपारी ऊन पडल्यानंतर हवा वर सरकते, तेव्हाच फक्त १०-१५ मिनिटे घर हवेशीर करा.',
    whatToDoBn:
      'সকালের সময় বাইরের সব জানালা বন্ধ রাখুন। কেবল দুপুরে যখন রোদ ওঠে ও ধোঁয়াশা হালকা হয়, তখন ১০-১৫ মিনিটের জন্য জানালা খুলুন।',
    whatToDoTa:
      'காலை வேளையில் வெளிப்புற ஜன்னல்களை மூடி வைக்கவும். மதிய வேளையில் சூரிய வெப்பத்தால் காற்று லேசாகும்போது 10-15 நிமிடங்கள் மட்டும் திறந்து வையுங்கள்.',
    whatToDoTe:
      'ఉదయం వేళల్లో కిటికీలను మూసి ఉంచండి. మధ్యాహ్నం ఎండ వచ్చినప్పుడు మాత్రమే 10-15 నిమిషాలు కిటికీలు తెరవండి.',
    mythText: 'Opening windows at 6 AM lets in fresh morning air.',
    explanation:
      'In northern Indian winters, cold air traps heavy vehicle smoke right at ground level between 5 AM and 10 AM. Opening windows then floods your home with toxic dust and smoke particles.',
    whatToDo:
      'Keep exterior windows shut during the morning. Air out briefly for 10–15 minutes only in the afternoon when the sun warms the air and the smoke spreads out.',
  },
  {
    id: 'sealing_airtight',
    category: 'indoor',
    titleEn: 'Sealing Every Gap Without Airing Out',
    titleHi: 'सारे छेद पूरी तरह टेप से सील करना',
    titleMr: 'घरातील सर्व फटी कायमस्वरूपी बंद करणे',
    titleBn: 'ঘরের প্রতিটি ছিদ্র পুরোপুরি বায়ুরোধী করা',
    titleTa: 'காற்றோட்டமே இல்லாமல் அனைத்து இடைவெளிகளையும் அடைப்பது',
    titleTe: 'గాలి ఆడకుండా అన్ని సందులను పూర్తిగా మూసివేయడం',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Carbon Monoxide Risk',
    verdictHi: 'कार्बन मोनोऑक्साइड का खतरा',
    verdictMr: 'कार्बन मोनॉक्साइडचा धोका',
    verdictBn: 'কার্বন মনোক্সাইড বিষক্রিয়ার ঝুঁকি',
    verdictTa: 'கார்பன் மோனாக்சைடு ஆபத்து',
    verdictTe: 'కార్బన్ మోనాక్సైడ్ ప్రమాదం',
    mythTextEn: 'Taping every crack and door completely airtight keeps you safest.',
    mythTextHi: 'दरवाजों और खिड़कियों के हर छेद को प्लास्टिक या टेप से पूरी तरह सील कर देना सबसे सुरक्षित है।',
    mythTextMr: 'खिडक्या-दारांच्या सर्व फटी टेपने पूर्णपणे हवाबंद केल्यास आपण सर्वाधिक सुरक्षित राहतो.',
    mythTextBn: 'দরজা-জানালার সব ফাঁকফোকর টেপ দিয়ে পুরোপুরি আটকে দিলে সবচেয়ে নিরাপদে থাকা যায়।',
    mythTextTa: 'அனைத்து கதவு மற்றும் ஜன்னல் இடுக்குகளை டேப் போட்டு முழுமையாக அடைப்பது மிகவும் பாதுகாப்பானது.',
    mythTextTe: 'కిటికీలు మరియు తలుపుల సందులను టేప్‌తో పూర్తిగా మూసివేయడం అత్యంత సురక్షితం.',
    explanationEn:
      'Completely airtight rooms trap exhaled CO2, indoor humidity, and lethal carbon monoxide if gas heaters, stoves, or coal angithi are used inside.',
    explanationHi:
      'कमरे को पूरी तरह सीलबंद करने से छोड़ी गई कार्बन डाइऑक्साइड (CO2) और नमी जमा हो जाती है। अगर कमरे में हीटर, गीजर, गैस चूल्हा या अंगीठी जलाई जाए तो जानलेवा कार्बन मोनोऑक्साइड गैस भर सकती है जिससे दम घुट सकता है।',
    explanationMr:
      'खोली पूर्णपणे हवाबंद केल्यास श्वासातून सोडलेला CO2 आणि आर्द्रता साचून राहते. खोलीत गॅस शेगडी, हिटर किंवा कोळशाची शेकोटी पेटवल्यास प्राणघातक कार्बन मोनॉक्साइड तयार होऊन गुदमरण्याचा धोका असतो.',
    explanationBn:
      'ঘর সম্পূর্ণ বায়ুরোধী করলে শ্বাস-প্রশ্বাসের CO2 জমে যায়। ঘরে গ্যাস হিটার, চুলা বা কয়লার আগুন জ্বালালে মারাত্মক বিষাক্ত কার্বন মনোক্সাইড জমে দমবন্ধ হয়ে মৃত্যুর ঝুঁকি তৈরি হয়।',
    explanationTa:
      'முழுமையாக சீல் செய்யப்பட்ட அறைகளில் வெளிவிடப்படும் CO2 மற்றும் ஈரப்பதம் தேங்கும். கேஸ் ஹீட்டர்கள் அல்லது நிலக்கரி பயன்படுத்தினால் உயிருக்கு ஆபத்தான கார்பன் மோனாக்சைடு உருவாகி மூச்சுத்திணறல் ஏற்படும்.',
    explanationTe:
      'గదిని పూర్తిగా మూసివేయడం వల్ల మనం వదిలే CO2 నిండిపోతుంది. గదిలో గ్యాస్ హీటర్లు లేదా బొగ్గులు వాడితే ప్రాణాంతక కార్బన్ మోనాక్సైడ్ చేరి ఊపిరాడక ప్రమాదం జరుగుతుంది.',
    whatToDoEn:
      'Keep doors and windows closed to cut outdoor smog, but pair with active mechanical HEPA filtration. Never use open-flame heaters or burning coal indoors.',
    whatToDoHi:
      'खिड़कियां बंद रखें ताकि बाहर का स्मॉग न आए, लेकिन अंदर HEPA एयर प्यूरीफायर चलाएं। बंद कमरे में कभी भी अंगीठी, कोयला या खुली आग वाला हीटर न जलाएं।',
    whatToDoMr:
      'बाहेरील धुरके रोखण्यासाठी खिडक्या-दारे बंद ठेवा, पण आत HEPA एअर प्युरिफायर चालू ठेवा. बंद खोलीत कधीही कोळसा किंवा शेकोटी पेटवू नका.',
    whatToDoBn:
      'বাইরের ধোঁয়াশা আটকাতে দরজা-জানালা বন্ধ রাখুন, তবে ঘরে HEPA ফিল্টার ব্যবহার করুন। বন্ধ ঘরে কখনোই কয়লার আগুন বা খোলা শিখার হিটার জ্বালাবেন না।',
    whatToDoTa:
      'வெளிப்புற புகையைத் தடுக்க ஜன்னல்களை மூடுங்கள், ஆனால் உட்புற HEPA பியூரிஃபையரைப் பயன்படுத்துங்கள். மூடிய அறைக்குள் நிலக்கரி அல்லது திறந்த நெருப்பை ஒருபோதும் எரிக்காதீர்கள்.',
    whatToDoTe:
      'బయటి పొగ రాకుండా కిటికీలు మూసివేయండి, కానీ లోపల HEPA ప్యూరిఫైయర్ వాడండి. మూసిన గదిలో ఎప్పుడూ బొగ్గులు లేదా మంటలను మండించవద్దు.',
    mythText: 'Taping every crack and door completely airtight keeps you safest.',
    explanation:
      'Completely airtight rooms trap exhaled carbon dioxide (CO2), indoor humidity, and lethal carbon monoxide if gas heaters, stoves, or angithi are used inside.',
    whatToDo:
      'Keep doors and windows closed to cut outdoor smog, but pair with active mechanical HEPA filtration. Never use open-flame heaters or burning coal indoors.',
  },
  {
    id: 'outdoor_breathing',
    category: 'indoor',
    titleEn: 'Deep Breathing Exercises Outdoors',
    titleHi: 'स्मॉग में बाहर गहरी सांस व दौड़ना',
    titleMr: 'बाहेर धुरक्यात दीर्घ श्वास व धावणे',
    titleBn: 'ধোঁয়াশার মধ্যে বাইরে প্রাণায়াম ও জগিং',
    titleTa: 'வெளியே ஆழ்ந்த சுவாசப் பயிற்சிகள் செய்தல்',
    titleTe: 'బయట పొగమంచులో ప్రాణాయామం మరియు రన్నింగ్',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Lung Hazard',
    verdictHi: 'फेफड़ों के लिए जोखिम',
    verdictMr: 'फुप्फुसांसाठी धोकादायक',
    verdictBn: 'ফুসফুসের জন্য ক্ষতিকর',
    verdictTa: 'நுரையீரலுக்கு ஆபத்தானது',
    verdictTe: 'ఊపిరితిత్తులకు హానికరం',
    mythTextEn: 'Deep morning pranayama or jogging outside strengthens lungs against smog.',
    mythTextHi: 'सुबह स्मॉग में बाहर प्राणायाम (गहरी सांस) या तेज दौड़ने से फेफड़े मजबूत होते हैं और प्रदूषण सहने की ताकत आती है।',
    mythTextMr: 'सकाळी धुरक्यात बाहेर जाऊन दीर्घ प्राणायाम किंवा धावल्याने फुप्फुसे बळकट होतात आणि प्रदूषणाचा त्रास होत नाही.',
    mythTextBn: 'সকালে ধোঁয়াশার মধ্যে বাইরে প্রাণায়াম বা দৌড়ালে ফুসফুস শক্তিশালী হয় এবং দূষণ প্রতিরোধ ক্ষমতা বাড়ে।',
    mythTextTa: 'காலை பனிமூட்டத்தில் வெளியே பிராணாயாமம் அல்லது ஓட்டப்பயிற்சி செய்வது நுரையீரலை வலுப்படுத்தும்.',
    mythTextTe: 'పొగమంచులో బయట ప్రాణాయామం లేదా రన్నింగ్ చేస్తే ఊపిరితిత్తులు బలపడతాయి.',
    explanationEn:
      'Heavy or deep respiration during high smog bypasses your nasal passages and drives toxic fine particles directly into deep alveolar lung tissue and the bloodstream.',
    explanationHi:
      'तेज दौड़ते या गहरी सांस लेते समय नाक के बाल धूल नहीं रोक पाते। मुंह से ली गई गहरी सांस PM2.5 और जहरीले रसायनों को सीधे फेफड़ों की सबसे गहराई (एल्वियोली) और खून में उतार देती है, जिससे दिल का दौरा और अस्थमा अटैक बढ़ जाता है।',
    explanationMr:
      'वेगाने धावताना किंवा दीर्घ श्वास घेताना नाकाची नैसर्गिक गाळणी निष्प्रभ ठरते. विषारी PM2.5 कण थेट फुप्फुसांच्या खोल भागात व रक्तप्रवाहात मिसळतात, ज्यामुळे हृदयविकार व दम्याचा झटका येऊ शकतो.',
    explanationBn:
      'দৌড়ানোর সময় বা গভীর শ্বাসের সময় নাকের ফিল্টার কাজ করতে পারে না। ফলে বিষাক্ত PM2.5 কণা সরাসরি ফুসফুসের গভীরে এবং রক্তে মিশে গিয়ে হার্ট অ্যাটাক ও হাঁপানির ঝুঁকি বাড়ায়।',
    explanationTa:
      'கடுமையான மாசுபாட்டின் போது ஆழ்ந்து சுவாசிக்கும்போது, நச்சு நுண்துகள்கள் நேரடியாக நுரையீரலின் ஆழமான பகுதிக்கும் இரத்த ஓட்டத்திற்கும் சென்று இதய நோய் மற்றும் ஆஸ்துமாவைத் தூண்டும்.',
    explanationTe:
      'ఎక్కువ పొగమంచు ఉన్నప్పుడు వేగంగా లేదా లోతుగా శ్వాస తీసుకుంటే, విషపూరిత PM2.5 కణాలు నేరుగా ఊపిరితిత్తుల లోపలికి మరియు రక్తంలోకి చేరి గుండెపోటు, ఆస్తమాను పెంచుతాయి.',
    whatToDoEn:
      'Practice calm breathing exercises strictly indoors in a room with filtered air. Keep outdoor morning trips brief and low-effort.',
    whatToDoHi:
      'योगासन और प्राणायाम केवल बंद कमरे में फिल्टर वाली साफ हवा में ही करें। अत्यधिक प्रदूषण वाले दिनों में सुबह बाहर टहलने या कसरत करने से बचें।',
    whatToDoMr:
      'योगासने आणि प्राणायाम केवळ बंद खोलीत आणि एअर फिल्टरच्या स्वच्छ हवेतच करा. जास्त धुरके असताना सकाळी बाहेर धावणे किंवा व्यायाम करणे टाळा.',
    whatToDoBn:
      'প্রাণায়াম বা ব্যায়াম কেবল বন্ধ ঘরে পিউরিফায়ারের পরিষ্কার বাতাসে করুন। সকালের বাইরের হাঁটাচলা যথাসম্ভব কম রাখুন।',
    whatToDoTa:
      'சுத்திகரிக்கப்பட்ட காற்றுள்ள அறைக்குள் மட்டுமே சுவாசப் பயிற்சிகளைச் செய்யுங்கள். அதிகாலை வெளிப்புற உடற்பயிற்சிகளைத் தவிருங்கள்.',
    whatToDoTe:
      'ప్రాణాయామం లేదా వ్యాయామం కేవలం ఫిల్టర్ ఉన్న గది లోపలే చేయండి. ఉదయం వేళల్లో బయట తిరగడం లేదా వ్యాయామం చేయడం మానుకోండి.',
    mythText: 'Deep morning pranayama or jogging outside strengthens lungs against smog.',
    explanation:
      'Heavy or deep respiration during high smog bypasses your nasal passages and drives toxic fine particles directly into deep alveolar lung tissue and the bloodstream.',
    whatToDo:
      'Practice calm breathing exercises strictly indoors in a room with filtered air. Keep outdoor morning trips brief and low-effort.',
  },
  {
    id: 'incense_agarbatti',
    category: 'cooking',
    titleEn: 'Incense & Camphor Purify the Air',
    titleHi: 'अगरबत्ती, धूप व कपूर जलाना',
    titleMr: 'अगरबत्ती, धूप व कापूर जाळणे',
    titleBn: 'ধূপ, আগরবাতি ও কর্পূর জ্বালানো',
    titleTa: 'ஊதுபத்தி மற்றும் கற்பூரம் காற்றைச் சுத்தப்படுத்தும்',
    titleTe: 'అగరబత్తీలు మరియు కర్పూరం గాలిని శుద్ధి చేస్తాయి',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Indoor Smoke Spike',
    verdictHi: 'घर के अंदर धुएं का विस्फोट',
    verdictMr: 'घरातील धुरात प्रचंड वाढ',
    verdictBn: 'ঘরের ভেতর ধোঁয়ার বৃদ্ধি',
    verdictTa: 'உட்புறப் புகை அதிகரிப்பு',
    verdictTe: 'ఇంట్లో పొగ తీవ్రత పెరుగుతుంది',
    mythTextEn: 'Burning dhoop, agarbatti, or camphor cleanses indoor smog pollution.',
    mythTextHi: 'कमरे में अगरबत्ती, धूपबत्ती, हवन या कपूर जलाने से हवा शुद्ध होती है और स्मॉग का जहर खत्म हो जाता है।',
    mythTextMr: 'घरात धूप, अगरबत्ती किंवा कापूर जाळल्याने हवा शुद्ध होते आणि बाहेरील धुरक्याचे प्रदूषण नाहीसे होते.',
    mythTextBn: 'ঘরে ধূপ, আগরবাতি বা কর্পূর জ্বালালে বাতাস শুদ্ধ হয় এবং শীতের বিষাক্ত ধোঁয়াশা কেটে যায়।',
    mythTextTa: 'தூபம், ஊதுபத்தி அல்லது கற்பூரம் ஏற்றுவது உட்புற மாசுபாட்டை அகற்றி காற்றைச் சுத்தப்படுத்தும்.',
    mythTextTe: 'ఇంట్లో ధూపం, అగరబత్తీలు లేదా కర్పూరం వెలిగిస్తే గాలి శుద్ధి అవుతుంది మరియు పొగమంచు పోతుంది.',
    explanationEn:
      'Burning incense, dhoop, and camphor produces dense indoor PM2.5, carbon monoxide, benzene, and formaldehyde spikes that often exceed the pollution levels of heavy outdoor highway traffic.',
    explanationHi:
      'अगरबत्ती और धूप जलने से घर के अंदर भारी मात्रा में PM2.5, बेंजीन, फॉर्मलाडिहाइड और कार्बन मोनोऑक्साइड पैदा होती है। यह धुआं अक्सर व्यस्त हाईवे के ट्रैफिक से भी ज्यादा जहरीला स्तर छू लेता है।',
    explanationMr:
      'धूप व अगरबत्ती जळताना घरात प्रचंड प्रमाणात PM2.5, कार्बन मोनॉक्साइड आणि विषारी रसायने उत्सर्जित होतात. बंद खोलीत हा धूर महामार्गावरील ट्रॅफिकपेक्षाही अधिक विषारी बनतो.',
    explanationBn:
      'আগরবাতি ও ধূপ জ্বললে ঘরের ভেতরে প্রচুর পরিমাণে PM2.5, কার্বন মনোক্সাইড ও বিষাক্ত বেনজিন নির্গত হয়। বদ্ধ ঘরে এর দূষণের মাত্রা ব্যস্ত সড়কের ট্রাফিকের চেয়েও ক্ষতিকর হয়ে ওঠে।',
    explanationTa:
      'ஊதுபத்தி மற்றும் கற்பூரம் எரிக்கும்போது அதிக அளவு PM2.5, கார்பன் மோனாக்சைடு மற்றும் பென்சீன் உருவாகிறது. இது நெரிசலான நெடுஞ்சாலைப் புகையை விட அதிக நச்சுத்தன்மை வாய்ந்தது.',
    explanationTe:
      'అగరబత్తీలు మరియు ధూపం వెలిగించినప్పుడు ఇంట్లో అధిక స్థాయిలో PM2.5, కార్బన్ మోనాక్సైడ్ మరియు బెంజీన్ విడుదలవుతాయి. ఇది హైవే ట్రాఫిక్ పొగ కంటే ఎక్కువ ప్రమాదకరం.',
    whatToDoEn:
      'Avoid burning incense, mosquito coils, or candles in closed rooms during winter. Switch to electric lamps or flameless diffusers.',
    whatToDoHi:
      'सर्दियों में बंद कमरों में अगरबत्ती, धूप, अगरबत्ती वाले मच्छर कॉइल या मोमबत्ती न जलाएं। रोशनी के लिए बिजली के दीये या एलईडी लैंप का इस्तेमाल करें।',
    whatToDoMr:
      'हिवाळ्यात बंद खोलीत अगरबत्ती, डास अगरबत्ती किंवा मेणबत्त्या जाळणे टाळा. सुवासासाठी किंवा पूजेसाठी सुरक्षित विजेचे दिवे किंवा डिफ्यूझर वापरा.',
    whatToDoBn:
      'শীতের দিনে বন্ধ ঘরে ধূপ, মশার কয়েল বা মোমবাতি জ্বালানো এড়িয়ে চলুন। বৈদ্যুতিক বাতি বা ধোঁয়াহীন বিকল্প ব্যবহার করুন।',
    whatToDoTa:
      'குளிர்காலத்தில் மூடிய அறைகளில் ஊதுபத்தி, கொசு சுருள்கள் அல்லது மெழுகுவர்த்திகளை எரிப்பதைத் தவிர்க்கவும். எலக்ட்ரிக் விளக்குகளைப் பயன்படுத்துங்கள்.',
    whatToDoTe:
      'శీతాకాలంలో మూసివున్న గదుల్లో అగరబత్తీలు, దోమల కాయిల్స్ లేదా కొవ్వొత్తులను వెలిగించవద్దు. ఎలక్ట్రిక్ దీపాలను వాడండి.',
    mythText: 'Burning dhoop, agarbatti, or camphor cleanses indoor smog pollution.',
    explanation:
      'Burning incense and dhoop produces dense indoor PM2.5, benzene, and formaldehyde spikes that often exceed the pollution levels of heavy outdoor traffic.',
    whatToDo:
      'Avoid burning incense, mosquito coils, or candles in closed rooms during winter. Switch to electric lamps or flameless diffusers.',
  },
  {
    id: 'cooking_smoke',
    category: 'cooking',
    titleEn: 'Kitchen Smoke Clears On Its Own',
    titleHi: 'रसोई का धुआं अपने आप निकलना',
    titleMr: 'स्वयंपाकघरातील धूर आपोआप निघून जाणे',
    titleBn: 'রান্নাঘরের ধোঁয়া নিজে থেকেই সরে যাওয়া',
    titleTa: 'சமையலறைப் புகை தானாகவே வெளியேறிவிடும்',
    titleTe: 'వంటగది పొగ దానంతట అదే పోతుంది',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Indoor Particle Burst',
    verdictHi: 'घर के अंदर जहरीला फैलाव',
    verdictMr: 'घरात धुराचा वेगाने प्रसार',
    verdictBn: 'ঘরের মধ্যে ধোঁয়ার দ্রুত বিস্তার',
    verdictTa: 'உட்புறத் துகள் வெடிப்பு',
    verdictTe: 'ఇంట్లో విషపూరిత పొగ వ్యాప్తి',
    mythTextEn: 'Cooking smoke stays in the kitchen and does not hurt family members.',
    mythTextHi: 'तड़के और छौंक का धुआं सिर्फ रसोई तक रहता है और बाकी घर वालों या बच्चों को नुकसान नहीं पहुंचाता।',
    mythTextMr: 'फोडणी आणि स्वयंपाकाचा धूर फक्त स्वयंपाकघरातच राहतो, त्याचा घरातील इतर सदस्यांना किंवा मुलांच्या खोलीत त्रास होत नाही.',
    mythTextBn: 'রান্নার তেলের ফোড়ন বা ধোঁয়া শুধু রান্নাঘরেই থাকে, ঘরের বাকি সদস্যদের কোনো ক্ষতি করে না।',
    mythTextTa: 'சமையல் புகை சமையலறையிலேயே தங்கிவிடும், மற்ற குடும்ப உறுப்பினர்களுக்கு எந்தப் பாதிப்பையும் ஏற்படுத்தாது.',
    mythTextTe: 'పోపు లేదా వంట పొగ కేవలం వంటగదిలోనే ఉంటుంది, ఇతర కుటుంబ సభ్యులకు లేదా పిల్లలకు హాని కలిగించదు.',
    explanationEn:
      'High-heat oil frying, tadka, and open gas flames generate massive bursts of fine combustion particles that rapidly circulate into children\'s and elderly bedrooms without exhaust.',
    explanationHi:
      'तेज आंच पर तेल का तड़का और खुली गैस की लौ भारी मात्रा में अतिसूक्ष्म PM2.5 कण छोड़ती है। एग्जॉस्ट फैन न होने पर यह जहरीला धुआं मिनटों में बच्चों और बुजुर्गों के सोने के कमरों में फैल जाता है।',
    explanationMr:
      'तेलाची फोडणी आणि गॅसच्या आगीमुळे हवेत प्रचंड सूक्ष्म PM2.5 कण पसरतात. एक्झॉस्ट फॅन नसेल तर हा धूर काही मिनिटांतच मुलांच्या आणि वृद्धांच्या बेडरूममध्ये पसरून खोकला व श्वास घेण्यास त्रास निर्माण करतो.',
    explanationBn:
      'গরম তেলে ভাজা বা ফোড়ন দিলে প্রচুর পরিমাণে অতিসূক্ষ্ম দূষিত কণা তৈরি হয়। এক্সস্ট ফ্যান না চালালে এই বিষাক্ত ধোঁয়া দ্রুত বাচ্চাদের ও বয়স্কদের শোবার ঘরে ছড়িয়ে পড়ে।',
    explanationTa:
      'அதிக வெப்பத்தில் வறுப்பது, தாளிப்பது போன்றவை அதிக அளவு நச்சு நுண்துகள்களை உருவாக்குகின்றன. எக்ஸாஸ்ட் ஃபேன் இல்லாவிட்டால், இது விரைவாக குழந்தைகள் மற்றும் முதியோர்களின் படுக்கையறைக்குள் பரவுகிறது.',
    explanationTe:
      'నూనెతో పోపు పెట్టడం మరియు గ్యాస్ మంటలు భారీగా PM2.5 కణాలను ఉత్పత్తి చేస్తాయి. ఎగ్జాస్ట్ ఫ్యాన్ లేకపోతే, ఈ పొగ త్వరగా పిల్లలు మరియు వృద్ధుల పడకగదులకు వ్యాపిస్తుంది.',
    whatToDoEn:
      'Cook with lids on pots, keep the kitchen door closed to living areas, and always run a mechanical exhaust fan or chimney that vents outdoors.',
    whatToDoHi:
      'खाना बनाते समय बर्तनों पर ढक्कन रखें, रसोई का दरवाजा बंद रखें ताकि धुआं घर में न फैले, और खाना बनाते समय हमेशा एग्जॉस्ट फैन या चिमनी चालू रखें।',
    whatToDoMr:
      'स्वयंपाक करताना भांड्यांवर झाकण ठेवा, धूर घरामध्ये पसरू नये म्हणून स्वयंपाकघराचे दार बंद ठेवा आणि बाहेर धूर फेकणारा एक्झॉस्ट फॅन किंवा चिमणी नेहमी चालू ठेवा.',
    whatToDoBn:
      'রান্না করার সময় পাত্রের ঢাকনা ব্যবহার করুন, বসার ঘরের দিকের দরজা বন্ধ রাখুন এবং রান্নার সময় সর্বদা এক্সস্ট ফ্যান বা চিমনি চালিয়ে রাখুন।',
    whatToDoTa:
      'பாத்திரங்களை மூடி வைத்து சமையுங்கள், சமையலறை கதவை மூடி வையுங்கள், மேலும் புகையை வெளியேற்றும் எக்ஸாஸ்ட் ஃபேன் அல்லது சிம்னியை எப்போதும் பயன்படுத்துங்கள்.',
    whatToDoTe:
      'వంట చేసేటప్పుడు మూతలు పెట్టండి, వంటగది తలుపు మూసి ఉంచండి మరియు ఎల్లప్పుడూ ఎగ్జాస్ట్ ఫ్యాన్ లేదా చిమ్నీని ఆన్ చేయండి.',
    mythText: 'Cooking smoke stays in the kitchen and does not hurt family members.',
    explanation:
      'High-heat oil frying, tadka, and open gas flames generate massive bursts of fine combustion particles that quickly circulate into children’s and elderly bedrooms.',
    whatToDo:
      'Cook with lids on pots, keep the kitchen door closed to living areas, and always run a mechanical exhaust fan or chimney that vents outdoors.',
  },
];

export function getMythField(
  myth: MythItem,
  field: 'title' | 'verdict' | 'mythText' | 'explanation' | 'whatToDo',
  lang: string
): string {
  if (!myth) return '';

  if (lang === 'en') {
    const enVal = myth[`${field}En` as keyof MythItem];
    return typeof enVal === 'string' ? enVal : '';
  }

  // Language mapping with prioritized fallback
  const directKey = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof MythItem;
  const directVal = myth[directKey];
  if (typeof directVal === 'string' && directVal.trim().length > 0) {
    return directVal;
  }

  // Fallbacks: Marathi -> Hindi -> English
  if (lang === 'mr') {
    return myth[`${field}Mr` as keyof MythItem] as string || myth[`${field}Hi` as keyof MythItem] as string || myth[`${field}En` as keyof MythItem] as string || '';
  }
  // Bengali -> Hindi -> English
  if (lang === 'bn') {
    return myth[`${field}Bn` as keyof MythItem] as string || myth[`${field}Hi` as keyof MythItem] as string || myth[`${field}En` as keyof MythItem] as string || '';
  }
  // Tamil -> Hindi -> English
  if (lang === 'ta') {
    return myth[`${field}Ta` as keyof MythItem] as string || myth[`${field}Hi` as keyof MythItem] as string || myth[`${field}En` as keyof MythItem] as string || '';
  }
  // Telugu -> Hindi -> English
  if (lang === 'te') {
    return myth[`${field}Te` as keyof MythItem] as string || myth[`${field}Hi` as keyof MythItem] as string || myth[`${field}En` as keyof MythItem] as string || '';
  }

  // General fallback to Hindi if available, else English
  const hiVal = myth[`${field}Hi` as keyof MythItem];
  if (typeof hiVal === 'string' && hiVal.trim().length > 0) {
    return hiVal;
  }

  const enVal = myth[`${field}En` as keyof MythItem];
  return typeof enVal === 'string' ? enVal : '';
}
