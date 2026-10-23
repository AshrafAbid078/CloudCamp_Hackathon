'use client';

import { useEffect, useState } from 'react';
import { systemApi } from '@/lib/api';
import type { SystemService } from '@/lib/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { AdminConsole } from '@/components/features';

export default function SettingsPage() {
  const role = useAuthStore(state => state.user?.role);
  const [services, setServices] = useState<SystemService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void systemApi.getServices().then(items => { if (active) setServices(items); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Health unavailable.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div className="space-y-8">
    <div><p className="page-kicker">Workspace / Settings</p><h1 className="page-title">Settings</h1><p className="page-subtitle">Account context and system readiness</p></div>
    <section className="surface-panel p-6"><h2 className="text-lg font-bold">System readiness</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Backend checks for the forecast model, solver, and demo asset data.</p>{loading && <p className="mt-5">Checking backend…</p>}{error && <p role="alert" className="mt-5 text-red-700">{error}</p>}<div className="mt-5 divide-y divide-[var(--border-hairline)]">{services.map(service => <div key={service.name} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div><strong>{service.name}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{service.notes}</p></div><span className="demo-tag h-fit">{service.status}</span></div>)}</div></section>
    <div className="surface-panel p-6 text-sm text-[var(--text-muted)]">Safety interlock settings are planned. No field gateway is connected and no settings are saved or enforced.</div>
    {role === 'admin' && <section className="surface-panel space-y-4 p-6"><h2 className="text-lg font-bold">User administration</h2><AdminConsole /></section>}
  </div>;
}
