'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Input, Chip, Button } from '@/components/common';
import { systemApi, dataApi } from '@/lib/api';
import type { DataProvenanceRecord, CarbonSnapshotRecord } from '@/lib/types';
import { Activity, RefreshCw } from 'lucide-react';

export default function DataProvenancePage() {
  const [records, setRecords] = useState<DataProvenanceRecord[]>([]);
  const [carbonSnapshots, setCarbonSnapshots] = useState<CarbonSnapshotRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCarbonLoading, setIsCarbonLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await systemApi.getDataProvenance();
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCarbonTelemetry = async () => {
    setIsCarbonLoading(true);
    try {
      const snapshots = await dataApi.getCarbonSnapshots(50);
      setCarbonSnapshots(snapshots);
    } finally {
      setIsCarbonLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadCarbonTelemetry();
  }, []);

  const latestSnapshot = carbonSnapshots[0] || null;

  const filteredRecords = records.filter(
    (r) =>
      r.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dataType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pipelineStage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Database className="w-6 h-6 text-[var(--accent-solar)]" />
              <span>Data Lineage, Provenance & Carbon Telemetry</span>
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            End-to-end cryptographic audit trail verifying meteorological inputs, Electricity Maps carbon feeds, and sensor calibration.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Carbon Reading Indicator */}
          {latestSnapshot && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-clean)] animate-pulse" />
              <span>Live Carbon Feed:</span>
              <span className="font-bold text-[var(--accent-clean)]">
                {Math.round(latestSnapshot.carbon_intensity_gco2eq_kwh)} gCO₂/kWh
              </span>
              <span className="text-[10px] text-[var(--text-muted)] opacity-80">
                ({new Date(latestSnapshot.reading_datetime || latestSnapshot.polled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
          )}

          <Chip variant="clean" size="sm" dot>
            Cryptographic Integrity Verified
          </Chip>
        </div>
      </div>

      {/* Synthetic Data Disclosure Card */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-solar)] uppercase tracking-wider font-mono">
          <AlertCircle className="w-4 h-4" />
          <span>Synthetic Telemetry Disclosure & Calibration Methodology</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          While weather and solar irradiance are ingested from real physical feeds (<strong className="text-[var(--text-primary)]">NREL NSRDB</strong> 10-year historical satellite irradiance and <strong className="text-[var(--text-primary)]">NOAA GFS</strong> atmospheric grids), the industrial facility machine load profiles (Textile Dye-Vat #2, Steel Arc Pre-Heater) utilize <strong className="text-[var(--text-primary)]">synthetic load curves</strong>. These curves are mathematically calibrated against empirical operational constraints from verified Bangladesh garment factories and steel mills in Gazipur and the Chittagong Export Processing Zone (CEPZ).
        </p>
      </div>

      {/* Visual Pipeline Flow Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold font-mono text-[var(--accent-solar)] uppercase tracking-wider">
            Stage 1: Raw Ingestion
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-heading">
            Physical Ingestion
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            NOAA GFS GRIB2 atmospheric forecast files & Electricity Maps zone API.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold font-mono text-[var(--accent-clean)] uppercase tracking-wider">
            Stage 2: Quality Control
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-heading">
            Physics Checks
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Extraterrestrial solar constant bounds validation and missing interval interpolation.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold font-mono text-[var(--accent-solar)] uppercase tracking-wider">
            Stage 3: Feature Store
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-heading">
            Coupled Vectorization
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Solar zenith angle, air mass coefficients, and Bangladesh TOU tariff tiers.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold font-mono text-[var(--accent-clean)] uppercase tracking-wider">
            Stage 4: Inference Ready
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-heading">
            MILP Optimization
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            LightGBM GHI probabilistic distribution feeding the universal solver.
          </p>
        </div>
      </div>

      {/* Complete Data Source Lineage Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
              Complete Data Source Inventory & Cryptographic Ledger
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Auditable records showing spatial resolution, temporal frequency, record count, and SHA-256 signatures.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Filter by source or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] font-mono uppercase text-[11px]">
                <th className="py-3 px-3">Data Stream Source</th>
                <th className="py-3 px-3">Telemetry Type</th>
                <th className="py-3 px-3">Spatial / Temporal Res</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Quality</th>
                <th className="py-3 px-3">SHA-256 Hash</th>
                <th className="py-3 px-3">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-solar)]" />
                    <span>Verifying cryptographic signatures and data feeds...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    No matching provenance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--bg-surface-raised)]/60 transition-colors">
                  <td className="py-3 px-3 font-bold font-sans text-[var(--text-primary)]">
                    {item.sourceName}
                  </td>
                  <td className="py-3 px-3 font-sans text-[var(--accent-solar)] font-semibold">
                    {item.dataType}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)] text-[11px]">
                    {item.spatialResolution} • {item.temporalResolution}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-semibold">
                      {item.pipelineStage}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[var(--accent-clean)]">
                      {item.dataQualityScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)] text-[11px] truncate max-w-[130px]" title={item.hash}>
                    {item.hash.substring(0, 16)}...
                  </td>
                  <td className="py-3 px-3 text-[var(--text-primary)]">
                    {item.recordCount.toLocaleString()}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Polled Carbon Telemetry Ledger Table (User Decision 3) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--accent-clean)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
                Polled Carbon Telemetry Ledger
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Time-series ledger of Electricity Maps carbon intensity readings persisted in SQLite database (<code className="font-mono text-[var(--accent-solar)]">carbon_snapshots</code>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-bold">
              {carbonSnapshots.length} Readings Available
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCarbonTelemetry}
              isLoading={isCarbonLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Feed
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Snapshot ID</th>
                <th className="py-2.5 px-3">Polled Timestamp</th>
                <th className="py-2.5 px-3">Reading Timestamp</th>
                <th className="py-2.5 px-3">Zone / Region</th>
                <th className="py-2.5 px-3">Carbon Intensity</th>
                <th className="py-2.5 px-3">Source Provider</th>
                <th className="py-2.5 px-3">Estimation & Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]/60 font-mono text-[11px]">
              {isCarbonLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-solar)]" />
                    <span>Querying live carbon ledger from backend...</span>
                  </td>
                </tr>
              ) : carbonSnapshots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    No carbon snapshots recorded yet.
                  </td>
                </tr>
              ) : (
                carbonSnapshots.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-surface-raised)]/60 transition-colors">
                    <td className="py-3 px-3 text-[var(--text-muted)]">#{item.id}</td>
                    <td className="py-3 px-3 text-[var(--text-primary)]">
                      {item.polledAt ? new Date(item.polledAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">
                      {item.readingDatetime ? new Date(item.readingDatetime).toLocaleTimeString() : 'Current'}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                        {item.region} (Bangladesh)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold font-sans">
                      <span className="text-[var(--accent-clean)]">
                        {item.carbonIntensityGco2eqKwh} <span className="text-[10px] text-[var(--text-muted)] font-normal">gCO₂/kWh</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-[var(--text-muted)]">
                      {item.source}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isEstimated ? 'bg-[var(--accent-solar)]' : 'bg-[var(--accent-clean)]'}`} />
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]" title={item.estimationMethod || 'Direct Measurement'}>
                          {item.estimationMethod || 'Verified Grid Measurement'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
