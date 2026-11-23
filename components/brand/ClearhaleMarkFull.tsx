'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ClearhaleMarkFullProps {
  size?: number;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
  isBreathing?: boolean;
  introAnimation?: boolean;
  drawAnimation?: boolean; // alias for introAnimation
  idPrefix?: string;
}

export function ClearhaleMarkFull({
  size = 96,
  className = '',
  variant = 'auto',
  isBreathing = false,
  introAnimation = false,
  drawAnimation = false,
  idPrefix = 'cmf',
}: ClearhaleMarkFullProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimateIntro = (introAnimation || drawAnimation) && !shouldReduceMotion;
  const shouldBreathe = isBreathing && !shouldReduceMotion;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Clearhale leaf-lung mark"
      role="img"
    >
      {/* Soft Ambient Radial Glow (subtle depth lift) */}
      <div
        className="absolute rounded-full bg-radial from-teal-500/15 via-emerald-500/10 to-transparent blur-xl pointer-events-none"
        style={{
          inset: -Math.round(size * 0.15),
        }}
      />

      {/* 3. The Authentic Clearhale Leaf-Lung Mark */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={
          shouldAnimateIntro
            ? { scale: 0.88, opacity: 0, filter: 'blur(4px)' }
            : false
        }
        animate={
          shouldReduceMotion
            ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
            : shouldAnimateIntro
            ? {
                scale: [0.88, 1.06, 1],
                opacity: [0, 1, 1],
                filter: ['blur(4px)', 'blur(0px)', 'blur(0px)'],
              }
            : shouldBreathe
            ? {
                scale: [1, 1.055, 1],
                y: [0, -1.5, 0],
              }
            : { scale: 1, opacity: 1, filter: 'blur(0px)' }
        }
        transition={
          shouldAnimateIntro
            ? {
                duration: 2.2,
                times: [0, 0.6, 1],
                ease: 'easeInOut' as const,
              }
            : shouldBreathe
            ? {
                duration: 8, // 4s in, 4s out
                repeat: Infinity,
                ease: 'easeInOut' as const,
              }
            : { duration: 0.3 }
        }
      >
        <img
          src="/brand/logo.png"
          alt="Clearhale"
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
          loading="eager"
        />
      </motion.div>
    </div>
  );
}
