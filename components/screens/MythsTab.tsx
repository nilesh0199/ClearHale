'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { MythDetailModal } from '../care/MythDetailModal';
import {
  HeartPulse,
  PhoneCall,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Shield,
  Home,
} from 'lucide-react';

export type MythCategory = 'all' | 'masks' | 'indoor' | 'cooking';

interface MythItem {
  id: string;
  category: 'masks' | 'indoor' | 'cooking';
  titleEn: string;
  titleHi: string;
  titleMr: string;
  verdictKey: string;
  verdictEn: string;
  mythText: string;
  explanation: string;
  whatToDo: string;
}

const MYTH_ITEMS: MythItem[] = [
  {
    id: 'cloth_masks',
    category: 'masks',
    titleEn: 'Cloth Masks, Scarves & Dupattas',
    titleHi: 'कपड़े के मास्क और दुपट्टे',
    titleMr: 'कापडी मास्क आणि ओढणी',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Myth for PM2.5',
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
    titleHi: 'घर के पौधे (हाउसप्लांट्स)',
    titleMr: 'घरातील शोभेची झाडे',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Myth for Smog',
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
    titleHi: 'सुबह खिड़कियां खोलना',
    titleMr: 'सकाळी खिडक्या उघडणे',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Hazardous Timing',
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
    titleHi: 'सारे छेद पूरी तरह सील करना',
    titleMr: 'घरातील सर्व फटी बंद करणे',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Carbon Monoxide Risk',
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
    titleHi: 'स्मॉग में बाहर गहरी सांस व दौड़',
    titleMr: 'बाहेर धुरक्यात दीर्घ श्वास व धावणे',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Lung Hazard',
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
    titleHi: 'अगरबत्ती व कपूर जलाना',
    titleMr: 'अगरबत्ती व कापूर जाळणे',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Indoor Smoke Spike',
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
    titleMr: 'स्वयंपाकघरातील धूर',
    verdictKey: 'learn.myths.badge',
    verdictEn: 'Indoor Particle Burst',
    mythText: 'Cooking smoke stays in the kitchen and does not hurt family members.',
    explanation:
      'High-heat oil frying, tadka, and open gas flames generate massive bursts of fine combustion particles that quickly circulate into children’s and elderly bedrooms.',
    whatToDo:
      'Cook with lids on pots, keep the kitchen door closed to living areas, and always run a mechanical exhaust fan or chimney that vents outdoors.',
  },
];

export function MythsTab() {
  const { profile } = useApp();
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

        {/* Warning signs: compact 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {[
            'Stridor or high-pitched wheezing at rest',
            'Inability to speak in full sentences without gasping',
            'Bluish tint on lips, fingernails, or tongue',
            'Chest heaviness, severe pressure, or acute pain',
            'Skin sucking in around ribs or collarbone',
            'Sudden dizziness, confusion, or severe lethargy',
          ].map((sign, i) => (
            <div
              key={i}
              className="p-2 sm:p-2.5 rounded-lg bg-white/90 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 text-xs sm:text-sm font-medium text-rose-950 dark:text-rose-100 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0" />
              <span className="leading-tight">{sign}</span>
            </div>
          ))}
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
              <Bi k="learn.mythBusters" layout="plain" />
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Peer-reviewed evidence on common winter smog claims.
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
                    {profile.language === 'en' ? (
                      <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {myth.titleEn}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {profile.language === 'mr' ? myth.titleMr : myth.titleHi}
                        </span>
                        <span className="text-xs text-muted truncate">
                          {myth.titleEn}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                      Myth
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
