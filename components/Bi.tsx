'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export interface BiProps {
  k: string;
  en?: string;
  layout?:
    | 'plain'
    | 'stacked'
    | 'inline'
    | 'desktop-nav'
    | 'mobile-tab'
    | 'action-card'
    | 'chip';
  className?: string;
  nativeClassName?: string;
  enClassName?: string;
  as?: React.ElementType;
}

/**
 * Bi (Bilingual) Component
 * 
 * Rules:
 * 1. If profile.language === 'en': renders English only, everywhere. No duplicate label.
 * 2. If profile.language !== 'en': always renders native label together with English label.
 *    - desktop-nav: bold native with smaller English beneath
 *    - mobile-tab: native with small English caption beneath
 *    - action-card / stacked: native title with English title as muted subtitle
 *    - inline / chip: native label with (English) beside it
 *    - plain: native label with (English) beside it
 */
export function Bi({
  k,
  en,
  layout = 'plain',
  className = '',
  nativeClassName = '',
  enClassName = '',
  as: Component = 'span',
}: BiProps) {
  const { profile, tBi } = useApp();
  const isEnglish = profile.language === 'en';
  const { en: enText, native: nativeText } = tBi(k, en);

  // 1. English mode: English ONLY
  if (isEnglish) {
    return <Component className={className}>{enText}</Component>;
  }

  // 2. Regional languages mode: Native + English together
  if (layout === 'desktop-nav') {
    return (
      <div className={`flex flex-col text-left leading-tight ${className}`}>
        <span className={`font-semibold text-sm ${nativeClassName}`}>{nativeText}</span>
        <span className={`text-[11px] text-muted opacity-85 font-normal ${enClassName}`}>{enText}</span>
      </div>
    );
  }

  if (layout === 'mobile-tab') {
    // Bottom tabs: user requested "for tabs in regional language- keep it english only - i mean the bottom tabs"
    const shortEn =
      k === 'tabs.plan' ? 'Plan' : k === 'tabs.ask' ? 'Ask' : enText;
    return (
      <span className={`text-[10px] font-medium leading-none mt-1 ${className}`}>
        {shortEn}
      </span>
    );
  }

  if (layout === 'action-card') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`text-sm sm:text-base font-semibold text-foreground ${nativeClassName}`}>{nativeText}</span>
        <span className={`text-xs text-muted font-normal mt-0.5 ${enClassName}`}>{enText}</span>
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-semibold text-foreground ${nativeClassName}`}>{nativeText}</span>
        <span className={`text-xs text-muted font-normal mt-0.5 ${enClassName}`}>{enText}</span>
      </div>
    );
  }

  if (layout === 'inline') {
    return (
      <Component className={className}>
        <span className={nativeClassName}>{nativeText}</span>{' '}
        <span className={`text-[0.85em] text-muted font-normal opacity-90 ${enClassName}`}>({enText})</span>
      </Component>
    );
  }

  if (layout === 'chip') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className={nativeClassName}>{nativeText}</span>
        <span className={`text-[10px] opacity-75 font-normal ${enClassName}`}>({enText})</span>
      </span>
    );
  }

  return (
    <Component className={className}>
      <span className={nativeClassName}>{nativeText}</span>{' '}
      <span className={`text-[0.85em] text-muted font-normal opacity-85 ${enClassName}`}>({enText})</span>
    </Component>
  );
}
