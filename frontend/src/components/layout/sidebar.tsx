'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock3, Database, Home, LineChart, MapPin, Settings, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Brand } from './brand';

const primary = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/forecast', label: 'Forecast', icon: LineChart },
  { href: '/dispatch', label: 'Dispatch', icon: SlidersHorizontal },
  { href: '/history', label: 'Run history', icon: Clock3 },
  { href: '/data', label: 'Data sources', icon: Database },
];
const secondary = [
  { href: '/copilot', label: 'Scenarios', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const { isSidebarOpen, setSidebarOpen } = useRoleStore();
  const items = (links: typeof primary) => links.map(({ href, label, icon: Icon }) =>
    <Link key={href} href={href} onClick={() => setSidebarOpen(false)} aria-current={pathname === href ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${pathname === href ? 'bg-[#2b465e] text-white' : 'text-[#c0ccda] hover:bg-[#233b50] hover:text-white'}`}>
      <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
    </Link>
  );
  return <>
    {isSidebarOpen && <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col bg-[#122232] text-white transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-7 py-7">
        <Link href="/dashboard" aria-label="Meridian Grid overview"><Brand inverse /></Link>
        <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={21} /></button>
      </div>
      <nav aria-label="Workspace" className="space-y-1 px-3 pt-4">{items(primary)}</nav>
      <div className="mx-5 mt-7 border-t border-white/15" />
      <nav aria-label="Account and tools" className="space-y-1 px-3 pt-5">{items(secondary)}</nav>
      <div className="mt-auto border-t border-white/15 px-7 py-6 text-xs text-[#b5c6d5]">
        <div className="mb-5 flex items-start gap-2"><MapPin size={18} className="shrink-0" /><span>Bangladesh<br /><small>Synthetic asset pool</small></span></div>
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-[#344f67] font-bold text-white">{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</span><span className="truncate">{user?.name ?? 'Account'}<small className="block capitalize text-[#aebfce]">{user?.role?.replaceAll('_', ' ')}</small></span></div>
      </div>
    </aside>
  </>;
}
