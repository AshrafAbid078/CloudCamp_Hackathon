'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Factory, BarChart3, CheckCircle2 } from 'lucide-react';

export function ValuePropositionSection() {
  return (
    <section className="mt-28 w-full text-left">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-clean)]/15 border border-[var(--accent-clean)]/30 text-[10px] font-bold text-[var(--accent-clean)] uppercase font-mono mb-3">
          Value Alignment
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]">
          Tailored For Both Sides Of The Grid
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
          Why plant operators and national utility dispatchers both benefit from the exact same mathematical solver.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Track 1: Facility Managers */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] shadow-xl relative space-y-6"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] flex items-center justify-center">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">
                  For Facility Managers
                </h3>
                <span className="text-xs font-mono text-[var(--accent-solar)]">
                  Industrial Plants • Microgrids • Commercial Depots
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[var(--accent-solar)]/10 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30">
              SaaS Model
            </span>
          </div>

          <div className="space-y-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Peak Tariff Avoidance:</strong> Automatically shifts energy-intensive equipment away from expensive 18:00–22:00 peak billing periods.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Zero Production Bottlenecks:</strong> Hard deadline constraints guarantee finished goods ship on schedule without compromise.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Maximized Solar Self-Consumption:</strong> Soaks up free midday rooftop solar before selling surplus at unfavorable net-metering rates.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Plain Language Audit Trail:</strong> The Copilot explains every override in plain Bengali or English for non-technical shift managers.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)]">Typical Energy Savings:</span>
            <span className="text-lg font-bold text-[var(--accent-clean)]">28% – 38% / Month</span>
          </div>
        </motion.div>

        {/* Track 2: Grid Operators */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-clean)] shadow-xl relative space-y-6"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">
                  For Grid Operators
                </h3>
                <span className="text-xs font-mono text-[var(--accent-clean)]">
                  Distribution Utilities (BPDB) • DERMS Dispatchers
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[var(--accent-clean)]/10 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              Utility Platform
            </span>
          </div>

          <div className="space-y-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Coincident Peak Demand Shaving:</strong> Prevents transformer overload on industrial feeders during hot summer evening spikes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Heavy Fuel Oil Peaker Displacement:</strong> Reduces utility dispatch of expensive, dirty diesel/HFO generation units.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">Autonomous Interlock Protections:</strong> Sets automated feeder headroom buffers to prevent brownouts or localized frequency dips.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[var(--text-primary)]">FastAPI Telemetry Integration:</strong> Standard REST endpoints readily ingestible into existing SCADA / EMS consoles.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)]">Aggregate Feeder Headroom:</span>
            <span className="text-lg font-bold text-[var(--accent-solar)]">+320 kW Headroom</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
