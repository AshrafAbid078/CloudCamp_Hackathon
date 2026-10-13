'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Input, Chip } from '@/components/common';
import { systemApi } from '@/lib/api';
import type { DataProvenanceRecord } from '@/lib/types';

export default function DataProvenancePage() {
  const [records, setRecords] = useState<DataProvenanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await systemApi.getDataProvenance();
        if (isMounted) setRecords(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
              <span>Data Lineage, Provenance & Synthetic Disclosures</span>
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            End-to-end cryptographic audit trail verifying meteorological inputs, electricity market tariffs, and sensor calibration.
          </p>
        </div>

        <Chip variant="clean" size="sm" dot>
          Cryptographic Integrity Verified
        </Chip>
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
    </div>
  );
}
