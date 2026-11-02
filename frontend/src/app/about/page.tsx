import Link from 'next/link';
import { Brand } from '@/components/layout/brand';
import {
  Zap,
  Sun,
  BatteryCharging,
  Factory,
  TrendingDown,
  Layers,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Users,
  Clock,
  Sparkles,
  DollarSign,
  FileText,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--accent-solar)] selection:text-[var(--bg-base)]">
      {/* Top Navigation Bar */}
      <header className="border-b border-[var(--border-hairline)] bg-white sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Meridian Grid home">
            <Brand />
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6">
            <Link href="/about" className="font-semibold text-[var(--accent-clean)]">
              About
            </Link>
            <Link href="/docs" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Docs & Architecture
            </Link>
            <Link href="/login" className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-clean)]">
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[var(--accent-clean)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Open Live Demo →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-white border-b border-[var(--border-hairline)]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent-clean)] mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Idea to Unicorn • ClimateSphere AI • Energy Brain
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0c1929] sm:text-5xl lg:text-6xl leading-[1.12]">
              Intelligent Energy Dispatch for Industrial Microgrids.
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-[var(--text-muted)]">
              Meridian Grid unifies <strong>AI solar generation forecasting</strong>,{' '}
              <strong>real-time grid carbon telemetry</strong>, and{' '}
              <strong>Mixed-Integer Linear Programming (MILP)</strong> to dynamically shift heavy industrial loads and battery storage into the cleanest, most cost-effective hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-clean)] px-6 py-3.5 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Open Demo Workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--surface-card)] px-6 py-3.5 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-overlay)]"
              >
                <FileText className="h-4 w-4 text-[var(--accent-clean)]" /> Inspect Technical Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Numbers Strip */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--surface-overlay)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Cost Savings</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[var(--accent-clean)]">Up to 28%</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">via TOU peak tariff load shifting</p>
            </div>
            <div className="p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Peak Shaving</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-amber-500">4× Spread</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">$0.20 peak vs $0.05 off-peak</p>
            </div>
            <div className="p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Solver Engine</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[#174b46]">&lt; 1.0 sec</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">PuLP MILP mathematical convergence</p>
            </div>
            <div className="p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Architecture</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-emerald-600">MCP 1.0</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Google Gemini with zero-hallucination tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: What Happens? (কি কি হয়) */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Core Capabilities</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[#0c1929] sm:text-4xl">What Meridian Grid Does (কি কি হয়)</h2>
          <p className="mt-4 text-base text-[var(--text-muted)]">
            Four coordinated engines link weather forecasts directly to mathematical equipment schedules:
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="surface-panel p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
              <Sun className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">1. Solar Irradiance Forecasting</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Produces rolling 6h, 12h, and 24h Global Horizontal Irradiance (GHI) outlooks using Open-Meteo regional weather models and historical NREL NSRDB satellite ground-truth.
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">2. Real-Time Carbon Telemetry</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Continuously ingests national grid carbon intensity (gCO2eq/kWh) via Electricity Maps v4 API with SQLite persistence and automated 24h background polling.
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">3. MILP Dispatch Optimization</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              PuLP solver formulates a dual-objective problem minimizing cost and carbon emissions while respecting non-interruptible industrial batch windows, BESS SoC limits, and feeder caps.
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">4. Grounded AI Copilot (MCP)</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Google Gemini 2.5 Flash agent executing Model Context Protocol (MCP) tools for instant what-if simulations, decision explanations, and bilingual (English/বাংলা) reasoning.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Where & Who? (কই হয় ও কার জন্য) */}
      <section className="bg-white border-y border-[var(--border-hairline)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-4">
                <MapPin className="h-3.5 w-3.5" /> Regional Context: Bangladesh
              </div>
              <h2 className="text-3xl font-extrabold text-[#0c1929] sm:text-4xl">
                Where It Operates &amp; Who It Serves (কই হয় / কার জন্য)
              </h2>
              <p className="mt-4 text-base text-[var(--text-muted)] leading-relaxed">
                Designed specifically for Bangladesh&apos;s rapidly growing industrial hubs where energy costs and grid reliability directly govern factory profit margins:
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent-clean)] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Target Industrial Clusters</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      RMG (Ready-Made Garments) factories, textile spinning &amp; dyeing mills, pharmaceutical cleanrooms, and agro cold-storage facilities in <strong>Dhaka, Gazipur, Narayanganj, Savar, and Chittagong</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent-clean)] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Persona 1: Facility Energy Managers</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Responsible for lowering monthly electric bills, avoiding peak-demand penalties, utilizing rooftop solar, and preventing battery degradation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent-clean)] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Persona 2: Utility &amp; Grid Operators (BREB, BPDB, DESCO)</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Seeking aggregate demand relief during severe 17:00–23:00 peak hours, easing substation transformer stress and reducing reliance on expensive fuel-oil peaker plants.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Industrial Tariff Reality Box */}
            <div className="surface-panel p-8 border border-[var(--border-subtle)] bg-[var(--surface-overlay)] rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-[#0c1929] flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" /> The Economic Incentive: 4× Tariff Spread
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                In Bangladesh, industrial Time-of-Use (TOU) tariffs impose a heavy penalty during evening peak hours:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-700">
                  <span>Peak Hours (17:00 – 23:00)</span>
                  <span className="font-bold">~$0.20 / kWh (High Tariff + Surcharge)</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800">
                  <span>Off-Peak / Night (23:00 – 07:00)</span>
                  <span className="font-bold">~$0.05 / kWh (Lowest Rate)</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-amber-800">
                  <span>Solar Generation Window (10:00 – 14:00)</span>
                  <span className="font-bold">Free Rooftop Solar Self-Consumption</span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-muted)] italic">
                By charging batteries at night ($0.05) and discharging during peak ($0.20), while sinking continuous batch processes into solar peak hours, facilities capture massive recurring ROI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works Step-by-Step (কীভাবে হয়) */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Technical Workflow</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[#0c1929] sm:text-4xl">How It Works (কীভাবে কাজ করে)</h2>
          <p className="mt-4 text-base text-[var(--text-muted)]">
            A continuous automated pipeline from satellite irradiance to machine dispatch:
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          <div className="surface-panel p-6 border border-[var(--border-subtle)] relative">
            <span className="text-4xl font-extrabold text-[var(--accent-clean)]/20">01</span>
            <h4 className="mt-2 text-base font-bold">Data Ingestion</h4>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              Regional weather from Open-Meteo and grid emissions from Electricity Maps v4 are ingested and synchronized with local Bangladesh Time (Asia/Dhaka).
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] relative">
            <span className="text-4xl font-extrabold text-[var(--accent-clean)]/20">02</span>
            <h4 className="mt-2 text-base font-bold">Horizon Forecasting</h4>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              Generates rolling 6h, 12h, and 24h solar curves and expected grid-carbon stress periods with verified fallback guarantees.
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] relative">
            <span className="text-4xl font-extrabold text-[var(--accent-clean)]/20">03</span>
            <h4 className="mt-2 text-base font-bold">MILP Optimization</h4>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              PuLP solver computes the exact slot assignments for flexible machines and battery cycles, outputting verified signed cost and emission savings.
            </p>
          </div>

          <div className="surface-panel p-6 border border-[var(--border-subtle)] relative">
            <span className="text-4xl font-extrabold text-[var(--accent-clean)]/20">04</span>
            <h4 className="mt-2 text-base font-bold">Copilot Reasoning</h4>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              Google Gemini agent executes Model Context Protocol (MCP) tools, giving facility managers instant natural-language scenario comparisons.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Demo Scope & Transparent Disclosures */}
      <section className="bg-white border-t border-[var(--border-hairline)] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-overlay)] p-8">
            <div className="flex items-center gap-2 text-sm font-bold text-[#174b46]">
              <ShieldCheck className="h-5 w-5 text-[var(--accent-clean)]" /> Demonstration Scope &amp; Scientific Integrity
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)] max-w-4xl">
              <strong>Transparent Reality Check:</strong> This application is a mathematical planning and optimization prototype. Live regional weather is ingested via Open-Meteo, and national carbon data via Electricity Maps v4. All factory machinery and battery specifications are modeled on standard industrial parameters. In this software evaluation build, no physical factory relays or high-voltage equipment breakers are controlled.
            </p>
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--border-hairline)] pt-8">
            <div>
              <h3 className="text-lg font-bold">Ready to explore the workspace?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Inspect public technical documentation or launch the interactive operations console.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/docs"
                className="rounded-md border border-[var(--border-hairline)] bg-white px-5 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-overlay)]"
              >
                Inspect Docs &amp; Architecture
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-[var(--accent-clean)] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                Launch Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
