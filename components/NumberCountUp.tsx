'use client';

import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface NumberCountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export function NumberCountUp({
  value,
  duration = 1.2,
  className = '',
}: NumberCountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value, duration, shouldReduceMotion]);

  return <span className={className}>{displayValue}</span>;
}
