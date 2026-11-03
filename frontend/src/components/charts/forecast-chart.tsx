'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { SolarDataPoint } from '@/lib/types';
import { t } from '@/lib/ui-copy';

type Props = {
  data: SolarDataPoint[];
  title?: string;
  subtitle?: string;
  showGridStress?: boolean;
  showOverlaysToggle?: boolean;
};

export function ForecastChart({
  data,
  title,
  subtitle,
}: Props) {
  const [metric, setMetric] = useState<'ghi' | 'carbon'>('ghi');

  const displayTitle = title || t('forecastTitle');
  const displaySubtitle = subtitle || t('forecastSubtitle');

  return (
    <section className="surface-panel min-w-0 space-y-5 p-6 border border-[var(--border-subtle)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{displayTitle}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{displaySubtitle}</p>
        </div>
        <div className="flex gap-1 rounded-md bg-[var(--surface-overlay)] p-1 text-xs border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setMetric('ghi')}
            aria-pressed={metric === 'ghi'}
            className={
              'rounded px-3 py-1.5 transition-colors ' +
              (metric === 'ghi'
                ? 'bg-[var(--surface-card)] font-bold text-[var(--accent-clean)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')
            }
          >
            Solar GHI (display ranges)
          </button>
          <button
            type="button"
            onClick={() => setMetric('carbon')}
            aria-pressed={metric === 'carbon'}
            className={
              'rounded px-3 py-1.5 transition-colors ' +
              (metric === 'carbon'
                ? 'bg-[var(--surface-card)] font-bold text-[var(--accent-clean)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')
            }
          >
            Carbon Intensity
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No forecast data available.</p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border-hairline)" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#718397' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#718397' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {metric === 'ghi' ? (
                <>
                  <Line
                    dataKey="ghiForecast"
                    name={t('forecastExpected')}
                    stroke="#d6a34b"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    dataKey="ghiLowerBound"
                    name={t('forecastWorstCase')}
                    stroke="#0284c7"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    dataKey="ghiUpperBound"
                    name={t('forecastBestCase')}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </>
              ) : (
                <Line
                  dataKey="carbonIntensityGco2"
                  name="Grid Carbon Intensity (gCO2eq/kWh)"
                  stroke="#137d76"
                  strokeWidth={3}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
