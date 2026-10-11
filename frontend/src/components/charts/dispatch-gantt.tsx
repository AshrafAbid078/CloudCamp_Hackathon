'use client';

import React, { useState } from 'react';
import type { DispatchInterval } from '@/lib/types';
import { Chip } from '@/components/common';
import { formatPowerMW, formatCurrency } from '@/lib/utils';
import { BatteryCharging, Battery, ArrowUpRight, ArrowDownLeft, Clock, DollarSign } from 'lucide-react';

interface DispatchGanttProps {
  intervals: DispatchInterval[];
  onSelectInterval?: (interval: DispatchInterval) => void;
}

export function DispatchGantt({ intervals, onSelectInterval }: DispatchGanttProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (interval: DispatchInterval) => {
    setSelectedId(interval.id);
    if (onSelectInterval) {
      onSelectInterval(interval);
    }
  };

  return (
    <div className="w-full p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            24h Battery Dispatch Schedule & LMP Arbitrage
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time optimization engine schedules storage to absorb solar and discharge at evening peak tariffs.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Charge (Absorb)</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-violet-500"></span>
            <span>Discharge (Peak)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-zinc-300 dark:bg-zinc-700"></span>
            <span>Hold</span>
          </div>
        </div>
      </div>

      {/* Timeline Gantt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {intervals.map((item) => {
          const isSelected = selectedId === item.id;
          const isCharging = item.action === 'charge';
          const isDischarging = item.action === 'discharge';

          return (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 dark:bg-sky-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {item.timestamp}
                  </span>
                </div>
                <Chip
                  variant={isCharging ? 'success' : isDischarging ? 'info' : 'neutral'}
                  size="sm"
                  className="uppercase font-semibold tracking-wider"
                >
                  {item.action}
                </Chip>
              </div>

              {/* Power and SoC Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    {isDischarging ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-violet-500" />
                    ) : isCharging ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    BESS Output:
                  </span>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">
                    {formatPowerMW(item.batteryPowerMW)}
                  </span>
                </div>

                {/* State of Charge Progress Bar */}
                <div className="w-full">
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>SoC Level</span>
                    <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {item.stateOfChargePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        item.stateOfChargePercent > 80
                          ? 'bg-emerald-500'
                          : item.stateOfChargePercent > 30
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.stateOfChargePercent}%` }}
                    />
                  </div>
                </div>

                {/* LMP Market Clearing & Yield */}
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">LMP Price:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(item.clearingPricePerMWh)}/MWh
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
