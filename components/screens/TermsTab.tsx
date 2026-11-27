'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Bi } from '../Bi';
import { SpotlightCard } from '../ui/rb/SpotlightCard';
import { TermDetailModal } from '../care/TermDetailModal';
import {
  GLOSSARY_TERMS,
  AIR_BANDS_10SEC,
  TermCategory,
  TermDetail,
} from '@/data/terms';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ShieldCheck,
  HelpCircle,
  Activity,
  Flame,
  Wind,
  ShieldAlert,
} from 'lucide-react';

export function TermsTab() {
  const { profile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory>('all');
  const [selectedModalTerm, setSelectedModalTerm] = useState<TermDetail | null>(null);

  const lang = profile.language;
  const isEn = lang === 'en';

  // Highlight or auto-open term passed from <Term> popovers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const termToHighlight = localStorage.getItem('clearhale_highlight_term');
      if (termToHighlight) {
        const found = GLOSSARY_TERMS.find((t) => t.id === termToHighlight);
        if (found) {
          setSelectedModalTerm(found);
        }
        localStorage.removeItem('clearhale_highlight_term');
      }
    } catch (e) {}
  }, []);

  const filterChips: { id: TermCategory; labelEn: string; labelHi: string; labelMr: string }[] = [
    { id: 'all', labelEn: 'All', labelHi: 'सभी (All)', labelMr: 'सर्व (All)' },
    { id: 'basics', labelEn: 'Basics', labelHi: 'मूल बातें (Basics)', labelMr: 'मूलभूत (Basics)' },
    { id: 'pollutants', labelEn: 'Pollutants', labelHi: 'प्रदूषक (Pollutants)', labelMr: 'प्रदूषक (Pollutants)' },
    { id: 'causes', labelEn: 'Causes', labelHi: 'कारण (Causes)', labelMr: 'कारणे (Causes)' },
    { id: 'protection', labelEn: 'Protection', labelHi: 'सुरक्षा (Protection)', labelMr: 'संरक्षण (Protection)' },
  ];

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((term) => {
      // Category filter
      if (selectedCategory !== 'all' && term.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchEn = term.titleEn.toLowerCase().includes(q) || term.shortMeaningEn.toLowerCase().includes(q);
      const matchHi = term.titleHi.toLowerCase().includes(q) || term.shortMeaningHi.toLowerCase().includes(q);
      const matchMr = term.titleMr.toLowerCase().includes(q) || term.shortMeaningMr.toLowerCase().includes(q);
      const matchAlias = term.aliases.some((a) => a.toLowerCase().includes(q));
      return matchEn || matchHi || matchMr || matchAlias;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 text-left">
      {/* 1. TOP HERO: "Read your air in 10 seconds" Compact Band Guide Card */}
      <SpotlightCard
        spotlightColor="rgba(45, 212, 191, 0.12)"
        className="bg-gradient-to-br from-card to-card-subtle rounded-card border border-card-border p-4 sm:p-5 shadow-soft space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-accent" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              {isEn
                ? 'Read your air in 10 seconds'
                : lang === 'hi'
                ? '१० सेकंड में समझें अपनी हवा'
                : '१० सेकंदात समजून घ्या हवा'}
            </h2>
          </div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-light text-teal-accent border border-teal-accent/25">
            CPCB Scale
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          {isEn
            ? 'The six official colour bands used in India, their PM2.5 range, and the single most important action to take.'
            : lang === 'hi'
            ? 'भारत के 6 आधिकारिक कलर बैंड, उनका PM2.5 स्तर और तुरंत उठाया जाने वाला मुख्य कदम।'
            : 'भारतातील ६ अधिकृत रंग स्तर, त्यांची PM2.5 मर्यादा आणि प्रत्येकासाठी सर्वात महत्त्वाची कृती.'}
        </p>

        {/* 6-Band Grid: 1 col on xs, 2 col on sm, 3 col on md, 6 col on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {AIR_BANDS_10SEC.map((band) => (
            <div
              key={band.bandKey}
              className={`p-3 rounded-xl border ${band.borderClass} ${band.bgClass} flex flex-col justify-between space-y-1.5 transition-all`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs sm:text-sm font-bold ${band.textClass}`}>
                  {isEn ? band.nameEn : lang === 'hi' ? band.nameHi : band.nameMr}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 text-foreground border border-card-border">
                  {band.pm25Range}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-snug text-foreground/85 font-medium">
                {isEn ? band.actionEn : lang === 'hi' ? band.actionHi : band.actionMr}
              </p>
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* 2. SEARCH & CATEGORY CHIPS */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? 'Search terms (e.g. AQI, PM2.5, HEPA, N95)...'
                  : lang === 'hi'
                  ? 'शब्द खोजें (जैसे AQI, PM2.5, हेपा, N95)...'
                  : 'शब्दार्थ शोधा (उदा. AQI, PM2.5, HEPA, N95)...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-card-border bg-card text-foreground text-sm sm:text-base focus:border-teal-accent focus:ring-1 focus:ring-teal-accent shadow-xs"
            />
          </div>

          {/* Category Chips Row with sliding spring pill (Wraps on mobile, no horizontal scroll) */}
          <div
            className="flex flex-wrap items-center gap-1.5 py-1 relative"
            role="tablist"
            aria-label="Filter glossary categories"
          >
            {filterChips.map((chip) => {
              const isSelected = selectedCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'text-white border-teal-accent shadow-xs font-semibold'
                      : 'bg-card text-muted hover:text-foreground border-card-border hover:bg-card-subtle'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="terms-category-pill"
                      className="absolute inset-0 rounded-full bg-teal-accent -z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {isEn ? chip.labelEn : lang === 'hi' ? chip.labelHi : chip.labelMr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-xs text-muted flex items-center justify-between px-1">
          <span>
            {isEn
              ? `Showing ${filteredTerms.length} terms`
              : lang === 'hi'
              ? `${filteredTerms.length} शब्द उपलब्ध`
              : `${filteredTerms.length} शब्दार्थ उपलब्ध`}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-teal-accent hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* 3. GLOSSARY ACCORDION CARDS */}
        <div className="space-y-2.5">
          {filteredTerms.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-card border border-card-border">
              <HelpCircle className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">
                No matching terms found
              </p>
              <p className="text-xs text-muted mt-1">
                Try searching for simple words like "mask", "smog", "filter", or "dust".
              </p>
            </div>
          ) : (
            filteredTerms.map((term) => {
              const title = isEn ? term.titleEn : lang === 'hi' ? term.titleHi : term.titleMr;

              return (
                <SpotlightCard
                  key={term.id}
                  id={`term-${term.id}`}
                  spotlightColor="rgba(45, 212, 191, 0.1)"
                  className="bg-card rounded-card border border-card-border shadow-soft overflow-hidden transition-all duration-200 group cursor-pointer hover:border-teal-accent/40"
                >
                  {/* Card Header (Always Visible, Min 50px tap target) */}
                  <button
                    type="button"
                    onClick={() => setSelectedModalTerm(term)}
                    className="w-full min-h-[50px] p-4 text-left flex items-center justify-between gap-3 hover:bg-card-subtle/50 transition-colors cursor-pointer select-none"
                    aria-label={`View details for ${title}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-card-subtle border border-card-border text-muted shrink-0">
                        {term.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm text-muted hidden md:inline-block max-w-[280px] truncate">
                        {isEn ? term.shortMeaningEn : lang === 'hi' ? term.shortMeaningHi : term.shortMeaningMr}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 text-muted/70 group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all"
                        strokeWidth={1.75}
                      />
                    </div>
                  </button>
                </SpotlightCard>
              );
            })
          )}
        </div>
      </section>

      {/* Term Detail Pop-up Modal */}
      <TermDetailModal
        term={selectedModalTerm}
        isOpen={Boolean(selectedModalTerm)}
        onClose={() => setSelectedModalTerm(null)}
      />
    </div>
  );
}
