'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';

interface WaveformBarsProps {
  className?: string;
  barCount?: number;
  colorClass?: string;
  size?: 'sm' | 'md';
}

export function WaveformBars({
  className = '',
  barCount = 4,
  colorClass = 'bg-rose-500',
  size = 'md',
}: WaveformBarsProps) {
  const shouldReduceMotion = useReducedMotion();

  const barHeight = size === 'sm' ? 'h-3.5' : 'h-5';
  const barWidth = size === 'sm' ? 'w-0.5' : 'w-1';

  if (shouldReduceMotion) {
    return (
      <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
        {Array.from({ length: barCount }).map((_, i) => (
          <span
            key={i}
            className={`${barWidth} h-3 rounded-full ${colorClass} opacity-80`}
          />
        ))}
      </div>
    );
  }

  // Pre-configured distinct bounce heights & delay offsets for organic audio feel
  const animations = [
    { height: ['30%', '90%', '40%'], duration: 0.65, delay: 0 },
    { height: ['60%', '100%', '30%'], duration: 0.55, delay: 0.15 },
    { height: ['40%', '85%', '50%'], duration: 0.7, delay: 0.08 },
    { height: ['70%', '35%', '90%'], duration: 0.6, delay: 0.22 },
    { height: ['35%', '80%', '45%'], duration: 0.5, delay: 0.12 },
  ];

  return (
    <div
      className={`flex items-center justify-center gap-1 ${barHeight} ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const anim = animations[i % animations.length];
        return (
          <span
            key={i}
            className={`${barWidth} rounded-full ${colorClass} transition-all`}
            style={{
              height: '100%',
              animation: `waveformBounce ${anim.duration}s ease-in-out infinite alternate`,
              animationDelay: `${anim.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
