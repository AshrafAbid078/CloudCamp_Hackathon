'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { SolarDataPoint } from '@/lib/types';
import { formatGhi } from '@/lib/utils';

interface ForecastChartProps {
  data: SolarDataPoint[];
  title?: string;
  subtitle?: string;
  showGridStress?: boolean;
  showOverlaysToggle?: boolean;
}

export function ForecastChart({
  data,
  title = 'Solar Irradiance (GHI) vs Grid-Stress Forecast',
  subtitle = 'Coupled LightGBM solar forecast with Bangladesh regional grid stress curve',
  showGridStress = true,
  showOverlaysToggle = false,
}: ForecastChartProps) {
  const [showDni, setShowDni] = useState(false);
  const [showDhi, setShowDhi] = useState(false);
  const [showClearsky, setShowClearsky] = useState(false);
  const [viewMetric, setViewMetric] = useState<'irradiance' | 'carbon'>('irradiance');

  return (
    <div className="w-full p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg flex flex-col">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 gap-3 border-b border-[var(--border-hairline)] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
              {title}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30">
              Model: LightGBM v4.2
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        </div>

        {/* Controls & Optional Overlays */}
        <div className="flex items-center gap-2 flex-wrap">
          {showOverlaysToggle && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs">
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-2">Overlays:</span>
              <button
                onClick={() => setShowDni(!showDni)}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                  showDni
                    ? 'bg-[#F97316] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                DNI
              </button>
              <button
                onClick={() => setShowDhi(!showDhi)}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                  showDhi
                    ? 'bg-[#38BDF8] text-[var(--bg-base)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                DHI
              </button>
              <button
                onClick={() => setShowClearsky(!showClearsky)}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                  showClearsky
                    ? 'bg-[var(--text-muted)] text-[var(--bg-base)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Clearsky
              </button>
            </div>
          )}

          {/* Metric View Switch */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs">
            <button
              onClick={() => setViewMetric('irradiance')}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMetric === 'irradiance'
                  ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Solar GHI (W/m²)
            </button>
            <button
              onClick={() => setViewMetric('carbon')}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMetric === 'carbon'
                  ? 'bg-[var(--accent-clean)] text-[var(--bg-base)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Carbon Intensity (gCO₂)
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Solar GHI Confidence Band Gradient */}
              <linearGradient id="solarConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8A33D" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#E8A33D" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2FA98C" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2FA98C" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Subtle Hairline Grid */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#26405C" strokeOpacity={0.6} />

            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={{ stroke: '#26405C' }}
              tick={{ fontSize: 11, fill: '#93A3B5' }}
            />

            {/* Left Axis: Irradiance or Carbon */}
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={{ stroke: '#26405C' }}
              tick={{ fontSize: 11, fill: '#93A3B5' }}
              tickFormatter={(v) => (viewMetric === 'irradiance' ? `${v}` : `${v}g`)}
            />

            {/* Right Axis: Grid Stress Index (0-100) */}
            {showGridStress && viewMetric === 'irradiance' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: '#26405C' }}
                tick={{ fontSize: 10, fill: '#E0604D' }}
                tickFormatter={(v) => `${v}%`}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as SolarDataPoint;
                  return (
                    <div className="p-3.5 bg-[var(--bg-surface-raised)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-hairline)] shadow-2xl text-xs backdrop-blur-xl space-y-2 min-w-[200px]">
                      <div className="font-bold text-[var(--accent-solar)] border-b border-[var(--border-hairline)] pb-1 flex items-center justify-between font-mono">
                        <span>Time: {label} BST</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          {pt.cloudCoverPercent}% cloud
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--accent-solar)] font-medium">Solar Forecast:</span>
                          <span className="font-mono font-bold">{formatGhi(pt.ghiForecast)}</span>
                        </div>

                        {pt.ghiActual !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--accent-clean)] font-medium">Actual Telemetry:</span>
                            <span className="font-mono font-bold">{formatGhi(pt.ghiActual)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[var(--accent-stress)] font-medium">Grid Stress Index:</span>
                          <span className="font-mono font-bold text-[var(--accent-stress)]">
                            {pt.gridStressIndex} / 100
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-hairline)]">
                          <span>Carbon Intensity:</span>
                          <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {pt.carbonIntensityGco2} gCO₂/kWh
                          </span>
                        </div>

                        {showDni && pt.dni !== undefined && (
                          <div className="flex items-center justify-between text-[10px] text-[#F97316]">
                            <span>DNI (Direct):</span>
                            <span className="font-mono">{pt.dni} W/m²</span>
                          </div>
                        )}
                        {showDhi && pt.dhi !== undefined && (
                          <div className="flex items-center justify-between text-[10px] text-[#38BDF8]">
                            <span>DHI (Diffuse):</span>
                            <span className="font-mono">{pt.dhi} W/m²</span>
                          </div>
                        )}
                        {showClearsky && pt.clearsky !== undefined && (
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            <span>Clearsky Potential:</span>
                            <span className="font-mono">{pt.clearsky} W/m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
              iconType="circle"
            />

            {viewMetric === 'irradiance' ? (
              <>
                {/* 90% Confidence Interval Band */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="ghiUpperBound"
                  stroke="none"
                  fill="url(#solarConfidenceGrad)"
                  name="10%-90% Confidence Band"
                />

                {/* Primary Solar Forecast Line: --accent-solar */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ghiForecast"
                  stroke="#E8A33D"
                  strokeWidth={2.5}
                  dot={false}
                  name="Solar Forecast (LightGBM)"
                />

                {/* Actual Solar Pyranometer / Satellite Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ghiActual"
                  stroke="#2FA98C"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#2FA98C' }}
                  name="Actual SCADA GHI"
                />

                {/* Grid-Stress Line: --accent-stress (secondary axis) */}
                {showGridStress && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="gridStressIndex"
                    stroke="#E0604D"
                    strokeWidth={2}
                    dot={false}
                    name="Grid Stress Index (0-100%)"
                  />
                )}

                {/* Optional Overlays */}
                {showDni && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="dni"
                    stroke="#F97316"
                    strokeWidth={1.5}
                    dot={false}
                    name="DNI (Direct)"
                  />
                )}
                {showDhi && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="dhi"
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    dot={false}
                    name="DHI (Diffuse)"
                  />
                )}
                {showClearsky && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clearsky"
                    stroke="#93A3B5"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Clearsky Baseline"
                  />
                )}
              </>
            ) : (
              <>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="carbonIntensityGco2"
                  stroke="#2FA98C"
                  strokeWidth={2.5}
                  fill="url(#carbonGrad)"
                  name="Grid Carbon Intensity (gCO₂/kWh)"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
