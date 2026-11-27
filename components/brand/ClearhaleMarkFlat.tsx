'use client';

import React from 'react';

export interface ClearhaleMarkFlatProps {
  size?: number;
  className?: string;
  color?: string; // If omitted, defaults to currentColor or teal
  idPrefix?: string;
}

export function ClearhaleMarkFlat({
  size = 24,
  className = '',
  color,
  idPrefix = 'cmflat',
}: ClearhaleMarkFlatProps) {
  const maskId = `${idPrefix}-mask`;
  const strokeColor = color || 'currentColor';
  const fillColor = color || 'currentColor';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Clearhale flat mark"
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100" height="100" fill="white" />
            {/* Cut-out negative space veins */}
            <g stroke="black" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Left veins cutout */}
              <path d="M 44 44 C 39 47, 34 38, 30 23" strokeWidth="2.8" />
              <path d="M 41 53 C 32 59, 23 68, 17 72" strokeWidth="2.2" />
              <path d="M 38 45 C 27 47, 19 50, 13 52" strokeWidth="2.2" />
              <path d="M 34 35 C 26 34, 20 33, 16 32" strokeWidth="2.2" />
              <path d="M 39 48 C 42 42, 43 37, 44 32" strokeWidth="2.2" />
              {/* Right veins cutout */}
              <path d="M 56 44 C 61 47, 66 37, 71 20" strokeWidth="2.8" />
              <path d="M 59 53 C 68 59, 77 68, 83 73" strokeWidth="2.2" />
              <path d="M 62 45 C 73 47, 81 50, 87 52" strokeWidth="2.2" />
              <path d="M 66 35 C 74 34, 80 33, 84 32" strokeWidth="2.2" />
              <path d="M 61 48 C 58 42, 57 37, 56 32" strokeWidth="2.2" />
            </g>
          </mask>
        </defs>

        {/* Masked leaf lobes */}
        <g mask={`url(#${maskId})`}>
          {/* Left Lobe */}
          <path
            d="M 30 20 C 18 28, 9 44, 9 58 C 9 71, 17 83, 30 85 C 36 86, 42 84, 45 80 C 47 73, 47 61, 46 49 C 45 38, 41 27, 30 20 Z"
            fill={fillColor}
          />
          {/* Right Lobe */}
          <path
            d="M 72 17 C 84 25, 93 42, 93 57 C 93 72, 85 84, 71 87 C 64 88, 58 85, 55 81 C 53 74, 53 62, 54 50 C 55 38, 60 25, 72 17 Z"
            fill={fillColor}
          />
        </g>

        {/* Trachea & main bronchi */}
        <g>
          <path
            d="M 50 14 L 50 31"
            stroke={strokeColor}
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 50 31 C 49 37, 47 41, 44 44"
            stroke={strokeColor}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 50 31 C 51 37, 53 41, 56 44"
            stroke={strokeColor}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
