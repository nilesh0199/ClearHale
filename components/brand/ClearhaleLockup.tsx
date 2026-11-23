'use client';

import React from 'react';
import { ClearhaleMarkFull } from './ClearhaleMarkFull';
import { ClearhaleMarkFlat } from './ClearhaleMarkFlat';

export interface ClearhaleLockupProps {
  size?: 'sm' | 'md' | 'lg' | number;
  variant?: 'light' | 'dark' | 'auto';
  isBreathing?: boolean;
  introAnimation?: boolean;
  useFlatMark?: boolean;
  className?: string;
  subtitle?: string;
  idPrefix?: string;
}

export function ClearhaleLockup({
  size = 'md',
  variant = 'auto',
  isBreathing = false,
  introAnimation = false,
  useFlatMark,
  className = '',
  subtitle,
  idPrefix = 'clockup',
}: ClearhaleLockupProps) {
  // Dimension presets
  let markSize = 40;
  let textClass = 'text-xl';
  let subtitleClass = 'text-xs';
  let gapClass = 'gap-3';

  if (typeof size === 'number') {
    markSize = size;
    textClass = size < 28 ? 'text-sm' : size < 40 ? 'text-lg' : 'text-2xl';
  } else if (size === 'sm') {
    markSize = 26;
    textClass = 'text-base';
    subtitleClass = 'text-[10px]';
    gapClass = 'gap-2';
  } else if (size === 'lg') {
    markSize = 64;
    textClass = 'text-3xl';
    subtitleClass = 'text-sm';
    gapClass = 'gap-4';
  }

  // Auto-switch to flat mark if smaller than 30px unless explicitly set
  const isFlat = useFlatMark !== undefined ? useFlatMark : markSize < 30;

  return (
    <div className={`inline-flex items-center ${gapClass} ${className}`}>
      {isFlat ? (
        <ClearhaleMarkFlat
          size={markSize}
          color={
            variant === 'dark'
              ? '#34D399'
              : variant === 'light'
              ? '#0D5C52'
              : undefined
          }
          className="text-teal-accent"
          idPrefix={idPrefix}
        />
      ) : (
        <ClearhaleMarkFull
          size={markSize}
          variant={variant}
          isBreathing={isBreathing}
          introAnimation={introAnimation}
          idPrefix={idPrefix}
        />
      )}

      <div className="flex flex-col justify-center">
        <span
          className={`font-semibold tracking-tight leading-none lowercase ${textClass} ${
            variant === 'dark'
              ? 'text-white'
              : variant === 'light'
              ? 'text-stone-900'
              : 'text-foreground'
          }`}
        >
          clearhale
        </span>
        {subtitle && (
          <span
            className={`mt-1 font-normal leading-none ${subtitleClass} ${
              variant === 'dark'
                ? 'text-stone-400'
                : variant === 'light'
                ? 'text-stone-500'
                : 'text-muted'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
