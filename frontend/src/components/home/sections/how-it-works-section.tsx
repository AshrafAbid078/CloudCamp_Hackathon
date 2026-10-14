'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SunMedium, Zap, Bot } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <section className="mt-24 w-full text-left">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-solar)]/15 border border-[var(--accent-solar)]/30 text-[10px] font-bold text-[var(--accent-solar)] uppercase font-mono mb-3">
          Core Technical Pipeline
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]">
          How The Meridian Engine Operates
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
          Three synchronized phases linking atmospheric physics, mathematical optimization, and autonomous plain-language explanation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Step 1 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] transition-all shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-3xl font-black font-mono text-[var(--bg-surface-raised)] select-none">
            01
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] flex items-center justify-center mb-5">
            <SunMedium className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold font-mono text-[var(--accent-solar)] uppercase tracking-wider mb-1">
            Step 1: Multi-Source Ingestion
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
            NSRDB + NOAA GFS + Electricity Maps
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            Ingests historical solar irradiance from NREL NSRDB, numerical weather models from NOAA GFS, and real-time regional carbon intensity from Electricity Maps. LightGBM predicts localized GHI irradiance 6h–24h ahead.
          </p>
          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Model: LightGBM v4.2</span>
            <span className="text-[var(--accent-clean)] font-bold">58% MAE Uplift</span>
          </div>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-clean)] transition-all shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-3xl font-black font-mono text-[var(--bg-surface-raised)] select-none">
            02
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] flex items-center justify-center mb-5">
            <Zap className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold font-mono text-[var(--accent-clean)] uppercase tracking-wider mb-1">
            Step 2: Constrained Optimization
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
            PuLP Mixed-Integer Linear Programming
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            Formulates the mathematical program balancing industrial production deadlines (earliest start, completion target, batch duration) and battery state-of-charge constraints against Bangladesh peak-hour tariff spikes.
          </p>
          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Solver: PuLP / CBC</span>
            <span className="text-[var(--accent-solar)] font-bold">142ms Convergence</span>
          </div>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--text-primary)] transition-all shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-3xl font-black font-mono text-[var(--bg-surface-raised)] select-none">
            03
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-raised)] text-[var(--text-primary)] flex items-center justify-center mb-5 border border-[var(--border-hairline)]">
            <Bot className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider mb-1">
            Step 3: Agent Explanation
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
            Dual-Role Copilot with Tool Traces
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            Grounded telemetry reasoning explains every scheduling decision in plain, auditable language. Inspects live tool-call traces and adapts tone: operational action-first for plant managers, SCADA telemetry for grid operators.
          </p>
          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>LLM Engine: Ollama / DeepSeek</span>
            <span className="text-[var(--accent-clean)] font-bold">Tool-Call Grounded</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
