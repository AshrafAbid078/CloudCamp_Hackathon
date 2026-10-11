import React from 'react';
import Link from 'next/link';
import {
  SunMedium,
  Zap,
  Bot,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <header className="h-20 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              HELIOS GRID
            </span>
            <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">
              Solar & Storage Intelligence
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/about" className="hover:text-amber-400 transition-colors">
            Business Case
          </Link>
          <Link href="/forecast" className="hover:text-amber-400 transition-colors">
            GHI Model
          </Link>
          <Link href="/dispatch" className="hover:text-amber-400 transition-colors">
            BESS Dispatch
          </Link>
          <Link href="/copilot" className="hover:text-amber-400 transition-colors">
            AI Copilot
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium">Live Telemetry: GOES-16 Satellite Cloud Ingestion Active</span>
          <span className="text-amber-400">• v3.2 Neural Net</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
          Autonomous Solar Forecasting & Battery Dispatch Intelligence
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Unify satellite-derived Global Horizontal Irradiance (GHI) prediction with real-time
          locational marginal pricing to maximize battery arbitrage, eliminate curtailment, and assist operators via telemetry-grounded LLMs.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/25 active:scale-95"
          >
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Role-Based Auth Demo</span>
          </Link>
        </div>

        {/* Highlight Metrics Grid */}
        <div className="mt-16 sm:mt-24 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
              <SunMedium className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">96.2%</div>
            <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              GHI Forecast Precision
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Cloud motion vector neural models outperform standard persistence models by 34%.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <div className="p-3 w-fit rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">+18.4%</div>
            <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Revenue Arbitrage Uplift
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Automated battery dispatch absorbs noon solar excess and injects at evening peak tariff windows.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <div className="p-3 w-fit rounded-2xl bg-sky-500/10 text-sky-400 mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">&lt; 150ms</div>
            <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Copilot SCADA Reasoning
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Conversational AI grounded in real-time sensor streams for instantaneous operational root-cause analysis.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <div className="p-3 w-fit rounded-2xl bg-violet-500/10 text-violet-400 mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">Zero Loss</div>
            <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Curtailment Mitigation
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Interconnection headroom monitoring dynamically throttles or stores generation before grid penalties.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 sm:px-12 text-center text-xs text-slate-500">
        <p>© 2026 Helios Grid Platform • CloudCamp Hackathon Architecture Showcase</p>
      </footer>
    </div>
  );
}
