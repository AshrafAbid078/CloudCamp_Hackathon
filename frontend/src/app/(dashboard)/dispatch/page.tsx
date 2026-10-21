'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Zap,
  BatteryCharging,
  Factory,
  CheckCircle2,
  RotateCw,
  History,
} from 'lucide-react';
import { DispatchGantt } from '@/components/charts';
import { OverridePanel } from '@/components/features';
import { Button } from '@/components/common';
import { dispatchApi } from '@/lib/api';
import type {
  IndustrialAssetTrack,
  BatteryAssetTrack,
  EvFleetStubAsset,
  OptimizationRunHistory,
} from '@/lib/types';
import { useRole } from '@/hooks';
import { useRoleStore } from '@/lib/store/useRoleStore';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function DispatchPlanPage() {
  const { isGridOperator } = useRole();
  const { forecastHorizon, setForecastHorizon } = useRoleStore();
  const horizonHours = forecastHorizon === '6h' ? 6 : forecastHorizon === '12h' ? 12 : 24;

  const [industrialTracks, setIndustrialTracks] = useState<IndustrialAssetTrack[]>([]);
  const [batteryTrack, setBatteryTrack] = useState<BatteryAssetTrack | null>(null);
  const [evFleetStub, setEvFleetStub] = useState<EvFleetStubAsset | null>(null);
  const [history, setHistory] = useState<OptimizationRunHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Override Modal state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('ind-vat-2');
  const [selectedAssetName, setSelectedAssetName] = useState('Textile Finishing Dye-Vat #2');
  const [selectedWindow, setSelectedWindow] = useState('11:30 – 15:00');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSchedule = async (hours: number = horizonHours) => {
    setIsLoading(true);
    try {
      const data = await dispatchApi.getDispatchTracks(hours);
      setIndustrialTracks(data.industrialTracks);
      setBatteryTrack(data.batteryTrack);
      setEvFleetStub(data.evFleetStub);
      setHistory(data.history);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const data = await dispatchApi.getDispatchTracks(horizonHours);
        if (isMounted) {
          setIndustrialTracks(data.industrialTracks);
          setBatteryTrack(data.batteryTrack);
          setEvFleetStub(data.evFleetStub);
          setHistory(data.history);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [horizonHours]);

  const handleOpenOverride = (trackId: string, trackName: string, window: string) => {
    setSelectedAssetId(trackId);
    setSelectedAssetName(trackName);
    setSelectedWindow(window);
    setIsOverrideOpen(true);
  };

  const handleOverrideSuccess = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
    fetchSchedule(horizonHours);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Zap className="w-6 h-6 text-[var(--accent-solar)]" />
              <span>Universal Flexible-Load Dispatch Plan</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              Solver: PuLP MILP (Live)
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Live PuLP LP mixed-integer optimization synchronizing flexible industrial loads and battery storage arbitrage against Bangladesh tariffs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Horizon Switcher (6h, 12h, 24h triggers live re-solve) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            {(['6h', '12h', '24h'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                  forecastHorizon === h
                    ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={`Re-solve PuLP optimizer over ${h} horizon`}
              >
                {h}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSchedule(horizonHours)}
            isLoading={isLoading}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Re-solve Optimizer
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-[var(--accent-clean)]/15 border border-[var(--accent-clean)]/30 text-xs text-[var(--accent-clean)] flex items-center gap-2 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-Asset KPI Deltas Broken Out Per Track */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
          Per-Track Operational Contribution Deltas
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industrial Batch Processes Track KPI */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md space-y-3 transition-colors hover:bg-[var(--bg-surface-raised)]/70"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-[var(--accent-solar)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-heading">
                  Track 1: Industrial Batch Loads (Dye-Vat & Arc Furnace)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] font-bold">
                1,100 kW Combined
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Cost Saved</span>
                <span className="text-xl font-extrabold font-mono text-[var(--accent-clean)]">
                  +$1,240
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Off-peak shift</span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Carbon Avoided</span>
                <span className="text-xl font-extrabold font-mono text-[var(--accent-solar)]">
                  6.8 tCO₂
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Solar alignment</span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Peak Shaved</span>
                <span className="text-xl font-extrabold font-mono text-[var(--text-primary)]">
                  220 kW
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Coincident load</span>
              </div>
            </div>
          </motion.div>

          {/* Battery Storage Track KPI */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md space-y-3 transition-colors hover:bg-[var(--bg-surface-raised)]/70"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-[var(--accent-clean)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-heading">
                  Track 2: Battery Energy Storage (BESS)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] font-bold">
                2,000 kWh • 68% SoC
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Cost Saved</span>
                <span className="text-xl font-extrabold font-mono text-[var(--accent-clean)]">
                  +$1,600
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Arbitrage net</span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Carbon Avoided</span>
                <span className="text-xl font-extrabold font-mono text-[var(--accent-solar)]">
                  7.4 tCO₂
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Displaced peakers</span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">Peak Shaved</span>
                <span className="text-xl font-extrabold font-mono text-[var(--text-primary)]">
                  160 kW
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Evening injection</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Interactive Multi-Track Gantt Timeline */}
      {batteryTrack && evFleetStub && (
        <motion.div variants={itemVariants}>
          <DispatchGantt
            industrialTracks={industrialTracks}
            batteryTrack={batteryTrack}
            evFleetStub={evFleetStub}
            onSelectSlot={handleOpenOverride}
          />
        </motion.div>
      )}

      {/* Override Dialog / Modal */}
      <OverridePanel
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        initialAssetId={selectedAssetId}
        initialAssetName={selectedAssetName}
        initialWindow={selectedWindow}
        onSuccess={handleOverrideSuccess}
      />

      {/* History View & Trend Chart: Past optimization runs & KPI trends */}
      <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--accent-clean)]" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
                Optimization Run History & Trend Ledger
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Historical MILP solver convergences, solver latency, and multi-day financial uplift.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[var(--accent-solar)] bg-[var(--bg-base)] px-3 py-1.5 rounded-xl border border-[var(--border-hairline)]">
            Role Access: {isGridOperator ? 'Grid Operator' : 'Facility Manager'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] font-mono uppercase text-[11px]">
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Cost Saved</th>
                <th className="py-3 px-3">Carbon Avoided</th>
                <th className="py-3 px-3">Peak Shaved</th>
                <th className="py-3 px-3">Solver Latency</th>
                <th className="py-3 px-3">Convergence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]/60 font-mono">
              {history.map((run) => (
                <tr key={run.runId} className="hover:bg-[var(--bg-surface-raised)]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{run.runId}</td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">{run.timestamp}</td>
                  <td className="py-3 px-3 font-bold text-[var(--accent-clean)]">
                    +${run.costSavedUsd.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-[var(--accent-solar)]">
                    {(run.carbonAvoidedKg / 1000).toFixed(1)} tCO₂
                  </td>
                  <td className="py-3 px-3 text-[var(--text-primary)]">{run.peakShavedKw} kW</td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">{run.solverConvergenceMs} ms</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] font-semibold border border-[var(--accent-clean)]/30">
                      Optimal
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
