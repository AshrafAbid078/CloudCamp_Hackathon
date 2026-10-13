'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  BatteryCharging,
  DollarSign,
  ArrowRight,
  Sparkles,
  Leaf,
  ChevronRight,
  Info,
} from 'lucide-react';
import { KpiCard } from '@/components/features';
import { ForecastChart } from '@/components/charts';
import { Button } from '@/components/common';
import { forecastApi, dispatchApi } from '@/lib/api';
import type {
  SolarDataPoint,
  ForecastHorizon,
  ScheduledActionItem,
  DispatchSummaryKpis,
} from '@/lib/types';
import { useCopilot, useRole } from '@/hooks';
import { useRoleStore } from '@/lib/store/useRoleStore';

export default function DashboardOverviewPage() {
  const { isFacilityManager } = useRole();
  const { forecastHorizon, setForecastHorizon, dataConfidence } = useRoleStore();
  const [solarData, setSolarData] = useState<SolarDataPoint[]>([]);
  const [scheduledActions, setScheduledActions] = useState<ScheduledActionItem[]>([]);
  const [kpis, setKpis] = useState<DispatchSummaryKpis | null>(null);
  const [isCachedBannerOpen, setIsCachedBannerOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { sendMessage, setOpen } = useCopilot();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [solar, tracks, actions] = await Promise.all([
          forecastApi.getForecastSeries(forecastHorizon),
          dispatchApi.getDispatchTracks(),
          dispatchApi.getScheduledActions(),
        ]);
        if (isMounted) {
          setSolarData(solar);
          setKpis(tracks.summaryKpis);
          setScheduledActions(actions);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [forecastHorizon]);

  const handleAskCopilot = (prompt: string) => {
    setOpen(true);
    sendMessage(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Graceful Degradation / Live Telemetry Banner */}
      {isCachedBannerOpen && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-primary)]">
                Regional Feed Telemetry Sync:
              </span>{' '}
              <span className="text-[var(--text-muted)]">
                Showing live solar telemetry fused with Electricity Maps Bangladesh (last cached sample from {dataConfidence.lastPollTimestamp}). Regional latency nominal at {dataConfidence.latencyMs}ms.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              LightGBM Ingestion Live
            </span>
            <button
              onClick={() => setIsCachedBannerOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome & Horizon Control */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface-raised)] to-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-[var(--accent-solar)]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-clean)] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-solar)] font-mono">
                {isFacilityManager ? 'Facility Manager Console' : 'Grid Operator Dispatch Node'}
              </span>
              <span className="text-[var(--border-hairline)]">•</span>
              <span className="text-xs text-[var(--text-muted)]">
                Chittagong Industrial Corridor (Bangladesh)
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight font-heading text-[var(--text-primary)]">
              {isFacilityManager
                ? 'Solar Load Window & Cost Avoidance Hub'
                : 'Feeder Stress Coordination & Aggregate Shave Hub'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
              {isFacilityManager
                ? 'AI engine schedules your heavy industrial machines and battery storage into the cheapest midday rooftop solar window, eliminating expensive evening peak demand tariffs.'
                : 'Real-time locational monitoring coordinating flexible industrial batch loads and 40 MWh storage to relieve 33kV substation feeder stress and eliminate peaker emissions.'}
            </p>
          </div>

          {/* Forecast Horizon Selector (6h / 12h / 24h) */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Forecast Horizon:
            </span>
            <div className="flex items-center p-1 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] shadow-inner">
              {(['6h', '12h', '24h'] as ForecastHorizon[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                    forecastHorizon === h
                      ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-md shadow-[var(--accent-solar)]/20'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {h.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dominant KPI Cards (Compared Against Unoptimized Baseline) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Cost Saved Today ($)"
          value={kpis ? `$${kpis.totalCostSavedUsd.toLocaleString()}` : '$2,840'}
          changePercent={kpis?.costSavedPercent ?? 24.8}
          changeLabel="vs unoptimized schedule"
          variant="clean"
          icon={<DollarSign className="w-5 h-5" />}
          baselineComparison={kpis ? `$${kpis.unoptimizedCostUsd.toLocaleString()} unoptimized run cost` : '$11,450 baseline'}
          tooltip="Calculated by shifting heavy loads from $0.18/kWh evening peak to free rooftop solar"
        />

        <KpiCard
          title="Carbon Avoided (tCO₂)"
          value={kpis ? `${kpis.totalCarbonAvoidedTons} t` : '14.2 t'}
          changePercent={kpis?.carbonAvoidedPercent ?? 38.0}
          changeLabel="emissions reduced"
          variant="clean"
          icon={<Leaf className="w-5 h-5" />}
          baselineComparison={kpis ? `${kpis.unoptimizedCarbonTons} tCO2 grid average` : '37.4 tCO2 baseline'}
          tooltip="Displacing heavy fuel oil and natural gas peaker plants on the BPDB national grid"
        />

        <KpiCard
          title="Peak Demand Shaved (kW)"
          value={kpis ? `${kpis.totalPeakShavedKw} kW` : '380 kW'}
          changePercent={kpis?.peakShavedPercent ?? 32.2}
          changeLabel="peak demand trimmed"
          variant="solar"
          icon={<Zap className="w-5 h-5" />}
          baselineComparison={kpis ? `${kpis.unoptimizedPeakKw} kW uncoordinated spike` : '1,180 kW coincident peak'}
          tooltip="Prevents facility from breaching 1,000 kW maximum demand threshold"
        />
      </div>

      {/* Main Center Area: Solar + Grid-Stress Chart & Right Sidebar Dispatch Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Center Hero: Forecast Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="h-[400px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
              Synthesizing real-time GHI irradiance & Bangladesh stress curves...
            </div>
          ) : (
            <ForecastChart
              data={solarData}
              title={`Solar GHI vs Grid-Stress Forecast (${forecastHorizon.toUpperCase()} Horizon)`}
              subtitle="Golden line tracks LightGBM irradiance with 90% confidence bands; red line tracks regional stress."
              showGridStress={true}
              showOverlaysToggle={false}
            />
          )}

          {/* End-Of-Day Auto-Generated Savings Summary Panel */}
          <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-solar)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                  Auto-Generated Operational Decision Synthesis
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] font-bold">
                MILP Optimal
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {kpis?.explanationText}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[var(--text-muted)]">
                Have questions about this dispatch decision?
              </span>
              <button
                onClick={() =>
                  handleAskCopilot(
                    'Explain why Dye-Vat #2 was scheduled at 11:30 and how the battery mitigated grid stress.'
                  )
                }
                className="text-[var(--accent-solar)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ask Meridian Copilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Today's Dispatch Summary (1 Col) */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                  Today&apos;s Dispatch Summary
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">Top scheduled flexible actions</p>
              </div>
              <Link
                href="/dispatch"
                className="text-[11px] font-bold text-[var(--accent-solar)] hover:underline flex items-center gap-1"
              >
                <span>Full Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Scrollable list of top scheduled actions */}
            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {scheduledActions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)]/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        {act.assetType === 'industrial' ? (
                          <Zap className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
                        ) : (
                          <BatteryCharging className="w-3.5 h-3.5 text-[var(--accent-clean)]" />
                        )}
                        <span>{act.assetName}</span>
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-[var(--accent-solar)] mt-0.5">
                        Window: {act.scheduledTimeWindow}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-[var(--accent-clean)] shrink-0">
                      +${act.costSavedUsd}
                    </span>
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    {act.actionSummary}
                  </p>

                  <div className="pt-1.5 border-t border-[var(--border-hairline)]/60 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>{act.carbonAvoidedKg} kg CO₂ avoided</span>
                    {act.peakKwShaved > 0 && <span>{act.peakKwShaved} kW shaved</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav Button to /dispatch */}
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <Link href="/dispatch">
              <Button variant="solar" size="md" className="w-full font-bold justify-between">
                <span>View Multi-Track Dispatch Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
