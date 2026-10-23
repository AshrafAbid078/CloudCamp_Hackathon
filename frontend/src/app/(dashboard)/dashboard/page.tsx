'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ForecastChart } from '@/components/charts';
import { forecastApi, dispatchApi } from '@/lib/api';
import { useRoleStore } from '@/lib/store/useRoleStore';
import type { SolarDataPoint, ScheduledActionItem, DispatchSummaryKpis, ForecastSummaryMetrics } from '@/lib/types';

export default function DashboardOverviewPage() {
  const { forecastHorizon } = useRoleStore();
  const [solar, setSolar] = useState<SolarDataPoint[]>([]);
  const [actions, setActions] = useState<ScheduledActionItem[]>([]);
  const [kpis, setKpis] = useState<DispatchSummaryKpis | null>(null);
  const [summary, setSummary] = useState<ForecastSummaryMetrics | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      forecastApi.getForecastSeries(forecastHorizon),
      forecastApi.getForecastSummary(forecastHorizon),
      dispatchApi.getDispatchTracks(Number.parseInt(forecastHorizon, 10)),
    ]).then(([series, info, plan]) => {
      if (active) { setSolar(series); setSummary(info); setActions(plan.actions); setKpis(plan.summaryKpis); setRunId(plan.runId); setError(''); }
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Dashboard unavailable.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [forecastHorizon]);

  const weatherLive = summary?.solarSource === 'open_meteo_weather_forecast';
  const carbonLive = summary?.carbonSource === 'electricity_maps_v4_forecast';
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="page-kicker">Workspace / Overview</p><h1 className="page-title">Energy overview</h1><p className="page-subtitle">Bangladesh planning demo · current regional weather when available · synthetic assets</p></div>
      <Link href="/dispatch" className="rounded-md bg-[var(--accent-clean)] px-4 py-2.5 text-sm font-bold text-white">View dispatch plan →</Link>
    </header>
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-[var(--text-muted)]">Loading overview…</p> : <>
      <div className="flex flex-wrap gap-2 text-xs"><span className="demo-tag">Solar: {weatherLive ? 'current Open-Meteo forecast' : 'archived 2020 fallback'}</span><span className="demo-tag">Carbon: {carbonLive ? 'Electricity Maps forecast' : summary?.carbonSource === 'electricity_maps_recent_reading_persistence' ? 'recent reading held constant' : 'archived constant'}</span></div>
      <dl className="metric-strip">
        <div><dt>Peak solar forecast</dt><dd>{summary ? Math.round(summary.peakGhiForecast) + ' W/m²' : '—'}</dd><small>GHI · {forecastHorizon} view</small></div>
        <div><dt>Modeled cost change</dt><dd>{kpis ? (kpis.totalCostSavedUsd < 0 ? '−' : '+') + '$' + Math.abs(kpis.totalCostSavedUsd).toFixed(2) : '—'}</dd><small>Compared with baseline</small></div>
        <div><dt>Modeled carbon change</dt><dd>{kpis ? kpis.totalCarbonAvoidedTons.toFixed(2) + ' t' : '—'}</dd><small>Positive means reduction</small></div>
      </dl>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(260px,.75fr)]">
        <ForecastChart data={solar} title="Solar outlook" subtitle={(weatherLive ? 'Current weather model' : 'Archived 2020 data') + ' · fixed ±15% display bounds'} />
        <section className="surface-panel p-6"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Planning context</p><h2 className="mt-5 text-2xl font-bold">See the next best window.</h2><p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">The optimizer compares flexible industrial loads and battery schedules against a baseline. Results are estimates for a demo, with no equipment control.</p><div className="mt-8 space-y-4 border-t border-[var(--border-hairline)] pt-5 text-sm"><p>Solar source <strong className="float-right">{weatherLive ? 'Open-Meteo' : 'Archived fallback'}</strong></p><p>Plan <strong className="float-right">{runId ? 'Saved run ' + runId : 'Unsaved preview'}</strong></p><p>Peak impact <strong className="float-right">{kpis ? kpis.totalPeakShavedKw.toFixed(1) + ' kW' : '—'}</strong></p></div><Link href="/forecast" className="teal-link mt-8 inline-block text-sm">Explore forecast →</Link></section>
      </div>
      <section className="surface-panel overflow-hidden"><div className="flex items-center justify-between gap-3 px-6 pt-6"><div><h2 className="text-lg font-bold">Dispatch preview</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Suggested windows from the current plan</p></div><Link href="/dispatch" className="teal-link text-sm">View all →</Link></div><div className="overflow-x-auto px-6 pb-3"><table className="quiet-table min-w-[600px]"><thead><tr><th>Asset</th><th>Window</th><th>Modeled cost change</th><th>Carbon impact</th></tr></thead><tbody>{actions.slice(0, 5).map(item => <tr key={item.id}><td className="font-semibold">{item.assetName}</td><td>{item.scheduledTimeWindow}</td><td>{(item.costSavedUsd < 0 ? '−' : '+') + '$' + Math.abs(item.costSavedUsd).toFixed(2)}</td><td>{item.carbonAvoidedKg.toFixed(1)} kg</td></tr>)}</tbody></table>{actions.length === 0 && <p className="py-5 text-sm text-[var(--text-muted)]">No actions in this horizon.</p>}</div></section>
    </>}
  </div>;
}
