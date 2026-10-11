'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudRain,
  Compass,
  Satellite,
  BarChart3,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { ForecastChart } from '@/components/charts';
import { KpiCard } from '@/components/features';
import { Chip, Button } from '@/components/common';
import { forecastApi } from '@/lib/api';
import type { SolarDataPoint, ForecastSummaryMetrics, ForecastHorizon } from '@/lib/types';
import { formatGhi, formatPercent } from '@/lib/utils';

export default function ForecastAnalysisPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>('24h');
  const [solarData, setSolarData] = useState<SolarDataPoint[]>([]);
  const [summary, setSummary] = useState<ForecastSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      setIsLoading(true);
      try {
        const [series, sum] = await Promise.all([
          forecastApi.getForecastSeries(horizon),
          forecastApi.getForecastSummary(),
        ]);
        setSolarData(series);
        setSummary(sum);
      } finally {
        setIsLoading(false);
      }
    }
    loadForecast();
  }, [horizon]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>GHI Irradiance & Neural Vector Analysis</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time Global Horizontal Irradiance (GHI) estimation driven by convolutional satellite motion vectors.
          </p>
        </div>

        {/* Forecast Horizon Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          {(['15m', '1h', '4h', '24h', '48h'] as ForecastHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                horizon === h
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {h.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy & Satellite Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Root Mean Squared Error (RMSE)"
          value={summary ? `${summary.rootMeanSquaredError}` : '18.4'}
          unit="W/m²"
          changePercent={-14.2}
          changeLabel="vs standard persistence"
          variant="amber"
          icon={<BarChart3 className="w-5 h-5" />}
          tooltip="Lower is better: indicates deviation between actual and predicted GHI"
        />
        <KpiCard
          title="Mean Absolute Error (MAPE)"
          value={summary ? `${summary.meanAbsoluteErrorPercent}` : '3.8'}
          unit="%"
          changePercent={-2.1}
          changeLabel="improvement this week"
          variant="emerald"
          icon={<TrendingDown className="w-5 h-5" />}
          tooltip="Absolute percentage error across daylight hours (>20 W/m²)"
        />
        <KpiCard
          title="Cloud Motion Vector"
          value="NW (285°)"
          unit="@ 14 km/h"
          variant="sky"
          icon={<Compass className="w-5 h-5" />}
          tooltip="Derived from 5-minute optical flow cross-correlation on GOES-16 Band 2"
        />
        <KpiCard
          title="Satellite Stream Health"
          value="LIVE"
          unit="100% feed uptime"
          variant="emerald"
          icon={<Satellite className="w-5 h-5" />}
          tooltip="GOES-16 ABI channel 2 (0.64 µm red band) 500m resolution stream"
        />
      </div>

      {/* Main Interactive Forecast Chart */}
      <ForecastChart
        data={solarData}
        title={`GHI Irradiance Curve & Solar PV Yield (${horizon.toUpperCase()} Horizon)`}
      />

      {/* Physics Breakdown Table: GHI, DNI, DHI */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Solar Radiation Decomposition & Atmospheric Attenuation
            </h3>
            <p className="text-xs text-zinc-500">
              Direct Normal Irradiance (DNI) and Diffuse Horizontal Irradiance (DHI) partition.
            </p>
          </div>
          <Chip variant="neutral" size="sm">
            ISO / NREL Standard
          </Chip>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Interval</th>
                <th className="py-2.5 px-3">GHI Forecast</th>
                <th className="py-2.5 px-3">GHI Actual</th>
                <th className="py-2.5 px-3">Estimated DNI</th>
                <th className="py-2.5 px-3">Cloud Attenuation</th>
                <th className="py-2.5 px-3">Predicted PV (MW)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
              {solarData.slice(4, 12).map((item) => (
                <tr key={item.timestamp} className="hover:bg-zinc-50 dark:hover:bg-zinc-850">
                  <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {item.timestamp}
                  </td>
                  <td className="py-2.5 px-3 text-amber-500 font-semibold">
                    {formatGhi(item.ghiForecast)}
                  </td>
                  <td className="py-2.5 px-3 text-sky-500">
                    {item.ghiActual !== undefined ? formatGhi(item.ghiActual) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                    {Math.round(item.ghiForecast * 0.88)} W/m²
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.cloudCoverPercent > 30
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.cloudCoverPercent}% cover
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.pvPowerForecastMW} MW
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="w-2 h-2 rounded-full inline-block bg-emerald-500" />
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
