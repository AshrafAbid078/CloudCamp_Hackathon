'use client';

import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { Globe } from 'lucide-react';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title="Toggle Language (English / বাংলা)"
      aria-label="Toggle Language"
      className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-clean)] hover:text-[var(--accent-clean)] ${className}`}
    >
      <Globe className="h-3.5 w-3.5 text-[var(--accent-clean)]" />
      <span>{language === 'en' ? 'EN' : 'বাং'}</span>
      <span className="text-[10px] text-[var(--text-muted)]">|</span>
      <span className="text-[11px] font-normal text-[var(--text-muted)]">
        {language === 'en' ? 'বাংলা' : 'EN'}
      </span>
    </button>
  );
}

