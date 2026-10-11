'use client';

import React, { useState, useEffect } from 'react';
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
import { formatGhi, formatPowerMW } from '@/lib/utils';

interface ForecastChartProps {
  data: SolarDataPoint[];
  title?: string;
}

export function ForecastChart({ data, title = 'Solar Irradiance (GHI) Curve vs 24h Inference' }: ForecastChartProps) {
  const [metricMode, setMetricMode] = useState<'ghi' | 'power'>('ghi');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-80 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-xs text-zinc-400">
        Initializing High-Precision Forecast Engine...
      </div>
    );
  }

  return (
    <div className="w-full p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            GOES-16 satellite cloud motion vectors coupled with ground pyranometer neural inference.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('ghi')}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              metricMode === 'ghi'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            GHI (W/m²)
          </button>
          <button
            onClick={() => setMetricMode('power')}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              metricMode === 'power'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            PV Power (MW)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ghiConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#888' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#888' }}
              tickFormatter={(v) => (metricMode === 'ghi' ? `${v}` : `${v}M`)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload as SolarDataPoint;
                  return (
                    <div className="p-3 bg-zinc-900/95 text-white rounded-xl border border-zinc-700 shadow-xl text-xs backdrop-blur-md space-y-1.5">
                      <div className="font-semibold text-zinc-300 border-b border-zinc-700 pb-1">
                        Time: {label}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-amber-400">Model Forecast:</span>
                        <span className="font-mono font-bold">
                          {metricMode === 'ghi'
                            ? formatGhi(dataPoint.ghiForecast)
                            : formatPowerMW(dataPoint.pvPowerForecastMW)}
                        </span>
                      </div>
                      {dataPoint.ghiActual !== undefined && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sky-400">Actual SCADA:</span>
                          <span className="font-mono font-bold">
                            {metricMode === 'ghi'
                              ? formatGhi(dataPoint.ghiActual)
                              : formatPowerMW(dataPoint.pvPowerActualMW ?? 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
                        <span>Cloud Cover:</span>
                        <span>{dataPoint.cloudCoverPercent}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[10px] text-zinc-400">
                        <span>Ambient Temp:</span>
                        <span>{dataPoint.temperatureC}°C</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {metricMode === 'ghi' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="ghiUpperBound"
                  stroke="none"
                  fill="url(#ghiConfidenceGrad)"
                  name="90% Confidence Interval"
                />
                <Line
                  type="monotone"
                  dataKey="ghiForecast"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="AI GHI Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="ghiActual"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                  name="Actual Pyranometer GHI"
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="pvPowerForecastMW"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Predicted PV Power"
                />
                <Line
                  type="monotone"
                  dataKey="pvPowerActualMW"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  name="Actual Inverter Output"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
