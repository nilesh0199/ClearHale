'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BreathingRingProps {
  colorHex?: string;
  size?: number;
  strokeWidth?: number;
  mode?: 'ambient' | 'guided' | 'welcome';
  children?: React.ReactNode;
  isBreathingIn?: boolean;
}

export function BreathingRing({
  colorHex = '#10B981',
  size = 240,
  strokeWidth = 3.5,
  mode = 'ambient',
  children,
  isBreathingIn,
}: BreathingRingProps) {
  const shouldReduceMotion = useReducedMotion();

  const radius = (size - strokeWidth * 4) / 2;
  const circumference = 2 * Math.PI * radius;

  // Reduced motion: static rendering with soft glow
  if (shouldReduceMotion) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--palette-200)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorHex}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Welcome animation: draws itself, expands, contracts
  if (mode === 'welcome') {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.svg
          width={size}
          height={size}
          className="absolute inset-0"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{
            scale: [0.92, 1.05, 1],
            opacity: [0, 1, 1],
          }}
          transition={{
            duration: 2.2,
            times: [0, 0.6, 1],
            ease: 'easeInOut',
          }}
        >
          {/* Subtle outer halo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--palette-200)"
            strokeWidth={1.5}
            fill="none"
          />
          {/* Main animated path */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1, rotate: -90 }}
            transition={{
              duration: 1.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: 'center' }}
          />
        </motion.svg>
        <div className="relative z-10 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Guided breathing mode for Learn tab
  if (mode === 'guided') {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Soft background pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.85,
            height: size * 0.85,
            backgroundColor: colorHex.startsWith('#') ? `${colorHex}15` : colorHex,
          }}
          animate={{
            scale: isBreathingIn ? 1.15 : 0.9,
            opacity: isBreathingIn ? 0.35 : 0.1,
          }}
          transition={{
            duration: 4,
            ease: 'easeInOut',
          }}
        />

        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--palette-200)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorHex}
            strokeWidth={strokeWidth + 1}
            strokeLinecap="round"
            fill="none"
            animate={{
              scale: isBreathingIn ? 1.05 : 0.95,
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: 'center' }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Ambient Home Ring: subtle breathing rhythm (scale 1.00 -> 1.02 -> 1.00 over 5s) only when idle, never frantic
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <motion.svg
        width={size}
        height={size}
        className="absolute inset-0"
        animate={{
          scale: [1.0, 1.02, 1.0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: 'center' }}
      >
        {/* Background track: strictly neutral 200 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--palette-200)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Breathing calibrated foreground ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorHex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          style={{
            transformOrigin: 'center',
            transition: 'stroke 0.6s ease-in-out',
          }}
        />
      </motion.svg>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {children}
      </div>
    </div>
  );
}
