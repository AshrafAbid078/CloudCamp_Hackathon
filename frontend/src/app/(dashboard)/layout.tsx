'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Shield } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Immediate pre-check: if no token exists in localStorage, redirect immediately
    const token = typeof window !== 'undefined' ? localStorage.getItem('meridian_token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    void checkAuth().finally(() => setChecked(true));

    const expire = () => {
      logout();
      router.replace('/login');
    };
    window.addEventListener('meridian-session-expired', expire);
    return () => window.removeEventListener('meridian-session-expired', expire);
  }, [checkAuth, logout, router]);

  useEffect(() => {
    if (checked && !isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (checked && !isLoading && user?.mustChangePassword) {
      router.replace('/change-password');
    }
  }, [checked, isLoading, isAuthenticated, user, router]);

  if (!checked || isLoading || !isAuthenticated || user?.mustChangePassword) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-base)] flex flex-col items-center justify-center p-8 text-[var(--text-primary)]">
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] animate-pulse">
          <Shield className="w-5 h-5 text-[var(--accent-solar)]" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <main className="w-full flex-1 px-5 pb-8 pt-3 lg:px-10">
          <div className="mx-auto max-w-[1400px]">
            {children}
            <footer className="workspace-footer">
              Planning demo · Synthetic assets and tariff · No equipment control
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
