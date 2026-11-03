'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { OverridePanel } from '@/components/features';
import { dispatchApi } from '@/lib/api';
import { adaptBackendDispatchPlan, type BackendDispatchPlanResponse } from '@/lib/api/adapters';
import type { CustomAssetInput } from '@/lib/types/dispatch';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { t } from '@/lib/ui-copy';
import { PlusCircle, X, Zap } from 'lucide-react';
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
  const [forecastStart, setForecastStart] = useState<string | null>(null);
  const [tab, setTab] = useState<'industrial' | 'battery'>('industrial');
  const [override, setOverride] = useState<IndustrialAssetTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Custom Machine Modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('Spinning Frame B2');
  const [customPower, setCustomPower] = useState('150');
  const [customDuration, setCustomDuration] = useState('4');
  const [customDeadline, setCustomDeadline] = useState('18');
  const [customBusy, setCustomBusy] = useState(false);
  const [customAssets, setCustomAssets] = useState<CustomAssetInput[]>([]);

  function applyPlan(plan: BackendDispatchPlanResponse) {
    const adapted = adaptBackendDispatchPlan(plan);
    setAssets(adapted.industrial);
    setBattery(adapted.batteries[0] ?? null);
    setKpis(adapted.kpis);
    setRunId(plan.run_id ?? null);
    setCustomAssets(plan.assumptions?.custom_assets ?? []);
    setSolarSource(plan.forecast_used?.sources?.solar ?? 'unknown');
    setCarbonSource(plan.forecast_used?.sources?.carbon ?? 'unknown');
    setForecastStart(plan.forecast_used?.timestamps?.[0] ?? null);
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const plan = await dispatchApi.getDispatchTracks(hours);
      setAssets(plan.industrialTracks);
      setBattery(plan.batteryTrack);
      setKpis(plan.summaryKpis);
      setRunId(plan.runId);
      setCustomAssets(plan.customAssets);
      setSolarSource(plan.forecastSources?.solar ?? 'unknown');
      setCarbonSource(plan.forecastSources?.carbon ?? 'unknown');
      setForecastStart(plan.forecastStart);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Plan unavailable.');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  async function savePlan() {
    setLoading(true);
    setError('');
    try {
      const saved = await dispatchApi.createDispatchRun(hours, customAssets);
      applyPlan(saved);
      setNotice('A new demo plan was saved. No equipment command was sent.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the plan.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCustomMachine(e: FormEvent) {
    e.preventDefault();
    setCustomBusy(true);
    setError('');
    try {
      const res = await dispatchApi.addCustomAsset({
        name: customName,
        power_kw: Number(customPower),
        duration_hours: Number(customDuration),
        deadline_hour: Number(customDeadline),
        horizon_hours: hours,
        existing_assets: customAssets,
      });

      const ca = res.custom_asset;
      const formattedSlot = `${ca.optimal_start_hour ?? 0}:00 - ${(ca.optimal_start_hour ?? 0) + ca.duration_hours}:00`;
      applyPlan(res);
      setIsCustomModalOpen(false);
      setNotice(`Custom machine "${ca.name}" successfully scheduled at optimal window ${formattedSlot}!`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to solve with custom machine.');
    } finally {
      setCustomBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">Workspace / Dispatch</p>
          <h1 className="page-title">{t('dispatchTitle')}</h1>
          <p className="page-subtitle">{t('dispatchSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || customBusy || customAssets.length >= 10}
            onClick={() => { setCustomDeadline(String(hours)); setIsCustomModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-clean)] bg-[var(--surface-card)] px-3.5 py-2 text-sm font-semibold text-[var(--accent-clean)] transition-colors hover:bg-[var(--accent-clean)] hover:text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('btnAddMachine')}</span>
          </button>

          <div className="flex gap-1 rounded-md border border-[var(--border-hairline)] bg-white p-1">
            {(['6h', '12h', '24h'] as ForecastHorizon[]).map(h => (
              <button
                key={h}
                disabled={loading || customBusy || (customAssets.length > 0 && runId === null)}
                title={customAssets.length > 0 && runId === null ? 'Save the custom plan before changing horizon' : undefined}
                onClick={() => setForecastHorizon(h)}
                aria-pressed={forecastHorizon === h}
                className={
                  'rounded px-3 py-2 text-sm transition-colors ' +
                  (forecastHorizon === h
                    ? 'bg-[var(--accent-clean)] font-bold text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')
                }
              >
                {h}
              </button>
            ))}
          </div>

          <button
            onClick={savePlan}
            disabled={loading}
            className="rounded-md bg-[var(--accent-clean)] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Working…' : 'Save new plan'}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-4 text-teal-800">{notice}</p>}

      {!loading && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="demo-tag">
            Solar: {solarSource === 'open_meteo_weather_forecast' ? 'Open-Meteo forecast snapshot (heuristic ranges)' : 'archived fallback'}
          </span>
          <span className="demo-tag">
            Carbon: {carbonSource === 'electricity_maps_v4_forecast' ? 'Electricity Maps forecast' : carbonSource === 'electricity_maps_recent_reading_persistence' ? 'recent reading held constant' : 'archived constant'}
          </span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <dl className="metric-strip">
        <div>
          <dt>{t('kpiCostSavings')}</dt>
          <dd>{kpis ? (kpis.totalCostSavedUsd < 0 ? '−' : '+') + '$' + Math.abs(kpis.totalCostSavedUsd).toFixed(2) : '—'}</dd>
          <small>Versus run-immediately baseline</small>
        </div>
        <div>
          <dt>{t('kpiCarbonReduced')}</dt>
          <dd>{kpis ? kpis.totalCarbonAvoidedTons.toFixed(2) + ' t' : '—'}</dd>
          <small>Positive means clean reduction</small>
        </div>
        <div>
          <dt>{t('kpiPeakShaved')}</dt>
          <dd>{kpis ? kpis.totalPeakShavedKw.toFixed(1) + ' kW' : '—'}</dd>
          <small>Coincident peak shaving</small>
        </div>
      </dl>

      {/* Schedule Table / Gantt View */}
      <section className="surface-panel overflow-hidden border border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold">{t('dispatchGantt')}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {runId ? 'Saved run ' + runId : 'Live preview'} · TOU tariff optimized
              {forecastStart && <span className="mt-1 block text-xs">Forecast horizon begins {new Date(forecastStart).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (Asia/Dhaka). Saving a new plan recomputes with the available data.</span>}
            </p>
          </div>
          <Link href="/history" className="teal-link text-sm">
            Run history →
          </Link>
        </div>

        <div className="section-tabs mx-6 mt-4">
          <button onClick={() => setTab('industrial')} className={tab === 'industrial' ? 'active' : ''}>
            Industrial processes ({assets.length})
          </button>
          <button onClick={() => setTab('battery')} className={tab === 'battery' ? 'active' : ''}>
            Battery Storage (BESS)
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-[var(--text-muted)]">Computing MILP schedule…</p>
        ) : tab === 'industrial' ? (
          <div className="overflow-x-auto px-6 pb-4">
            <table className="quiet-table min-w-[650px]">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Facility</th>
                  <th>Power (kW)</th>
                  <th>Suggested Window</th>
                  <th>Cost Impact</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className={asset.id.startsWith('custom') ? 'bg-emerald-500/5 font-medium' : ''}>
                    <td className="font-semibold flex items-center gap-1.5">
                      {asset.id.startsWith('custom') && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          CUSTOM
                        </span>
                      )}
                      <span>{asset.name}</span>
                    </td>
                    <td>{asset.facility}</td>
                    <td>{asset.powerKw} kW</td>
                    <td className="font-mono text-xs">{asset.chosenRunWindow}</td>
                    <td className="font-mono text-xs">
                      {(asset.costSavedUsd < 0 ? '−' : '+') + '$' + Math.abs(asset.costSavedUsd).toFixed(2)}
                    </td>
                    <td>
                      <button onClick={() => setOverride(asset)} className="teal-link text-xs">
                        Shift
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && <p className="py-5 text-sm text-[var(--text-muted)]">No industrial assets in this horizon.</p>}
          </div>
        ) : (
          <div className="grid gap-5 p-6 text-sm md:grid-cols-4">
            <div>
              <p className="text-[var(--text-muted)]">Battery Asset</p>
              <strong>{battery?.name ?? 'Unavailable'}</strong>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Capacity &amp; Chemistry</p>
              <strong>{battery ? battery.capacityKwh + ' kWh (LFP)' : '—'}</strong>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Charging Windows</p>
              <strong className="text-emerald-600">{battery?.chargeWindows.join(', ') || 'None'}</strong>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Discharge Windows (Peak)</p>
              <strong className="text-amber-600">{battery?.dischargeWindows.join(', ') || 'None'}</strong>
            </div>
          </div>
        )}
      </section>

      {/* Custom Machine Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2 text-[#0c1929]">
                <Zap className="h-5 w-5 text-[var(--accent-clean)]" />
                <h3 className="font-bold text-base">{t('customMachineTitle')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMachine} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text-primary)]">
                  {t('customMachineName')}
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-clean)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text-primary)]">
                    {t('customMachinePower')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={customPower}
                    onChange={e => setCustomPower(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-clean)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text-primary)]">
                    {t('customMachineDuration')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-clean)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-primary)]">
                  {t('customMachineDeadline')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={customDeadline}
                  onChange={e => setCustomDeadline(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-clean)] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Machine must finish before this hour to meet shipment constraints.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="rounded-md border border-[var(--border-hairline)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-overlay)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customBusy}
                  className="rounded-md bg-[var(--accent-clean)] px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {customBusy ? 'Solving…' : t('customMachineSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {override && (
        <OverridePanel
          customAssets={customAssets}
          isOpen={true}
          onClose={() => setOverride(null)}
          initialAssetId={override.id}
          initialAssetName={override.name}
          initialWindow={override.chosenRunWindow}
          horizonHours={hours}
          onSuccess={message => {
            setNotice(message);
            setOverride(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
