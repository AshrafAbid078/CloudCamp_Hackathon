'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronDown,
  Shield,
  Sun,
  Activity,
  Radio,
} from 'lucide-react';
import { useRole } from '@/hooks';
import { useAppStore } from '@/lib/store';
import { CopilotToggle } from './copilot-toggle';
import { Chip } from '@/components/common';
import type { UserRole } from '@/lib/types';

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Fleet Overview & Real-Time KPIs',
  '/forecast': 'GHI Solar Irradiance & Cloud Motion',
  '/dispatch': 'BESS Optimization & Schedule Arbitrage',
  '/copilot': 'Solar Intelligence Copilot Assistant',
  '/data': 'Data Lineage & SCADA Provenance',
  '/settings': 'System Health, Interlocks & Thresholds',
  '/about': 'Technical Business Case & Value Proposition',
};

export function Header() {
  const pathname = usePathname();
  const { role, setRole, allRoles } = useRole();
  const unreadAlertsCount = useAppStore((state) => state.unreadAlertsCount);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const currentTitle = PATH_TITLES[pathname] || 'Helios Grid Control';

  return (
    <header className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Title & Status indicator */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {currentTitle}
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <Chip variant="success" size="sm" dot>
            Telemetry: Live 1-Sec
          </Chip>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>LMP: <strong className="text-zinc-800 dark:text-zinc-200">$88.40/MWh</strong></span>
          </div>
        </div>
      </div>

      {/* Actions: Role Selector, Copilot, Alerts */}
      <div className="flex items-center gap-3">
        {/* Role Toggle Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline text-zinc-500 font-normal">Role:</span>
            <span className="capitalize font-semibold">{role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Switch Operational Role
                </div>
                {allRoles.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => {
                      setRole(item.role as UserRole);
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-start justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize flex items-center gap-1.5">
                        {item.role}
                        {role === item.role && (
                          <Check className="w-3.5 h-3.5 text-sky-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Copilot Pill Trigger */}
        <CopilotToggle variant="pill" />

        {/* Alerts Icon */}
        <div className="relative">
          <button
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="System alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
