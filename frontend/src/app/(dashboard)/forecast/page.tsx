'use client';

import { useEffect, useState } from 'react';
import { ForecastChart } from '@/components/charts';
import { forecastApi } from '@/lib/api';
import { useRoleStore } from '@/lib/store/useRoleStore';
import type { SolarDataPoint, ForecastSummaryMetrics, ForecastHorizon } from '@/lib/types';

export default function ForecastPage() {
  const { forecastHorizon, setForecastHorizon } = useRoleStore();
  const [series, setSeries] = useState<SolarDataPoint[]>([]);
  const [summary, setSummary] = useState<ForecastSummaryMetrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [points, info] = await Promise.all([
          forecastApi.getForecastSeries(forecastHorizon),
          forecastApi.getForecastSummary(forecastHorizon),
        ]);
        if (active) { setSeries(points); setSummary(info); setError(''); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Forecast unavailable.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [forecastHorizon]);

  const weatherLive = summary?.solarSource === 'open_meteo_weather_forecast';
  const carbonLabel = summary?.carbonSource === 'electricity_maps_v4_forecast'
    ? 'Electricity Maps forecast'
    : summary?.carbonSource === 'electricity_maps_recent_reading_persistence'
      ? 'Recent reading held constant'
      : 'Archived constant';

  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="page-kicker">Workspace / Forecast</p><h1 className="page-title">Solar forecast</h1><p className="page-subtitle">Bangladesh regional weather outlook near Dhaka</p></div>
      <div className="flex gap-1 rounded-md border border-[var(--border-hairline)] bg-white p-1">
        {(['6h', '12h', '24h'] as ForecastHorizon[]).map(h => <button key={h} onClick={() => setForecastHorizon(h)} aria-pressed={forecastHorizon === h} className={'rounded px-4 py-2 text-sm ' + (forecastHorizon === h ? 'bg-[var(--accent-clean)] font-bold text-white' : 'text-[var(--text-muted)]')}>{h}</button>)}
      </div>
    </header>
    {loading && <p>Loading forecast…</p>}
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && !error && summary && <>
      <dl className="metric-strip">
        <div><dt>First hourly GHI estimate</dt><dd>{Math.round(summary.currentGhi)} <span className="text-lg">W/m²</span></dd><small>Weather-model output</small></div>
        <div><dt>Peak GHI forecast</dt><dd>{Math.round(summary.peakGhiForecast)} <span className="text-lg">W/m²</span></dd><small>{forecastHorizon} view</small></div>
        <div><dt>Solar source</dt><dd className="!text-2xl !tracking-normal">{weatherLive ? 'Open-Meteo' : 'Archived fallback'}</dd><small>{weatherLive ? 'Current regional forecast' : '2020 sample data'}</small></div>
      </dl>
      <ForecastChart data={series} title={'Solar GHI · ' + forecastHorizon} subtitle={(weatherLive ? 'Current weather model' : 'Archived 2020 data') + ' · fixed ±15% display bounds'} />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="surface-panel p-6"><h2 className="text-lg font-bold">Forecast context</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{weatherLive ? 'Open-Meteo provides a current weather-model prediction near Dhaka. This is not on-site measured irradiance.' : 'Current weather is unavailable. This view uses the archived 2020 sample.'}</p><p className="mt-4 text-sm">Backend model: <strong>{summary.modelType}</strong></p>{summary.forecastIssuedAt && <p className="mt-2 text-sm">Retrieved: <strong>{new Date(summary.forecastIssuedAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} BD time</strong></p>}<p className="mt-2 text-sm">RMSE: <strong>{summary.benchmarks[0]?.lightGbmValue ?? 'Unavailable'}</strong> · MAPE: <strong>{summary.benchmarks[1]?.lightGbmValue ?? 'Unavailable'}</strong></p></section>
        <section className="surface-panel p-6"><h2 className="text-lg font-bold">Carbon source</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{carbonLabel}. {summary.carbonSource === 'archived_constant' ? 'An Electricity Maps key is not configured or a current forecast is unavailable.' : 'This is a regional grid signal, not facility telemetry.'}</p><p className="mt-4 text-xs text-[var(--text-muted)]">The ±15% GHI bounds are illustrative, not calibrated confidence intervals.</p></section>
      </div>
    </>}
  </div>;
}
