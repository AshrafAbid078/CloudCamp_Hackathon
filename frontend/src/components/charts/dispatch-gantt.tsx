'use client';

import React from 'react';
import {
  IndustrialAssetTrack,
  BatteryAssetTrack,
  EvFleetStubAsset,
} from '@/lib/types';
import { BatteryCharging, Factory, Truck, Edit3 } from 'lucide-react';

interface DispatchGanttProps {
  industrialTracks: IndustrialAssetTrack[];
  batteryTrack: BatteryAssetTrack;
  evFleetStub: EvFleetStubAsset;
  onSelectSlot?: (trackId: string, trackName: string, window: string) => void;
}

export function DispatchGantt({
  industrialTracks,
  batteryTrack,
  evFleetStub,
  onSelectSlot,
}: DispatchGanttProps) {
  const timeLabels = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  return (
    <div className="w-full p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-hairline)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-heading">
              Universal Multi-Track Dispatch Timeline
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30">
              Solver: MILP Optimal
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Synchronized scheduling across heavy industrial flexible batch loads and BESS storage.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 text-[var(--accent-solar)] font-medium">
            <span className="w-2.5 h-2.5 rounded bg-[var(--accent-solar)]"></span>
            <span>Solar Absorption</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--accent-clean)] font-medium">
            <span className="w-2.5 h-2.5 rounded bg-[var(--accent-clean)]"></span>
            <span>Stress Discharge</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--tag-architecture-ready)] font-medium">
            <span className="w-2.5 h-2.5 rounded bg-[var(--tag-architecture-ready)]"></span>
            <span>Stub Track</span>
          </div>
        </div>
      </div>

      {/* Time Axis Bar */}
      <div className="hidden md:grid grid-cols-9 gap-1 text-[11px] font-mono text-[var(--text-muted)] text-center pb-2 border-b border-[var(--border-hairline)]/50">
        {timeLabels.map((t) => (
          <span key={t}>{t} BST</span>
        ))}
      </div>

      {/* Track 1: Industrial Batch Loads */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <Factory className="w-4 h-4 text-[var(--accent-solar)]" />
            <span>Track A: Industrial Batch Load Processes</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Coupled to Bangladesh TOU Off-Peak & Midday Solar
          </span>
        </div>

        {industrialTracks.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[var(--accent-solar)]/50 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] font-mono">
                    {item.powerKw} kW
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.facility}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-[11px]">
                  <span className="text-[var(--accent-clean)] font-bold font-mono">
                    +${item.costSavedUsd} saved
                  </span>
                  <span className="text-[var(--text-muted)] block text-[10px]">
                    {item.carbonAvoidedKg / 1000} tCO₂ avoided
                  </span>
                </div>

                <button
                  onClick={() => onSelectSlot?.(item.id, item.name, item.chosenRunWindow)}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--border-hairline)] hover:border-[var(--accent-solar)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-[var(--accent-solar)]" />
                  <span>Override</span>
                </button>
              </div>
            </div>

            {/* Visual Schedule Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Earliest: {item.earliestStart}</span>
                <span className="font-semibold text-[var(--accent-solar)] font-mono">
                  Allocated Window: {item.chosenRunWindow} ({item.durationHours}h)
                </span>
                <span>Deadline: {item.deadline}</span>
              </div>

              {/* Progress Bar with highlighted active solar window */}
              <div className="w-full h-3 bg-[var(--bg-base)] rounded-full overflow-hidden relative border border-[var(--border-hairline)]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-solar)] to-[var(--accent-clean)] rounded-full transition-all"
                  style={{
                    marginLeft: '36%', // ~11:30 position
                    width: '32%', // 3.5 hour window
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Track 2: Battery Storage (BESS) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <BatteryCharging className="w-4 h-4 text-[var(--accent-clean)]" />
            <span>Track B: Utility / Facility BESS Battery Storage</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {batteryTrack.capacityKwh} kWh Capacity • {batteryTrack.currentSocPercent}% SoC
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[var(--accent-clean)]/50 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{batteryTrack.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] font-mono">
                  Rate: ±{batteryTrack.chargeDischargeRateKw} kW
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{batteryTrack.facility}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-[11px]">
                <span className="text-[var(--accent-clean)] font-bold font-mono">
                  +${batteryTrack.costSavedUsd} saved
                </span>
                <span className="text-[var(--text-muted)] block text-[10px]">
                  {batteryTrack.carbonAvoidedKg / 1000} tCO₂ avoided • {batteryTrack.peakKwShaved} kW shaved
                </span>
              </div>

              <button
                onClick={() => onSelectSlot?.(batteryTrack.id, batteryTrack.name, '18:30 – 21:00')}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--border-hairline)] hover:border-[var(--accent-clean)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-[var(--accent-clean)]" />
                <span>Override</span>
              </button>
            </div>
          </div>

          {/* Visual Dual-Cycle Schedule Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="text-[var(--accent-solar)] font-semibold font-mono">
                Absorption: {batteryTrack.chargeWindows[0]}
              </span>
              <span className="text-[var(--accent-clean)] font-semibold font-mono">
                Discharge: {batteryTrack.dischargeWindows[0]}
              </span>
            </div>

            <div className="w-full h-3 bg-[var(--bg-base)] rounded-full overflow-hidden relative border border-[var(--border-hairline)] flex">
              {/* Charge window (midday solar) */}
              <div
                className="h-full bg-[var(--accent-solar)] rounded-l-full"
                style={{ marginLeft: '32%', width: '22%' }}
                title="Battery Absorption Window"
              />
              {/* Discharge window (evening stress) */}
              <div
                className="h-full bg-[var(--accent-clean)] rounded-r-full"
                style={{ marginLeft: '24%', width: '18%' }}
                title="Battery Stress Relief Window"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track 3: EV Fleet — Architecture-Ready Stub */}
      <div className="pt-2">
        <div className="p-4 rounded-2xl bg-[var(--bg-base)]/50 border border-dashed border-[var(--tag-architecture-ready)]/60 text-xs text-[var(--text-muted)] space-y-2 opacity-85">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[var(--tag-architecture-ready)]" />
              <span className="font-bold text-[var(--text-primary)]">{evFleetStub.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40">
              Architecture-Ready Stub
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {evFleetStub.note} Supporting {evFleetStub.vehicleCount} fleet delivery vans ({evFleetStub.depotCapacityKw} kW connected capacity).
          </p>
        </div>
      </div>
    </div>
  );
}
