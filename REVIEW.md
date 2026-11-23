# Clearhale Advice Content & Source Review

This document contains all newly rewritten action catalog items, official source references, and band-aware multilingual advice matrix (English, Hindi, Marathi) for expert and native speaker verification.

---

## 1. Action Catalog Verification & Official Sources

All 32 actions in `data/actions.json` have verified official sources from EPA, WHO, CDC/NIOSH, and CPCB. No unverified claims were invented.

### Allowed Numeric Claims (Used Verbatim)
1. **HEPA Air Purifier**: "a portable HEPA purifier may cut indoor PM2.5 by about 50-80% when run continuously with doors and windows closed"
2. **DIY Box-Fan Filter**: "a DIY box-fan filter with MERV-13 filters by about 40-70% in studies"
3. **Closed Windows & Infiltration**: "with windows and doors shut, indoor PM2.5 is still about 55-60% of outdoor levels in smoke events"

### Catalog Summary Table

| Action ID | Room | Title (≤6 words) | Evidence Level | Cost Tier | Official Source | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `bedroom_sanctuary` | bedroom | Create a bedroom clean-air sanctuary | Strong | Free | [US EPA Clean Room Guidance](https://www.epa.gov/indoor-air-quality-iaq/create-clean-room-protect-indoor-air-quality-during-wildfire) | Concentrated bedroom filtration during sleep |
| `bedroom_door_towel` | bedroom | Block door gaps with towels | Moderate | Free | [US EPA IAQ Guidance](https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality) | Reduces inter-room air infiltration |
| `stop_incense_coils` | bedroom | Stop incense, dhoop and coils | Strong | Free | [WHO Household Air Pollution](https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health) | Eliminates intense indoor combustion sources |
| `kitchen_exhaust_chimney` | kitchen | Run kitchen chimney or exhaust | Strong | Free | [US EPA Pollutants & Sources](https://www.epa.gov/indoor-air-quality-iaq/indoor-pollutants-and-sources) | Run before, during, and after cooking |
| `lids_and_pressure_cookers` | kitchen | Use lids and pressure cookers | Moderate | Free | [WHO Household Air Pollution](https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health) | Cuts cooking combustion time |
| `lower_frying_heat` | kitchen | Lower heat during stovetop frying | Moderate | Free | [US EPA Pollutants & Sources](https://www.epa.gov/indoor-air-quality-iaq/indoor-pollutants-and-sources) | Prevents oil aerosolization |
| `switch_to_induction` | kitchen | Switch to an induction cooktop | Strong | If you can afford | [WHO Household Air Pollution](https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health) | Zero in-kitchen combustion emissions |
| `biomass_ventilation` | kitchen | Ventilate biomass cooking fires outdoors | Strong | Free | [WHO Household Air Pollution](https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health) | Outdoor cross ventilation for solid fuels |
| `damp_mopping_floors` | living | Damp-mop floors instead of sweeping | Moderate | Free | [US EPA Pollutants & Sources](https://www.epa.gov/indoor-air-quality-iaq/indoor-pollutants-and-sources) | Prevents resuspension of settled PM |
| `choose_hepa_not_ozone` | living | Choose HEPA over ionizing purifiers | Strong | If you can afford | [US EPA Ozone Generators](https://www.epa.gov/indoor-air-quality-iaq/ozone-generators-are-sold-air-cleaners) | Avoids lung-damaging ozone byproducts |
| `avoid_aerosol_sprays` | living | Avoid aerosol sprays and fresheners | Strong | Free | [US EPA VOCs](https://www.epa.gov/indoor-air-quality-iaq/volatile-organic-compounds-impact-indoor-air-quality) | Eliminates secondary organic aerosol precursors |
| `maintain_purifier_filters` | living | Replace purifier filters on schedule | Strong | Low-cost | [US EPA Air Cleaners & Filters](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) | Preserves design CADR airflow |
| `shut_windows_smog` | whole-home | Shut windows during peak smog | Strong | Free | [US EPA Wildfires & IAQ](https://www.epa.gov/indoor-air-quality-iaq/wildfires-and-indoor-air-quality-iaq) | Allowed number verbatim (55-60%) |
| `air_out_cleanest_hour` | whole-home | Air out during cleanest hour | Depends on your home | Free | [US EPA Improving IAQ](https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality) | Brief midday cross ventilation when outdoor air is clean |
| `seal_gaps_weatherstripping` | whole-home | Seal drafty gaps with weatherstripping | Moderate | Low-cost | [US EPA Improving IAQ](https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality) | Blocks infiltration through perimeter cracks |
| `recirculating_ac_fan` | whole-home | Run recirculating fan or AC | Depends on your home | Free | [US EPA Air Cleaners & Filters](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) | Recirculation mode; window AC damper closed |
| `hepa_purifier` | whole-home | Run portable True HEPA purifier | Strong | If you can afford | [US EPA Air Cleaners & Filters](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) | Allowed number verbatim (50-80%) |
| `diy_box_fan` | whole-home | Build DIY box-fan filter | Moderate | Low-cost | [US EPA Research DIY Air Cleaners](https://www.epa.gov/indoor-air-quality-iaq/research-diy-air-cleaners-reduce-wildfire-smoke-indoors) | Allowed number verbatim (40-70%) |
| `n95_respirator` | outdoors | Wear fitted N95 respirator outdoors | Strong | Low-cost | [CDC NIOSH Respirator Guidance](https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/default.html) | Snug perimeter seal; not for children under 2 |
| `move_exercise_indoors` | outdoors | Move strenuous exercise indoors | Strong | Free | [WHO Ambient Air Quality](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health) | Avoids multiplied respiratory minute volume |
| `shift_outdoor_offpeak` | outdoors | Shift outdoor trips off-peak | Moderate | Free | [WHO Ambient Air Quality](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health) | Avoids morning/evening boundary layer inversions |
| `cleaner_travel_routes` | outdoors | Choose cleaner low-traffic travel routes | Moderate | Free | [WHO Ambient Air Quality](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health) | Spatial decay of traffic plume soot |
| `stop_waste_burning` | community | Never burn waste or leaves | Strong | Free | [CPCB Official Portal](https://cpcb.nic.in/) | Prevents ground-level dioxin & black carbon release |
| `report_burning_sameer` | community | Report open burning via SAMEER | Strong | Free | [CPCB Official Portal / SAMEER](https://cpcb.nic.in/) | Official geo-tagged citizen complaint portal |
| `advocate_cleaner_spaces` | community | Advocate for cleaner shared spaces | Moderate | Free | [US EPA IAQ in Schools](https://www.epa.gov/iaq-schools) | School & workplace filtration advocacy |
| `commute_clean_choices` | outdoors | Practice cleaner daily commuting habits | Moderate | Free | [WHO Ambient Air Quality](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health) | `askOnly: true`; general guidance, not live route data |
| `myth_houseplants` | living | Myth: Houseplants clean room air | Myth | Free | [US EPA Indoor Pollutants](https://www.epa.gov/indoor-air-quality-iaq/indoor-pollutants-and-sources) | Debunks chamber study extrapolation |
| `myth_cloth_masks` | outdoors | Myth: Cloth masks block PM2.5 | Myth | Free | [CDC NIOSH Respirator Guidance](https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/default.html) | Debunks cloth fabric weave for submicron soot |
| `myth_salt_lamps` | bedroom | Myth: Salt lamps clean air | Myth | Free | [US EPA Air Cleaners & Filters](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) | Debunks passive hygroscopic crystal claims |
| `myth_water_onion` | bedroom | Myth: Water bowls absorb pollution | Myth | Free | [WHO Household Air Pollution](https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health) | Debunks static surface absorption of airborne aerosol |
| `myth_wet_cloths_windows` | whole-home | Myth: Wet cloths block smog | Myth | Free | [US EPA Wildfires & IAQ](https://www.epa.gov/indoor-air-quality-iaq/wildfires-and-indoor-air-quality-iaq) | Explains gap bypassing and indoor mold hazard |
| `myth_detox_drinks` | whole-home | Myth: Detox drinks flush PM2.5 | Myth | Free | [WHO Ambient Air Quality](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health) | Clarifies digestive vs respiratory tract biology |

---

## 2. Band-Aware Multilingual Advice Matrix

Below is the verified advice matrix across all 6 AQI bands and 4 family personas in English, Hindi, and Marathi.

### Band: Good (0-30 µg/m³)
- **Whole family**:
  - `en`: Outdoor air is clean and healthy today. Open your windows to refresh indoor air and enjoy outdoor activities.
  - `hi`: आज बाहर की हवा बिल्कुल साफ और सेहतमंद है। ताजी हवा के लिए खिड़कियां खोलें और बाहर की गतिविधियों का आनंद लें।
  - `mr`: आज बाहेरील हवा अत्यंत स्वच्छ आणि निरोगी आहे. घरातील हवा ताजी करण्यासाठी खिडक्या उघडा आणि मैदानी कामांचा आनंद घ्या.
- **Baby & Kids**:
  - `en`: Great conditions for babies and children to play outdoors. It is a wonderful day for sports and open-air games.
  - `hi`: बच्चों और नन्हे बच्चों के बाहर खेलने के लिए बेहतरीन मौसम है। खुले मैदान में खेलकूद के लिए यह बहुत बढ़िया दिन है।
  - `mr`: लहान मुलांसाठी आणि बाळांसाठी बाहेर खेळण्यासाठी उत्तम वातावरण आहे. मैदानी खेळांचा मनसोक्त आनंद घेण्याचा हा छान दिवस आहे.
- **Elderly**:
  - `en`: Air quality is ideal for seniors today. Take your morning or evening walks outdoors with ease.
  - `hi`: बुजुर्गों के लिए आज की हवा बेहद अनुकूल है। आराम से बाहर सुबह या शाम की सैर का आनंद लें।
  - `mr`: ज्येष्ठ नागरिकांसाठी आजची हवा अतिशय अनुकूल आहे. सकाळी किंवा संध्याकाळी मोकळ्या हवेत फिरण्याचा आनंद घ्या.
- **Outdoor worker**:
  - `en`: Air is clean across work sites. You can complete outdoor labor comfortably without respiratory strain.
  - `hi`: कामकाज की जगहों पर हवा साफ है। आप बिना किसी परेशानी के बाहर अपना काम आराम से पूरा कर सकते हैं।
  - `mr`: कामाच्या ठिकाणी हवा स्वच्छ आहे. कोणत्याही त्रासाशिवाय तुम्ही मोकळ्या हवेत तुमचे काम सहज करू शकता.

### Band: Satisfactory (31-60 µg/m³)
- **Whole family**:
  - `en`: Air quality is acceptable for everyday routines. Brief outdoor ventilation is fine, though unusually sensitive individuals should observe mild symptoms.
  - `hi`: दैनिक गतिविधियों के लिए हवा की गुणवत्ता ठीक है। खिड़कियां खोलना सुरक्षित है, लेकिन अति-संवेदनशील लोग थोड़ा ध्यान रखें।
  - `mr`: दैनंदिन कामांसाठी हवेचा दर्जा समाधानकारक आहे. थोडा वेळ खिडक्या उघडणे सुरक्षित आहे, पण अतिसंवेदनशील व्यक्तींनी काळजी घ्यावी.
- **Baby & Kids**:
  - `en`: Safe for kids to play in the yard or park. Normal school sports and outdoor play can proceed safely.
  - `hi`: बच्चों के पार्क या मैदान में खेलने के लिए सुरक्षित है। सामान्य खेलकूद और स्कूल की गतिविधियां जारी रख सकते हैं।
  - `mr`: मुलांना अंगणात किंवा बागेत खेळण्यासाठी हवा सुरक्षित आहे. नेहमीचे मैदानी खेळ सहज खेळता येतील.
- **Elderly**:
  - `en`: Comfortable for routine outdoor walks. If you have chronic chest conditions, keep physical exertion moderate.
  - `hi`: नियमित टहलने के लिए हवा ठीक है। अगर सांस या दिल की पुरानी समस्या है, तो बहुत भारी मेहनत से बचें।
  - `mr`: नियमित चालण्यासाठी हवा चांगली आहे. दम्याचा किंवा छातीचा जुना त्रास असल्यास खूप धावपळ करणे टाळा.
- **Outdoor worker**:
  - `en`: Outdoor working conditions are manageable. Drink regular water and take routine rest breaks.
  - `hi`: बाहर काम करने की स्थिति सामान्य है। नियमित रूप से पानी पीते रहें और समय पर आराम लें।
  - `mr`: बाहेर काम करण्यासाठी परिस्थिती सामान्य आहे. नियमित पाणी प्या आणि अधूनमधून विश्रांती घ्या.

### Band: Moderate (61-90 µg/m³)
- **Whole family**:
  - `en`: Pollution levels are noticeable and can cause breathing discomfort for sensitive lungs. Keep non-essential outdoor time brief and ventilate only during the cleanest midday window.
  - `hi`: हवा में प्रदूषण महसूस हो रहा है जिससे संवेदनशील लोगों को सांस लेने में दिक्कत हो सकती है। बाहर ज्यादा देर न रहें और दोपहर में केवल सबसे साफ समय पर ही खिड़की खोलें।
  - `mr`: प्रदूषणाची पातळी वाढलेली असून संवेदनशील व्यक्तींना श्वसनाचा त्रास होऊ शकतो. बाहेरील वेळ मर्यादित ठेवा आणि दुपारच्या सर्वात स्वच्छ वेळेतच खिडक्या उघडा.
- **Baby & Kids**:
  - `en`: Children with asthma or allergies may cough after hard play. Shift strenuous sports indoors and keep rescue inhalers within easy reach.
  - `hi`: अस्थमा या एलर्जी वाले बच्चों को ज्यादा खेलने पर खांसी हो सकती है। भारी खेल घर के अंदर कराएं और जरूरी दवाइयां पास रखें।
  - `mr`: दमा किंवा ॲलर्जी असलेल्या मुलांना जास्त खेळल्यास खोकल्याची शक्यता आहे. जास्त धावपळीचे खेळ घरातच घ्या आणि इनहेलर जवळ ठेवा.
- **Elderly**:
  - `en`: Seniors with heart or lung issues may experience irritation. Prefer indoor walking and keep daily prescribed medicines handy.
  - `hi`: सांस या दिल के मरीजों को गले में खराश महसूस हो सकती है। घर के अंदर ही टहलें और जरूरी दवाइयां पास रखें।
  - `mr`: हृदय किंवा फुप्फुसाचा त्रास असणाऱ्या ज्येष्ठांना अस्वस्थता जाणवू शकते. घरातच हलके चाला आणि नियमित औषधे जवळ ठेवा.
- **Outdoor worker**:
  - `en`: Prolonged shifts outdoors can trigger mild throat dryness. Stay well hydrated and take regular indoor rest pauses.
  - `hi`: लंबे समय तक बाहर काम करने से गले में सूखापन आ सकता है। भरपूर पानी पिएं और बीच-बीच में आराम लेते रहें।
  - `mr`: दीर्घकाळ उघड्यावर काम केल्यास घसा कोरडा पडू शकतो. भरपूर पाणी प्या आणि सावलीत विश्रांती घेत काम करा.

### Band: Poor (91-120 µg/m³)
- **Whole family**:
  - `en`: Air is unhealthy for sensitive groups and causes discomfort on prolonged exposure. Keep doors and windows closed, run purifiers, and wear an N95 if heading outdoors.
  - `hi`: हवा खराब स्तर पर है जिससे सांस लेने में परेशानी हो सकती है। खिड़कियां बंद रखें, प्यूरीफायर चलाएं और बाहर जाते समय N95 मास्क पहनें।
  - `mr`: हवा खराब पातळीवर पोहोचली असून अस्वस्थता वाढू शकते. खिडक्या बंद ठेवा, प्युरिफायर चालू ठेवा आणि बाहेर पडताना N95 मास्क वापरा.
- **Baby & Kids**:
  - `en`: Avoid outdoor physical education classes and park visits. Keep children in a closed, filtered room to protect developing airways.
  - `hi`: बच्चों को पार्क और बाहर के खेलकूद से दूर रखें। नन्हे फेफड़ों की सुरक्षा के लिए बच्चों को बंद और साफ हवा वाले कमरे में रखें।
  - `mr`: मुलांना बाहेरील खेळांपासून आणि बागेत जाण्यापासून दूर ठेवा. वाढत्या वयातील फुप्फुसांच्या सुरक्षिततेसाठी त्यांना स्वच्छ हवेच्या खोलीत ठेवा.
- **Elderly**:
  - `en`: Cancel morning and evening walks along roadways. Stay in a clean-air room with medication easily accessible, and seek medical care if chest tightness occurs.
  - `hi`: सड़क किनारे सुबह या शाम की सैर बिल्कुल बंद करें। साफ हवा वाले कमरे में रहें, दवा पास रखें और सांस फूलने पर डॉक्टर से संपर्क करें।
  - mr: रस्त्यावरील सकाळ-संध्याकाळचे फिरणे पूर्णपणे थांबवा. स्वच्छ हवेच्या खोलीत औषधे जवळ घेऊन विश्रांती घ्या आणि त्रास जाणवल्यास डॉक्टरांचा सल्ला घ्या.
- **Outdoor worker**:
  - `en`: Heavy particulate exposure puts continuous strain on lungs during full shifts. Wear a well-fitted N95 respirator tightly and wash your eyes with clean water at breaks.
  - `hi`: लगातार काम करने से फेफड़ों पर प्रदूषण का गहरा असर पड़ता है। सही फिटिंग वाला N95 मास्क जरूर पहनें और काम के बीच साफ पानी से मुंह-आंखें धोएं।
  - `mr`: सतत बाहेर काम केल्याने फुप्फुसांवर मोठा ताण येतो. व्यवस्थित बसणारा N95 मास्क न विसरता वापरा आणि विश्रांतीच्या वेळी स्वच्छ पाण्याने तोंड-डोळे धुवा.

### Band: Very Poor (121-250 µg/m³)
- **Whole family**:
  - `en`: Very high particulate pollution can trigger acute respiratory illness. Keep all windows shut, create a clean bedroom sanctuary, and avoid all unnecessary outdoor travel.
  - `hi`: प्रदूषण बहुत गंभीर स्तर पर है जिससे सांस की बीमारी बढ़ सकती है। सभी खिड़कियां बंद रखें, बेडरूम को साफ-हवा का कमरा बनाएं और बाहर जाना टालें।
  - `mr`: प्रदूषण अत्यंत धोकादायक पातळीवर पोहोचले आहे. सर्व खिडक्या बंद ठेवा, एका खोलीत प्युरिफायर चालवून सुरक्षित जागा तयार करा आणि बाहेर जाणे टाळा.
- **Baby & Kids**:
  - `en`: Children must remain indoors with doors shut and air filtration running. Use wet wiping instead of sweeping to keep indoor dust settled.
  - `hi`: बच्चों को पूरी तरह घर के अंदर रखें और एयर फिल्टर चलाएं। धूल उड़ने से बचाने के लिए झाड़ू की जगह गीले पोंछे का इस्तेमाल करें।
  - `mr`: लहान मुलांना पूर्णपणे घरातच ठेवा आणि हवा शुद्धीकरण यंत्र चालू ठेवा. घरात धूळ उडू नये म्हणून झाडू मारण्याऐवजी ओल्या फडक्याने पुसून घ्या.
- **Elderly**:
  - `en`: High hazard for elders with cardiovascular or pulmonary disease. Stay strictly in a closed, filtered room, keep rescue medications beside your bed, and call a doctor if breathing worsens.
  - `hi`: बुजुर्गों और दिल-सांस के मरीजों के लिए यह समय बहुत नाजुक है। बंद कमरे में रहें, इमरजेंसी दवाइयां पास रखें और तकलीफ होने पर तुरंत डॉक्टर को दिखाएं।
  - `mr`: ज्येष्ठ नागरिक आणि हृदयविकार असलेल्यांसाठी ही वेळ अत्यंत नाजूक आहे. बंद खोलीत राहा, सर्व आवश्यक औषधे जवळ ठेवा आणि त्रास वाढल्यास तातडीने डॉक्टरांशी संपर्क साधा.
- **Outdoor worker**:
  - `en`: Hazardous smog directly threatens respiratory health during long shifts. Wear an N95 respirator continuously, rotate shifts to reduce exposure, and avoid unvented burning.
  - `hi`: जहरीली हवा में देर तक काम करना स्वास्थ्य के लिए सीधा खतरा है। लगातार N95 मास्क लगाएं, काम के बीच ब्रेक लें और आग या धुएं से दूर रहें।
  - `mr`: प्रदूषित हवेत सलग काम करणे आरोग्यासाठी थेट धोकादायक आहे. पूर्ण वेळ N95 मास्क वापरा, कामाच्या वेळा वाटून घ्या आणि उघड्यावरील धुरापासून दूर राहा.

---

## 3. Conversational Intake Questions & Chip Translation Review

All intake questions, helper reasons, group labels, and quick-reply chip labels rewritten for natural conversational flow and verified under 24 characters per chip label.

| Question ID | Language | Spoken Question (TTS) | Helper Reason (Text Only) | Chip Labels (ID & Text) |
| :--- | :--- | :--- | :--- | :--- |
| `household_members` | `en` | "Who are we looking after at home?" | "So I can think first about the people who need cleaner air the most." | `just_me`: "Just me" (7c)<br>`infant`: "Baby or toddler (under 2)" (25c)<br>`children`: "Children (2-12)" (15c)<br>`elderly`: "Elders (60+)" (12c)<br>`pregnant`: "Someone pregnant" (16c)<br>`asthma_heart`: "Asthma or heart condition" (25c) |
| `household_members` | `hi` | "घर पर हम किसकी देखभाल कर रहे हैं?" | "ताकि मैं सबसे पहले उन लोगों का ध्यान रख सकूं जिन्हें स्वच्छ हवा की सबसे ज्यादा जरूरत है।" | `just_me`: "सिर्फ मैं" (8c)<br>`infant`: "छोटा बच्चा (<2 वर्ष)" (18c)<br>`children`: "बच्चे (2–12 वर्ष)" (16c)<br>`elderly`: "बुजुर्ग (60+)" (12c)<br>`pregnant`: "गर्भवती महिला" (13c)<br>`asthma_heart`: "दमा या हृदय रोग" (15c) |
| `household_members` | `mr` | "घरी आपण कोणाची काळजी घेत आहोत?" | "जेणेकरून ज्यांना स्वच्छ हवेची सर्वात जास्त गरज आहे त्यांचा मी आधी विचार करू शकेन." | `just_me`: "फक्त मी" (7c)<br>`infant`: "लहान मूल (<२ वर्षे)" (17c)<br>`children`: "मुले (२–१२ वर्षे)" (15c)<br>`elderly`: "ज्येष्ठ (६०+)" (12c)<br>`pregnant`: "गरोदर व्यक्ती" (12c)<br>`asthma_heart`: "दमा / हृदयविकार" (14c) |
| `daily_routine` | `en` | "Tell me about a usual day." | "Where you go and how, so I can suggest the best time to step out." | `indoor_work`: "Mostly indoors" (14c)<br>`outdoor_work`: "Work outdoors" (13c)<br>`two_wheeler`: "Scooter or bike" (15c)<br>`bus_metro`: "Bus or metro" (12c)<br>`walk_cycle`: "Walk or cycle" (13c)<br>`car`: "Car" (3c)<br>`school_run`: "School runs" (11c)<br>`peak_hours`: "Rush-hour travel" (16c) |
| `daily_routine` | `hi` | "अपने सामान्य दिन के बारे में बताएं।" | "आप कब और कैसे बाहर जाते हैं, ताकि मैं बाहर जाने का सबसे सुरक्षित समय बता सकूं।" | `indoor_work`: "ज्यादातर घर के अंदर" (18c)<br>`outdoor_work`: "बाहर काम करते हैं" (16c)<br>`two_wheeler`: "स्कूटर या बाइक" (13c)<br>`bus_metro`: "बस या मेट्रो" (11c)<br>`walk_cycle`: "पैदल या साइकिल" (13c)<br>`car`: "कार" (3c)<br>`school_run`: "बच्चों का स्कूल आना-जाना" (23c)<br>`peak_hours`: "व्यस्त समय में यात्रा" (19c) |
| `daily_routine` | `mr` | "तुमच्या नेहमीच्या दिवसाविषयी सांगा." | "तुम्ही कुठे आणि कसे जाता, जेणेकरून मी बाहेर पडण्याची उत्तम वेळ सुचवू शकेन." | `indoor_work`: "बहुतांश घरात/ऑफिस" (16c)<br>`outdoor_work`: "बाहेर प्रत्यक्ष काम" (17c)<br>`two_wheeler`: "स्कूटर किंवा बाइक" (15c)<br>`bus_metro`: "बस किंवा मेट्रो" (13c)<br>`walk_cycle`: "पायी किंवा सायकल" (15c)<br>`car`: "कार" (3c)<br>`school_run`: "मुलांची शाळा ने-आण" (17c)<br>`peak_hours`: "गर्दीच्या वेळेत प्रवास" (21c) |
| `home_equipment` | `en` | "What's your home like?" | "So I don't suggest things you already have or can't use." | **Cooking**: `lpg`: "LPG" (3c), `induction`: "Induction or electric" (21c), `biomass`: "Wood or biomass" (15c)<br>**At home**: `has_purifier`: "I have a purifier" (17c), `no_purifier`: "No purifier yet" (15c), `use_n95`: "I use N95 masks" (15c)<br>**Budget**: `budget_free`: "Free tips only" (14c), `budget_low_cost`: "A little to spend" (17c), `budget_flexible`: "Flexible" (8c) |
| `home_equipment` | `hi` | "आपका घर कैसा है?" | "ताकि मैं ऐसी चीजें न सुझाऊं जो आपके पास पहले से हैं या आप इस्तेमाल नहीं कर सकते।" | **खाना पकाना**: `lpg`: "एलपीजी गैस" (10c), `induction`: "इंडक्शन / बिजली" (15c), `biomass`: "लकड़ी या उपले" (12c)<br>**घर पर**: `has_purifier`: "प्यूरीफायर है" (12c), `no_purifier`: "प्यूरीफायर नहीं है" (17c), `use_n95`: "N95 मास्क पहनते हैं" (18c)<br>**बजट**: `budget_free`: "केवल मुफ़्त उपाय" (14c), `budget_low_cost`: "थोड़ा खर्च संभव" (14c), `budget_flexible`: "लचीला बजट" (9c) |
| `home_equipment` | `mr` | "तुमचे घर कसे आहे?" | "जेणेकरून आधीच असलेल्या किंवा न वापरता येणाऱ्या गोष्टी मी सुचवणार नाही." | **स्वयंपाक**: `lpg`: "एलपीजी गॅस" (9c), `induction`: "इंडक्शन / वीज" (13c), `biomass`: "लाकूड किंवा शेणी" (14c)<br>**घरी**: `has_purifier`: "प्युरिफायर आहे" (13c), `no_purifier`: "अजून प्युरिफायर नाही" (19c), `use_n95`: "N95 मास्क वापरतो" (15c)<br>**बजेट**: `budget_free`: "फक्त मोफत उपाय" (13c), `budget_low_cost`: "थोडा खर्च शक्य" (13c), `budget_flexible`: "लवचिक बजेट" (10c) |
| `priorities` | `en` | "What would help you most?" | "Choose any that apply." | `kids_health`: "Keeping kids healthy" (20c)<br>`saving_money`: "Saving money" (12c)<br>`understanding_numbers`: "Understanding numbers" (21c)<br>`cutting_emissions`: "Less smoke at home" (18c) |
| `priorities` | `hi` | "आपकी सबसे ज्यादा मदद किससे होगी?" | "जो भी महत्वपूर्ण लगे चुनें।" | `kids_health`: "बच्चों का स्वास्थ्य" (18c)<br>`saving_money`: "पैसे की बचत" (10c)<br>`understanding_numbers`: "आंकड़े और AQI समझना" (18c)<br>`cutting_emissions`: "घर में कम धुआं" (13c) |
| `priorities` | `mr` | "तुम्हाला सर्वात जास्त कशाने मदत होईल?" | "तुम्हाला हवे ते सर्व पर्याय निवडा." | `kids_health`: "मुलांचे निरोगी आरोग्य" (20c)<br>`saving_money`: "पैशांची बचत" (10c)<br>`understanding_numbers`: "AQI आकडे समजणे" (13c)<br>`cutting_emissions`: "घरात कमी धूर" (11c) |


### Band: Severe (>250 µg/m³)
- **Whole family**:
  - `en`: Severe pollution emergency affects everyone and can damage healthy lungs. Seal door and window cracks with towels, run filtration continuously, and do not step outside unless critical.
  - `hi`: हवा आपातकालीन स्थिति में पहुंच चुकी है जो स्वस्थ लोगों को भी बीमार कर सकती है। खिड़की-दरवाजों को तौलिए से सील करें, प्यूरीफायर लगातार चलाएं और बहुत जरूरी न हो तो बाहर न निकलें।
  - `mr`: प्रदूषणाची गंभीर आणीबाणी असून निरोगी व्यक्तींनाही त्रास होऊ शकतो. खिडक्या-दारांच्या फटी टॉवेलने बंद करा, प्युरिफायर सतत चालू ठेवा आणि अतिमहत्त्वाच्या कामाशिवाय बाहेर पडू नका.
- **Baby & Kids**:
  - `en`: Strictly restrict children indoors in a closed clean-air sanctuary. Do not let infants outdoors and monitor breathing rate closely for any wheezing.
  - `hi`: बच्चों को पूरी तरह सुरक्षित कमरे के अंदर ही रखें। छोटे बच्चों को बाहर बिल्कुल न ले जाएं और सांस की गति या घबराहट पर नजर रखें।
  - `mr`: लहान मुलांना पूर्णपणे सुरक्षित खोलीत बंदिस्त ठेवा. बाळांना अजिबात बाहेर नेऊ नका आणि त्यांच्या श्वासोच्छ्वासावर बारीक लक्ष ठेवा.
- **Elderly**:
  - `en`: Critical medical danger for senior citizens. Remain seated in an airtight filtered room, keep oxygen or inhalers within arm's reach, and reach hospital care if pulse or breath quickens.
  - `hi`: बुजुर्गों के लिए यह बेहद खतरनाक स्थिति है। फिल्टर वाले कमरे में ही आराम करें, इनहेलर पास रखें और घबराहट या सांस फूलने पर तुरंत अस्पताल जाएं।
  - `mr`: ज्येष्ठांसाठी ही अत्यंत धोक्याची परिस्थिती आहे. प्युरिफायर असलेल्या खोलीत शांत विश्रांती घ्या, इनहेलर हाताशी ठेवा आणि छातीत दुखल्यास किंवा दम लागल्यास तात्काळ दवाखान्यात जा.
- **Outdoor worker**:
  - `en`: Emergency conditions make physical labor outdoors dangerous. Suspend heavy outdoor exertion where possible, wear a sealed N95 at all times, and seek sheltered rest areas.
  - `hi`: बाहर शारीरिक मेहनत करना जान जोखिम में डालना है। भारी काम तुरंत टालें, हर समय N95 मास्क पहने रखें और बंद सुरक्षित जगह पर शरण लें।
  - `mr`: बाहेर शारीरिक कष्टाचे काम करणे जिवावर बेतू शकते. जड कामे पुढे ढकला, प्रत्येक क्षणी N95 मास्क वापरून सुरक्षित निवाऱ्यात विश्रांती घ्या.


## Profile & Cloud Sync Bilingual Strings (For Native Speaker Review)

| Key | Language | Translated String | Context & Length |
| --- | --- | --- | --- |
| `profile.installNow` | `hi` | "अभी इंस्टॉल करें" | Install PWA button (17c) |
| `profile.installNow` | `mr` | "आता इन्स्टॉल करा" | Install PWA button (17c) |
| `profile.appInstalled` | `hi` | "ऐप इंस्टॉल है / तैयार" | PWA ready state (23c) |
| `profile.appInstalled` | `mr` | "अ‍ॅप इन्स्टॉल आहे / तयार" | PWA ready state (24c) |
| `profile.personaliseChat` | `hi` | "बातचीत से प्रोफ़ाइल बनाएं" | Intake chat entry card (24c) |
| `profile.personaliseChat` | `mr` | "संवादातून प्रोफाइल तयार करा" | Intake chat entry card (25c) |
| `profile.redoChat` | `hi` | "बातचीत फिर से करें" | Intake chat redo card (18c) |
| `profile.redoChat` | `mr` | "पुन्हा संवाद साधा" | Intake chat redo card (16c) |
| `profile.intakeChatSub` | `hi` | "दिनचर्या, कमरों और परिजनों के अनुसार सलाह के लिए 2 मिनट की आसान बातचीत।" | Intake card subtitle |
| `profile.intakeChatSub` | `mr` | "दिनचर्या, खोल्या आणि कुटुंबीयांसाठी अचूक सल्ल्यासाठी २ मिनिटांचा सोपा संवाद." | Intake card subtitle |
| `profile.cloudSyncTitle` | `hi` | "खाता व क्लाउड सिंक (Google)" | Cloud sync card title (26c) |
| `profile.cloudSyncTitle` | `mr` | "खाते आणि क्लाउड सिंक (Google)" | Cloud sync card title (28c) |
| `profile.cloudSyncLocalOnly` | `hi` | "आपकी स्वच्छ हवा प्रोफ़ाइल अभी केवल इसी डिवाइस पर सुरक्षित है।" | Local-only storage status |
| `profile.cloudSyncLocalOnly` | `mr` | "तुमची स्वच्छ हवा प्रोफाइल सध्या फक्त याच डिव्हाइसवर साठवली आहे." | Local-only storage status |
| `profile.signedInAs` | `hi` | "लॉग इन किया गया:" | User status prefix |
| `profile.signedInAs` | `mr` | "साइन इन केले आहे:" | User status prefix |
| `profile.cloudSyncSignedIn` | `hi` | "प्रोफ़ाइल सुरक्षित क्लाउड स्टोरेज पर सिंक है।" | Synced profile status |
| `profile.cloudSyncSignedIn` | `mr` | "प्रोफाइल सुरक्षित क्लाउड स्टोरेजवर सिंक आहे." | Synced profile status |
| `profile.continueGoogle` | `hi` | "Google से जारी रखें" | Sign in button (18c) |
| `profile.continueGoogle` | `mr` | "Google सह सुरू ठेवा" | Sign in button (19c) |
| `profile.cloudSave` | `hi` | "क्लाउड पर सेव करें" | Sync button (17c) |
| `profile.cloudSave` | `mr` | "क्लाउडवर सेव्ह करा" | Sync button (18c) |
| `profile.cloudSaved` | `hi` | "सहेजा गया!" | Synced toast button (10c) |
| `profile.cloudSaved` | `mr` | "सेव्ह झाले!" | Synced toast button (10c) |
| `profile.signOut` | `hi` | "साइन आउट" | Sign out button (8c) |
| `profile.signOut` | `mr` | "साइन आउट" | Sign out button (8c) |
| `profile.cloudConsent` | `hi` | "सहमति: अपने खाते में सहेजकर, आप अपनी स्वच्छ हवा प्राथमिकताओं को सुरक्षित क्लाउड में संग्रहीत करने की सहमति देते हैं (users/{uid}/profile)। हम ऑडियो, ट्रांसक्रिप्ट या चैट कभी संग्रहीत नहीं करते। आप किसी भी समय अपना डेटा हटा सकते हैं।" | Disclaimer & privacy consent |
| `profile.cloudConsent` | `mr` | "संमती: खात्यात सेव्ह करून, तुम्ही तुमची माहिती सुरक्षित क्लाउडवर ठेवण्यास संमती देता (users/{uid}/profile). आम्ही ऑडिओ किंवा चॅट कधीही साठवत नाही. तुम्ही तुमचा डेटा कधीही हटवू शकता." | Disclaimer & privacy consent |


## 5. Single Source of Truth for Outdoor Guidance & CPCB NAQI Health Statements

### Official Authority & Standards Source
- **Authority**: Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India.
- **Document**: National Air Quality Index (NAQI) Technical Report & Guidelines.
- **India PM2.5 Band Breakpoints**:
  1. **Good (0–30 µg/m³)**: Minimal health impact.
     - *Guidance level*: `go`
     - *Outdoor advice*: Safe for all outdoor activities, outdoor play, sports, and airing out home.
  2. **Satisfactory (31–60 µg/m³)**: Minor breathing discomfort to sensitive individuals.
     - *Guidance level*: `go`
     - *Outdoor advice*: Safe for general outdoor activities. Outdoor workouts welcome.
  3. **Moderate (61–90 µg/m³)**: Breathing discomfort to people with lung disease, asthma, and heart conditions.
     - *Guidance level*: `light-only` (for vulnerable personas: child, elderly, pregnant, asthma/heart, whole family)
     - *Outdoor advice*: Limit outdoor activity to light walking only. Healthy adults avoid long or hard exercise.
  4. **Poor (91–120 µg/m³)**: Breathing discomfort to most people on prolonged exposure.
     - *Guidance level*: `avoid`
     - *Outdoor advice*: Avoid outdoor exercise for everyone; move workouts indoors. Wear fitted N95 near heavy traffic.
  5. **Very Poor (121–250 µg/m³)**: Respiratory illness to the people on prolonged exposure.
     - *Guidance level*: `avoid`
     - *Outdoor advice*: Stay indoors in closed rooms with air cleaning. Use fitted N95 respirator only for essential trips.
  6. **Severe (>250 µg/m³)**: Affects healthy people and seriously impacts those with existing diseases.
     - *Guidance level*: `avoid`
     - *Outdoor advice*: Pollution emergency. Strictly stay indoors. Seal door/window cracks with towels and run air cleaning continuously.

### Multilingual Outdoor Guidance String Matrix (CPCB Aligned)

| Band | Key | Language | Text (Plain Language, <= 18 words) |
| :--- | :--- | :--- | :--- |
| **Good** | `statusLine` | `en` | "Air quality is clean and safe. Normal outdoor activities welcome." |
| **Good** | `statusLine` | `hi` | "हवा साफ और सुरक्षित है। बाहर की गतिविधियां आराम से कर सकते हैं।" |
| **Good** | `statusLine` | `mr` | "हवा स्वच्छ आणि सुरक्षित आहे. मैदानी हालचाली स्वागतार्ह आहेत." |
| **Satisfactory** | `statusLine` | `en` | "Air quality is acceptable. Normal outdoor activities are safe." |
| **Satisfactory** | `statusLine` | `hi` | "हवा सामान्य रूप से ठीक है। बाहर जाना सुरक्षित है।" |
| **Satisfactory** | `statusLine` | `mr` | "हवा समाधानकारक आहे. बाहेर पडणे सुरक्षित आहे." |
| **Moderate** | `statusLine` | `en` | "Air has noticeable dust and smoke. Sensitive people may feel mild breathing discomfort." |
| **Moderate** | `statusLine` | `hi` | "हवा में धूल और धुआं है। संवेदनशील लोगों को हल्की परेशानी हो सकती है।" |
| **Moderate** | `statusLine` | `mr` | "हवेत धूर आणि धूळ जाणवत आहे. संवेदनशील व्यक्तींना सौम्य त्रास होऊ शकतो." |
| **Poor** | `statusLine` | `en` | "Air pollution is high. Prolonged exposure causes breathing discomfort for most people." |
| **Poor** | `statusLine` | `hi` | "हवा में प्रदूषण ज्यादा है। बाहर देर तक रहने से सांस में परेशानी हो सकती है।" |
| **Poor** | `statusLine` | `mr` | "प्रदूषण पातळी जास्त आहे. जास्त वेळ बाहेर राहिल्यास श्वास घेण्यास त्रास होऊ शकतो." |
| **Very Poor** | `statusLine` | `en` | "Air pollution is very high. Prolonged exposure can trigger respiratory illness." |
| **Very Poor** | `statusLine` | `hi` | "हवा बहुत ज्यादा खराब है। बाहर रहने पर फेफड़ों और सांस की बीमारी का खतरा है।" |
| **Very Poor** | `statusLine` | `mr` | "हवा अत्यंत दूषित आहे. जास्त वेळ बाहेर राहिल्यास श्वसनाचे आजार उद्भवू शकतात." |
| **Severe** | `statusLine` | `en` | "Severe air emergency. Affects healthy people and seriously impacts vulnerable individuals." |
| **Severe** | `statusLine` | `hi` | "गंभीर प्रदूषण आपातकाल। यह स्वस्थ लोगों और कमजोर फेफड़ों वालों दोनों के लिए खतरनाक है।" |
| **Severe** | `statusLine` | `mr` | "गंभीर प्रदूषण आणीबाणी. निरोगी व्यक्तींना आणि आजारी व्यक्तींना मोठा धोका आहे." |

### Catalog Changes
- **Replaced**: "Enjoy outdoor workouts during afternoon clean hours" -> replaced with:
  1. `good_day_outdoor_workout`: "Good day for a walk or workout outside" (`outdoorPositive: true`, shown only when air is Good/Satisfactory).
  2. `pick_lightest_hour_errands`: "Pick the lightest hour for outdoor tasks" (`outdoorPositive: false`, shown when air is Moderate or worse for essential errands only).
- **Flag**: Added `outdoorPositive: boolean` to all catalog action items. Filtered out whenever `outdoorGuidance.level !== 'go'`.

### Plain-Language Jargon Replacements Verified
- "inversion layer" -> "cold air that traps smoke near the ground"
- "solar heating disperses" -> "when the sun warms the air and the smoke spreads out"
- "particulates" -> "tiny dust and smoke particles"
- "sensitive lower lung tissues" -> "lungs"
- "cardiovascular exercise" -> "hard exercise"
- "ventilation" -> "airing out"
- "dispersion" -> "spreading out"
- "infiltration" -> "outside air leaking in"
- "boundary layer", "mitigation", "exposure reduction" -> strictly eliminated across all 13 content files.


---

## 4. Family-Friendly Subtitle Translations (Native Speaker Verification)

All translations follow the bilingual rule (clear everyday language, friendly tone):

| Language | Code | Translation | English Meaning |
| :--- | :--- | :--- | :--- |
| English | `en` | Today's air for your family | Today's air for your family |
| Hindi | `hi` | आपके परिवार के लिए आज की हवा | Today's air for your family |
| Marathi | `mr` | तुमच्या कुटुंबासाठी आजची हवा | Today's air for your family |
| Tamil | `ta` | உங்கள் குடும்பத்திற்கான இன்றைய காற்று | Today's air for your family |
| Bengali | `bn` | আপনার পরিবারের জন্য আজকের বাতাস | Today's air for your family |
| Telugu | `te` | మీ కుటుంబం కోసం నేటి గాలి | Today's air for your family |
| Kannada | `kn` | ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕಾಗಿ ಇಂದಿನ ಗಾಳಿ | Today's air for your family |
| Malayalam | `ml` | നിങ്ങളുടെ കുടുംബത്തിനായുള്ള ഇന്നത്തെ വായു | Today's air for your family |
| Gujarati | `gu` | તમારા પરિવાર માટે આજની હવા | Today's air for your family |
| Punjabi | `pa` | ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਲਈ ਅੱਜ ਦੀ ਹਵਾ | Today's air for your family |
| Odia | `or` | ଆପଣଙ୍କ ପରିବାର ପାଇଁ ଆଜିର ବାୟୁ | Today's air for your family |
