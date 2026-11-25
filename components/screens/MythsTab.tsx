'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { MythDetailModal } from '../care/MythDetailModal';
import { MYTH_ITEMS, MythCategory, MythItem, getMythField } from '@/data/myths';
import {
  HeartPulse,
  PhoneCall,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export { type MythCategory, type MythItem } from '@/data/myths';

const EMERGENCY_SIGNS: { en: string; hi: string; mr: string; bn?: string; ta?: string; te?: string }[] = [
  {
    en: 'Stridor or high-pitched wheezing at rest',
    hi: 'आराम करते समय भी सांस में सीटी जैसी तेज आवाज (स्ट्रिडर)',
    mr: 'विश्रांतीच्या वेळीही श्वास घेताना शिटीसारखा आवाज येणे',
    bn: 'বিশ্রামের সময়ও শ্বাস নিতে গিয়ে বাঁশির মতো শব্দ হওয়া',
    ta: 'ஓய்வெடுக்கும் போதும் மூச்சுத்திணறல் அல்லது சீழ்க்கை ஒலி',
    te: 'విశ్రాంతి తీసుకుంటున్నప్పుడు కూడా శ్వాసలో పిల్లికూతలు రావడం',
  },
  {
    en: 'Inability to speak in full sentences without gasping',
    hi: 'बिना हांफे एक पूरा वाक्य न बोल पाना',
    mr: 'धाप न लागता पूर्ण वाक्यात बोलता न येणे',
    bn: 'দম না নিয়ে একটি সম্পূর্ণ বাক্য বলতে না পারা',
    ta: 'மூச்சு வாங்காமல் முழு வாக்கியங்களில் பேச முடியாமை',
    te: 'ఆగకుండా పూర్తి వాక్యాలు మాట్లాడలేకపోవడం',
  },
  {
    en: 'Bluish tint on lips, fingernails, or tongue',
    hi: 'होठों, नाखूनों या जीभ का नीला या बैंगनी पड़ना',
    mr: 'ओठ, नखे किंवा जीभ निळसर पडणे',
    bn: 'ঠোঁট, নখ বা জিহ্বায় নীলচে ভাব দেখা দেওয়া',
    ta: 'உதடுகள், விரல் நகங்கள் அல்லது நாக்கில் நீல நிற மாற்றம்',
    te: 'పెదవులు, గోర్లు లేదా నాలుక నీలి రంగులోకి మారడం',
  },
  {
    en: 'Chest heaviness, severe pressure, or acute pain',
    hi: 'छाती में भारीपन, तेज दबाव या तेज दर्द',
    mr: 'छातीत जडपणा, तीव्र दाब किंवा तीव्र वेदना',
    bn: 'বুকে ভারী ভাব, প্রচণ্ড চাপ বা তীব্র ব্যথা',
    ta: 'நெஞ்சு பாரம், கடுமையான அழுத்தம் அல்லது கடுமையான வலி',
    te: 'ఛాతీలో బరువు, తీవ్రమైన ఒత్తిడి లేదా నొప్పి',
  },
  {
    en: 'Skin sucking in around ribs or collarbone',
    hi: 'सांस लेते समय पसलियों या गर्दन के पास त्वचा का अंदर धंसना',
    mr: 'श्वास घेताना बरगड्या किंवा गळ्याभोवतीची त्वचा आत खेचली जाणे',
    bn: 'শ্বাস নেওয়ার সময় পাঁজরের চামড়া ভেতরের দিকে দেবে যাওয়া',
    ta: 'சுவாசிக்கும் போது விலா எலும்புகள் அல்லது கழுத்து எலும்பு அருகே தோல் உள்வாங்குதல்',
    te: 'శ్వాస తీసుకునేటప్పుడు పక్కటెముకల వద్ద చర్మం లోపలికి లాగడం',
  },
  {
    en: 'Sudden dizziness, confusion, or severe lethargy',
    hi: 'अचानक चक्कर आना, घबराहट, बेहोशी या अत्यधिक सुस्ती',
    mr: 'अचानक चक्कर येणे, गोंधळ उडणे किंवा अतिशय थकवा येणे',
    bn: 'হঠাৎ মাথা ঘোরা, বিভ্রান্তি বা প্রচণ্ড অলসতা দেখা দেওয়া',
    ta: 'திடீர் தலைசுற்றல், குழப்பம் அல்லது கடுமையான சோர்வு',
    te: 'అకస్మాత్తుగా మైకం రావడం, అయోమయం లేదా తీవ్రమైన నిస్సత్తువ',
  },
];

export function MythsTab() {
  const { profile } = useApp();
  const lang = profile.language;
  const isEn = lang === 'en';
  const [selectedCategory, setSelectedCategory] = useState<MythCategory>('all');
  const [selectedModalMyth, setSelectedModalMyth] = useState<MythItem | null>(null);

  const filterChips: { id: MythCategory; key: string; label: string }[] = [
    { id: 'all', key: 'learn.filters.all', label: 'All' },
    { id: 'masks', key: 'learn.filters.masks', label: 'Masks' },
    { id: 'indoor', key: 'learn.filters.indoor', label: 'Indoor air' },
    { id: 'cooking', key: 'learn.filters.cooking', label: 'Cooking' },
  ];

  const filteredMyths =
    selectedCategory === 'all'
      ? MYTH_ITEMS
      : MYTH_ITEMS.filter((m) => m.category === selectedCategory);

  const mythsSubtitle = isEn
    ? 'Peer-reviewed evidence on common winter smog claims.'
    : lang === 'hi'
    ? 'सर्दियों के प्रदूषण व स्मॉग से जुड़े सामान्य दावों का वैज्ञानिक सच।'
    : lang === 'mr'
    ? 'हिवाळ्यातील धुरक्याशी संबंधित गैरसमज आणि त्यांचे वैज्ञानिक सत्य.'
    : lang === 'bn'
    ? 'শীতকালীন ধোঁয়াশা সম্পর্কিত প্রচলিত ভুল ধারণা ও বৈজ্ঞানিক সত্য।'
    : lang === 'ta'
    ? 'குளிர்கால காற்று மாசுபாடு பற்றிய கட்டுக்கதைகளும் அறிவியல் உண்மைகளும்.'
    : lang === 'te'
    ? 'శీతాకాలపు పొగమంచుకు సంబంధించిన అపోహలు మరియు శాస్త్రీయ నిజాలు.'
    : 'सर्दियों के प्रदूषण व स्मॉग से जुड़े सामान्य दावों का वैज्ञानिक सच।';

  const mythBadgeText = isEn
    ? 'Myth'
    : lang === 'hi'
    ? 'भ्रम (Myth)'
    : lang === 'mr'
    ? 'गैरसमज (Myth)'
    : lang === 'bn'
    ? 'ভুল ধারণা (Myth)'
    : lang === 'ta'
    ? 'கட்டுக்கதை (Myth)'
    : lang === 'te'
    ? 'అపోహ (Myth)'
    : 'भ्रम (Myth)';

  return (
    <div className="w-full space-y-6 py-1">
      {/* 1. WHEN TO GET HELP (Prominent Red-Tinted Card, Near Top) */}
      <section
        className="bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 rounded-card p-4 sm:p-5 shadow-soft space-y-3"
        aria-labelledby="emergency-heading"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <h2 id="emergency-heading" className="text-base sm:text-lg font-semibold tracking-tight">
              <Bi k="learn.emergency.title" layout="plain" />
            </h2>
          </div>

          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-current" />
            <span><Bi k="learn.emergency.call112" layout="plain" /></span>
          </a>
        </div>

        <p className="text-xs text-rose-950/85 dark:text-rose-200/90 leading-relaxed font-normal">
          <Bi k="learn.emergency.subtitle" layout="plain" />
        </p>

        {/* Warning signs: compact 2-column grid in regional languages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {EMERGENCY_SIGNS.map((sign, i) => {
            const localizedSign = isEn
              ? sign.en
              : lang === 'hi'
              ? sign.hi
              : lang === 'mr'
              ? sign.mr
              : lang === 'bn'
              ? sign.bn || sign.hi
              : lang === 'ta'
              ? sign.ta || sign.hi
              : lang === 'te'
              ? sign.te || sign.hi
              : sign.hi;

            return (
              <div
                key={i}
                className="p-2 sm:p-2.5 rounded-lg bg-white/90 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 text-xs sm:text-sm font-medium text-rose-950 dark:text-rose-100 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span>{localizedSign}</span>
                  {!isEn && (
                    <span className="text-[11px] text-muted opacity-80 font-normal">{sign.en}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-rose-800/80 dark:text-rose-300/80 font-medium pt-1">
          <Bi k="learn.emergency.helplineNote" layout="plain" />
        </div>
      </section>

      {/* 2. MYTHS SECTION */}
      <section className="space-y-3" aria-labelledby="myths-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="myths-heading" className="text-base sm:text-lg font-semibold text-foreground">
              <Bi k="learn.mythBusters" en="Myth Busters" layout="plain" />
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              {mythsSubtitle}
            </p>
          </div>

          {/* Filter Chips Row (All, Masks, Indoor air, Cooking) - Wraps on mobile, no horizontal scroll */}
          <div
            className="flex flex-wrap items-center gap-1.5 py-1 relative"
            role="tablist"
            aria-label="Filter myths"
          >
            {filterChips.map((chip) => {
              const isSelected = selectedCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'text-white border-teal-accent shadow-xs'
                      : 'bg-card text-muted hover:text-foreground border-card-border hover:bg-card-subtle'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="myths-category-pill"
                      className="absolute inset-0 rounded-full bg-teal-accent -z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    <Bi k={chip.key} en={chip.label} layout="inline" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Myths Accordion (Mobile single-column, Desktop 2 independent columns to prevent row-stretch empty gaps) */}
        {(() => {
          const col1Myths = filteredMyths.filter((_, i) => i % 2 === 0);
          const col2Myths = filteredMyths.filter((_, i) => i % 2 === 1);

          const renderMythCard = (myth: (typeof filteredMyths)[0]) => {
            const cardTitle = getMythField(myth, 'title', lang);

            return (
              <SpotlightCard
                key={myth.id}
                spotlightColor="rgba(45, 212, 191, 0.1)"
                className="bg-card rounded-card border border-card-border shadow-soft overflow-hidden transition-all duration-200 group cursor-pointer hover:border-teal-accent/40"
              >
                {/* Header (Always Visible, Min 44px tap target) */}
                <button
                  type="button"
                  onClick={() => setSelectedModalMyth(myth)}
                  className="w-full min-h-[48px] p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-card-subtle/60 transition-colors focus-visible:ring-2 focus-visible:ring-teal-accent cursor-pointer"
                  aria-label={`View details for ${myth.titleEn}`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    {isEn ? (
                      <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {myth.titleEn}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {cardTitle}
                        </span>
                        <span className="text-xs text-muted truncate">
                          {myth.titleEn}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                      {mythBadgeText}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted/70 group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all" strokeWidth={1.75} />
                  </div>
                </button>
              </SpotlightCard>
            );
          };

          return (
            <>
              {/* Mobile: Single-column stack */}
              <div className="md:hidden space-y-2.5">
                {filteredMyths.map(renderMythCard)}
              </div>

              {/* Desktop: 2 independent columns that never force the other side to stretch */}
              <div className="hidden md:grid md:grid-cols-2 gap-3 items-start">
                <div className="space-y-2.5">
                  {col1Myths.map(renderMythCard)}
                </div>
                <div className="space-y-2.5">
                  {col2Myths.map(renderMythCard)}
                </div>
              </div>
            </>
          );
        })()}
      </section>

      {/* Myth Detail Pop-up Modal */}
      <MythDetailModal
        myth={selectedModalMyth}
        isOpen={Boolean(selectedModalMyth)}
        onClose={() => setSelectedModalMyth(null)}
      />
    </div>
  );
}
