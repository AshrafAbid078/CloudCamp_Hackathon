'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe2,
  Cpu,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Sliders,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { useRole } from '@/hooks';
import { useAuthStore } from '@/lib/store';
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
  const { user, logout } = useAuthStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdapterMenuOpen, setIsAdapterMenuOpen] = useState(false);

  const currentMeta = PATH_TITLES[pathname] || {
    title: 'Meridian Grid Engine',
    subtitle: 'Universal Flexible-Load Intelligence',
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight truncate font-heading">
              {currentMeta.title}
            </h1>
            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] mr-1 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] hidden md:block truncate max-w-sm lg:max-w-md">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Compact & Responsive */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Compact Adapters Status Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAdapterMenuOpen(!isAdapterMenuOpen)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-xs text-[var(--text-muted)] transition-all cursor-pointer"
            title="Engine Adapters Status"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-clean)] animate-pulse" />
            <span className="font-semibold text-[var(--text-primary)] text-[11px]">Adapters</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-raised)] text-[var(--accent-clean)] font-mono font-bold">
              2 Live
            </span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          <AnimatePresence>
            {isAdapterMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAdapterMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] shadow-2xl z-50 p-3 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
                      Universal Adapter Status
                    </span>
                    <Link
                      href="/settings"
                      onClick={() => setIsAdapterMenuOpen(false)}
                      className="text-[10px] text-[var(--accent-solar)] hover:underline"
                    >
                      Config →
                    </Link>
                  </div>

                  {/* Region Adapter Details */}
                  <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <Globe2 className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
                        Region Adapter
                      </span>
                      <span className="text-[10px] font-bold text-[var(--accent-clean)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Live: Bangladesh
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-hairline)]/50">
                      <span>BPDB Chittagong Corridor</span>
                      <span className="font-mono text-[var(--tag-architecture-ready)]">
                        Ready: EU, US
                      </span>
                    </div>
                  </div>

                  {/* Asset Adapter Details */}
                  <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <Cpu className="w-3.5 h-3.5 text-[var(--accent-clean)]" />
                        Asset Adapter
                      </span>
                      <span className="text-[10px] font-bold text-[var(--accent-clean)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Live: Industry + BESS
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-hairline)]/50">
                      <span>Batch Load + 2 MWh Battery</span>
                      <span className="font-mono text-[var(--tag-architecture-ready)]">
                        Ready: EV Fleet
                      </span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Global Role Toggle Switch (Compact & Sleek) */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] shadow-inner">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setRole('facility_manager')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isFacilityManager
                ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-xs font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Facility Manager perspective"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Facility</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setRole('grid_operator')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isGridOperator
                ? 'bg-[var(--accent-clean)] text-[var(--bg-base)] shadow-xs font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Switch to Grid Operator perspective"
          >
            <span>🏭</span>
            <span className="hidden sm:inline">Operator</span>
          </motion.button>
        </div>

        {/* Slide-over Copilot Pill Trigger */}
        <CopilotToggle variant="pill" />

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-solar)] transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[var(--accent-solar)] to-[var(--accent-clean)] flex items-center justify-center text-[var(--bg-base)] font-extrabold text-[11px]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold leading-none text-[11px] truncate max-w-[80px]">
                {user?.name || 'Operator'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] shadow-2xl z-50 p-3 space-y-3"
                >
                  <div className="border-b border-[var(--border-hairline)] pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                      <ShieldCheck className="w-4 h-4 text-[var(--accent-solar)]" />
                      <span>{user?.name || 'Authenticated Session'}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
                      {user?.email || 'admin@meridiangrid.energy'}
                    </p>
                    <div className="mt-2 p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Active Role:</span>
                      <span className="font-mono font-bold text-[var(--accent-solar)]">
                        {isFacilityManager ? 'facility_manager' : 'grid_operator'}
                      </span>
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
                    <Link
                      href="/signup"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <span>Register New User</span>
                      <UserIcon className="w-3.5 h-3.5" />
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
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
