import React from 'react';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  BarChart4,
  ArrowRight,
  Globe2,
  DollarSign,
  CloudSun,
  Award,
} from 'lucide-react';

export default function BusinessCasePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="h-20 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              HELIOS GRID
            </span>
            <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">
              Business Case & Architecture
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>CloudCamp Hackathon Project Showcase</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            The Business & Engineering Case for Autonomous Solar Dispatch
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            How fusing deep satellite irradiance neural nets with battery dispatch optimization solves the California Duck Curve and delivers institutional-grade wholesale arbitrage.
          </p>
        </div>

        {/* The Challenge vs The Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-rose-500/20 relative overflow-hidden">
            <div className="w-2 h-full bg-rose-500 absolute left-0 top-0" />
            <h3 className="text-lg font-bold text-rose-400 mb-3">The Industry Challenge</h3>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Solar Price Cannibalization:</strong> Midday solar flooding depresses wholesale clearing prices into negative territory (-$15 to -$30/MWh).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Curtailment Penalties:</strong> Transmission interconnect congestion forces operators to dump clean MWs to prevent grid line overloads.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Ramping Strain:</strong> Rapid cloud band transit causes sudden 200+ MW power swings in under 15 minutes, stressing spinning reserves.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.02] border border-emerald-500/20 relative overflow-hidden">
            <div className="w-2 h-full bg-emerald-500 absolute left-0 top-0" />
            <h3 className="text-lg font-bold text-emerald-400 mb-3">The Helios Solution</h3>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Sub-Hour GHI Precision:</strong> Optical flow satellite tracking predicts localized cloud cover 15 to 60 minutes ahead with 96.2% accuracy.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>MILP Battery Arbitrage:</strong> Automatically charges BESS storage during cheap/negative noon hours and discharges into $140+/MWh evening peaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Grounded AI Copilot:</strong> Empowers plant operators with real-time conversational analysis directly linked to SCADA sensor streams.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quantified Value & ROI Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-center">
            Modeled Annual Value Creation (100 MW PV + 40 MWh BESS)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-amber-400 font-mono">+$1,420,000</div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-1">
                Net Annual Arbitrage Uplift
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Additional wholesale settlement profit via time-of-export price optimization.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">15,600 MWh</div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-1">
                Annual Curtailment Rescued
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Clean electricity safely stored instead of being disconnected by ISO operators.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-sky-400 font-mono">11,200 Tons</div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-1">
                CO2 Emissions Avoided
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Displacing natural gas peaker plants during California evening ramp periods.
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Stack */}
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>Architecture & Technology Stack</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">
                Frontend App
              </span>
              <strong className="text-white block text-sm">Next.js 16 App Router</strong>
              <span className="text-slate-400 text-[11px] mt-1 block">
                React 19, TypeScript, Tailwind CSS v4, Zustand, Recharts
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-sky-400 font-bold uppercase block mb-1">
                Forecasting Pipeline
              </span>
              <strong className="text-white block text-sm">GHI ConvNet & Farneback</strong>
              <span className="text-slate-400 text-[11px] mt-1 block">
                GOES-16 ABI satellite optical flow fused with Modbus pyranometers
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                Storage Optimization
              </span>
              <strong className="text-white block text-sm">MILP Solver Engine</strong>
              <span className="text-slate-400 text-[11px] mt-1 block">
                Day-ahead Locational Marginal Pricing arbitration with degradation penalties
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-violet-400 font-bold uppercase block mb-1">
                Autonomous Copilot
              </span>
              <strong className="text-white block text-sm">Grounded LLM SCADA</strong>
              <span className="text-slate-400 text-[11px] mt-1 block">
                Sub-150ms reasoning over real-time sensor streams and ISO dispatches
              </span>
            </div>
          </div>
        </div>

        {/* Action Call */}
        <div className="text-center pt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-amber-500/25 active:scale-95"
          >
            <span>Experience The Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Helios Grid • CloudCamp Hackathon Technical Business Case</p>
      </footer>
    </div>
  );
}
