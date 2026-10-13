'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
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
  const { isSidebarOpen, setSidebarOpen } = useRoleStore();

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'w-72 shrink-0 flex flex-col h-screen border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all select-none z-50',
          'fixed lg:static top-0 left-0 shadow-2xl lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-base)]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-md shadow-[var(--accent-solar)]/20">
              <div className="w-full h-full bg-[var(--bg-base)] rounded-[10px] flex items-center justify-center text-[var(--accent-solar)]">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight font-heading text-[var(--text-primary)]">
                MERIDIAN GRID
              </span>
              <span className="text-[9px] text-[var(--accent-solar)] uppercase tracking-widest font-semibold font-mono">
                Universal Engine
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Adapter Status Panel in Sidebar */}
        <div className="p-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-base)]/30 space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Engine Adapters</span>
            <span className="text-[var(--accent-clean)]">● Active</span>
          </div>

          {/* Region Adapter status */}
          <div className="p-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
                <Globe2 className="w-3 h-3 text-[var(--accent-solar)]" />
                Region
              </span>
              <span className="text-[10px] font-semibold text-[var(--accent-clean)]">Live: BD</span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border-hairline)]/60 text-[var(--text-muted)]">
              <span>Chittagong Corridor</span>
              <span className="px-1.5 py-0.2 rounded bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] font-mono text-[9px]">
                EU, US Stubs
              </span>
            </div>
          </div>

          {/* Asset Adapter status */}
          <div className="p-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
                <Cpu className="w-3 h-3 text-[var(--accent-clean)]" />
                Asset
              </span>
              <span className="text-[10px] font-semibold text-[var(--accent-clean)]">Live: Ind + BESS</span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border-hairline)]/60 text-[var(--text-muted)]">
              <span>Batch Load + Battery</span>
              <span className="px-1.5 py-0.2 rounded bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] font-mono text-[9px]">
                EV Fleet Stub
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--accent-solar)]/50 shadow-md shadow-[var(--accent-solar)]/5'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)]/60 hover:text-[var(--text-primary)]'
                )}
              >
                <div className="flex items-center gap-2.5">
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
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider',
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
        <div className="p-3.5 border-t border-[var(--border-hairline)] bg-[var(--bg-base)]/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)] text-[11px]">Active Persona</span>
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
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            {permissions.tagline}
          </p>
        </div>
      </aside>
    </>
  );
}
