'use client';

import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

interface ParticlesProps {
  density?: number; // 1 to 10 scale (or mapped from PM2.5)
  color?: string; // hex or rgba
  speed?: number; // drift speed multiplier
  thinFactor?: number; // 0 (full) to 1 (completely cleared by actions)
  className?: string;
}

export function Particles({
  density = 3,
  color = 'rgba(16, 185, 129, 0.25)',
  speed = 0.5,
  thinFactor = 0,
  className = '',
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Compute effective particle count: base on density, thinned by thinFactor
    const effectiveDensity = Math.max(0.5, density * (1 - thinFactor * 0.7));
    const count = Math.min(60, Math.floor((width * height) / 25000) * effectiveDensity);

    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      maxAlpha: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4 * speed,
        vy: (Math.random() * -0.5 - 0.1) * speed, // gentle upward thermal drift
        alpha: Math.random() * 0.5,
        maxAlpha: Math.random() * 0.4 + 0.15,
      });
    }

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = color;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [density, color, speed, thinFactor, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.85 }}
    />
  );
}
