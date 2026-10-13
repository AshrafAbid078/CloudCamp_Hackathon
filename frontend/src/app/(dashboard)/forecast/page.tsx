'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sun,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { ForecastChart } from '@/components/charts';
import { forecastApi } from '@/lib/api';
import type { SolarDataPoint, ForecastSummaryMetrics, ForecastHorizon } from '@/lib/types';
import { formatGhi } from '@/lib/utils';
import { useRoleStore } from '@/lib/store/useRoleStore';

export default function ForecastDetailPage() {
  const { forecastHorizon, setForecastHorizon, activeModel, setActiveModel } = useRoleStore();
  const [solarData, setSolarData] = useState<SolarDataPoint[]>([]);
  const [summary, setSummary] = useState<ForecastSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setIsLoading(true);
      try {
        const [series, sum] = await Promise.all([
          forecastApi.getForecastSeries(forecastHorizon),
          forecastApi.getForecastSummary(),
        ]);
        if (isMounted) {
          setSolarData(series);
          setSummary(sum);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadForecast();
    return () => {
      isMounted = false;
    };
  }, [forecastHorizon]);

  return (
    <div className="space-y-6">
      {/* Page Header with Region, Target & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Sun className="w-6 h-6 text-[var(--accent-solar)]" />
              <span>GHI Solar Irradiance & Atmospheric Attenuation</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              Region: Bangladesh (Chittagong)
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Coupled machine learning irradiance prediction (NREL NSRDB + NOAA GFS) feeding real-time flexible load optimizers.
          </p>
        </div>

        {/* Horizon Switcher & Model Indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            {(['6h', '12h', '24h'] as ForecastHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                  forecastHorizon === h
                    ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {h.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Indicator & Data Confidence Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Indicator Card */}
        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Active Inference Engine
              </div>
              <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{activeModel} Model</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
                  Primary
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {activeModel === 'LightGBM'
                  ? 'LightGBM Gradient Boosting with Cloud Motion Vectors & Solar Zenith Angle'
                  : 'Persistence Baseline (t-24h lagged physical clear-sky reference)'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveModel(activeModel === 'LightGBM' ? 'PersistenceBaseline' : 'LightGBM')}
              className="text-xs px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-[var(--text-primary)] font-semibold transition-all cursor-pointer"
            >
              Toggle {activeModel === 'LightGBM' ? 'Baseline' : 'LightGBM'}
            </button>
          </div>
        </div>

        {/* Data Confidence Indicator Card */}
        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--accent-clean)]/15 text-[var(--accent-clean)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Electricity Maps Feed Confidence
              </div>
              <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Direct Feed: High Confidence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
                  isEstimated: false
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Estimation method: <strong className="text-[var(--text-primary)]">NOAA GFS + NREL NSRDB Physical Coupling</strong>
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[var(--text-muted)] text-right">
            Last Poll:<br /><span className="text-[var(--accent-clean)]">14:25 BST</span>
          </span>
        </div>
      </div>

      {/* GHI Hero Chart with Toggle Overlays (DNI, DHI, Clearsky) */}
      {isLoading ? (
        <div className="h-[420px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
          Computing atmospheric radiative transfer equations...
        </div>
      ) : (
        <ForecastChart
          data={solarData}
          title={`Surface Solar Irradiance Curve & Cloud Attenuation (${forecastHorizon.toUpperCase()} Horizon)`}
          subtitle="Turn on optional DNI, DHI, or Clearsky overlay lines below to inspect atmospheric partitioning."
          showGridStress={true}
          showOverlaysToggle={true}
        />
      )}

      {/* Backtested Accuracy Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent-solar)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
              Backtested Accuracy Breakdown: LightGBM vs. Persistence Baseline
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Tested across 10-year historical NSRDB Bangladesh dataset
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary?.benchmarks.map((b) => (
            <div
              key={b.metric}
              className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md space-y-3"
            >
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase font-mono tracking-wider">
                {b.metric}
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold font-mono text-[var(--accent-solar)]">
                    {b.lightGbmValue}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)] ml-1">{b.unit}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                    LightGBM Model
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-base font-semibold font-mono text-[var(--text-muted)]">
                    {b.persistenceValue} {b.unit}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                    Persistence Baseline
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Performance uplift:</span>
                <span className="font-mono font-bold text-[var(--accent-clean)] bg-[var(--accent-clean)]/15 px-2 py-0.5 rounded-lg border border-[var(--accent-clean)]/30">
                  +{b.improvementPercent}% more accurate
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Raw Data Table Linking to Data Sources */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
              Raw Telemetry Table: NSRDB Historical vs. GFS Forecast Inputs
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Side-by-side verification comparing satellite irradiance inputs and numerical weather predictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="https://nsrdb.nrel.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>NREL NSRDB</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>NOAA GFS</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] font-mono uppercase text-[11px]">
                <th className="py-3 px-3">Interval</th>
                <th className="py-3 px-3">LightGBM Forecast</th>
                <th className="py-3 px-3">SCADA Actual</th>
                <th className="py-3 px-3">NSRDB 10-Yr Hist</th>
                <th className="py-3 px-3">GFS Cloud Cover</th>
                <th className="py-3 px-3">Grid Stress Index</th>
                <th className="py-3 px-3">Carbon (gCO₂)</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]/60 font-mono">
              {solarData.slice(0, 12).map((item) => (
                <tr key={item.timestamp} className="hover:bg-[var(--bg-surface-raised)]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                    {item.timestamp} BST
                  </td>
                  <td className="py-3 px-3 text-[var(--accent-solar)] font-bold">
                    {formatGhi(item.ghiForecast)}
                  </td>
                  <td className="py-3 px-3 text-[var(--accent-clean)] font-bold">
                    {item.ghiActual !== undefined ? formatGhi(item.ghiActual) : '—'}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">
                    {item.nsrdbHistoricalGhi ? `${item.nsrdbHistoricalGhi} W/m²` : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.cloudCoverPercent > 35
                          ? 'bg-[var(--accent-stress)]/15 text-[var(--accent-stress)]'
                          : 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)]'
                      }`}
                    >
                      {item.cloudCoverPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        item.gridStressIndex > 70
                          ? 'text-[var(--accent-stress)]'
                          : item.gridStressIndex > 40
                          ? 'text-[var(--accent-solar)]'
                          : 'text-[var(--accent-clean)]'
                      }`}
                    >
                      {item.gridStressIndex}/100
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-primary)]">
                    {item.carbonIntensityGco2} g/kWh
                  </td>
                  <td className="py-3 px-3">
                    <span className="w-2 h-2 rounded-full inline-block bg-[var(--accent-clean)]" />
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
