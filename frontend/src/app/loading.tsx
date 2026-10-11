import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Animated Skeleton Spinner & Pulse */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 animate-spin opacity-80" />
            <div className="absolute inset-1 rounded-xl bg-white dark:bg-zinc-950 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Streaming Helios Telemetry
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fetching neural irradiance forecasts and battery dispatch states...
          </p>
        </div>

        <div className="space-y-2 pt-4">
          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full animate-shimmer" style={{ width: '65%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
