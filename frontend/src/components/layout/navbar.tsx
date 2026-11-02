'use client';

import Link from 'next/link';
import { Brand } from './brand';
import { LanguageToggle } from '@/components/common/language-toggle';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export function Navbar() {
  const t = useLanguageStore(state => state.t);

  return (
    <header className="border-b border-[var(--border-hairline)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" aria-label="Meridian Grid home">
          <Brand />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          <Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {t('navAbout')}
          </Link>
          <Link href="/docs" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {t('navDocs')}
          </Link>
          <Link href="/login" className="font-semibold hover:text-[var(--accent-clean)] transition-colors">
            {t('navSignIn')}
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[var(--accent-clean)] px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90"
          >
            {t('navCreateAccount')} →
          </Link>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
