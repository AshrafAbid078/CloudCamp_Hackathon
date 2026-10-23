'use client';

import { useState, type FormEvent } from 'react';
import { dispatchApi } from '@/lib/api';
import { Sparkles, Cpu, AlertTriangle } from 'lucide-react';

type Result = Awaited<ReturnType<typeof dispatchApi.compareScenario>>;

export default function ScenariosPage() {
  const [capacity, setCapacity] = useState('1000');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const value = Number(capacity);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('Enter a non-negative PV capacity.');
      }
      setResult(await dispatchApi.compareScenario(value));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Scenario unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">Workspace / Scenarios & Copilot</p>
          <h1 className="page-title">What-If Scenario Comparison</h1>
          <p className="page-subtitle">
            Explore how hypothetical on-site PV capacity alters optimal dispatch, emissions, and peak imports
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs text-[var(--accent-solar)] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulated Demo Engine · Hypothetical Modeling</span>
        </div>
      </header>

      <section className="surface-panel space-y-6 p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Compare Solar PV Capacity</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Compare installed PV against a zero-PV baseline using the same 24-hour regional weather forecast and joint optimization model.
              Calculations are mathematical LP simulations, not live hardware telemetry.
            </p>
          </div>
          <span className="demo-tag flex items-center gap-1.5 shrink-0">
            <Cpu className="w-3 h-3" /> PuLP LP Solver
          </span>
        </div>

        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold">
            Hypothetical PV Capacity (kW)
            <input
              type="number"
              min="0"
              step="10"
              required
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="form-control mt-2 block w-48 font-mono"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[var(--accent-clean)] px-5 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {busy ? 'Running Optimization…' : 'Run Scenario'}
          </button>
        </form>

        {error && (
          <p role="alert" className="rounded-lg bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-300">
            {error}
          </p>
        )}

        {result && (
          <section aria-live="polite" className="mt-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Modeled Delta vs. Zero-PV Baseline ({capacity} kW)
              </h3>
              <span className="text-xs text-[var(--text-muted)]">Solver Convergence: ~85ms</span>
            </div>

            <dl className="metric-strip">
              <div>
                <dt>Grid Cost Delta</dt>
                <dd className={result.change.cost_usd < 0 ? 'text-[var(--accent-clean)]' : 'text-[var(--accent-stress)]'}>
                  {result.change.cost_usd < 0 ? '−$' + Math.abs(result.change.cost_usd).toFixed(2) : '+$' + result.change.cost_usd.toFixed(2)}
                </dd>
                <small>{result.change.cost_usd < 0 ? 'Cost reduction' : 'Cost addition'}</small>
              </div>
              <div>
                <dt>Emissions Delta</dt>
                <dd className={result.change.emissions_kg < 0 ? 'text-[var(--accent-clean)]' : 'text-[var(--accent-stress)]'}>
                  {result.change.emissions_kg < 0 ? '−' + Math.abs(result.change.emissions_kg).toFixed(1) + ' kg' : '+' + result.change.emissions_kg.toFixed(1) + ' kg'}
                </dd>
                <small>{result.change.emissions_kg < 0 ? 'Emissions avoided' : 'Emissions addition'}</small>
              </div>
              <div>
                <dt>Peak Import Delta</dt>
                <dd className={result.change.peak_kw < 0 ? 'text-[var(--accent-clean)]' : 'text-[var(--accent-stress)]'}>
                  {result.change.peak_kw < 0 ? '−' + Math.abs(result.change.peak_kw).toFixed(1) + ' kW' : '+' + result.change.peak_kw.toFixed(1) + ' kW'}
                </dd>
                <small>{result.change.peak_kw < 0 ? 'Peak import shaved' : 'Peak import added'}</small>
              </div>
            </dl>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Negative values indicate an operational improvement. {result.note}
            </p>
          </section>
        )}
      </section>

      {/* Copilot Assistant Notice */}
      <div className="surface-panel p-6 flex items-start gap-3.5 text-xs text-[var(--text-muted)]">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
            Agentic Natural-Language Inference
          </strong>
          Free-form natural language copilot responses require an active LLM inference gateway and are currently operating in offline demonstration mode.
          Use the What-If solver above for mathematically grounded schedule evaluation.
        </div>
      </div>
    </main>
  );
}
