'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { ActionItem } from '@/types';
import { CostChip, EvidenceChip } from '../ui/NeutralChips';
import { whyForYou } from '@/lib/rulesEngine';
import {
  X,
  CheckCircle2,
  Circle,
  Check,
  Info,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export interface ActionDetailModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  isChecked?: boolean;
  onToggleCheck?: (id: string, e: React.MouseEvent) => void;
}

export function ActionDetailModal({
  action,
  isOpen,
  onClose,
  isChecked = false,
  onToggleCheck,
}: ActionDetailModalProps) {
  const { profile, airData, currentBand, getActionBi } = useApp();

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

  if (typeof document === 'undefined' || !isOpen || !action) {
    return null;
  }

  const { enTitle, nativeTitle } = getActionBi(action.id, action.title, currentBand.key);
  const personalizedWhy = whyForYou(action, profile, airData);

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
          aria-labelledby="action-modal-title"
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
                <EvidenceChip level={action.evidence || action.evidence_level} />
                <CostChip tier={action.cost_tier} />
                {isChecked && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>

              {profile.language === 'en' ? (
                <h2
                  id="action-modal-title"
                  className="text-base sm:text-lg font-bold text-foreground leading-snug"
                >
                  {action.title}
                </h2>
              ) : (
                <div className="flex flex-col">
                  <h2
                    id="action-modal-title"
                    className="text-base sm:text-lg font-bold text-foreground leading-snug"
                  >
                    {nativeTitle}
                  </h2>
                  <span className="text-xs text-muted font-normal mt-0.5">
                    {enTitle}
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
            {/* Personalized Why Callout */}
            {personalizedWhy && (
              <div className="p-3.5 rounded-xl bg-card-subtle/80 border border-card-border/60 text-muted leading-relaxed">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-accent" />
                  <span>Why for you</span>
                </div>
                <p className="text-foreground/90 font-medium text-xs sm:text-sm leading-relaxed">
                  {personalizedWhy}
                </p>
              </div>
            )}

            {/* Do this */}
            <div className="space-y-1">
              <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-accent" strokeWidth={2.5} />
                Do this:
              </span>
              <p className="leading-relaxed text-foreground/90 pl-5 text-xs sm:text-sm">
                {action.doThis}
              </p>
            </div>

            {/* Why it works */}
            <div className="space-y-1">
              <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-accent" strokeWidth={2} />
                Why it works:
              </span>
              <p className="leading-relaxed text-muted pl-5 text-xs sm:text-sm">
                {action.whyItWorks || action.why}
              </p>
            </div>

            {/* Quick Details: Cost & time, Evidence */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-card-subtle/50 border border-card-border/50 text-xs sm:text-sm">
              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-medium">Cost & time</span>
                <span className="font-semibold text-foreground">{action.cost_tier} • {action.timeNeeded}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-medium">Evidence</span>
                <span className="font-semibold text-foreground">{action.evidence || action.evidence_level}</span>
              </div>
            </div>

            {/* Official Source Link */}
            {action.source && (
              <div className="pt-0.5">
                <a
                  href={action.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-accent hover:underline inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  <span>Official Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Be careful about alert */}
            {(action.careful || action.safety_note) && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" strokeWidth={1.75} />
                <div className="text-xs sm:text-sm">
                  <strong className="font-semibold block mb-0.5">Be careful about:</strong>
                  <span className="leading-relaxed">{action.careful || action.safety_note}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-card-border/60 bg-card-subtle/40 flex items-center justify-between gap-3 shrink-0">
            {onToggleCheck ? (
              <button
                type="button"
                onClick={(e) => onToggleCheck(action.id, e)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-teal-accent hover:bg-teal-hover text-white shadow-soft'
                }`}
              >
                {isChecked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    <span>Mark as Completed</span>
                  </>
                )}
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-card-border bg-card hover:bg-card-subtle text-foreground text-xs sm:text-sm font-medium transition-colors cursor-pointer"
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
