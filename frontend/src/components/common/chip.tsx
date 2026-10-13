'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'clean' | 'solar' | 'stress' | 'architecture-ready' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Chip({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}: ChipProps) {
  const variants: Record<string, string> = {
    clean: 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border-[var(--accent-clean)]/30',
    success: 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border-[var(--accent-clean)]/30',
    solar: 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] border-[var(--accent-solar)]/30',
    warning: 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] border-[var(--accent-solar)]/30',
    stress: 'bg-[var(--accent-stress)]/15 text-[var(--accent-stress)] border-[var(--accent-stress)]/30',
    danger: 'bg-[var(--accent-stress)]/15 text-[var(--accent-stress)] border-[var(--accent-stress)]/30',
    info: 'bg-[var(--bg-surface-raised)] text-[var(--accent-solar)] border-[var(--border-hairline)]',
    neutral: 'bg-[var(--bg-surface-raised)] text-[var(--text-muted)] border-[var(--border-hairline)]',
    'architecture-ready': 'bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border-[var(--tag-architecture-ready)]/40',
  };

  const dotColors: Record<string, string> = {
    clean: 'bg-[var(--accent-clean)]',
    success: 'bg-[var(--accent-clean)]',
    solar: 'bg-[var(--accent-solar)]',
    warning: 'bg-[var(--accent-solar)]',
    stress: 'bg-[var(--accent-stress)]',
    danger: 'bg-[var(--accent-stress)]',
    info: 'bg-[var(--accent-solar)]',
    neutral: 'bg-[var(--text-muted)]',
    'architecture-ready': 'bg-[var(--tag-architecture-ready)]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border tracking-wide transition-colors',
        variants[variant] || variants.neutral,
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant] || dotColors.neutral)}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
