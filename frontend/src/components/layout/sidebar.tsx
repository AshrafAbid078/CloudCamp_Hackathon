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
  Globe2,
  Cpu,
} from 'lucide-react';
import { useRole } from '@/hooks';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'clean' | 'solar' | 'stress' | 'architecture';
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'GHI Forecast Detail', href: '/forecast', icon: SunMedium, badge: 'Live', badgeVariant: 'solar' },
  { name: 'Dispatch Plan (MILP)', href: '/dispatch', icon: Zap, badge: 'Optimal', badgeVariant: 'clean' },
  { name: 'Meridian Copilot', href: '/copilot', icon: Bot, badge: 'Agentic', badgeVariant: 'solar' },
  { name: 'Data Provenance', href: '/data', icon: Database },
  { name: 'System Health', href: '/settings', icon: Sliders },
  { name: 'Judge Business Case', href: '/about', icon: Info, badge: 'Pitch', badgeVariant: 'clean' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { permissions, isFacilityManager } = useRole();
  const { isSidebarOpen } = useRoleStore();

  return (
    <aside
      className={cn(
        'w-72 shrink-0 flex flex-col h-screen border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all select-none z-40',
        'fixed lg:static top-0 left-0 shadow-2xl lg:shadow-none',
        !isSidebarOpen && 'hidden lg:flex'
      )}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3.5 px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-base)]/50">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/20">
          <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight font-heading text-[var(--text-primary)]">
            MERIDIAN GRID
          </span>
          <span className="text-[10px] text-[var(--accent-solar)] uppercase tracking-widest font-semibold font-mono">
            Universal Flexible Engine
          </span>
        </div>
      </div>

      {/* Global Adapter Status Panel in Sidebar */}
      <div className="p-4 border-b border-[var(--border-hairline)] bg-[var(--bg-base)]/30 space-y-2.5">
        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
          <span>Engine Adapters</span>
          <span className="text-[var(--accent-clean)]">● Active</span>
        </div>

        {/* Region Adapter status */}
        <div className="p-2.5 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
              Region Adapter
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent-clean)]">Live: BD</span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border-hairline)]/60 text-[var(--text-muted)]">
            <span>Bangladesh (BPDB / GFS)</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] font-mono text-[9px]">
              Ready: EU, US
            </span>
          </div>
        </div>

        {/* Asset Adapter status */}
        <div className="p-2.5 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-clean)]" />
              Asset Adapter
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent-clean)]">Live: Ind + BESS</span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border-hairline)]/60 text-[var(--text-muted)]">
            <span>Industrial + 40MWh Battery</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] font-mono text-[9px]">
              Ready: EV Fleet
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                isActive
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--accent-solar)]/50 shadow-md shadow-[var(--accent-solar)]/5'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)]/60 hover:text-[var(--text-primary)]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-[var(--accent-solar)]'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--accent-solar)]'
                  )}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                      item.badgeVariant === 'solar'
                        ? 'bg-[var(--accent-solar)]/20 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30'
                        : item.badgeVariant === 'clean'
                        ? 'bg-[var(--accent-clean)]/20 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30'
                        : 'bg-[var(--bg-base)] text-[var(--text-muted)]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-solar)]" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Role State Indicator & Footer */}
      <div className="p-4 border-t border-[var(--border-hairline)] bg-[var(--bg-base)]/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">Active Persona</span>
          </div>
          <span
            className={cn(
              'px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
              isFacilityManager
                ? 'bg-[var(--accent-solar)]/20 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30'
                : 'bg-[var(--accent-clean)]/20 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30'
            )}
          >
            {permissions.displayName} {permissions.badgeEmoji}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {permissions.tagline}
        </p>
      </div>
    </aside>
  );
}
