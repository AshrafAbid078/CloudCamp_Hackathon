'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  SunMedium,
  Zap,
  Bot,
  Database,
  Sliders,
  Info,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useRole } from '@/hooks';
import { Chip } from '@/components/common';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview & KPIs', href: '/dashboard', icon: LayoutDashboard },
  { name: 'GHI Forecast Analysis', href: '/forecast', icon: SunMedium, badge: 'Live' },
  { name: 'Dispatch Optimization', href: '/dispatch', icon: Zap },
  { name: 'Copilot Chatbot', href: '/copilot', icon: Bot, badge: 'AI' },
  { name: 'Data Provenance', href: '/data', icon: Database },
  { name: 'System Health', href: '/settings', icon: Sliders },
  { name: 'Business Case', href: '/about', icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, permissions } = useRole();

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-all select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-zinc-900 via-sky-950 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            HELIOS GRID
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            Solar Intelligence
          </span>
        </div>
      </div>

      {/* Facility / Substation selector */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Active Solar Array</span>
          </div>
          <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
            Mohave Array & BESS-1
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>120 MW PV • 40 MWh Storage</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                  )}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                      item.badge === 'AI'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-500" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Current Role Indicator & Interlock Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Active Profile</span>
          </div>
          <Chip variant="info" size="sm" className="capitalize">
            {role}
          </Chip>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
          {permissions.displayName}
        </p>
      </div>
    </aside>
  );
}
