'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe2,
  Cpu,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { useRole } from '@/hooks';
import { CopilotToggle } from './copilot-toggle';

const PATH_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Overview & Main Results',
    subtitle: 'Universal Flexible-Load Solar Forecasting & Real-Time Dispatch',
  },
  '/forecast': {
    title: 'Solar GHI & Grid-Stress Forecast',
    subtitle: 'LightGBM vs Persistence Benchmarks with Cloud Attenuation',
  },
  '/dispatch': {
    title: 'Asset Dispatch Optimization',
    subtitle: 'Multi-Track Scheduling for Industrial Batch Loads & BESS Arbitrage',
  },
  '/copilot': {
    title: 'Meridian Intelligence Copilot',
    subtitle: 'Telemetry-Grounded Agent with Tool-Call Traces & What-If Simulations',
  },
  '/data': {
    title: 'Data Provenance & Lineage',
    subtitle: 'Audit Trail for NREL NSRDB, NOAA GFS & Electricity Maps Bangladesh',
  },
  '/settings': {
    title: 'System Health & Adapters',
    subtitle: 'Regional & Asset Adapter Pipeline Health, Interlocks & Tolerances',
  },
  '/about': {
    title: 'Architecture & Value Proposition',
    subtitle: 'ClimaTech CloudCampBD Idea to Unicorn — Dual-Track Business Model',
  },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setRole, isFacilityManager, isGridOperator } = useRole();
  const { isSidebarOpen, toggleSidebar } = useRoleStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentMeta = PATH_TITLES[pathname] || {
    title: 'Meridian Grid Engine',
    subtitle: 'Universal Flexible-Load Intelligence',
  };

  const handleLogout = () => {
    localStorage.removeItem('meridian_token');
    router.push('/login');
  };

  return (
    <header className="h-20 px-4 sm:px-8 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
              {currentMeta.title}
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] mr-1 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] hidden sm:block truncate max-w-md">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Adapter Status Chips (Collapsible / Tooltip modal trigger) */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Region Adapter Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[11px]">
            <Globe2 className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
            <span className="text-[var(--text-muted)]">Region:</span>
            <span className="font-semibold text-[var(--accent-clean)]">Live: Bangladesh</span>
            <span className="text-[var(--border-hairline)]">•</span>
            <span className="text-[var(--tag-architecture-ready)] font-medium">Ready: EU, US</span>
          </div>

          {/* Asset Adapter Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-[var(--accent-clean)]" />
            <span className="text-[var(--text-muted)]">Asset:</span>
            <span className="font-semibold text-[var(--accent-clean)]">Live: Industrial + Battery</span>
            <span className="text-[var(--border-hairline)]">•</span>
            <span className="text-[var(--tag-architecture-ready)] font-medium">Ready: EV Fleet</span>
          </div>
        </div>

        {/* Global Role Toggle Switch */}
        <div className="flex items-center p-1 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-hairline)] shadow-inner">
          <button
            onClick={() => setRole('facility_manager')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isFacilityManager
                ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-md shadow-[var(--accent-solar)]/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Facility Manager perspective"
          >
            <span>Facility Manager</span>
            <span>⚡</span>
          </button>
          <button
            onClick={() => setRole('grid_operator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isGridOperator
                ? 'bg-[var(--accent-clean)] text-[var(--bg-base)] shadow-md shadow-[var(--accent-clean)]/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Grid Operator perspective"
          >
            <span>Grid Operator</span>
            <span>🏭</span>
          </button>
        </div>

        {/* Slide-over Copilot Pill Trigger */}
        <CopilotToggle variant="pill" />

        {/* User Menu & Seeded Auth Status */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-solar)] transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[var(--accent-solar)] to-[var(--accent-clean)] flex items-center justify-center text-[var(--bg-base)] font-extrabold text-[11px]">
              M
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold leading-none">Admin</span>
              <span className="text-[10px] text-[var(--accent-solar)] font-mono leading-tight mt-0.5">Seeded</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] shadow-2xl z-50 p-3 space-y-3">
                <div className="border-b border-[var(--border-hairline)] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-solar)]" />
                    <span>Seeded Enterprise Account</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    admin@meridiangrid.energy
                  </p>
                  <div className="mt-2 p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--accent-solar)]/30 text-[10px] text-[var(--accent-solar)] leading-tight">
                    ⚠️ <strong>First-boot notice:</strong> Remember to update default seeded credentials before connecting production SCADA interlocks.
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span>System Health & Adapters</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/data"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span>Data Lineage & Provenance</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="border-t border-[var(--border-hairline)] pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[var(--accent-stress)] hover:bg-[var(--accent-stress)]/10 transition-colors cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
