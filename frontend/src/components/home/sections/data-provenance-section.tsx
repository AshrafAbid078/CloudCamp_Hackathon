'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function DataProvenanceSection() {
  return (
    <section className="mt-28 w-full text-left">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text-muted)]/20 border border-[var(--border-hairline)] text-[10px] font-bold text-[var(--text-primary)] uppercase font-mono mb-3">
          Scientific Integrity & Transparency
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]">
          Data Provenance & Trust Standards
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
          Every solar forecast and carbon calculation grounds itself in peer-reviewed public meteorological feeds and transparent mathematical formulations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-solar)] font-bold font-mono text-sm">
            NREL
          </div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">
            NSRDB Solar Radiation DB
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            National Renewable Energy Laboratory Physical Solar Model (PSM v3) delivering satellite-derived GHI, DNI, and DHI coordinates.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-clean)] font-bold font-mono text-sm">
            NOAA
          </div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">
            Global Forecast System (GFS)
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Atmospheric cloud cover, ambient surface temperatures, and convective cloud motion vectors updating at 0.25-degree spatial resolution.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-solar)] font-bold font-mono text-sm">
            EMAPS
          </div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">
            Electricity Maps REST API
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Live carbon intensity telemetry for zone BD (Bangladesh), tracking gas peaker vs baseload coal fuel fractions in real time.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-clean)] font-bold font-mono text-sm">
            BPDB
          </div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">
            Industrial Tariff Regimes
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Official Bangladesh Power Development Board Time-of-Use rate schedules for high-voltage industrial manufacturing consumers.
          </p>
        </div>
      </div>

      {/* Synthetic Data & Privacy Disclosure */}
      <div className="mt-8 p-4 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[var(--accent-clean)] shrink-0" />
          <span>
            <strong className="text-[var(--text-primary)]">Public Data Disclosure:</strong> All factory machine schedules and battery telemetry are 100% synthetic research prototypes. Zero personal PII is processed or stored.
          </span>
        </div>
        <Link
          href="/data"
          className="text-[var(--accent-solar)] hover:underline font-mono text-[11px] shrink-0 font-bold"
        >
          View Cryptographic Ledger →
        </Link>
      </div>
    </section>
  );
}
