'use client';

import React from 'react';
import { ClearhaleMarkFull, ClearhaleMarkFullProps } from './brand/ClearhaleMarkFull';
import { ClearhaleMarkFlat } from './brand/ClearhaleMarkFlat';
import { ClearhaleLockup } from './brand/ClearhaleLockup';

export { ClearhaleMarkFull, ClearhaleMarkFlat, ClearhaleLockup };

export interface ClearhaleLogoProps {
  size?: number;
  className?: string;
  drawAnimation?: boolean;
  introAnimation?: boolean;
  isBreathing?: boolean;
  strokeWidth?: number;
  color?: string;
  variant?: 'light' | 'dark' | 'auto';
  flat?: boolean;
}

/**
 * ClearhaleLogoMark:
 * Drop-in component rendering the refined semi-realistic leaf-lung Clearhale logo mark.
 * Backward-compatible with previous invocations.
 */
export function ClearhaleLogoMark({
  size = 96,
  className = '',
  drawAnimation = false,
  introAnimation = false,
  isBreathing = false,
  variant = 'auto',
  flat = false,
  color,
}: ClearhaleLogoProps) {
  if (flat || size < 30) {
    return (
      <ClearhaleMarkFlat
        size={size}
        className={className}
        color={color}
      />
    );
  }

  return (
    <ClearhaleMarkFull
      size={size}
      className={className}
      variant={variant}
      introAnimation={introAnimation || drawAnimation}
      isBreathing={isBreathing}
    />
  );
}
