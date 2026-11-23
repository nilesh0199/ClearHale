'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // seconds
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  className = '',
  suffix = '',
  prefix = '',
}: CountUpProps) {
  const [current, setCurrent] = useState(from);
  const shouldReduceMotion = useReducedMotion();
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrent(to);
      return;
    }

    let animationFrameId: number;
    startTimeRef.current = null;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutExpo(progress);

      const nextVal = from + (to - from) * easedProgress;
      setCurrent(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrent(to);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [to, from, duration, shouldReduceMotion]);

  const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
