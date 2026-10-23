'use client';

import { useEffect, useState } from 'react';
import { dataApi } from '@/lib/api';
import type { CarbonSnapshotRecord } from '@/lib/types';

export default function DataPage() {
  const [snapshots, setSnapshots] = useState<CarbonSnapshotRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError(null);
    try { setSnapshots(await dataApi.getCarbonSnapshots(50)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load carbon snapshots.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="page-kicker">Workspace / Data sources</p><h1 className="page-title">Data sources</h1><p className="page-subtitle">Carbon readings and archived fallback records with source timestamps</p></div><button className="rounded-md border border-[var(--border-hairline)] bg-white px-4 py-2 text-sm font-semibold" onClick={() => void load()}>Refresh</button></div>
    <div className="surface-panel p-5 text-sm text-[var(--text-muted)]">Check each reading’s source and timestamp. Cryptographic provenance, sensor calibration, and live SCADA verification are unavailable in this demo.</div>
    {loading && <p>Loading snapshots…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
    {!loading && !error && snapshots.length === 0 && <p>No carbon snapshots are available.</p>}
    <div className="surface-panel overflow-x-auto px-5"><table className="quiet-table min-w-[620px]"><thead><tr><th>Reading time</th><th>Intensity (gCO₂/kWh)</th><th>Source</th><th>Estimated</th></tr></thead><tbody>{snapshots.map(item => <tr key={`${item.source}-${item.id}`}><td>{item.reading_datetime ?? item.polled_at}</td><td>{item.carbon_intensity_gco2eq_kwh.toFixed(1)}</td><td>{item.source}</td><td>{item.is_estimated ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>
  </div>;
}
