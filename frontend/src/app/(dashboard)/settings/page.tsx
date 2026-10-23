'use client';

import { useEffect, useState } from 'react';
import { systemApi } from '@/lib/api';
import type { SystemService } from '@/lib/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { AdminConsole } from '@/components/features';
import { ShieldAlert, Sliders, CheckCircle2 } from 'lucide-react';

interface InterlockSettings {
  emergencyInterlock: boolean;
  feederRampLimitKwMin: number;
  reserveMarginPercent: number;
}

const DEFAULT_INTERLOCKS: InterlockSettings = {
  emergencyInterlock: true,
  feederRampLimitKwMin: 500,
  reserveMarginPercent: 15,
};

export default function SettingsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const [services, setServices] = useState<SystemService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Local persistent state for demonstration safety interlocks
  const [interlocks, setInterlocks] = useState<InterlockSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('meridian_demo_interlocks');
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore parse failure
      }
    }
    return DEFAULT_INTERLOCKS;
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let active = true;
    void systemApi
      .getServices()
      .then((items) => {
        if (active) setServices(items);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Health unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateInterlock = <K extends keyof InterlockSettings>(key: K, value: InterlockSettings[K]) => {
    const next = { ...interlocks, [key]: value };
    setInterlocks(next);
    try {
      localStorage.setItem('meridian_demo_interlocks', JSON.stringify(next));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {
      // Ignore storage error
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="page-kicker">Workspace / Settings</p>
        <h1 className="page-title">Settings & System Readiness</h1>
        <p className="page-subtitle">Account context, platform diagnostics, and simulation parameters</p>
      </div>

      {/* System Readiness */}
      <section className="surface-panel p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div>
            <h2 className="text-lg font-bold">System Readiness Diagnostics</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Backend runtime checks for forecasting models, mathematical solvers, and synthetic asset data.
            </p>
          </div>
          <span className="demo-tag">Backend v1.1.0</span>
        </div>

        {loading && <p className="mt-5 text-sm text-[var(--text-muted)]">Probing backend diagnostics…</p>}
        {error && (
          <p role="alert" className="mt-5 rounded-md bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 divide-y divide-[var(--border-hairline)]">
          {services.map((service) => (
            <div key={service.name} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
              <div>
                <strong className="text-[var(--text-primary)]">{service.name}</strong>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{service.notes}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  service.status === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Demonstration Safety Interlocks */}
      <section className="surface-panel p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[var(--accent-solar)]" />
              <h2 className="text-lg font-bold">Safety Interlocks & Simulation Limits</h2>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Simulation guardrails for feeder loading and load shedding calculations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-[var(--accent-solar)]">
              <ShieldAlert className="w-3.5 h-3.5" />
              Demonstration Controls · No Hardware Gateway Connected
            </span>
            {savedNotice && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-5">
            <label className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)] cursor-pointer">
              <span>Emergency Shedding Interlock</span>
              <input
                type="checkbox"
                checked={interlocks.emergencyInterlock}
                onChange={(e) => updateInterlock('emergencyInterlock', e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Enforces mandatory spinning reserves during peak tariff intervals in modeled optimization runs.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-5">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">
              Feeder Ramp Limit (kW/min)
              <input
                type="number"
                min="50"
                step="50"
                value={interlocks.feederRampLimitKwMin}
                onChange={(e) => updateInterlock('feederRampLimitKwMin', Number(e.target.value))}
                className="form-control mt-2 block w-full text-xs font-mono"
              />
            </label>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Clamps sudden rate-of-change across asset transitions in synthetic scenario solvers.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-5">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">
              Reserve Margin (%)
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={interlocks.reserveMarginPercent}
                onChange={(e) => updateInterlock('reserveMarginPercent', Number(e.target.value))}
                className="form-control mt-2 block w-full text-xs font-mono"
              />
            </label>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Target unallocated capacity retained by batteries during high grid stress indices.
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Parameters are preserved in your local operator session. Because no physical SCADA field gateway is active,
          changes update local mathematical constraints and will not manipulate electrical hardware.
        </p>
      </section>

      {/* Admin User Management Console */}
      {role === 'admin' && (
        <section className="surface-panel space-y-4 p-6">
          <h2 className="text-lg font-bold">User Administration (Admin Console)</h2>
          <AdminConsole />
        </section>
      )}
    </div>
  );
}
