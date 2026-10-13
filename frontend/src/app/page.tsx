'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  SunMedium,
  Zap,
  Bot,
  ArrowRight,
  Cpu,
  Sparkles,
  ShieldCheck,
  Globe2,
  Sliders,
  CheckCircle2,
  Factory,
  BarChart3,
  Lock,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function LandingPage() {
  // Interactive KPI Preview State
  const [baseLoadKw, setBaseLoadKw] = useState(650);
  const [solarCapacityKwp, setSolarCapacityKwp] = useState(420);
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(800);

  // Dynamic calculations based on Bangladesh TOU tariff deltas (BDT 8.5 off-peak vs BDT 14.8 peak)
  const monthlySavingsUsd = Math.round(
    (baseLoadKw * 1.85 + solarCapacityKwp * 3.4 + batteryCapacityKwh * 1.75) * 1.2
  );
  const annualCarbonAvoidedTons = (
    ((solarCapacityKwp * 1.45 + batteryCapacityKwh * 0.55) * 365) /
    1000
  ).toFixed(1);
  const peakShavedKw = Math.round(solarCapacityKwp * 0.38 + batteryCapacityKwh * 0.28);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--accent-solar)] selection:text-[var(--bg-base)] relative overflow-x-hidden">
      {/* Background Decorative Grid and Solar Horizon Sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Navy Grid Matrix */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radiant Solar-Cycle Horizon Sweep Visual */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[var(--accent-solar)]/12 via-[var(--accent-clean)]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-44 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-solar)]/60 to-transparent" />
        <div className="absolute top-44 -left-1/4 w-1/2 h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-solar)] to-transparent animate-solar-sweep blur-[1px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 h-16 sm:h-20 border-b border-[var(--border-hairline)] px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/25"
          >
            <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </motion.div>
          <div>
            <span className="font-extrabold text-base tracking-tight font-heading text-[var(--text-primary)]">
              MERIDIAN GRID
            </span>
            <div className="text-[10px] text-[var(--accent-solar)] font-semibold uppercase tracking-widest font-mono">
              ClimaTech • Idea to Unicorn
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[var(--text-muted)]">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/forecast" className="hover:text-[var(--text-primary)] transition-colors">
            Solar GHI Model
          </Link>
          <Link href="/dispatch" className="hover:text-[var(--text-primary)] transition-colors">
            Dispatch Optimizer
          </Link>
          <Link href="/copilot" className="hover:text-[var(--text-primary)] transition-colors">
            AI Copilot
          </Link>
          <Link href="/about" className="hover:text-[var(--accent-solar)] transition-colors">
            Business Model
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-all border border-[var(--border-hairline)]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-surface-raised)] hover:border-[var(--accent-solar)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-primary)] transition-all"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] text-xs font-extrabold transition-all shadow-lg shadow-[var(--accent-solar)]/25 active:scale-95"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 sm:py-16 flex flex-col items-center text-center">
        {/* Adapter Framing Line */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-hairline)] backdrop-blur-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--accent-solar)] font-mono">
              Engine Status:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] animate-pulse" />
              Live: Bangladesh (BPDB + Electricity Maps)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40 font-mono text-[10px]">
              Architecture-Ready: EU, US
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-semibold text-[11px]">
              <Cpu className="w-3 h-3 text-[var(--accent-clean)]" />
              Live: Industrial + Battery
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40 font-mono text-[10px]">
              Ready: EV Fleet
            </span>
          </div>
        </motion.div>

        {/* Tagline Treatment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
          <span className="font-medium text-[var(--text-primary)]">
            One engine. Any flexible load. Anywhere the sun and the grid don&apos;t quite agree.
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] font-heading text-[var(--text-primary)]"
        >
          Autonomous Solar Load Scheduling & Intelligent Grid Coordination
        </motion.h1>

        {/* Hero One-Line Pitch */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-base sm:text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed"
        >
          An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] font-extrabold text-sm transition-all shadow-xl shadow-[var(--accent-solar)]/25 active:scale-95"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--accent-clean)]" />
            <span>Create Operator Account</span>
          </Link>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-14 w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left"
        >
          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
              Live Session Savings
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              $4,820
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Avoided peak demand surcharges & carbon penalties today
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-solar)] uppercase tracking-wider mb-1 font-mono">
              GHI Forecasts Run
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              148
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              LightGBM inferences vs NSRDB persistence benchmark
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1 font-mono">
              Facilities Simulated
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              12 Sites
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Bangladesh industrial data (Chittagong corridor, synthetic)
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
              Clean Energy Offset
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              318 gCO₂
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Per kWh shifted from evening gas peakers to midday solar
            </p>
          </motion.div>
        </motion.div>

        {/* ========================================================================= */}
        {/* SECTION 1: HOW IT WORKS (3-STEP ENGINE PIPELINE)                           */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* SECTION 2: PLUGGABLE ARCHITECTURE SHOWCASE (ADAPTER MATRIX)               */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* SECTION 3: DUAL-TRACK VALUE PROPOSITION                                   */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* SECTION 4: INTERACTIVE SIMULATED KPI PREVIEW WIDGET                       */}
        {/* ========================================================================= */}
        <section className="mt-28 w-full text-left">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-2xl relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10px] font-bold text-[var(--accent-solar)] uppercase tracking-wider font-mono">
                Interactive Model Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)] mt-1">
                Simulate Your Facility&apos;s Flexible Load Potential
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Adjust parameters to project real-time savings using the Bangladesh regional optimization curve.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Slider 1: Base Load */}
                <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Factory className="w-4 h-4 text-[var(--accent-solar)]" />
                      Facility Average Base Load
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--accent-solar)]">
                      {baseLoadKw} kW
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={baseLoadKw}
                    onChange={(e) => setBaseLoadKw(Number(e.target.value))}
                    className="w-full accent-[var(--accent-solar)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>100 kW (Small Workshop)</span>
                    <span>2,000 kW (Textile Dyeing Complex)</span>
                  </div>
                </div>

                {/* Slider 2: Solar Array */}
                <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <SunMedium className="w-4 h-4 text-[var(--accent-solar)]" />
                      Rooftop Solar Array Capacity
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--accent-solar)]">
                      {solarCapacityKwp} kWp
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1200}
                    step={20}
                    value={solarCapacityKwp}
                    onChange={(e) => setSolarCapacityKwp(Number(e.target.value))}
                    className="w-full accent-[var(--accent-solar)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>0 kWp (Grid Only)</span>
                    <span>1,200 kWp (Industrial Rooftop)</span>
                  </div>
                </div>

                {/* Slider 3: Battery Storage */}
                <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[var(--accent-clean)]" />
                      Battery Energy Storage (BESS)
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--accent-clean)]">
                      {batteryCapacityKwh} kWh
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2500}
                    step={50}
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(Number(e.target.value))}
                    className="w-full accent-[var(--accent-clean)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>0 kWh (No Storage)</span>
                    <span>2,500 kWh (Utility-Scale Pack)</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs (5 Cols) */}
              <div className="lg:col-span-5 p-7 rounded-3xl bg-gradient-to-b from-[var(--bg-surface-raised)] to-[var(--bg-base)] border border-[var(--border-hairline)] shadow-xl space-y-5">
                <div className="border-b border-[var(--border-hairline)] pb-4">
                  <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-wider">
                    Projected Optimization Delta
                  </span>
                  <div className="text-3xl font-extrabold font-mono text-[var(--accent-clean)] mt-1">
                    +${monthlySavingsUsd.toLocaleString()} / mo
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Estimated monthly reduction in electricity bill
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                      Emissions Avoided
                    </span>
                    <span className="text-xl font-bold font-mono text-[var(--accent-solar)] mt-1 block">
                      {annualCarbonAvoidedTons} tCO₂
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Annual peaker offset</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                      Peak Demand Shaved
                    </span>
                    <span className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1 block">
                      {peakShavedKw} kW
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Coincident peak drop</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] text-xs font-extrabold transition-all shadow-md active:scale-95"
                  >
                    <span>Run Full MILP Simulation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: DATA PROVENANCE & TRUST GRID                                   */}
        {/* ========================================================================= */}
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
      </main>

      {/* NASA-style Attribution Footer */}
      <footer className="relative z-10 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 px-6 sm:px-12 text-xs text-[var(--text-muted)] mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-[var(--text-primary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-solar)]" />
              <span>MERIDIAN GRID PLATFORM</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              ClimaTech Challenge • CloudCampBD: Idea to Unicorn • Universal Flexible Load Engine
            </p>
          </div>

          {/* Citations & Navigation */}
          <div className="flex flex-col md:items-end text-[11px] space-y-1">
            <p className="text-[var(--text-primary)] font-semibold">
              Telemetry & Meteorological Data Sources:
            </p>
            <p className="text-[var(--text-muted)]">
              NREL NSRDB (Solar Radiation DB) • NOAA GFS (Global Forecast System) • Electricity Maps API • BPDB Industrial Tariffs
            </p>
            <p className="text-[10px] text-[var(--tag-architecture-ready)]">
              Synthetic dataset calibrated for Bangladesh industrial clusters (Gazipur & Chittagong)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
