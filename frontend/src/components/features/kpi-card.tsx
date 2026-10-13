'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'solar' | 'clean' | 'stress' | 'neutral' | 'amber' | 'emerald' | 'sky' | 'violet';
  tooltip?: string;
  baselineComparison?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  changePercent,
  changeLabel = 'vs unoptimized baseline',
  icon,
  variant = 'clean',
  tooltip,
  baselineComparison,
  className,
}: KpiCardProps) {
  const isPositive = (changePercent ?? 0) >= 0;

  const accentBorders: Record<string, string> = {
    clean: 'border-l-4 border-l-[var(--accent-clean)]',
    emerald: 'border-l-4 border-l-[var(--accent-clean)]',
    solar: 'border-l-4 border-l-[var(--accent-solar)]',
    amber: 'border-l-4 border-l-[var(--accent-solar)]',
    stress: 'border-l-4 border-l-[var(--accent-stress)]',
    violet: 'border-l-4 border-l-[var(--accent-clean)]',
    sky: 'border-l-4 border-l-[var(--accent-solar)]',
    neutral: 'border-l-4 border-l-[var(--border-hairline)]',
  };

  const iconBg: Record<string, string> = {
    clean: 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)]',
    emerald: 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)]',
    solar: 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)]',
    amber: 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)]',
    stress: 'bg-[var(--accent-stress)]/15 text-[var(--accent-stress)]',
    violet: 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)]',
    sky: 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)]',
    neutral: 'bg-[var(--bg-base)] text-[var(--text-muted)]',
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md flex flex-col justify-between transition-colors hover:bg-[var(--bg-surface-raised)]/70',
        accentBorders[variant] || accentBorders.clean,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            <span>{title}</span>
            {tooltip && (
              <span title={tooltip} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-mono">
              {value}
            </span>
            {unit && <span className="text-xs font-bold text-[var(--text-muted)]">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn('p-3 rounded-2xl shrink-0', iconBg[variant] || iconBg.clean)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] space-y-1">
        {changePercent !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'inline-flex items-center font-bold font-mono rounded-lg px-2 py-0.5 text-[11px]',
                isPositive
                  ? 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30'
                  : 'bg-[var(--accent-stress)]/15 text-[var(--accent-stress)] border border-[var(--accent-stress)]/30'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {isPositive ? `+${changePercent}%` : `${changePercent}%`}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] truncate">{changeLabel}</span>
          </div>
        )}
        {baselineComparison && (
          <div className="text-[10px] text-[var(--text-muted)]/80 font-mono">
            Baseline: {baselineComparison}
          </div>
        )}
      </div>
    </motion.div>
  );
}
