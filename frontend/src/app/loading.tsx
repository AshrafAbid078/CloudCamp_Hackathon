import React from 'react';
import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="w-full max-w-md space-y-5 text-center">
        {/* Animated Solar-Grid Loading Ring */}
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl border-2 border-[var(--border-hairline)]" />
            <div className="absolute inset-0 rounded-2xl border-2 border-[var(--accent-solar)] border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--accent-solar)] shadow-inner">
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
            Syncing Meridian Grid Telemetry
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Loading solar irradiance forecasts & flexible-load dispatch plans...
          </p>
        </div>

        <div className="w-48 mx-auto h-1.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-solar)] to-[var(--accent-clean)] rounded-full animate-pulse"
            style={{ width: '75%' }}
          />
        </div>
      </div>
    </div>
  );
}
