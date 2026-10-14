import React from 'react';

export function Footer() {
  return (
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
  );
}
