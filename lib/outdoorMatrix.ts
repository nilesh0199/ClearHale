import type { AQIBandKey } from '../types';
import type { FamilyView } from '../types';

export interface CopySet {
  en: string;
  hi: string;
  mr: string;
}

export const STATUS_LINES: Record<AQIBandKey, CopySet> = {
  good: {
    en: 'Air quality is clean and safe. Normal outdoor activities welcome.',
    hi: 'हवा पूरी तरह साफ और सुरक्षित है। बाहर की गतिविधियां आराम से करें।',
    mr: 'हवा पूर्णपणे स्वच्छ आणि सुरक्षित आहे. मैदानी कामांचा मनसोक्त आनंद घ्या.',
  },
  satisfactory: {
    en: 'Air quality is acceptable. Normal outdoor activities are safe.',
    hi: 'हवा का स्तर ठीक है। बाहर की सामान्य गतिविधियां सुरक्षित हैं।',
    mr: 'हवेचा दर्जा समाधानकारक आहे. बाहेरील नेहमीची कामे सुरक्षित आहेत.',
  },
  moderate: {
    en: 'Air has noticeable dust and smoke. Sensitive groups should keep outdoor time light.',
    hi: 'हवा में धूल और धुआं है। संवेदनशील लोग बाहर का समय हल्का रखें।',
    mr: 'हवेत धूर आणि धूळ जाणवत आहे. संवेदनशील व्यक्तींनी बाहेरील कामे हलकी ठेवावीत.',
  },
  poor: {
    en: 'Smog is unhealthy today. Avoid outdoor exercise and move workouts indoors.',
    hi: 'आज हवा खराब है। बाहर कसरत करने से बचें और व्यायाम घर के अंदर करें।',
    mr: 'आज हवेत प्रदूषण जास्त आहे. बाहेर व्यायाम करणे टाळा आणि घरातच हालचाली करा.',
  },
  very_poor: {
    en: 'Heavy smog outside. Stay indoors and use a fitted N95 mask for essential trips.',
    hi: 'बाहर भारी स्मॉग है। घर पर रहें और जरूरी काम के लिए फिट N95 मास्क पहनें।',
    mr: 'बाहेर दाट धुरके आहे. घरातच राहा आणि महत्त्वाच्या कामासाठी N95 मास्क वापरा.',
  },
  severe: {
    en: 'Severe toxic smog. Stay strictly indoors and use a fitted N95 for essential trips.',
    hi: 'गंभीर जहरीला स्मॉग। बिल्कुल घर के अंदर रहें और जरूरी काम पर N95 पहनें।',
    mr: 'अतिधोकादायक विषारी हवा. घरातच राहा आणि अत्यंत महत्त्वाच्या कामासाठी N95 वापरा.',
  },
};

export const FAMILY_GUIDANCE: Record<AQIBandKey, Record<FamilyView, CopySet>> = {
  good: {
    whole_family: {
      en: 'Air is clean and fresh. Open windows to refresh your home.',
      hi: 'हवा साफ और ताजा है। घर की हवा बदलने के लिए खिड़कियां खोलें।',
      mr: 'हवा स्वच्छ आणि ताजी आहे. घरातील हवा ताजी करण्यासाठी खिडक्या उघडा.',
    },
    child: {
      en: 'Air is clean and safe. Babies and children can play outside freely.',
      hi: 'हवा साफ और सुरक्षित है। बच्चे और नन्हे बच्चे बाहर आराम से खेल सकते हैं।',
      mr: 'हवा स्वच्छ आणि सुरक्षित आहे. मुले आणि लहान बाळे मोकळेपणाने खेळू शकतात.',
    },
    elderly: {
      en: 'Air is clean and safe. Great day for outdoor walks and fresh air.',
      hi: 'हवा साफ और सुरक्षित है। बाहर टहलने और ताजी हवा लेने का बढ़िया दिन है।',
      mr: 'हवा स्वच्छ आणि सुरक्षित आहे. मोकळ्या हवेत फिरण्यासाठी आजचा दिवस उत्तम आहे.',
    },
    pregnant: {
      en: 'Air is pure and healthy. Safe for outdoor walks and open windows.',
      hi: 'हवा शुद्ध और सेहतमंद है। बाहर टहलना और खिड़कियां खोलना सुरक्षित है।',
      mr: 'हवा शुद्ध आणि निरोगी आहे. बाहेर हलके फिरणे आणि खिडक्या उघडणे सुरक्षित आहे.',
    },
    asthma: {
      en: 'Clean air today. Safe for outdoor walks; carry your prescribed rescue inhaler when heading out.',
      hi: 'आज हवा साफ है। बाहर टहलना सुरक्षित है; बाहर जाते समय अपना इनहेलर साथ रखें।',
      mr: 'आज हवा स्वच्छ आहे. बाहेर फिरणे सुरक्षित आहे; बाहेर पडताना इनहेलर सोबत ठेवा.',
    },
    outdoor_worker: {
      en: 'Air is clean across work sites. Outdoor work is comfortable today.',
      hi: 'कामकाज की जगहों पर हवा साफ है। बाहर काम करना आज सहज है।',
      mr: 'कामाच्या ठिकाणी हवा स्वच्छ आहे. उघड्यावर काम करणे आज सोपे आणि सुरक्षित आहे.',
    },
  },
  satisfactory: {
    whole_family: {
      en: 'Air is acceptable. You can open windows for fresh air.',
      hi: 'हवा ठीक है। ताजी हवा के लिए खिड़कियां खोली जा सकती हैं।',
      mr: 'हवा समाधानकारक आहे. ताजी हवा येण्यासाठी खिडक्या उघडू शकता.',
    },
    child: {
      en: 'Safe for kids to play in parks. Normal school sports can proceed.',
      hi: 'बच्चों के पार्क में खेलने के लिए सुरक्षित है। खेलकूद जारी रख सकते हैं।',
      mr: 'मुलांना बागेत खेळण्यासाठी सुरक्षित आहे. नेहमीचे मैदानी खेळ खेळता येतील.',
    },
    elderly: {
      en: 'Comfortable for daily walks. Take a rest if you feel tired.',
      hi: 'रोज की सैर के लिए हवा ठीक है। थकान महसूस हो तो आराम करें।',
      mr: 'नेहमीच्या चालीसाठी हवा ठीक आहे. थकवा जाणवल्यास विश्रांती घ्या.',
    },
    pregnant: {
      en: 'Air is safe for daily routines. Drink water and avoid heavy traffic.',
      hi: 'दैनिक दिनचर्या के लिए हवा सुरक्षित है। पानी पिएं और भारी ट्रैफिक से बचें।',
      mr: 'दैनंदिन कामांसाठी हवा सुरक्षित आहे. भरपूर पाणी प्या आणि रहदारीचे रस्ते टाळा.',
    },
    asthma: {
      en: 'Air quality is acceptable. Safe for daily walks; keep your rescue inhaler handy.',
      hi: 'हवा का स्तर ठीक है। रोज की सैर सुरक्षित है; अपना इनहेलर साथ रखें।',
      mr: 'हवेचा दर्जा समाधानकारक आहे. नियमित चालणे सुरक्षित आहे; आवश्यक इनहेलर सोबत ठेवा.',
    },
    outdoor_worker: {
      en: 'Work conditions are normal. Drink plenty of water during your shift.',
      hi: 'काम के हालात सामान्य हैं। काम के दौरान भरपूर पानी पीते रहें।',
      mr: 'कामासाठी परिस्थिती सामान्य आहे. कामाच्या वेळी पुरेसे पाणी पीत राहा.',
    },
  },
  moderate: {
    whole_family: {
      en: 'Dust is noticeable outside. Keep outdoor time light and air out home during clean midday.',
      hi: 'बाहर धूल-धुआं है। बाहर का समय हल्का रखें और दोपहर में ही खिड़कियां खोलें।',
      mr: 'बाहेर धूर जाणवत आहे. बाहेरील कामे हलकी ठेवा आणि दुपारच्या वेळेतच खिडक्या उघडा.',
    },
    child: {
      en: 'Smog can cause coughing in children. Move hard sports indoors.',
      hi: 'धुएं से बच्चों को खांसी हो सकती है। भारी खेल घर के अंदर कराएं।',
      mr: 'धुरामुळे मुलांना खोकला येऊ शकतो. जास्त धावपळीचे खेळ घरातच घ्या.',
    },
    elderly: {
      en: 'Dust may irritate sensitive lungs. Keep walks short and gentle.',
      hi: 'धूल से फेफड़ों में परेशानी हो सकती है। सैर छोटी और धीमी रखें।',
      mr: 'धुळीमुळे श्वसनाचा त्रास होऊ शकतो. चालणे कमी आणि हलके ठेवा.',
    },
    pregnant: {
      en: 'Smog can cause throat dryness and tiredness. Rest indoors during busy rush hours.',
      hi: 'धुएं से गले में सूखापन और थकान हो सकती है। व्यस्त समय में घर पर आराम करें।',
      mr: 'धुरामुळे घसा कोरडा पडून थकवा येऊ शकतो. गर्दीच्या वेळी घरातच विश्रांती घ्या.',
    },
    asthma: {
      en: 'Dust can trigger coughing or chest tightness. Keep outdoor exertion light and carry your inhaler.',
      hi: 'धूल से खांसी या सांस फूल सकती है। बाहर मेहनत हल्की रखें और इनहेलर साथ रखें।',
      mr: 'धुळीमुळे खोकला किंवा छातीत त्रास होऊ शकतो. बाहेरील हालचाली हलक्या ठेवा आणि इनहेलर जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Dust can cause throat dryness. Take regular breaks in sheltered spots.',
      hi: 'धूल से गले में सूखापन आ सकता है। सुरक्षित जगहों पर बीच-बीच में आराम लें।',
      mr: 'धुळीमुळे घसा कोरडा पडू शकतो. सावलीच्या ठिकाणी नियमित विश्रांती घेत काम करा.',
    },
  },
  poor: {
    whole_family: {
      en: 'Smog is unhealthy today. Shut windows, run air filters, and move exercise indoors.',
      hi: 'आज हवा खराब है। खिड़कियां बंद रखें, एयर फिल्टर चलाएं और कसरत अंदर करें।',
      mr: 'आज हवा खराब आहे. खिडक्या बंद ठेवा, एअर फिल्टर चालवा आणि घरातच व्यायाम करा.',
    },
    child: {
      en: 'Air is unhealthy. Keep children indoors and pause outdoor playground sports.',
      hi: 'हवा खराब है। बच्चों को घर के अंदर रखें और बाहर के खेल बंद रखें।',
      mr: 'हवा अस्वच्छ आहे. मुलांना घरातच ठेवा आणि मैदानातील खेळ थांबवा.',
    },
    elderly: {
      en: 'Smog strains lungs and heart. Stay indoors and keep daily medicines close.',
      hi: 'स्मॉग से फेफड़ों और दिल पर जोर पड़ता है। घर में रहें और दवाइयां पास रखें।',
      mr: 'प्रदूषणामुळे फुप्फुस आणि हृदयावर ताण येतो. घरातच राहा आणि औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Smog harms maternal and baby health. Rest indoors with clean filtered air.',
      hi: 'स्मॉग मां और बच्चे दोनों के लिए हानिकारक है। साफ हवा में घर पर आराम करें।',
      mr: 'प्रदूषण आई आणि बाळ दोघांसाठी घातक आहे. घरात स्वच्छ हवेत विश्रांती घ्या.',
    },
    asthma: {
      en: 'Unhealthy smog can irritate airways. Stay indoors, run air filtration, and avoid outdoor workouts.',
      hi: 'खराब हवा सांस की नली में जलन कर सकती है। अंदर रहें, एयर फिल्टर चलाएं और बाहर कसरत न करें।',
      mr: 'प्रदूषणामुळे श्वासनलिकेत जळजळ होऊ शकते. घरातच राहा, एअर फिल्टर चालवा आणि बाहेरील व्यायाम टाळा.',
    },
    outdoor_worker: {
      en: 'Smog levels are high. Wear a snug N95 mask and take indoor rest pauses.',
      hi: 'प्रदूषण का स्तर ऊंचा है। टाइट N95 मास्क पहनें और अंदर आराम के ब्रेक लें।',
      mr: 'प्रदूषणाची पातळी जास्त आहे. चेहऱ्याला बसणारा N95 मास्क वापरा आणि विश्रांती घ्या.',
    },
  },
  very_poor: {
    whole_family: {
      en: 'Heavy smog outside. Keep windows shut, run air cleaners, and stay inside.',
      hi: 'बाहर भारी स्मॉग है। खिड़कियां बंद रखें, एयर प्यूरीफायर चलाएं और अंदर रहें।',
      mr: 'बाहेर दाट धुरके आहे. खिडक्या बंद ठेवा, एअर प्युरिफायर चालवा आणि घरातच राहा.',
    },
    child: {
      en: 'Heavy smog harms young lungs. Keep kids indoors in a closed, filtered room.',
      hi: 'भारी स्मॉग नन्हे फेफड़ों को नुकसान पहुंचाता है। बच्चों को बंद साफ कमरे में रखें।',
      mr: 'दाट धुरके लहान फुप्फुसांना त्रास देते. मुलांना बंद आणि स्वच्छ खोलीत ठेवा.',
    },
    elderly: {
      en: 'Heavy smog is dangerous for seniors. Stay inside and keep rescue medicines handy.',
      hi: 'बुजुर्गों के लिए भारी स्मॉग खतरनाक है। अंदर रहें और जरूरी दवाएं पास रखें।',
      mr: 'ज्येष्ठांसाठी दाट धूर धोकादायक आहे. घरातच राहा आणि इनहेलर जवळ ठेवा.',
    },
    pregnant: {
      en: 'Toxic smoke passes to unborn babies. Stay inside a closed room with air cleaning.',
      hi: 'जहरीला धुआं बच्चे तक पहुंच सकता है। बंद कमरे में एयर फिल्टर के साथ रहें।',
      mr: 'विषारी धूर गर्भातील बाळासाठी घातक ठरतो. बंद खोलीत हवा स्वच्छ ठेवून विश्रांती घ्या.',
    },
    asthma: {
      en: 'Heavy smog can trigger asthma attacks. Stay indoors with sealed windows and keep medications nearby.',
      hi: 'भारी स्मॉग से दमे का दौरा पड़ सकता है। खिड़कियां बंद रखकर अंदर रहें और दवाएं पास रखें।',
      mr: 'दाट धुरामुळे दम्याचा त्रास वाढू शकतो. खिडक्या बंद ठेवून घरातच राहा आणि औषधे जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Heavy smog outside. Wear a tight N95 mask and rest in clean indoor rooms.',
      hi: 'बाहर भारी स्मॉग है। टाइट N95 मास्क पहनें और अंदर साफ कमरों में आराम लें।',
      mr: 'बाहेर तीव्र धुरके आहे. घट्ट N95 मास्क लावा आणि आतील स्वच्छ खोलीत विश्रांती घ्या.',
    },
  },
  severe: {
    whole_family: {
      en: 'Emergency smog levels. Keep doors sealed, run air cleaners, and avoid all outdoor trips.',
      hi: 'आपातकालीन स्मॉग स्तर। दरवाजे बंद रखें, एयर क्लीनर चलाएं और बाहर जाना टालें।',
      mr: 'धोकादायक आणीबाणी पातळी. दारे बंद ठेवा, एअर क्लीनर चालवा आणि बाहेर जाणे पूर्ण टाळा.',
    },
    child: {
      en: 'Emergency smog levels. Keep kids strictly indoors in a sealed, filtered bedroom.',
      hi: 'आपातकालीन स्मॉग। बच्चों को पूरी तरह बंद और साफ हवा वाले कमरे में रखें।',
      mr: 'आणीबाणीची पातळी. मुलांना घरामध्ये बंद आणि स्वच्छ हवेच्या खोलीतच ठेवा.',
    },
    elderly: {
      en: 'Emergency smog levels. Remain indoors; seek urgent medical help if chest feels tight.',
      hi: 'आपातकालीन स्मॉग। अंदर ही रहें; सीने में जकड़न हो तो तुरंत डॉक्टर से संपर्क करें।',
      mr: 'धोकादायक प्रदूषण. घरातच राहा; छातीत त्रास जाणवल्यास त्वरित वैद्यकीय मदत घ्या.',
    },
    pregnant: {
      en: 'Severe toxic smoke outside. Stay inside a sealed, filtered room and avoid travel.',
      hi: 'बाहर जहरीला धुआं है। साफ और बंद कमरे में रहें, बाहर का सफर बिल्कुल न करें।',
      mr: 'बाहेर अत्यंत विषारी धूर आहे. स्वच्छ बंद खोलीत राहा आणि प्रवास पूर्णपणे टाळा.',
    },
    asthma: {
      en: 'Emergency toxic smog. Stay inside a filtered room with rescue inhalers handy; seek care if chest tightens.',
      hi: 'आपातकालीन जहरीला स्मॉग। साफ कमरे में इनहेलर पास रखें; सीने में जकड़न पर तुरंत डॉक्टर को दिखाएं।',
      mr: 'धोकादायक विषारी हवा. इनहेलर जवळ ठेवून फिल्टर खोलीत राहा; त्रास जाणवल्यास त्वरित मदत घ्या.',
    },
    outdoor_worker: {
      en: 'Emergency toxic air. Halt heavy outdoor labor; wear a fitted N95 respirator.',
      hi: 'अत्यधिक जहरीली हवा। बाहर की भारी मेहनत रोकें और फिटेड N95 मास्क पहनें।',
      mr: 'अतिविषारी हवा. उघड्यावरील कष्टाची कामे थांबवा आणि N95 मास्क वापरा.',
    },
  },
};

export const NEXT_2_HOURS_DECISIONS: Record<AQIBandKey, Record<FamilyView, CopySet>> = {
  good: {
    whole_family: {
      en: 'The air is clean and safe right now! Feel free to open windows for fresh air and enjoy outdoor workouts freely.',
      hi: 'हवा बिल्कुल साफ और सुरक्षित है! ताज़ा हवा के लिए खिड़कियां खोलें और बाहर कसरत या सैर का आनंद लें।',
      mr: 'हवा अतिशय स्वच्छ आणि सुरक्षित आहे! ताजी हवा मिळण्यासाठी खिडक्या उघडा आणि मैदानी खेळ किंवा फिरण्याचा आनंद घ्या.',
    },
    child: {
      en: 'Wonderful fresh air for the kids today! Outdoor play, sports, and park visits are completely safe.',
      hi: 'बच्चों के लिए आज हवा बहुत अच्छी है! बाहर खेलना, कूदना और पार्क में जाना पूरी तरह सुरक्षित है।',
      mr: 'मुलांसाठी आज हवा खूप छान आहे! बागेत खेळणे, धावणे आणि बागडणे पूर्णपणे सुरक्षित आहे.',
    },
    elderly: {
      en: 'Gentle, easy breathing conditions today. A peaceful garden walk or morning stroll is safe and refreshing.',
      hi: 'सांस लेने के लिए हवा बहुत हल्की है। पार्क या बगीचे में टहलना सुरक्षित और ताज़गी भरा है।',
      mr: 'आज श्वास घेण्यासाठी हवा हलकी आहे. बागेत शांतपणे फेरफटका मारणे सुरक्षित आणि ताजेतवाने आहे.',
    },
    pregnant: {
      en: 'Air is clean, safe, and soothing right now. Enjoy gentle walks, open windows, and refreshing sunshine.',
      hi: 'हवा साफ और सुखद है। हल्की सैर करें और घर में ताज़ी हवा आने दें।',
      mr: 'हवा स्वच्छ आणि सुखद आहे. मोकळ्या हवेत हलके फिरा आणि खिडक्या उघड्या ठेवा.',
    },
    asthma: {
      en: 'Air is clean and soothing! Enjoy outdoor walks freely, and always carry your prescribed rescue inhaler when heading out.',
      hi: 'हवा साफ और सुखद है! बाहर टहलने का आनंद लें, और बाहर जाते समय अपना इनहेलर हमेशा साथ रखें।',
      mr: 'हवा अतिशय स्वच्छ आणि सुखद आहे! मोकळेपणाने फिरा, आणि बाहेर जाताना आपला इनहेलर नेहमी सोबत ठेवा.',
    },
    outdoor_worker: {
      en: 'Comfortable working conditions outdoors. No mask needed right now; keep yourself well hydrated.',
      hi: 'बाहर काम करने के लिए माहौल अच्छा है। मास्क की जरूरत नहीं है, बस पानी पीते रहें।',
      mr: 'बाहेर कामासाठी परिस्थिती चांगली आहे. मास्कची गरज नाही, फक्त पाणी पीत राहा.',
    },
  },
  satisfactory: {
    whole_family: {
      en: 'Air quality is pleasant and comfortable! Open windows for fresh air and enjoy outdoor walks freely.',
      hi: 'हवा काफी अच्छी और आरामदायक है! ताज़ा हवा के लिए खिड़कियां खोलें और बाहर सैर का आनंद लें।',
      mr: 'हवा छान आणि आरामदायक आहे! घरात ताजी हवा येण्यासाठी खिडक्या उघडा आणि बाहेर फिरा.',
    },
    child: {
      en: 'Great air for the little ones right now! Outdoor playtime, sports, and park visits are safe.',
      hi: 'बच्चों के लिए हवा बहुत बढ़िया है! पार्क में खेलना और दौड़ना पूरी तरह सुरक्षित है।',
      mr: 'लहान मुलांसाठी हवा उत्तम आहे! बागेत खेळणे आणि बागडणे पूर्णपणे सुरक्षित आहे.',
    },
    elderly: {
      en: 'Comfortable breathing conditions for everyday walks. Rest if feeling short of breath.',
      hi: 'रोज की सैर के लिए हवा अच्छी है। अगर सांस फूले तो थोड़ा आराम कर लें।',
      mr: 'नियमित चालण्यासाठी हवा आरामदायक आहे. दम लागल्यास थोडी विश्रांती घ्या.',
    },
    pregnant: {
      en: 'Air is suitable for normal daily routines. Enjoy gentle walks and avoid congested road junctions.',
      hi: 'दिनचर्या के लिए हवा बिल्कुल ठीक है। हल्की सैर करें और भीड़-भाड़ वाले चौराहों से बचें।',
      mr: 'दैनंदिन कामांसाठी हवा अनुकूल आहे. शांतपणे फिरा आणि गर्दीचे रस्ते टाळा.',
    },
    asthma: {
      en: 'Pleasant air for gentle routines. Enjoy peaceful outdoor walks, and keep your prescribed inhaler and medication accessible.',
      hi: 'सामान्य दिनचर्या के लिए हवा अच्छी है। हल्की सैर सुरक्षित है; अपना इनहेलर और दवाएं हमेशा साथ रखें।',
      mr: 'दैनंदिन कामांसाठी हवा चांगली आहे. हलके फिरणे सुरक्षित आहे; आवश्यक इनहेलर आणि औषधे सोबत ठेवा.',
    },
    outdoor_worker: {
      en: 'Manageable working conditions outdoors. Stay well hydrated throughout your shift.',
      hi: 'काम के हालात सामान्य और सुरक्षित हैं। काम के दौरान समय-समय पर पानी पीते रहें।',
      mr: 'कामाची परिस्थिती सामान्य आहे. कामादरम्यान भरपूर पाणी पीत राहा.',
    },
  },
  moderate: {
    whole_family: {
      en: 'Mild haze is in the air. Everyday routines are fine; pace heavy outdoor workouts or move them indoors.',
      hi: 'हवा में हल्की धुंध है। रोज के काम सामान्य हैं; बहुत भारी कसरत अंदर करें या गति धीमी रखें।',
      mr: 'हवेत थोडा धूर आहे. रोजची कामे ठीक आहेत; जास्त मोठा व्यायाम घरात करा.',
    },
    child: {
      en: 'Kids can play outside normally. Take breaks if they are running hard or sensitive to dust.',
      hi: 'बच्चे सामान्य रूप से बाहर खेल सकते हैं। अगर वे ज्यादा दौड़ रहे हों तो बीच में पानी पिलाएं।',
      mr: 'मुले सामान्यपणे खेळू शकतात. जास्त धावपळ करत असल्यास मधेच विश्रांती द्या.',
    },
    elderly: {
      en: 'Safe for light walks. Sensitive individuals should avoid heavy exertion and keep inhalers close.',
      hi: 'हल्की सैर के लिए ठीक है। ज्यादा मेहनत से बचें और जरूरी दवाएं या इनहेलर पास रखें।',
      mr: 'हलक्या फेरफटक्यासाठी ठीक आहे. जास्त धावपळ टाळा आणि औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Safe for normal errands. Keep windows shut during dusty hours and rest in clean indoor rooms.',
      hi: 'सामान्य कामों के लिए ठीक है। धूल भरे समय में खिड़की बंद रखें और अंदर आराम करें।',
      mr: 'सामान्य कामांसाठी ठीक आहे. धुराच्या वेळी खिडक्या बंद ठेवा आणि आत विश्रांती घ्या.',
    },
    asthma: {
      en: 'Mild haze is present. Pace outdoor activities, avoid cold drafts, and always carry your rescue inhaler and medicines.',
      hi: 'हवा में हल्की धुंध है। बाहर की गतिविधि धीमी रखें, ठंडी हवा से बचें और इनहेलर व दवाएं हमेशा साथ रखें।',
      mr: 'हवेत थोडी धुंध आहे. बाहेरील कामे सावकाश करा, थंड हवेपासून दूर राहा आणि इनहेलर व औषधे सोबत ठेवा.',
    },
    outdoor_worker: {
      en: 'Manageable conditions. Wear a snug N95 mask near traffic and take short rest breaks in shade.',
      hi: 'हालात ठीक हैं। ट्रैफिक के पास N95 मास्क लगाएं और छांव में छोटे ब्रेक लेते रहें।',
      mr: 'परिस्थिती नियंत्रणात आहे. रहदारीजवळ N95 मास्क लावा आणि सावलीत विश्रांती घ्या.',
    },
  },
  poor: {
    whole_family: {
      en: 'Smog is elevated right now. Keep windows closed, run indoor filtration, and wear an N95 if stepping out.',
      hi: 'हवा में प्रदूषण बढ़ा हुआ है। खिड़कियां बंद रखें, एयर फिल्टर चलाएं और बाहर जाते समय N95 लगाएं।',
      mr: 'हवेत प्रदूषण वाढले आहे. खिडक्या बंद ठेवा, एअर फिल्टर चालवा आणि बाहेर पडताना N95 मास्क वापरा.',
    },
    child: {
      en: 'Please keep children indoors in a closed room with air cleaning running. Reschedule outdoor park trips.',
      hi: 'कृपया बच्चों को अंदर रखें जहां एयर प्यूरीफायर चल रहा हो। पार्क जाने का समय टालें।',
      mr: 'कृपया मुलांना एअर प्युरिफायर चालू असलेल्या बंद खोलीतच ठेवा. बागेत जाणे पुढे ढकला.',
    },
    elderly: {
      en: 'Stay comfortably inside a cleaner-air room. Avoid outdoor walks and keep inhalers and medicines handy.',
      hi: 'साफ हवा वाले कमरे में आराम करें। बाहर टहलने से बचें और जरूरी इनहेलर पास रखें।',
      mr: 'स्वच्छ खोलीतच विश्रांती घ्या. बाहेर फिरणे टाळा आणि इनहेलर जवळ ठेवा.',
    },
    pregnant: {
      en: 'Rest inside a closed room with air filtration. Postpone non-urgent outdoor travel for your safety.',
      hi: 'एयर फिल्टर वाले कमरे में आराम करें। अपनी सुरक्षा के लिए गैर-जरूरी सफर टालें।',
      mr: 'एअर फिल्टर असलेल्या खोलीत विश्रांती घ्या. सुरक्षिततेसाठी अनावश्यक प्रवास पुढे ढकला.',
    },
    asthma: {
      en: 'Elevated smog can trigger asthma. Rest indoors with air filtration, and keep your rescue inhaler and medicines within reach.',
      hi: 'प्रदूषण से दमे का दौरा पड़ सकता है। एयर फिल्टर चलाकर अंदर रहें और इनहेलर व दवाएं हमेशा पास रखें।',
      mr: 'प्रदूषणामुळे श्वास घेण्यास त्रास होऊ शकतो. घरातच राहा आणि इनहेलर व औषधे हाताशी जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Unhealthy air outside. Put on your fitted N95 respirator and take breaks inside sheltered rooms.',
      hi: 'बाहर हवा खराब है। अपना N95 मास्क जरूर लगाएं और अंदर सुरक्षित जगह पर ब्रेक लें।',
      mr: 'बाहेर हवा अस्वस्थ आहे. बसणारा N95 मास्क लावा आणि आतील सुरक्षित जागेत विश्रांती घ्या.',
    },
  },
  very_poor: {
    whole_family: {
      en: 'Heavy smog outside. Please stay indoors; wear a fitted N95 mask if you must travel.',
      hi: 'बाहर भारी स्मॉग है। कृपया अंदर रहें; जरूरी काम होने पर ही N95 मास्क लगाकर निकलें।',
      mr: 'बाहेर दाट धूर आहे. कृपया घरातच राहा; अत्यंत महत्त्वाच्या कामासाठीच N95 मास्क वापरा.',
    },
    child: {
      en: 'Keep children safely indoors in a closed room. Never use masks on babies under two.',
      hi: 'बच्चों को सुरक्षित रूप से बंद कमरे में रखें। 2 साल से छोटे बच्चों को कभी मास्क न लगाएं।',
      mr: 'मुलांना सुरक्षितपणे बंद खोलीतच ठेवा. २ वर्षांखालील बाळांना मास्क वापरू नका.',
    },
    elderly: {
      en: 'Please keep seniors in a dedicated clean room. Avoid balcony walks and keep inhalers close.',
      hi: 'बुजुर्गों को साफ हवा वाले कमरे में रखें। बालकनी में न जाएं और इनहेलर पास रखें।',
      mr: 'ज्येष्ठांना स्वच्छ खोलीत ठेवा. बाल्कनीत जाणे टाळा आणि इनहेलर जवळ ठेवा.',
    },
    pregnant: {
      en: 'Remain inside with air cleaners running. Wear a tight N95 for necessary doctor visits.',
      hi: 'एयर प्यूरीफायर चालू रखकर अंदर रहें। डॉक्टर के पास जाते समय टाइट N95 मास्क पहनें।',
      mr: 'एअर प्युरिफायर चालू ठेवून घरातच राहा. डॉक्टरकडे जाताना घट्ट N95 वापरा.',
    },
    asthma: {
      en: 'Dangerous smog for sensitive airways. Stay in a clean filtered room, take preventer doses, and keep rescue inhalers handy.',
      hi: 'फेफड़ों के लिए हवा खतरनाक है। साफ हवा वाले कमरे में रहें, दवाएं समय पर लें और इनहेलर पास रखें।',
      mr: 'श्वसनासाठी हवा अतिशय धोकादायक आहे. स्वच्छ खोलीतच राहा, औषधे वेळेवर घ्या आणि इनहेलर जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Hazardous air outside. Wear your fitted N95 respirator and move heavy tasks to sheltered spaces.',
      hi: 'बाहर हवा खतरनाक है। फिटेड N95 मास्क पहनें और भारी काम शेड या अंदर करें।',
      mr: 'बाहेर हवा धोकादायक आहे. बसणारा N95 मास्क वापरा आणि जड कामे शेडमध्ये करा.',
    },
  },
  severe: {
    whole_family: {
      en: 'Emergency smog outside. Stay strictly indoors; use a fitted N95 mask only for essential trips.',
      hi: 'बाहर आपातकालीन स्मॉग है। बिल्कुल अंदर रहें; जरूरी काम पर ही N95 पहनकर जाएं।',
      mr: 'बाहेर आणीबाणीचा धूर आहे. पूर्णपणे आत राहा; महत्त्वाच्या कामासाठीच N95 वापरा.',
    },
    child: {
      en: 'Keep children strictly indoors in a closed bedroom with active air filtration running.',
      hi: 'बच्चों को पूरी तरह बंद बेडरूम में रखें जहां एयर फिल्टर चल रहा हो।',
      mr: 'मुलांना एअर फिल्टर चालू असलेल्या बंद बेडरूममध्येच ठेवा.',
    },
    elderly: {
      en: 'Keep seniors in a sealed clean-air room. Seek immediate medical help if chest tightness occurs.',
      hi: 'बुजुर्गों को बंद साफ कमरे में रखें। सीने में भारीपन लगे तो तुरंत मदद लें।',
      mr: 'ज्येष्ठांना बंद स्वच्छ खोलीत ठेवा. छातीत त्रास झाल्यास तातडीने मदत घ्या.',
    },
    pregnant: {
      en: 'Remain inside a closed room with air cleaning running. Avoid all outdoor travel.',
      hi: 'एयर फिल्टर वाले बंद कमरे में रहें। बाहर का कोई सफर न करें।',
      mr: 'एअर फिल्टर असलेल्या बंद खोलीत राहा. बाहेरचा कोणताही प्रवास टाळा.',
    },
    asthma: {
      en: 'Emergency toxic smog. Remain sealed in a filtered room with inhalers ready; seek immediate care if chest tightens.',
      hi: 'आपातकालीन जहरीला स्मॉग। इनहेलर पास रखकर साफ कमरे में रहें; सीने में जकड़न पर तुरंत डॉक्टर को दिखाएं।',
      mr: 'धोकादायक विषारी स्मॉग. इनहेलर जवळ ठेवून बंद खोलीतच राहा; छातीत तीव्र त्रास जाणवल्यास त्वरित वैद्यकीय मदत घ्या.',
    },
    outdoor_worker: {
      en: 'Stop heavy outdoor work. Wear a fitted N95 respirator and rest in filtered air.',
      hi: 'बाहर की भारी मेहनत रोकें। फिटेड N95 मास्क लगाएं और साफ हवा में आराम करें।',
      mr: 'कष्टाची कामे थांबवा. N95 मास्क लावा आणि आतील स्वच्छ हवेत विश्रांती घ्या.',
    },
  },
};

/**
 * Night-time sleeping hours decisions (12 AM to 6 AM / hours 00:00 - 05:59).
 * Between 12 AM and 6 AM, strictly suggests restful sleep and bedroom air quality,
 * never outdoor activities. For asthma patients, reinforces having rescue inhalers bedside.
 * Every sentence is strictly 18 words or fewer.
 */
export const NIGHT_SLEEP_DECISIONS: Record<AQIBandKey, Record<FamilyView, CopySet>> = {
  good: {
    whole_family: {
      en: 'It is late night. Enjoy a peaceful and restful sleep in clean, fresh air.',
      hi: 'देर रात का समय है। साफ और ताज़ा हवा में सुकून भरी नींद लें।',
      mr: 'मध्यरात्र आहे. स्वच्छ आणि ताज्या हवेत शांत व गाढ झोप घ्या.',
    },
    child: {
      en: 'Late night resting hours. Keep the bedroom cozy, quiet, and well-ventilated for sound sleep.',
      hi: 'देर रात का समय है। बच्चों के कमरे को आरामदायक व हवादार रखकर सुकून से सोने दें।',
      mr: 'मध्यरात्र आहे. मुलांच्या खोलीत शांत वातावरण ठेवून त्यांना गाढ झोपू द्या.',
    },
    elderly: {
      en: 'Late night resting hours. Rest comfortably in a warm, quiet room for restorative sleep.',
      hi: 'रात के आराम का समय है। कमरे को शांत व गर्म रखकर आरामदायक नींद लें।',
      mr: 'रात्रीच्या विश्रांतीची वेळ आहे. शांत आणि उबदार खोलीत गाढ झोप घ्या.',
    },
    pregnant: {
      en: 'Late night resting time. Rest comfortably in clean air and enjoy sound, restorative sleep.',
      hi: 'रात के आराम का समय है। साफ हवा में आरामदायक मुद्रा में सुकून की नींद लें।',
      mr: 'रात्रीच्या आरामाची वेळ आहे. स्वच्छ हवेत आरामदायक आणि शांत झोप घ्या.',
    },
    asthma: {
      en: 'Late night hours. Sleep peacefully in fresh air and keep your rescue inhaler at your bedside.',
      hi: 'देर रात का समय है। साफ हवा में सुकून से सोएं और अपना इनहेलर सिरहाने पास रखें।',
      mr: 'मध्यरात्र आहे. स्वच्छ हवेत शांत झोप घ्या आणि आपला इनहेलर उशाशी जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Night resting hours. Sleep soundly indoors and let your body recharge for tomorrow.',
      hi: 'रात के आराम का समय है। कमरे के अंदर गहरी नींद लें और कल के लिए ऊर्जा जुटाएं।',
      mr: 'रात्रीच्या विश्रांतीची वेळ आहे. घरात शांत झोप घ्या आणि उद्यासाठी ताजेतवाने व्हा.',
    },
  },
  satisfactory: {
    whole_family: {
      en: 'It is late night. Enjoy a peaceful and restful sleep in pleasant indoor air.',
      hi: 'देर रात का समय है। आरामदायक कमरे में सुकून और शांति से सोएं।',
      mr: 'मध्यरात्र आहे. आरामदायक खोलीत शांत आणि गाढ झोप घ्या.',
    },
    child: {
      en: 'Late night hours. Keep the bedroom cozy, quiet, and comfortable for sound sleep.',
      hi: 'देर रात का समय है। बच्चों के कमरे को आरामदायक व शांत रखकर गहरी नींद लेने दें।',
      mr: 'मध्यरात्र आहे. मुलांच्या खोलीत शांत वातावरण ठेवून त्यांना गाढ झोपू द्या.',
    },
    elderly: {
      en: 'Late night hours. Rest comfortably in a warm bedroom for gentle, restorative sleep.',
      hi: 'रात के आराम का समय है। गर्म और शांत कमरे में आरामदायक नींद लें।',
      mr: 'रात्रीच्या विश्रांतीची वेळ आहे. उबदार खोलीत शांत आणि गाढ झोप घ्या.',
    },
    pregnant: {
      en: 'Late night resting time. Sleep comfortably in pleasant air and get peaceful night rest.',
      hi: 'रात के आराम का समय है। आरामदायक कमरे में सुकून से सोएं।',
      mr: 'रात्रीच्या आरामाची वेळ आहे. स्वच्छ आणि आरामदायक खोलीत शांत झोपा.',
    },
    asthma: {
      en: 'Late night hours. Sleep comfortably indoors and keep your rescue inhaler accessible at your bedside.',
      hi: 'देर रात का समय है। आराम से सोएं और अपना इनहेलर व दवाएं हमेशा सिरहाने रखें।',
      mr: 'मध्यरात्र आहे. शांत झोप घ्या आणि आपला इनहेलर व औषधे उशाशी जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Night resting hours. Get restful indoor sleep to recharge your stamina for the morning.',
      hi: 'रात के आराम का समय है। सुबह के लिए पूरी ऊर्जा जुटाने हेतु अच्छी नींद लें।',
      mr: 'रात्रीच्या विश्रांतीची वेळ आहे. सकाळच्या कामासाठी शरीराला ताजी ऊर्जा मिळण्यासाठी गाढ झोपा.',
    },
  },
  moderate: {
    whole_family: {
      en: 'It is late night. Keep windows shut against night haze and sleep comfortably indoors.',
      hi: 'देर रात का समय है। रात की धुंध से बचने के लिए खिड़कियां बंद रखें और अच्छी नींद लें।',
      mr: 'मध्यरात्र आहे. रात्रीच्या धुरापासून बचावासाठी खिडक्या बंद ठेवा आणि गाढ झोप घ्या.',
    },
    child: {
      en: 'Late night hours. Keep bedroom windows closed so children can sleep peacefully in clean air.',
      hi: 'देर रात का समय है। खिड़कियां बंद रखें ताकि बच्चे साफ कमरे में सुकून से सो सकें।',
      mr: 'मध्यरात्र आहे. खिडक्या बंद ठेवा जेणेकरून मुले शांत आणि स्वच्छ हवेत झोपू शकतील.',
    },
    elderly: {
      en: 'Late night hours. Keep bedroom draft-free, stay warm, and enjoy peaceful, uninterrupted sleep.',
      hi: 'देर रात का समय है। कमरे को गर्म व धूल-मुक्त रखें और सुकून भरी नींद लें।',
      mr: 'मध्यरात्र आहे. खोली उबदार आणि धूळमुक्त ठेवा आणि शांत झोप घ्या.',
    },
    pregnant: {
      en: 'Late night resting time. Keep bedroom windows shut against night haze and rest comfortably.',
      hi: 'रात के आराम का समय है। खिड़की बंद रखें और साफ कमरे में आराम से सोएं।',
      mr: 'रात्रीच्या विश्रांतीची वेळ आहे. खिडक्या बंद ठेवा आणि स्वच्छ खोलीत शांत झोपा.',
    },
    asthma: {
      en: 'Night haze can trigger coughing. Keep windows shut, stay warm, and keep your rescue inhaler beside you.',
      hi: 'रात की धुंध से खांसी हो सकती है। खिड़की बंद रखें और इनहेलर अपने बिस्तर के पास रखें।',
      mr: 'रात्रीच्या हवेमुळे खोकला येऊ शकतो. खिडक्या बंद ठेवा आणि इनहेलर आपल्या अंथरुणाजवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Late night resting time. Rest well indoors away from road haze and recharge your body.',
      hi: 'रात के आराम का समय है। सड़क की धुंध से दूर घर में आराम से सोएं।',
      mr: 'रात्रीच्या आरामाची वेळ आहे. रस्त्यावरील धुरापासून दूर घरात शांत झोप घ्या.',
    },
  },
  poor: {
    whole_family: {
      en: 'Night smog is elevated. Keep bedroom windows closed, run filtration quietly, and get restful sleep.',
      hi: 'रात में स्मॉग बढ़ा हुआ है। खिड़कियां बंद रखें, एयर फिल्टर चलाएं और सुकून से सोएं।',
      mr: 'रात्री धूर वाढला आहे. खिडक्या बंद ठेवा, एअर फिल्टर शांतपणे चालवा आणि शांत झोपा.',
    },
    child: {
      en: 'Night smog is elevated. Keep children sleeping safely in a closed room with air cleaning running.',
      hi: 'रात में स्मॉग बढ़ा हुआ है। बच्चों को एयर फिल्टर वाले बंद कमरे में सुरक्षित सुलाएं।',
      mr: 'रात्री प्रदूषण वाढले आहे. मुलांना एअर फिल्टर चालू असलेल्या बंद खोलीतच सुरक्षित झोपू द्या.',
    },
    elderly: {
      en: 'Night smog is unhealthy. Keep the bedroom sealed with air filtration running, and sleep warmly.',
      hi: 'रात का स्मॉग नुकसानदेह है। एयर प्यूरीफायर चलाकर बंद कमरे में गर्म रहकर सोएं।',
      mr: 'रात्रीचा धूर त्रासदायक आहे. एअर प्युरिफायर चालू ठेवून उबदार खोलीत शांत झोपा.',
    },
    pregnant: {
      en: 'Night smog is high outside. Sleep in a sealed bedroom with air filtration running quietly.',
      hi: 'रात में बाहर स्मॉग है। पूरी रात एयर फिल्टर वाले बंद कमरे में सुकून की नींद लें।',
      mr: 'रात्री बाहेर धूर आहे. रात्रभर एअर फिल्टर चालू असलेल्या बंद खोलीत शांत झोपा.',
    },
    asthma: {
      en: 'Night smog triggers asthma attacks. Sleep in a filtered room and keep your rescue inhaler at your bedside.',
      hi: 'रात का स्मॉग दमा बढ़ा सकता है। एयर फिल्टर वाले कमरे में सोएं और इनहेलर सिरहाने पास रखें।',
      mr: 'रात्रीच्या धुरामुळे दम्याचा त्रास वाढू शकतो. फिल्टर असलेल्या खोलीत झोपा आणि इनहेलर उशाशी जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Hazardous night air outside. Sleep safely indoors in filtered air and rest your lungs.',
      hi: 'रात में बाहर जहरीली हवा है। घर में साफ हवा के अंदर सोएं और फेफड़ों को आराम दें।',
      mr: 'रात्री बाहेर विषारी हवा आहे. घरात स्वच्छ हवेमध्ये झोपा आणि फुफ्फुसांना विश्रांती द्या.',
    },
  },
  very_poor: {
    whole_family: {
      en: 'Heavy night smog outside. Sleep in a sealed room with air filtration running all night.',
      hi: 'बाहर भारी स्मॉग है। पूरी रात एयर फिल्टर वाले बंद कमरे में सुकून की नींद लें।',
      mr: 'बाहेर दाट धूर आहे. रात्रभर एअर फिल्टर चालू असलेल्या बंद खोलीत शांत झोपा.',
    },
    child: {
      en: 'Heavy night smog outside. Keep children safely asleep in a sealed room with air cleaners.',
      hi: 'बाहर भारी स्मॉग है। बच्चों को एयर प्यूरीफायर वाले बंद कमरे में सुरक्षित सुलाएं।',
      mr: 'बाहेर दाट धूर आहे. मुलांना एअर प्युरिफायर चालू असलेल्या बंद खोलीतच झोपू द्या.',
    },
    elderly: {
      en: 'Dangerous night smog outside. Sleep in a sealed cleaner-air room and keep rescue medicines handy.',
      hi: 'बाहर खतरनाक स्मॉग है। साफ हवा वाले कमरे में सोएं और जरूरी दवाएं पास रखें।',
      mr: 'बाहेर धोकादायक धूर आहे. स्वच्छ बंद खोलीत झोपा आणि आवश्यक औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Heavy night smog outside. Sleep in a sealed sanctuary room with air cleaning running quietly.',
      hi: 'रात में बाहर भारी स्मॉग है। एयर फिल्टर वाले शांत कमरे में सुरक्षित नींद लें।',
      mr: 'रात्री बाहेर दाट धूर आहे. एअर फिल्टर असलेल्या शांत खोलीत गाढ झोप घ्या.',
    },
    asthma: {
      en: 'Heavy night smog outside. Sleep in a sealed filtered room and keep rescue inhalers within arm reach.',
      hi: 'बाहर भारी स्मॉग है। साफ हवा वाले बंद कमरे में सोएं और इनहेलर हमेशा हाथ के पास रखें।',
      mr: 'बाहेर दाट धूर आहे. स्वच्छ बंद खोलीत झोपा आणि इनहेलर हाताशी जवळ ठेवा.',
    },
    outdoor_worker: {
      en: 'Heavy toxic night air. Rest strictly indoors in filtered air and let your lungs recover.',
      hi: 'रात में बाहर जहरीली हवा है। घर के अंदर साफ हवा में सोएं और फेफड़ों को आराम दें।',
      mr: 'रात्री बाहेर विषारी हवा आहे. घरात स्वच्छ हवेत झोपा आणि फुफ्फुसांना विश्रांती द्या.',
    },
  },
  severe: {
    whole_family: {
      en: 'Emergency night smog outside. Keep bedroom strictly sealed with filtration running and sleep safely.',
      hi: 'बाहर आपातकालीन स्मॉग है। बेडरूम बंद रखकर एयर फिल्टर चलाएं और सुरक्षित सोएं।',
      mr: 'बाहेर आणीबाणीचा धूर आहे. खोली पूर्ण बंद ठेवून एअर फिल्टर चालवा आणि सुरक्षित झोपा.',
    },
    child: {
      en: 'Emergency night smog outside. Keep children asleep in a sealed bedroom with active air filtration.',
      hi: 'आपातकालीन स्मॉग। बच्चों को बंद बेडरूम में सक्रिय एयर फिल्टर के साथ सुलाएं।',
      mr: 'धोकादायक आणीबाणी स्मॉग. मुलांना एअर फिल्टर चालू असलेल्या बंद बेडरूममध्येच झोपू द्या.',
    },
    elderly: {
      en: 'Emergency night smog outside. Sleep sealed in a filtered room and keep emergency contacts ready.',
      hi: 'आपातकालीन जहरीला स्मॉग। बंद साफ कमरे में सोएं और दवाएं पास रखें।',
      mr: 'धोकादायक विषारी स्मॉग. बंद स्वच्छ खोलीत झोपा आणि औषधे जवळ ठेवा.',
    },
    pregnant: {
      en: 'Severe toxic night smoke. Sleep in a sealed room with air cleaners running all night.',
      hi: 'रात में गंभीर जहरीला स्मॉग। पूरी रात एयर फिल्टर वाले बंद कमरे में सुरक्षित सोएं।',
      mr: 'रात्री अत्यंत विषारी हवा आहे. रात्रभर एअर क्लीनर चालू असलेल्या खोलीत शांत झोपा.',
    },
    asthma: {
      en: 'Emergency toxic night smog. Sleep sealed in a filtered room with your rescue inhaler bedside.',
      hi: 'गंभीर आपातकालीन स्मॉग। इनहेलर पास रखकर साफ कमरे में सोएं; सांस में तकलीफ पर तुरंत मदद लें।',
      mr: 'धोकादायक विषारी स्मॉग. इनहेलर जवळ ठेवून बंद खोलीत झोपा; त्रास जाणवल्यास त्वरित वैद्यकीय मदत घ्या.',
    },
    outdoor_worker: {
      en: 'Emergency toxic night air. Rest safely indoors with air cleaning running and sleep soundly.',
      hi: 'अत्यधिक जहरीली हवा। साफ कमरे में आराम से सोएं और फेफड़ों को पूरी तरह राहत दें।',
      mr: 'अतिविषारी हवा. घरात एअर क्लीनर चालू ठेवून शांत झोप घ्या आणि विश्रांती मिळवा.',
    },
  },
};

/**
 * Single function outdoorGuidance(currentBand, hourlyForecast, persona, profile, lang, currentHour)
 * Returns the unified outdoor advice, level, status line, guidance copy, and decision.
 */

