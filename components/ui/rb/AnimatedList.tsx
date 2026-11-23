'use client';

import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}

export function AnimatedList({
  children,
  stagger = 0.08,
  className = '',
}: AnimatedListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <AnimatedListItem key={index}>{child}</AnimatedListItem>
      ))}
    </motion.div>
  );
}

function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 280,
        damping: 24,
      },
    },
  };

  return <motion.div variants={itemVariants}>{children}</motion.div>;
}
