'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { OverridePanel } from '@/components/features';
import { dispatchApi } from '@/lib/api';
import { useRoleStore } from '@/lib/store/useRoleStore';
import type { IndustrialAssetTrack, BatteryAssetTrack, DispatchSummaryKpis, ForecastHorizon } from '@/lib/types';

export default function DispatchPlanPage() {
  const { forecastHorizon, setForecastHorizon } = useRoleStore();
  const hours = Number.parseInt(forecastHorizon, 10);
  const [assets, setAssets] = useState<IndustrialAssetTrack[]>([]);
  const [battery, setBattery] = useState<BatteryAssetTrack | null>(null);
  const [kpis, setKpis] = useState<DispatchSummaryKpis | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [solarSource, setSolarSource] = useState('');
  const [carbonSource, setCarbonSource] = useState('');
  const [tab, setTab] = useState<'industrial' | 'battery'>('industrial');
  const [override, setOverride] = useState<IndustrialAssetTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const plan = await dispatchApi.getDispatchTracks(hours); setAssets(plan.industrialTracks); setBattery(plan.batteryTrack); setKpis(plan.summaryKpis); setRunId(plan.runId); setSolarSource(plan.forecastSources?.solar ?? 'unknown'); setCarbonSource(plan.forecastSources?.carbon ?? 'unknown'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Plan unavailable.'); }
    finally { setLoading(false); }
  }, [hours]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  async function savePlan() { setLoading(true); setError(''); try { await dispatchApi.createDispatchRun(hours); await refresh(); setNotice('A new demo plan was saved. No equipment command was sent.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the plan.'); setLoading(false); } }
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="page-kicker">Workspace / Dispatch</p><h1 className="page-title">Dispatch plan</h1><p className="page-subtitle">Modeled schedules for synthetic industrial and battery assets</p></div><div className="flex flex-wrap gap-2"><div className="flex gap-1 rounded-md border border-[var(--border-hairline)] bg-white p-1">{(['6h','12h','24h'] as ForecastHorizon[]).map(h=><button key={h} onClick={()=>setForecastHorizon(h)} aria-pressed={forecastHorizon===h} className={'rounded px-3 py-2 text-sm '+(forecastHorizon===h?'bg-[var(--accent-clean)] font-bold text-white':'text-[var(--text-muted)]')}>{h}</button>)}</div><button onClick={savePlan} disabled={loading} className="rounded-md bg-[var(--accent-clean)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{loading?'Working…':'Save new plan'}</button></div></header>
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}{notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-4 text-teal-800">{notice}</p>}
    {!loading && <div className="flex flex-wrap gap-2 text-xs"><span className="demo-tag">Solar: {solarSource === 'open_meteo_weather_forecast' ? 'current Open-Meteo forecast' : 'archived fallback'}</span><span className="demo-tag">Carbon: {carbonSource === 'electricity_maps_v4_forecast' ? 'Electricity Maps forecast' : carbonSource === 'electricity_maps_recent_reading_persistence' ? 'recent reading held constant' : 'archived constant'}</span></div>}
    <dl className="metric-strip">
      <div>
        <dt>Modeled cost change</dt>
        <dd className={kpis && kpis.totalCostSavedUsd < 0 ? 'text-[var(--accent-stress)]' : ''}>
          {kpis ? (kpis.totalCostSavedUsd < 0 ? '−' : '+') + '$' + Math.abs(kpis.totalCostSavedUsd).toFixed(2) : '—'}
        </dd>
        <small>{kpis && kpis.totalCostSavedUsd < 0 ? 'Cost increase vs baseline' : 'Versus baseline'}</small>
      </div>
      <div>
        <dt>Carbon impact</dt>
        <dd className={kpis && kpis.totalCarbonAvoidedTons < 0 ? 'text-[var(--accent-stress)]' : ''}>
          {kpis ? (kpis.totalCarbonAvoidedTons < 0 ? '−' : '+') + Math.abs(kpis.totalCarbonAvoidedTons).toFixed(2) + ' t' : '—'}
        </dd>
        <small>{kpis && kpis.totalCarbonAvoidedTons < 0 ? 'Emissions increase' : 'Positive means reduction'}</small>
      </div>
      <div>
        <dt>Peak impact</dt>
        <dd className={kpis && kpis.totalPeakShavedKw < 0 ? 'text-[var(--accent-stress)]' : ''}>
          {kpis ? (kpis.totalPeakShavedKw < 0 ? '−' : '+') + Math.abs(kpis.totalPeakShavedKw).toFixed(1) + ' kW' : '—'}
        </dd>
        <small>{kpis && kpis.totalPeakShavedKw < 0 ? 'Peak demand increase' : 'Positive means reduction'}</small>
      </div>
    </dl>
    <section className="surface-panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5"><div><h2 className="text-lg font-bold">Schedule</h2><p className="mt-1 text-sm text-[var(--text-muted)]">{runId ? 'Saved run '+runId : 'Unsaved preview'} · no equipment connected</p></div><Link href="/history" className="teal-link text-sm">Run history →</Link></div><div className="section-tabs mx-6 mt-4"><button onClick={()=>setTab('industrial')} className={tab==='industrial'?'active':''}>Industrial assets</button><button onClick={()=>setTab('battery')} className={tab==='battery'?'active':''}>Battery</button></div>{loading ? <p className="p-6 text-sm text-[var(--text-muted)]">Loading plan…</p> : tab==='industrial' ? <div className="overflow-x-auto px-6 pb-3"><table className="quiet-table min-w-[650px]"><thead><tr><th>Asset</th><th>Facility</th><th>Power</th><th>Suggested window</th><th>Cost change</th><th></th></tr></thead><tbody>{assets.map(asset=><tr key={asset.id}><td className="font-semibold">{asset.name}</td><td>{asset.facility}</td><td>{asset.powerKw} kW</td><td>{asset.chosenRunWindow}</td><td className={asset.costSavedUsd < 0 ? 'text-[var(--accent-stress)] font-medium' : ''}>{(asset.costSavedUsd<0?'−':'+')+'$'+Math.abs(asset.costSavedUsd).toFixed(2)}</td><td><button onClick={()=>setOverride(asset)} className="teal-link">Shift</button></td></tr>)}</tbody></table>{assets.length===0&&<p className="py-5 text-sm text-[var(--text-muted)]">No industrial assets in this horizon.</p>}</div> : <div className="grid gap-5 p-6 text-sm md:grid-cols-3"><div><p className="text-[var(--text-muted)]">Battery</p><strong>{battery?.name ?? 'Unavailable'}</strong></div><div><p className="text-[var(--text-muted)]">Capacity</p><strong>{battery ? battery.capacityKwh+' kWh' : '—'}</strong></div><div><p className="text-[var(--text-muted)]">Charge windows</p><strong>{battery?.chargeWindows.join(', ') || 'None'}</strong></div><div><p className="text-[var(--text-muted)]">Discharge windows</p><strong>{battery?.dischargeWindows.join(', ') || 'None'}</strong></div></div>}</section>
    <p className="text-sm text-[var(--text-muted)]">Saving or approving a plan records a demo decision only. It does not control equipment.</p>
    {override && <OverridePanel isOpen={true} onClose={()=>setOverride(null)} initialAssetId={override.id} initialAssetName={override.name} initialWindow={override.chosenRunWindow} horizonHours={hours} onSuccess={message=>{setNotice(message);setOverride(null);void refresh();}} />}
  </div>;
}
