'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';

interface ShinyTextProps {
  text?: string;
  disabled?: boolean;
  speed?: number; // in seconds
  className?: string;
  children?: React.ReactNode;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
  children,
}: ShinyTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || disabled) {
    return <span className={className}>{children || text}</span>;
  }

  return (
    <span
      className={`inline-block relative bg-clip-text text-transparent bg-[linear-gradient(110deg,var(--text-secondary),45%,var(--text-primary),55%,var(--text-secondary))] bg-[length:250%_100%] animate-shine ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {children || text}
    </span>
  );
}
