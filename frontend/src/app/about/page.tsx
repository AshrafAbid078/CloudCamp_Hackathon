import React from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Award,
  Check,
} from 'lucide-react';

export default function JudgeAboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--accent-solar)] selection:text-[var(--bg-base)] relative overflow-x-hidden">
      {/* Background Matrix */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-20 h-20 border-b border-[var(--border-hairline)] px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
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
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] text-xs font-extrabold transition-all shadow-lg shadow-[var(--accent-solar)]/20"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
        {/* Judge Hero Pitch */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-solar)]/15 border border-[var(--accent-solar)]/30 text-xs font-mono font-bold text-[var(--accent-solar)]">
            <Award className="w-4 h-4" />
            <span>CloudCampBD: Idea to Unicorn • ClimaTech Submission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading text-[var(--text-primary)] leading-[1.1]">
            Universal Flexible-Load Intelligence Engine
          </h1>

          <p className="text-sm sm:text-lg text-[var(--text-muted)] leading-relaxed">
            An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.
          </p>

          <p className="text-xs font-mono text-[var(--accent-clean)]">
            Tagline: &ldquo;One engine. Any flexible load. Anywhere the sun and the grid don&apos;t quite agree.&rdquo;
          </p>
        </div>

        {/* Dual-Track Business Model Table */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
              Dual-Track Business Model
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Serving both commercial energy consumers and electric distribution utilities on a single unified engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track 1: Facility SaaS */}
            <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5 shadow-xl relative overflow-hidden">
              <div className="w-2 h-full bg-[var(--accent-solar)] absolute left-0 top-0" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-solar)]">
                  Track 1 (B2B SaaS)
                </span>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)] mt-1">
                  Facility Manager Platform
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  For factories, textile dye-houses, cold-storage warehouses, and commercial microgrids.
                </p>
              </div>

              <div className="text-3xl font-extrabold font-mono text-[var(--accent-solar)]">
                $299 – $1,499
                <span className="text-xs text-[var(--text-muted)] font-normal font-sans ml-2">/ month / facility</span>
              </div>

              <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Peak Demand Charge Avoidance:</strong> Automatically shifts loads to prevent costly coincident demand surcharges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Rooftop Solar Self-Consumption:</strong> Absorbs 100% of solar generation on-site with zero negative feed-in waste.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Plain-Language Agent Copilot:</strong> Empowers non-technical factory plant managers with action-first schedules.</span>
                </li>
              </ul>
            </div>

            {/* Track 2: Utility / DERMS Platform */}
            <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5 shadow-xl relative overflow-hidden">
              <div className="w-2 h-full bg-[var(--accent-clean)] absolute left-0 top-0" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-clean)]">
                  Track 2 (Enterprise Infrastructure)
                </span>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)] mt-1">
                  Utility & DERMS Grid Operator
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  For electric utilities (BPDB, REB, DESCO), aggregators, and distribution system operators (DSOs).
                </p>
              </div>

              <div className="text-3xl font-extrabold font-mono text-[var(--accent-clean)]">
                $25,000 – $150,000
                <span className="text-xs text-[var(--text-muted)] font-normal font-sans ml-2">/ year / utility zone</span>
              </div>

              <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Virtual Power Plant (VPP) Aggregation:</strong> Dynamically calls demand-response load drops across enrolled industrial fleets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Feeder Stress Relief:</strong> Relieves 33kV and 11kV substation congestion during the 18:30–21:30 national lighting peak.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--accent-clean)] shrink-0 mt-0.5" />
                  <span><strong>Peaker Carbon Displacement:</strong> Eliminates the need to fire costly heavy fuel oil peakers during evening ramps.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Competitive Differentiation Matrix */}
        <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-xl space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">
              Competitive Differentiation Matrix
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              How Meridian Grid outperforms legacy SCADA, generic DERMS, and manual factory scheduling.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] font-mono uppercase text-[11px]">
                  <th className="py-3 px-3">Capability</th>
                  <th className="py-3 px-3 text-[var(--accent-solar)] font-bold">Meridian Grid (Ours)</th>
                  <th className="py-3 px-3">Legacy SCADA Systems</th>
                  <th className="py-3 px-3">Generic DERMS Platforms</th>
                  <th className="py-3 px-3">Manual Factory Scheduling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]/60">
                <tr className="hover:bg-[var(--bg-surface-raised)]/60">
                  <td className="py-3.5 px-3 font-semibold text-[var(--text-primary)]">
                    Coupled Solar & Grid Carbon Forecasting
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[var(--accent-clean)] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[var(--accent-clean)]" />
                    <span>Coupled LightGBM + GFS</span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">No forecasting (raw meters only)</td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Generic weather API</td>
                  <td className="py-3.5 px-3 text-[var(--accent-stress)]">Zero</td>
                </tr>

                <tr className="hover:bg-[var(--bg-surface-raised)]/60">
                  <td className="py-3.5 px-3 font-semibold text-[var(--text-primary)]">
                    Universal Multi-Asset Support (Industrial + Battery + EV)
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[var(--accent-clean)] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[var(--accent-clean)]" />
                    <span>Pluggable Adapter Schema</span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Hardcoded vendor PLC</td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Battery-only or EV-only</td>
                  <td className="py-3.5 px-3 text-[var(--accent-stress)]">Spreadsheets</td>
                </tr>

                <tr className="hover:bg-[var(--bg-surface-raised)]/60">
                  <td className="py-3.5 px-3 font-semibold text-[var(--text-primary)]">
                    Dual-Tone LLM Copilot with Tool Traces
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[var(--accent-clean)] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[var(--accent-clean)]" />
                    <span>Live Traces & Tone Switching</span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Alarm logs only</td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Static report dashboards</td>
                  <td className="py-3.5 px-3 text-[var(--accent-stress)]">None</td>
                </tr>

                <tr className="hover:bg-[var(--bg-surface-raised)]/60">
                  <td className="py-3.5 px-3 font-semibold text-[var(--text-primary)]">
                    Interactive What-If Simulation
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[var(--accent-clean)] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[var(--accent-clean)]" />
                    <span>Sub-150ms MILP Re-solver</span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">No simulation</td>
                  <td className="py-3.5 px-3 text-[var(--text-muted)]">Offline batch run (hours)</td>
                  <td className="py-3.5 px-3 text-[var(--accent-stress)]">Guesswork</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Demo Links & Hackathon Context */}
        <div className="p-8 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-4 text-center">
          <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">
            Explore The Live Meridian Grid Demonstration
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-xl mx-auto">
            Test the live GHI solar curves, inspect the multi-track dispatch optimizer, and ask the LLM copilot what happens if solar drops 30%.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-[var(--accent-solar)] text-[var(--bg-base)] font-extrabold text-xs shadow-lg shadow-[var(--accent-solar)]/25 hover:brightness-110"
            >
              Main Overview Dashboard →
            </Link>
            <Link
              href="/forecast"
              className="px-6 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-bold text-xs hover:border-[var(--accent-solar)]"
            >
              GHI Forecast & Benchmarks →
            </Link>
            <Link
              href="/dispatch"
              className="px-6 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-bold text-xs hover:border-[var(--accent-solar)]"
            >
              Multi-Track Dispatch Plan →
            </Link>
            <Link
              href="/copilot"
              className="px-6 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-bold text-xs hover:border-[var(--accent-solar)]"
            >
              Agentic Copilot with Tool Traces →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-8 px-6 text-center text-xs text-[var(--text-muted)]">
        <p>© 2026 Meridian Grid • CloudCampBD ClimaTech Hackathon Submission</p>
      </footer>
    </div>
  );
}
