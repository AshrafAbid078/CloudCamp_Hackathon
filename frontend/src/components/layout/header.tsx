'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { t } from '@/lib/ui-copy';

export function Header() {
  const router = useRouter();
  const toggleSidebar = useRoleStore(state => state.toggleSidebar);
  const logout = useAuthStore(state => state.logout);

  return (
    <header className="flex min-h-13 items-center justify-between gap-3 px-5 pt-4 lg:px-10 lg:pt-5">
      <div className="flex items-center gap-3 text-sm text-[#60768a]">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md border border-[var(--border-hairline)] p-2 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>
        <span className="hidden sm:inline">Workspace</span>
        <span className="hidden sm:inline text-[#acb9c5]">/</span>
        <span className="font-medium text-[var(--text-primary)]">Bangladesh (Dhaka Grid)</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5d7489] transition-colors hover:text-[var(--accent-clean)]"
        >
          <LogOut size={15} />
          <span>{t('navSignOut')}</span>
        </button>
      </div>
    </header>
  );
}
