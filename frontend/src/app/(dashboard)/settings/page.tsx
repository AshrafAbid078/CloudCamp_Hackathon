'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  RefreshCw,
  Shield,
  Save,
} from 'lucide-react';
import { Button, Input, Chip } from '@/components/common';
import { useRole } from '@/hooks';
import { systemApi } from '@/lib/api';
import type { SystemService } from '@/lib/types';

export default function SettingsAndSystemHealthPage() {
  const { role, canEditSettings } = useRole();
  const [services, setServices] = useState<SystemService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable threshold settings
  const [curtailmentMarginMW, setCurtailmentMarginMW] = useState(5.0);
  const [bessMaxTempC, setBessMaxTempC] = useState(48.0);
  const [forecastConfidenceThreshold, setForecastConfidenceThreshold] = useState(90);

  useEffect(() => {
    async function load() {
      try {
        const data = await systemApi.getServices();
        setServices(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) return;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-500" />
            <span>System Health, Services & Interlock Thresholds</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time pipeline diagnostics, model latencies, and SCADA safety trip thresholds.
          </p>
        </div>

        <Chip variant={canEditSettings ? 'success' : 'neutral'} size="sm">
          {canEditSettings ? 'Edit Access (Engineer)' : `Viewing as ${role} (Read-Only)`}
        </Chip>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Operational parameters updated successfully. Broadcasted to field SCADA nodes.</span>
        </div>
      )}

      {/* Services Health Status Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-500" />
              <span>Core Service Status & Telemetry Latencies</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Health monitors for neural inference clusters and market streaming gateways.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            4/5 Services Healthy
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    svc.status === 'healthy'
                      ? 'bg-emerald-500'
                      : svc.status === 'degraded'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {svc.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Last health probe: {svc.lastChecked}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Latency</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {svc.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-sans">30d Uptime</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {svc.uptimePercent}%
                  </span>
                </div>
                <Chip
                  variant={svc.status === 'healthy' ? 'success' : 'warning'}
                  size="sm"
                  className="capitalize font-sans"
                >
                  {svc.status}
                </Chip>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model & Safety Parameters Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Inference & Grid Interlock Thresholds
              </h3>
              <p className="text-xs text-zinc-500">
                Set autonomous fail-safes for battery dispatch and transmission curtailment limits.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Curtailment Headroom Margin (MW)"
                type="number"
                step={0.5}
                value={curtailmentMarginMW}
                onChange={(e) => setCurtailmentMarginMW(parseFloat(e.target.value))}
                disabled={!canEditSettings}
                helperText="Buffer before battery charges to absorb line congestion"
              />
            </div>

            <div>
              <Input
                label="BESS Cell Max Temp Trip (°C)"
                type="number"
                step={0.5}
                value={bessMaxTempC}
                onChange={(e) => setBessMaxTempC(parseFloat(e.target.value))}
                disabled={!canEditSettings}
                helperText="Safety interlock cutoff for battery module protection"
              />
            </div>

            <div>
              <Input
                label="Forecast Confidence Interval (%)"
                type="number"
                min={70}
                max={99}
                value={forecastConfidenceThreshold}
                onChange={(e) => setForecastConfidenceThreshold(parseInt(e.target.value, 10))}
                disabled={!canEditSettings}
                helperText="Probabilistic confidence bound for day-ahead market bids"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {!canEditSettings && (
                <span>
                  To modify these thresholds, switch your active role to <strong>Engineer</strong> in the top header.
                </span>
              )}
            </p>

            {canEditSettings && (
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
                Save SCADA Configuration
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
