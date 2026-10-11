'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  BatteryCharging,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { DispatchGantt } from '@/components/charts';
import { KpiCard, OverridePanel } from '@/components/features';
import { Button, Chip } from '@/components/common';
import { dispatchApi } from '@/lib/api';
import type { DispatchInterval, DispatchSummary } from '@/lib/types';
import { formatCurrency, formatEnergyMWh } from '@/lib/utils';
import { useRole } from '@/hooks';

export default function DispatchOptimizationPage() {
  const { role, canOverrideDispatch } = useRole();
  const [intervals, setIntervals] = useState<DispatchInterval[]>([]);
  const [summary, setSummary] = useState<DispatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<DispatchInterval | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const data = await dispatchApi.getDispatchSchedule();
      setIntervals(data.intervals);
      setSummary(data.summary);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOverrideSuccess = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
    fetchSchedule();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-500" />
            <span>BESS Storage Dispatch & Real-Time Optimization</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated MILP (Mixed-Integer Linear Programming) schedule optimizing battery state-of-charge against CAISO day-ahead price nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedule}
            isLoading={isLoading}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh LMP Schedule
          </Button>
          <Chip variant="success" size="sm" dot>
            Solver: MILP v4.1 Converged
          </Chip>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Projected Daily Net Revenue"
          value={summary ? formatCurrency(summary.dailyRevenueUSD) : '$18,450'}
          changePercent={22.4}
          changeLabel="vs solar-only feed-in"
          variant="violet"
          icon={<DollarSign className="w-5 h-5" />}
          tooltip="Calculated from peak tariff discharge minus low-price absorption charging"
        />
        <KpiCard
          title="Solar Curtailment Avoided"
          value={summary ? `${summary.curtailmentAvoidedMWh}` : '42.8'}
          unit="MWh"
          changePercent={100}
          changeLabel="absorbed by BESS"
          variant="emerald"
          icon={<BatteryCharging className="w-5 h-5" />}
          tooltip="Energy diverted to batteries that would have breached transmission limits"
        />
        <KpiCard
          title="Battery Cell Cycling Degradation"
          value={summary ? `${summary.batteryCycleCount}` : '1.15'}
          unit="EFC / day"
          variant="sky"
          icon={<RotateCw className="w-5 h-5" />}
          tooltip="Equivalent full cycles; constrained below 1.5/day warranty threshold"
        />
        <KpiCard
          title="Optimal Discharge Window"
          value="18:00 - 21:00"
          unit="$142/MWh peak"
          variant="amber"
          icon={<Zap className="w-5 h-5" />}
          tooltip="Target market window delivering maximum wholesale price arbitrage"
        />
      </div>

      {/* Interactive Gantt Timeline */}
      <DispatchGantt
        intervals={intervals}
        onSelectInterval={(inv) => setSelectedInterval(inv)}
      />

      {/* Override Panel */}
      <div className="pt-2">
        <OverridePanel onSuccess={handleOverrideSuccess} />
      </div>

      {/* Detailed Interval Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Dispatch Ledger & Locational Marginal Pricing Table
            </h3>
            <p className="text-xs text-zinc-500">
              Interval-by-interval power routing, state of charge trajectory, and projected financial settlements.
            </p>
          </div>
          <Chip variant="neutral" size="sm">
            Node: MOHAVE_500_B1
          </Chip>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Interval</th>
                <th className="py-2.5 px-3">Battery Dispatch</th>
                <th className="py-2.5 px-3">State of Charge</th>
                <th className="py-2.5 px-3">PV Generation</th>
                <th className="py-2.5 px-3">Grid LMP Tariff</th>
                <th className="py-2.5 px-3">Interval Revenue</th>
                <th className="py-2.5 px-3">Action Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
              {intervals.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850">
                  <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {item.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.batteryPowerMW > 0
                      ? `+${item.batteryPowerMW} MW`
                      : `${item.batteryPowerMW} MW`}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-sky-500">
                      {item.stateOfChargePercent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-amber-500 font-semibold">
                    {item.solarGenerationMW} MW
                  </td>
                  <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(item.clearingPricePerMWh)}/MWh
                  </td>
                  <td
                    className={`py-2.5 px-3 font-bold ${
                      item.projectedRevenueUSD >= 0 ? 'text-emerald-500' : 'text-zinc-400'
                    }`}
                  >
                    {formatCurrency(item.projectedRevenueUSD)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="capitalize font-sans font-semibold text-[11px] text-zinc-600 dark:text-zinc-300">
                      {item.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
