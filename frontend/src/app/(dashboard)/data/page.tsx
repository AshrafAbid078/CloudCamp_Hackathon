'use client';

import { useEffect, useState, useTransition } from 'react';
import { dataApi } from '@/lib/api';
import type { CarbonSnapshotRecord } from '@/lib/types';
import { Database, RefreshCw, Radio, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataPage() {
  const [snapshots, setSnapshots] = useState<CarbonSnapshotRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await dataApi.getCarbonSnapshots(50);
      setSnapshots(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load carbon snapshots.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const latest = snapshots[0];
  const targetTime = latest?.reading_datetime ?? latest?.polled_at;
  const latestFormatted = targetTime
    ? new Date(targetTime).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header with live indicator */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">Workspace / Data Sources</p>
          <h1 className="page-title">Data & Telemetry Provenance</h1>
          <p className="page-subtitle">
            Electricity Maps live telemetry, carbon intensity signals, and pipeline provenance records
          </p>
        </div>

        <div className="flex items-center gap-3">
          {latestFormatted && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Live Poller Active:</span>
              <span className="text-[var(--text-muted)]">{latestFormatted} BD</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading || isRefreshing}
            onClick={() => {
              startTransition(() => {
                void load();
              });
            }}
            className="flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500/40 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Provenance Context Disclaimer */}
      <div className="surface-panel p-5 text-sm text-[var(--text-muted)] flex items-start gap-3">
        <Radio className="w-5 h-5 text-[var(--accent-solar)] shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed">
          <strong className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
            Telemetry Pipeline Architecture
          </strong>
          Readings are continuously ingested via the FastAPI background APScheduler from the Electricity Maps API
          and archived to the local SQLite ledger (<code className="text-emerald-400">meridian.db</code>).
          Sensor calibration, cryptographic blockchain anchoring, and live SCADA field verification are simulation-only in this demo.
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dedicated Polled Carbon Telemetry Ledger Table */}
      <section className="surface-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Polled Carbon Telemetry Ledger
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Recent 50 carbon readings recorded in the persistent database
              </p>
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Total records: <strong className="text-[var(--text-primary)]">{snapshots.length}</strong>
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--text-muted)]">Querying carbon telemetry ledger…</p>
        ) : snapshots.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--text-muted)]">No carbon snapshot records found.</p>
        ) : (
          <div className="overflow-x-auto px-6 pb-4">
            <table className="quiet-table min-w-[700px] text-xs">
              <thead>
                <tr>
                  <th>Reading Time (BD)</th>
                  <th>Carbon Intensity</th>
                  <th>Measurement Mode</th>
                  <th>Data Source</th>
                  <th>Polled Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((item) => {
                  const ci = item.carbon_intensity_gco2eq_kwh;
                  const intensityColor =
                    ci < 520
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : ci < 650
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-red-400 bg-red-500/10 border-red-500/30';

                  const readingDate = item.reading_datetime
                    ? new Date(item.reading_datetime).toLocaleString('en-GB', {
                        timeZone: 'Asia/Dhaka',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—';

                  const polledDate = item.polled_at
                    ? new Date(item.polled_at).toLocaleTimeString('en-GB', {
                        timeZone: 'Asia/Dhaka',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={`${item.source}-${item.id}`}>
                      <td className="font-semibold text-[var(--text-primary)]">{readingDate}</td>
                      <td>
                        <span className={`inline-block rounded-md border px-2 py-0.5 font-mono font-semibold ${intensityColor}`}>
                          {ci.toFixed(1)} gCO₂/kWh
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          {item.is_estimated ? (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                              Estimated
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Direct Reading
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)] font-mono">{item.source || 'electricity_maps'}</td>
                      <td className="text-[var(--text-muted)]">{polledDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
