'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { X, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export interface MythItem {
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

export interface MythDetailModalProps {
  myth: MythItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MythDetailModal({
  myth,
  isOpen,
  onClose,
}: MythDetailModalProps) {
  const { profile } = useApp();

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

  if (typeof document === 'undefined' || !isOpen || !myth) {
    return null;
  }

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
          aria-labelledby="myth-modal-title"
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
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  Myth Busted
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-card-subtle text-muted border border-card-border capitalize">
                  {myth.category}
                </span>
              </div>

              {profile.language === 'en' ? (
                <h2
                  id="myth-modal-title"
                  className="text-base sm:text-lg font-bold text-foreground leading-snug"
                >
                  {myth.titleEn}
                </h2>
              ) : (
                <div className="flex flex-col">
                  <h2
                    id="myth-modal-title"
                    className="text-base sm:text-lg font-bold text-foreground leading-snug"
                  >
                    {profile.language === 'mr' ? myth.titleMr : myth.titleHi}
                  </h2>
                  <span className="text-xs text-muted font-normal mt-0.5">
                    {myth.titleEn}
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
            {/* Common Myth Claim */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 text-rose-950 dark:text-rose-200">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                Common Winter Smog Claim
              </span>
              <p className="italic text-xs sm:text-sm leading-relaxed font-medium">
                &ldquo;{myth.mythText}&rdquo;
              </p>
            </div>

            {/* Peer-reviewed scientific reality */}
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-accent" strokeWidth={2} />
                The Scientific Reality:
              </span>
              <p className="leading-relaxed text-foreground/90 pl-5 text-xs sm:text-sm">
                {myth.explanation}
              </p>
            </div>

            {/* What to do instead */}
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50 text-teal-950 dark:text-teal-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold text-xs sm:text-sm text-teal-800 dark:text-teal-300 block">
                  What to do instead:
                </strong>
                <p className="text-xs sm:text-sm text-teal-950 dark:text-teal-100 leading-relaxed">
                  {myth.whatToDo}
                </p>
              </div>
            </div>
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
