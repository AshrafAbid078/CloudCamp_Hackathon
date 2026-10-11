'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'sky' | 'violet' | 'neutral';
  tooltip?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  changePercent,
  changeLabel = 'vs forecast',
  icon,
  variant = 'neutral',
  tooltip,
}: KpiCardProps) {
  const isPositive = (changePercent ?? 0) >= 0;

  const accentBorders = {
    amber: 'border-l-4 border-l-amber-500',
    emerald: 'border-l-4 border-l-emerald-500',
    sky: 'border-l-4 border-l-sky-500',
    violet: 'border-l-4 border-l-violet-500',
    neutral: 'border-l-4 border-l-zinc-400',
  };

  const iconBg = {
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
  };

  return (
    <div
      className={cn(
        'p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700',
        accentBorders[variant]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span>{title}</span>
            {tooltip && (
              <span title={tooltip} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-zinc-500">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0', iconBg[variant])}>
            {icon}
          </div>
        )}
      </div>

      {changePercent !== undefined && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center font-semibold rounded-md px-1.5 py-0.5 text-[11px]',
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {Math.abs(changePercent)}%
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
