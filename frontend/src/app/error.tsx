'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Meridian Grid Platform Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-2xl text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--accent-stress)]/10 text-[var(--accent-stress)] flex items-center justify-center">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Telemetry Boundary Trip
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            An unexpected error occurred while rendering the grid view. Safety interlocks and baseline schedules remain operational.
          </p>
          {error?.message && (
            <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] font-mono text-[11px] text-[var(--accent-stress)] text-left overflow-x-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-solar)] text-[var(--bg-base)] font-bold text-xs shadow-md transition-colors hover:brightness-110 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-hairline)] hover:bg-[var(--bg-surface-raised)] text-[var(--text-primary)] text-xs font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
