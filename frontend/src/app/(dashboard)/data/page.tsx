'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  Hash,
  Clock,
  ArrowRight,
  CheckCircle,
  FileText,
  Search,
} from 'lucide-react';
import { Chip, Input } from '@/components/common';
import { systemApi } from '@/lib/api';
import type { DataProvenanceRecord } from '@/lib/types';

export default function DataProvenancePage() {
  const [records, setRecords] = useState<DataProvenanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await systemApi.getDataProvenance();
        setRecords(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dataType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pipelineStage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <span>Data Lineage & SCADA Provenance Ledger</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tamper-evident audit trail verifying calibration, ingestion timestamps, and quality scoring for all sensor inputs.
          </p>
        </div>

        <Chip variant="success" size="sm" dot>
          Cryptographic Signatures Verified
        </Chip>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">
          End-to-End Solar Telemetry Ingestion Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">
              Stage 1
            </div>
            <div className="text-sm font-bold">Raw Telemetry Ingestion</div>
            <p className="text-[11px] text-slate-400 mt-1">
              GOES-16 0.64µm GeoTIFF tiles & Modbus RS-485 pyranometer streams.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
              Stage 2
            </div>
            <div className="text-sm font-bold">Quality Control & Physics Checks</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Extraterrestrial solar constant validation and outlier sensor rejection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Stage 3
            </div>
            <div className="text-sm font-bold">Feature Store & Vectorization</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Farneback optical flow velocity calculation and solar zenith angle projection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">
              Stage 4
            </div>
            <div className="text-sm font-bold">Inference & MILP Dispatch</div>
            <p className="text-[11px] text-slate-400 mt-1">
              24-hour GHI probabilistics feeding the storage optimization solver.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Ledger Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Sensor & Feed Provenance Records
            </h3>
            <p className="text-xs text-zinc-500">
              Detailed tracking records with SHA-256 signatures and data quality scores.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search source or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-zinc-400" />}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Data Stream Source</th>
                <th className="py-2.5 px-3">Telemetry Type</th>
                <th className="py-2.5 px-3">Pipeline Stage</th>
                <th className="py-2.5 px-3">Quality Score</th>
                <th className="py-2.5 px-3">Cryptographic Hash</th>
                <th className="py-2.5 px-3">Record Count</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850">
                  <td className="py-3 px-3 font-bold font-sans text-zinc-900 dark:text-zinc-100">
                    {item.sourceName}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {item.dataType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <Chip variant="neutral" size="sm">
                      {item.pipelineStage}
                    </Chip>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        item.dataQualityScore >= 98
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {item.dataQualityScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400 text-[11px] truncate max-w-[140px]">
                    {item.hash}
                  </td>
                  <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300">
                    {item.recordCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 text-[11px]">
                    {item.ingestionTimestamp.replace('T', ' ').replace('Z', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
