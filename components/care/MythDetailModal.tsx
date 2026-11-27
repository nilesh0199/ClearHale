'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { MythItem, getMythField } from '@/data/myths';
import { X, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export { type MythItem } from '@/data/myths';

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

  if (typeof document === 'undefined' || !isOpen || !myth) {
    return null;
  }

  // Regional language localized text
  const localizedTitle = getMythField(myth, 'title', lang);
  const localizedVerdict = getMythField(myth, 'verdict', lang);
  const localizedClaim = getMythField(myth, 'mythText', lang);
  const localizedExplanation = getMythField(myth, 'explanation', lang);
  const localizedWhatToDo = getMythField(myth, 'whatToDo', lang);

  // Section Header Labels in regional language
  const badgeLabel = isEn
    ? 'Myth Busted'
    : lang === 'hi'
    ? 'भ्रम का सच (Myth Busted)'
    : lang === 'mr'
    ? 'गैरसमज दूर (Myth Busted)'
    : lang === 'bn'
    ? 'ভ্রান্ত ধারণা নিরসন (Myth Busted)'
    : lang === 'ta'
    ? 'கட்டுக்கதை உடைக்கப்பட்டது (Myth Busted)'
    : lang === 'te'
    ? 'అపోహ నివృత్తి (Myth Busted)'
    : 'भ्रम का सच (Myth Busted)';

  const claimLabel = isEn
    ? 'Common Winter Smog Claim'
    : lang === 'hi'
    ? 'प्रचलित शीतकालीन भ्रम / दावा'
    : lang === 'mr'
    ? 'प्रचलित हिवाळी गैरसमज / दावा'
    : lang === 'bn'
    ? 'প্রচলিত শীতকালীন ভ্রান্ত বিশ্বাস'
    : lang === 'ta'
    ? 'பொதுவான தவறான நம்பிக்கை'
    : lang === 'te'
    ? 'సాధారణ శీతాకాలపు అపోహ'
    : 'प्रचलित शीतकालीन भ्रम / दावा';

  const realityLabel = isEn
    ? 'The Scientific Reality:'
    : lang === 'hi'
    ? 'वैज्ञानिक सच्चाई (Scientific Reality):'
    : lang === 'mr'
    ? 'वैज्ञानिक सत्य (Scientific Reality):'
    : lang === 'bn'
    ? 'বৈজ্ঞানিক সত্য (Scientific Reality):'
    : lang === 'ta'
    ? 'அறிவியல் உண்மை (Scientific Reality):'
    : lang === 'te'
    ? 'శాస్త్రీయ నిజం (Scientific Reality):'
    : 'वैज्ञानिक सच्चाई (Scientific Reality):';

  const whatToDoLabel = isEn
    ? 'What to do instead:'
    : lang === 'hi'
    ? 'इसके बजाय क्या करें (What to do instead):'
    : lang === 'mr'
    ? 'त्याऐवजी काय करावे (What to do instead):'
    : lang === 'bn'
    ? 'এর পরিবর্তে কী করবেন (What to do instead):'
    : lang === 'ta'
    ? 'அதற்கு பதிலாக என்ன செய்ய வேண்டும் (What to do instead):'
    : lang === 'te'
    ? 'బదులుగా ఏమి చేయాలి (What to do instead):'
    : 'इसके बजाय क्या करें (What to do instead):';

  const closeLabel = isEn
    ? 'Close'
    : lang === 'hi'
    ? 'बंद करें (Close)'
    : lang === 'mr'
    ? 'बंद करा (Close)'
    : lang === 'bn'
    ? 'বন্ধ করুন (Close)'
    : lang === 'ta'
    ? 'மூடு (Close)'
    : lang === 'te'
    ? 'మూసివేయి (Close)'
    : 'बंद करें (Close)';

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
                  {badgeLabel}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-card-subtle text-muted border border-card-border capitalize">
                  {myth.category}
                </span>
                {localizedVerdict && !isEn && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {localizedVerdict}
                  </span>
                )}
              </div>

              {isEn ? (
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
                    {localizedTitle}
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
            {/* Common Myth Claim (Explained in Regional Language) */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 text-rose-950 dark:text-rose-200">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                {claimLabel}
              </span>
              <p className="italic text-xs sm:text-sm leading-relaxed font-medium">
                &ldquo;{localizedClaim}&rdquo;
              </p>
              {!isEn && myth.mythTextEn !== localizedClaim && (
                <p className="text-[11px] text-muted italic mt-1 font-normal opacity-75">
                  &ldquo;{myth.mythTextEn}&rdquo;
                </p>
              )}
            </div>

            {/* Peer-reviewed scientific reality (Explained in Regional Language) */}
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-accent" strokeWidth={2} />
                {realityLabel}
              </span>
              <div className="pl-5 space-y-1 text-xs sm:text-sm">
                <p className="leading-relaxed text-foreground/95">
                  {localizedExplanation}
                </p>
                {!isEn && myth.explanationEn !== localizedExplanation && (
                  <p className="text-xs text-muted leading-relaxed font-normal pt-1 border-t border-card-border/40 mt-1.5">
                    {myth.explanationEn}
                  </p>
                )}
              </div>
            </div>

            {/* What to do instead (Explained in Regional Language) */}
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50 text-teal-950 dark:text-teal-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <strong className="font-semibold text-xs sm:text-sm text-teal-800 dark:text-teal-300 block">
                  {whatToDoLabel}
                </strong>
                <p className="text-xs sm:text-sm text-teal-950 dark:text-teal-100 leading-relaxed">
                  {localizedWhatToDo}
                </p>
                {!isEn && myth.whatToDoEn !== localizedWhatToDo && (
                  <p className="text-xs text-teal-800/70 dark:text-teal-300/70 leading-relaxed font-normal pt-1 border-t border-teal-200/50 dark:border-teal-800/50 mt-1">
                    {myth.whatToDoEn}
                  </p>
                )}
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
              {closeLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
