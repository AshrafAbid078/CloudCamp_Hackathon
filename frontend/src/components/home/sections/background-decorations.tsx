'use client';

import React from 'react';

export function BackgroundDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Navy Grid Matrix */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radiant Solar-Cycle Horizon Sweep Visual */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[var(--accent-solar)]/12 via-[var(--accent-clean)]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-44 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-solar)]/60 to-transparent" />
      <div className="absolute top-44 -left-1/4 w-1/2 h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-solar)] to-transparent animate-solar-sweep blur-[1px]" />
    </div>
  );
}
