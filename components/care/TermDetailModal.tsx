'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { TermDetail } from '@/data/terms';
import { X, Lightbulb, ShieldCheck, ShieldAlert, BookOpen } from 'lucide-react';

export interface TermDetailModalProps {
  term: TermDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TermDetailModal({
  term,
  isOpen,
  onClose,
}: TermDetailModalProps) {
  const { profile } = useApp();
  const lang = profile.language;
  const isEn = lang === 'en';

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (typeof document === 'undefined' || !isOpen || !term) {
    return null;
  }

  const title = isEn ? term.titleEn : lang === 'hi' ? term.titleHi : term.titleMr;
  const whatItMeans = isEn ? term.whatItMeansEn : lang === 'hi' ? term.whatItMeansHi : term.whatItMeansMr;
  const thinkOfItLike = isEn ? term.thinkOfItLikeEn : lang === 'hi' ? term.thinkOfItLikeHi : term.thinkOfItLikeMr;
  const whyItMatters = isEn ? term.whyItMattersEn : lang === 'hi' ? term.whyItMattersHi : term.whyItMattersMr;
  const whatYouCanDo = isEn ? term.whatYouCanDoEn : lang === 'hi' ? term.whatYouCanDoHi : term.whatYouCanDoMr;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop: Clicking outside closes the pop-up */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          aria-hidden="true"
        />

        {/* Pop-up Box */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="term-modal-title"
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-card border border-card-border rounded-t-3xl sm:rounded-2xl shadow-float flex flex-col overflow-hidden"
        >
          {/* Mobile Handle */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
            <span className="w-10 h-1.5 rounded-full bg-card-border" />
          </div>

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-card-border flex items-start justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-card-subtle border border-card-border text-muted">
                  {term.category}
                </span>
                <span className="text-xs text-muted truncate max-w-[260px]">
                  {isEn ? term.shortMeaningEn : lang === 'hi' ? term.shortMeaningHi : term.shortMeaningMr}
                </span>
              </div>

              {isEn ? (
                <h2
                  id="term-modal-title"
                  className="text-base sm:text-lg font-bold text-foreground leading-snug"
                >
                  {title}
                </h2>
              ) : (
                <div className="flex flex-col">
                  <h2
                    id="term-modal-title"
                    className="text-base sm:text-lg font-bold text-foreground leading-snug"
                  >
                    {title}
                  </h2>
                  <span className="text-xs text-muted font-normal mt-0.5">
                    {term.titleEn}
                  </span>
                </div>
              )}
            </div>

            {/* Cross / Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 -mt-1 rounded-full text-muted hover:text-foreground hover:bg-card-subtle transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
            {/* Part 1: What it means */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-accent" />
                <span>{isEn ? '1. What it means' : lang === 'hi' ? '१. इसका क्या मतलब है' : '१. याचा अर्थ काय आहे'}</span>
              </span>
              <p className="text-foreground leading-relaxed pl-5 text-xs sm:text-sm">
                {whatItMeans}
              </p>
            </div>

            {/* Part 2: Think of it like (Everyday comparison) */}
            {thinkOfItLike && (
              <div className="p-3.5 rounded-xl bg-teal-light/50 border border-teal-accent/20 space-y-1.5">
                <span className="text-xs font-bold text-teal-accent flex items-center gap-1.5 uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4" />
                  <span>{isEn ? '2. Think of it like' : lang === 'hi' ? '२. ऐसे समझें (सरल तुलना)' : '२. असा विचार करा (सोपी तुलना)'}</span>
                </span>
                <p className="text-foreground/90 leading-relaxed text-xs sm:text-sm font-medium">
                  {thinkOfItLike}
                </p>
              </div>
            )}

            {/* Part 3: Why it matters */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{isEn ? '3. Why it matters' : lang === 'hi' ? '३. यह क्यों जरूरी है' : '३. हे महत्त्वाचे का आहे'}</span>
              </span>
              <p className="text-muted leading-relaxed pl-5 text-xs sm:text-sm">
                {whyItMatters}
              </p>
            </div>

            {/* Part 4: What you can do */}
            {whatYouCanDo && (
              <div className="p-3.5 rounded-xl bg-card-subtle border border-card-border space-y-1.5">
                <span className="text-xs font-bold text-teal-accent flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEn ? '4. What you can do' : lang === 'hi' ? '४. आप क्या कर सकते हैं' : '४. आपण काय करू शकता'}</span>
                </span>
                <p className="text-foreground leading-relaxed text-xs sm:text-sm font-medium">
                  {whatYouCanDo}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-card-border/60 bg-card-subtle/40 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-5 py-2 rounded-xl border border-card-border bg-card hover:bg-card-subtle text-foreground text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
