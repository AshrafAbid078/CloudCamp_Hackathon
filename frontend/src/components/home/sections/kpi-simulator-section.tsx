'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Factory, SunMedium, Zap, ArrowRight } from 'lucide-react';

export function KpiSimulatorSection() {
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
  );
}
