'use client';

import React from 'react';
import Link from 'next/link';
import { Globe2, Cpu, Sliders } from 'lucide-react';

export function AdapterMatrixSection() {
  return (
    <section className="mt-28 w-full text-left">
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-surface-raised)] to-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-[var(--border-hairline)]">
          <div>
            <span className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider font-mono">
              Universal Modularity
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)] mt-1">
              Pluggable Adapter Matrix: Regional Grids & Flexible Loads
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Meridian Grid decouples optimization logic from regional tariff APIs and machine hardware. Switch regions or asset types with zero code rewrites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-xs font-semibold text-[var(--text-primary)] transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
              <span>Inspect Health Probes</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Region Adapter Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Globe2 className="w-4 h-4 text-[var(--accent-solar)]" />
              <span>Regional Grid Adapters</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--accent-clean)]/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    Bangladesh Regional Grid (BPDB)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-clean)]/20 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
                    Live Data Feed
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Fully wired to Electricity Maps live carbon API + NREL NSRDB physical coordinates for Gazipur and Chittagong manufacturing clusters.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-base)]/60 border border-[var(--border-hairline)] space-y-2 opacity-85">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    European Union (ENTSO-E Transparency)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40">
                    Architecture-Ready Stub
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Pre-configured schema mapping for 15-minute day-ahead spot market prices and zonal carbon intensity across ENTSO-E bidding zones.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-base)]/60 border border-[var(--border-hairline)] space-y-2 opacity-85">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    North America (CAISO / PJM Interconnection)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40">
                    Architecture-Ready Stub
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  OASIS five-minute real-time LMP tariff ingestion stub for California and mid-Atlantic DERMS coordination.
                </p>
              </div>
            </div>
          </div>

          {/* Asset Adapter Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Cpu className="w-4 h-4 text-[var(--accent-clean)]" />
              <span>Flexible Asset Adapters</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--accent-clean)]/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    Industrial Flexible Loads (Batch Dye-Vats & Arc Furnaces)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-clean)]/20 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
                    Live MILP Track
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Discrete uninterruptible run-window scheduling adhering to factory shift deadlines and thermal cooling constraints.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--accent-clean)]/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    BESS Battery Energy Storage Systems
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-clean)]/20 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
                    Live MILP Track
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Midday solar sponge charging (11:00–14:00) paired with evening peak tariff discharge (18:30–21:00) with battery C-rate warranty degradation protection.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-base)]/60 border border-[var(--border-hairline)] space-y-2 opacity-85">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">
                    Commercial EV Fleet Delivery Depots
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40">
                    Architecture-Ready Stub
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Depot charging window coordination aligned with delivery route turnaround schedules and feeder headroom limitations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
