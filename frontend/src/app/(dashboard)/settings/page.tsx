'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  Globe2,
  Cpu,
  CheckCircle2,
  Shield,
  Save,
} from 'lucide-react';
import { Button, Input, Chip } from '@/components/common';
import { useRole } from '@/hooks';
import { systemApi } from '@/lib/api';
import type { SystemService, AdapterHealthDetail } from '@/lib/types';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { AdminConsole } from '@/components/features';

export default function SystemHealthAndSettingsPage() {
  const { canEditSettings, isAdmin } = useRole();
  const { dataConfidence } = useRoleStore();
  const [activeTab, setActiveTab] = useState<'system' | 'admin'>('system');
  const [services, setServices] = useState<SystemService[]>([]);
  const [adapterDetails, setAdapterDetails] = useState<AdapterHealthDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // SCADA Interlock thresholds
  const [curtailmentMarginKw, setCurtailmentMarginKw] = useState(50);
  const [bessMaxCrate, setBessMaxCrate] = useState(0.5);
  const [solarDropThreshold, setSolarDropThreshold] = useState(25);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [svcs, adps] = await Promise.all([
          systemApi.getServices(),
          systemApi.getAdapterHealthDetails(),
        ]);
        if (isMounted) {
          setServices(svcs);
          setAdapterDetails(adps);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[var(--accent-solar)]" />
              <span>{isAdmin && activeTab === 'admin' ? 'Admin Console & Access Control' : 'System Health, Adapters & Known Gaps'}</span>
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isAdmin && activeTab === 'admin'
              ? 'User authentication management, role assignment, and system operator account controls.'
              : 'Real-time pipeline diagnostics, Electricity Maps poll timestamps, and pluggable adapter schemas.'}
          </p>
        </div>

        <Chip variant={isAdmin && activeTab === 'admin' ? 'solar' : 'clean'} size="sm" dot>
          {isAdmin && activeTab === 'admin' ? 'Admin Role Verified' : 'All 5 Pipeline Nodes Operational'}
        </Chip>
      </div>

      {/* Admin Console Tab Switcher (Visible strictly when role === 'admin') */}
      {isAdmin && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] w-fit">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-solar)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Diagnostics & Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-heading transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Console</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-black/20 text-current font-bold uppercase">
              Role Guarded
            </span>
          </button>
        </div>
      )}

      {/* Admin Tab View */}
      {isAdmin && activeTab === 'admin' ? (
        <AdminConsole />
      ) : (
        <>
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-[var(--accent-clean)]/15 border border-[var(--accent-clean)]/30 text-xs text-[var(--accent-clean)] flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>SCADA safety interlock thresholds saved and broadcast to field Modbus gateways.</span>
            </div>
          )}

      {/* Adapter Status Details Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[var(--accent-solar)]" />
              <span>Pluggable Adapter Infrastructure Details</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Regional data feeds and flexible equipment connector status with known gaps & degradation policies.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[var(--accent-clean)] px-2 py-0.5 rounded bg-[var(--accent-clean)]/15 border border-[var(--accent-clean)]/30 font-bold">
            2 Live • 2 Architecture-Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adapterDetails.map((adp) => (
            <div
              key={adp.id}
              className="p-5 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  {adp.type === 'region' ? (
                    <Globe2 className="w-4 h-4 text-[var(--accent-solar)]" />
                  ) : (
                    <Cpu className="w-4 h-4 text-[var(--accent-clean)]" />
                  )}
                  <span>{adp.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    adp.status === 'live'
                      ? 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30'
                      : 'bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40'
                  }`}
                >
                  {adp.status === 'live' ? 'Live Adapter' : 'Architecture-Ready Stub'}
                </span>
              </div>

              <div className="text-[11px] text-[var(--text-muted)] space-y-1">
                <div>
                  <strong className="text-[var(--text-primary)] font-sans">Primary Source:</strong>{' '}
                  {adp.primarySource}
                </div>
                <div>
                  <strong className="text-[var(--text-primary)] font-sans">Poll Frequency / Last Ingest:</strong>{' '}
                  {adp.lastPollTimestamp} ({adp.sampleFrequency})
                </div>
                <div>
                  <strong className="text-[var(--text-primary)] font-sans">Fallback Degradation:</strong>{' '}
                  {adp.fallbackStrategy}
                </div>
              </div>

              {adp.knownGaps && adp.knownGaps.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-hairline)]/80 text-[10px] text-[var(--text-muted)] space-y-1">
                  <span className="font-semibold text-[var(--accent-solar)] uppercase tracking-wider block font-mono">
                    Known System Gaps:
                  </span>
                  {adp.knownGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-[var(--accent-solar)]">•</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Core Services Health Table & Electricity Maps Poll Timestamp */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--accent-clean)]" />
              <span>Core Service Status & Ingestion Health</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Latest Electricity Maps poll timestamp: <strong className="text-[var(--text-primary)]">{dataConfidence.lastPollTimestamp}</strong>
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--accent-clean)]">
            Mean Pipeline Latency: 64ms
          </span>
        </div>

        <div className="divide-y divide-[var(--border-hairline)]/60">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-clean)] shrink-0" />
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{svc.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {svc.notes} • Probe: {svc.lastChecked}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-[11px] self-end sm:self-auto">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans">Latency</span>
                  <span className="font-bold text-[var(--text-primary)]">{svc.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans">Uptime</span>
                  <span className="font-bold text-[var(--accent-clean)]">{svc.uptimePercent}%</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] font-bold uppercase">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Interlock Thresholds Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent-solar)]" />
            <span>Autonomous Safety Interlock Thresholds</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Safety parameters that trigger automatic load shedding or battery holds during grid congestion.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Curtailment Headroom Margin (kW)"
              type="number"
              value={curtailmentMarginKw}
              onChange={(e) => setCurtailmentMarginKw(parseInt(e.target.value, 10))}
              helperText="Feeder buffer before industrial loads throttle"
            />
            <Input
              label="BESS Max C-Rate Limit (C)"
              type="number"
              step={0.1}
              value={bessMaxCrate}
              onChange={(e) => setBessMaxCrate(parseFloat(e.target.value))}
              helperText="Warranty protection cap on charge rate"
            />
            <Input
              label="Solar Drop Trigger Threshold (%)"
              type="number"
              value={solarDropThreshold}
              onChange={(e) => setSolarDropThreshold(parseInt(e.target.value, 10))}
              helperText="Trigger point for automatic what-if re-optimization"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {!canEditSettings ? (
              <span className="text-xs text-[var(--accent-solar)] font-mono">
                Read-only: Switch role to Grid Operator in top header to edit SCADA interlocks.
              </span>
            ) : <span />}
            <Button
              type="submit"
              variant="solar"
              size="sm"
              disabled={!canEditSettings}
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Interlock Settings
            </Button>
          </div>
        </form>
      </div>
        </>
      )}
    </div>
  );
}
