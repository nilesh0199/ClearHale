'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { GLOSSARY_TERMS, TermDetail } from '@/data/terms';
import { HelpCircle, X, ArrowRight, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';

interface TermProps {
  k: string; // Term id or alias
  children?: React.ReactNode;
  className?: string;
  noUnderline?: boolean;
}

export function Term({ k, children, className = '', noUnderline = false }: TermProps) {
  const { profile, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Normalize term lookup: match id or any alias
  const normalizedKey = k.toLowerCase().trim().replace(/[\.\s_-]+/g, '');
  const termData: TermDetail | undefined = GLOSSARY_TERMS.find((term) => {
    if (term.id === k) return true;
    if (term.id.replace(/_/g, '') === normalizedKey) return true;
    return term.aliases.some((alias) => alias.toLowerCase().replace(/[\.\s_-]+/g, '') === normalizedKey);
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  if (!termData) {
    // If not found in glossary, fallback to plain children
    return <span className={className}>{children || k}</span>;
  }

  // Bilingual text selection
  const lang = profile.language;
  const isEn = lang === 'en';

  const termTitle = isEn
    ? termData.titleEn
    : lang === 'hi'
    ? termData.titleHi
    : lang === 'mr'
    ? termData.titleMr
    : `${termData.titleEn}`;

  const shortMeaning = isEn
    ? termData.shortMeaningEn
    : lang === 'hi'
    ? termData.shortMeaningHi
    : lang === 'mr'
    ? termData.shortMeaningMr
    : termData.shortMeaningEn;

  const thinkOfItLike = isEn
    ? termData.thinkOfItLikeEn
    : lang === 'hi'
    ? termData.thinkOfItLikeHi
    : lang === 'mr'
    ? termData.thinkOfItLikeMr
    : termData.thinkOfItLikeEn;

  const whyItMatters = isEn
    ? termData.whyItMattersEn
    : lang === 'hi'
    ? termData.whyItMattersHi
    : lang === 'mr'
    ? termData.whyItMattersMr
    : termData.whyItMattersEn;

  const handleOpenAllTerms = () => {
    setIsOpen(false);
    setActiveTab('care');
    if (typeof window !== 'undefined') {
      window.location.hash = '#terms';
      try {
        localStorage.setItem('clearhale_learn_tab', 'terms');
        localStorage.setItem('clearhale_highlight_term', termData.id);
      } catch (e) {}
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={
          noUnderline
            ? `inline-flex items-center justify-center cursor-pointer ${className}`
            : `inline-flex items-baseline border-b border-dotted border-muted/50 dark:border-stone-500/40 hover:border-teal-accent hover:text-teal-accent transition-colors font-medium cursor-pointer text-inherit ${className}`
        }
        title={`View plain-language definition of ${termData.titleEn}`}
      >
        <span>{children || termData.titleEn}</span>
        {!noUnderline && (
          <HelpCircle className="w-2.5 h-2.5 ml-0.5 inline-block text-muted/60 opacity-60" />
        )}
      </button>

      {/* Popover / Mobile Bottom Sheet (Portaled to document.body so it locks background scrolling and covers full viewport) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
              />

              {/* Content Drawer / Modal Card */}
              <motion.div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-label={termTitle}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative z-10 w-full sm:max-w-md bg-card border border-card-border rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-float text-left overflow-hidden max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header with Title and Close */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-card-border">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-light text-teal-accent border border-teal-accent/20">
                    {termData.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-1.5 leading-snug">
                    {termTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-card-subtle transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Definition Content */}
              <div className="py-3.5 space-y-3.5 overflow-y-auto text-xs sm:text-sm">
                {/* 1. What it means */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    {isEn ? 'What it means' : lang === 'hi' ? 'इसका क्या मतलब है' : 'याचा अर्थ काय आहे'}
                  </div>
                  <p className="text-foreground leading-relaxed font-normal">
                    {shortMeaning}
                  </p>
                </div>

                {/* 2. Think of it like (Everyday Indian comparison) */}
                {thinkOfItLike && (
                  <div className="p-3 rounded-xl bg-teal-light/40 border border-teal-accent/20 space-y-1">
                    <div className="text-[11px] font-semibold text-teal-accent flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Think of it like' : lang === 'hi' ? 'ऐसे समझें (सरल तुलना)' : 'असा विचार करा (सोपी तुलना)'}</span>
                    </div>
                    <p className="text-foreground/90 leading-relaxed text-xs">
                      {thinkOfItLike}
                    </p>
                  </div>
                )}

                {/* 3. Why it matters */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    <span>{isEn ? 'Why it matters' : lang === 'hi' ? 'यह क्यों जरूरी है' : 'हे महत्त्वाचे का आहे'}</span>
                  </div>
                  <p className="text-muted leading-relaxed text-xs">
                    {whyItMatters}
                  </p>
                </div>
              </div>

              {/* Footer CTA: See all terms in Care */}
              <div className="pt-3 border-t border-card-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleOpenAllTerms}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-accent text-white font-medium text-xs sm:text-sm shadow-soft hover:bg-teal-hover transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isEn
                      ? 'See all terms in Care →'
                      : lang === 'hi'
                      ? 'देखभाल में सभी शब्द देखें →'
                      : 'काळजी मधील सर्व शब्दार्थ पहा →'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
