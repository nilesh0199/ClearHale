'use client';

import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
}

export function BlurText({
  text,
  delay = 0.05,
  className = '',
  animateBy = 'words',
}: BlurTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: delay, delayChildren: 0.1 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 18,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      y: 8,
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ marginRight: animateBy === 'words' ? '0.28em' : '0.02em' }}
        >
          {element}
        </motion.span>
      ))}
    </motion.span>
  );
}
