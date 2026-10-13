import React from 'react';
import Link from 'next/link';
import {
  SunMedium,
  Zap,
  Bot,
  ArrowRight,
  Cpu,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
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
      <header className="relative z-20 h-20 border-b border-[var(--border-hairline)] px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/25">
            <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight font-heading text-[var(--text-primary)]">
              MERIDIAN GRID
            </span>
            <div className="text-[10px] text-[var(--accent-solar)] font-semibold uppercase tracking-widest font-mono">
              ClimaTech • Idea to Unicorn
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[var(--text-muted)]">
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
            Business & Judges
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-all border border-[var(--border-hairline)]"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] text-xs font-extrabold transition-all shadow-lg shadow-[var(--accent-solar)]/25 active:scale-95"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-12 sm:py-20 flex flex-col items-center text-center">
        {/* Adapter Framing Line: Guaranteed visible without scrolling */}
        <div className="w-full max-w-4xl p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-hairline)] backdrop-blur-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--accent-solar)] font-mono">
              Engine Adapter Status:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] animate-pulse" />
              Live: Bangladesh (BPDB + Electricity Maps)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40 font-mono text-[10px]">
              Ready: EU, US
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
        </div>

        {/* Tagline Treatment */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
          <span className="font-medium text-[var(--text-primary)]">
            One engine. Any flexible load. Anywhere the sun and the grid don&apos;t quite agree.
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] font-heading text-[var(--text-primary)]">
          Autonomous Solar Load Scheduling & Intelligent Grid Coordination
        </h1>

        {/* Hero One-Line Pitch */}
        <p className="mt-6 text-base sm:text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed">
          An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] font-extrabold text-sm transition-all shadow-xl shadow-[var(--accent-solar)]/25 active:scale-95"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--accent-clean)]" />
            <span>View Judge Business Case</span>
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
              Live Session Savings
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              $4,820
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Avoided peak demand surcharges & carbon penalties today
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-solar)] uppercase tracking-wider mb-1 font-mono">
              GHI Forecasts Run
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              148
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              LightGBM inferences vs NSRDB persistence benchmark
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1 font-mono">
              Facilities Simulated
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              12 Sites
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Bangladesh industrial data (Chittagong corridor, synthetic)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
            <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
              Clean Energy Offset
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
              318 gCO₂
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Per kWh shifted from evening gas peakers to midday solar
            </p>
          </div>
        </div>

        {/* 3-Step Functional Journey: Forecast -> Optimize -> Explain */}
        <div className="mt-20 w-full text-left">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]">
              How Meridian Grid Solves The Solar-Load Mismatch
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
              A universal architecture linking regional weather data, industrial asset physics, and agent explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] flex items-center justify-center mb-5">
                <SunMedium className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold font-mono text-[var(--accent-solar)] uppercase tracking-wider mb-1">
                Phase 1: Solar & Stress Forecast
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
                Sub-Hour Irradiance & Carbon Prediction
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Ingests NREL NSRDB irradiance history and NOAA GFS cloud forecasts via LightGBM, predicting localized GHI and regional grid stress 6h to 24h ahead.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-clean)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold font-mono text-[var(--accent-clean)] uppercase tracking-wider mb-1">
                Phase 2: Universal Load Scheduling
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
                Multi-Asset MILP Optimization
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Schedules industrial batch processes (dye-vats, arc furnaces, chillers) and battery charge/discharge cycles into the cleanest, lowest-tariff windows without breaking deadlines.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--text-primary)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-raised)] text-[var(--text-primary)] flex items-center justify-center mb-5 border border-[var(--border-hairline)]">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider mb-1">
                Phase 3: Agentic Explanation
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-heading">
                Dual-Role Plain Language Copilot
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Grounds LLM reasoning with live tool-call traces (<code className="font-mono text-[11px] text-[var(--accent-solar)]">get_forecast</code>, <code className="font-mono text-[11px] text-[var(--accent-clean)]">run_whatif</code>), tailoring tone for Facility Managers vs. Grid Operators.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* NASA-style Attribution Footer */}
      <footer className="relative z-10 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 px-6 sm:px-12 text-xs text-[var(--text-muted)] mt-16">
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

          {/* NASA & Research Citations */}
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
