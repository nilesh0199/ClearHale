'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CostChipProps {
  tier: string;
  className?: string;
}

/**
 * CostChip:
 * - In Monochrome Mode (accentMode === 'mono'):
 *   Uses neutral tokens (100, 200, 300, 700, 800, 900) without high-contrast black blobs.
 * - In Teal Accent Mode (default / when not monochrome):
 *   Uses themed badges: Free is emerald/subtle green, Low-cost is neutral, If you can afford is outlined.
 * Always keeps the text label.
 */
export function CostChip({ tier, className = '' }: CostChipProps) {
  const { profile } = useApp();
  const isMono = profile?.accentMode === 'mono';
  const normalized = (tier || '').toLowerCase().trim();

  let styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
  let displayLabel = tier || 'If you can afford';

  if (isMono) {
    if (normalized === 'free') {
      styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
      displayLabel = 'Free';
    } else if (normalized.includes('low')) {
      styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
      displayLabel = 'Low-cost';
    } else {
      styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
      displayLabel = 'If you can afford';
    }
  } else {
    if (normalized === 'free') {
      styleClasses = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold';
      displayLabel = 'Free';
    } else if (normalized.includes('low')) {
      styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
      displayLabel = 'Low-cost';
    } else {
      styleClasses = 'bg-card-subtle text-foreground border border-card-border font-semibold';
      displayLabel = 'If you can afford';
    }
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${styleClasses} ${className}`}
      aria-label={`Cost: ${displayLabel}`}
    >
      {displayLabel}
    </span>
  );
}

interface EvidenceChipProps {
  level: string;
  className?: string;
}

/**
 * EvidenceChip:
 * - In Monochrome Mode (accentMode === 'mono'):
 *   Strong is solid neutral-900, Moderate/Depends is outlined, Limited is dashed outline, Myth is danger red.
 * - In Teal Accent Mode (default / when not monochrome):
 *   Strong is crisp teal, Moderate is outlined, Limited is dashed, Myth is danger red.
 * Always keeps the text label.
 */
export function EvidenceChip({ level, className = '' }: EvidenceChipProps) {
  const { profile } = useApp();
  const isMono = profile?.accentMode === 'mono';
  const normalized = (level || '').toLowerCase().trim();

  if (normalized === 'myth') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold text-danger bg-danger-bg border border-danger/30 whitespace-nowrap ${className}`}
        aria-label="Evidence: Myth"
      >
        <AlertTriangle className="w-3 h-3 text-danger shrink-0" strokeWidth={2} />
        <span>Myth</span>
      </span>
    );
  }

  if (isMono) {
    if (normalized === 'strong') {
      return (
        <span
          className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-card-subtle text-foreground border border-card-border whitespace-nowrap ${className}`}
          aria-label="Evidence: Strong"
        >
          Strong
        </span>
      );
    }

    if (normalized.includes('limited')) {
      return (
        <span
          className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-card-subtle text-foreground/90 border border-dashed border-card-border whitespace-nowrap ${className}`}
          aria-label={`Evidence: ${level}`}
        >
          {level || 'Limited'}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-card-subtle text-foreground border border-card-border whitespace-nowrap ${className}`}
        aria-label={`Evidence: ${level}`}
      >
        {level || 'Moderate'}
      </span>
    );
  }

  // Teal Mode (Default):
  if (normalized === 'strong') {
    return (
      <span
        className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-teal-light text-teal-accent dark:bg-teal-950/80 dark:text-teal-300 border border-teal-accent/30 dark:border-teal-700/60 whitespace-nowrap ${className}`}
        aria-label="Evidence: Strong"
      >
        Strong
      </span>
    );
  }

  if (normalized.includes('limited')) {
    return (
      <span
        className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-card-subtle text-foreground/90 border border-dashed border-card-border whitespace-nowrap ${className}`}
        aria-label={`Evidence: ${level}`}
      >
        {level || 'Limited'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-card-subtle text-foreground border border-card-border whitespace-nowrap ${className}`}
      aria-label={`Evidence: ${level}`}
    >
      {level || 'Moderate'}
    </span>
  );
}
