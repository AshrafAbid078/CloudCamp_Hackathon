'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SunMedium,
  Zap,
  BatteryCharging,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { KpiCard } from '@/components/features';
import { ForecastChart, DispatchGantt } from '@/components/charts';
import { Chip, Button } from '@/components/common';
import { forecastApi, dispatchApi } from '@/lib/api';
import type { SolarDataPoint, DispatchInterval } from '@/lib/types';
import { useCopilot } from '@/hooks';

export default function DashboardOverviewPage() {
  const [solarData, setSolarData] = useState<SolarDataPoint[]>([]);
  const [dispatchData, setDispatchData] = useState<DispatchInterval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendMessage, setOpen } = useCopilot();

  useEffect(() => {
    async function loadData() {
      try {
        const [solar, dispatch] = await Promise.all([
          forecastApi.getForecastSeries('24h'),
          dispatchApi.getDispatchSchedule(),
        ]);
        setSolarData(solar);
        setDispatchData(dispatch.intervals);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickCopilot = (prompt: string) => {
    setOpen(true);
    sendMessage(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                SCADA Real-Time Sync
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-300">Mohave Array Cluster #1</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Solar Irradiance & BESS Optimization Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Next-generation neural irradiance forecasting integrated directly with CAISO day-ahead dispatch schedules and battery state of charge arbitration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/forecast">
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                GHI Analysis
              </Button>
            </Link>
            <Link href="/dispatch">
              <Button variant="amber" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Review Dispatch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Instantaneous PV Output"
          value="94.2"
          unit="MW"
          changePercent={4.8}
          changeLabel="above GHI baseline"
          variant="amber"
          icon={<SunMedium className="w-5 h-5" />}
          tooltip="Calculated from inverter telemetry across 48 tracking strings"
        />
        <KpiCard
          title="Surface GHI Index"
          value="785"
          unit="W/m²"
          changePercent={-2.1}
          changeLabel="vs 12:00 peak"
          variant="sky"
          icon={<Radio className="w-5 h-5" />}
          tooltip="Calibrated pyranometer reading fused with GOES-16 satellite imagery"
        />
        <KpiCard
          title="BESS Fleet State of Charge"
          value="74.2"
          unit="%"
          changePercent={12.0}
          changeLabel="recharged today"
          variant="emerald"
          icon={<BatteryCharging className="w-5 h-5" />}
          tooltip="29.6 MWh stored in lithium-ion cells ready for 18:00 peak discharge"
        />
        <KpiCard
          title="Projected Daily Yield"
          value="$18,450"
          changePercent={18.4}
          changeLabel="vs non-storage baseline"
          variant="violet"
          icon={<DollarSign className="w-5 h-5" />}
          tooltip="Net day-ahead wholesale revenue after battery cycling degradation"
        />
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ForecastChart data={solarData} />
        </div>

        {/* AI Copilot Quick Insights Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Autonomous Insights
                </h3>
              </div>
              <Chip variant="amber" size="sm">
                Real-Time AI
              </Chip>
            </div>

            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                  13:00 Cloud Band Detected:
                </span>
                Cloud motion vector analysis predicts a 120 W/m² irradiance dip. Optimizer shifted BESS charge curve to protect state of charge.
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  Arbitrage Window Armed:
                </span>
                CAISO evening peak window ($142.00/MWh) scheduled for 18:00 - 20:30. Battery output locked at 35 MW.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4 space-y-2">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">
              Suggested Operator Queries:
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleQuickCopilot("Explain why BESS is holding at 13:00 instead of charging")}
                className="w-full text-left p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-[11px] text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                → Why is BESS holding at 13:00 instead of charging?
              </button>
              <button
                onClick={() => handleQuickCopilot("What is the current curtailment risk at the Mohave substation?")}
                className="w-full text-left p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-[11px] text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                → What is the current curtailment risk at the substation?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Schedule Preview */}
      <div>
        <DispatchGantt intervals={dispatchData} />
      </div>
    </div>
  );
}
