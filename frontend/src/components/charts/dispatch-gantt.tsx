'use client';

import type { IndustrialAssetTrack, BatteryAssetTrack, EvFleetStubAsset } from '@/lib/types';

type Props = {
  industrialTracks: IndustrialAssetTrack[];
  batteryTrack: BatteryAssetTrack;
  evFleetStub: EvFleetStubAsset;
  onSelectSlot?: (trackId: string, trackName: string, window: string) => void;
};

export function DispatchGantt({ industrialTracks, batteryTrack, evFleetStub, onSelectSlot }: Props) {
  return <section className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-5">
    <div><h2 className="font-bold">Asset schedules</h2><p className="text-xs text-[var(--text-muted)]">Windows are horizon slot indices. They are planning results, not equipment commands.</p></div>
    {industrialTracks.length === 0 && <p className="text-sm text-[var(--text-muted)]">No industrial batch fits this forecast horizon.</p>}
    {industrialTracks.map(item => <div key={item.id} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-4 space-y-2 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><strong>{item.name}</strong><span>{item.powerKw} kW for {item.durationHours} hours</span></div>
      <div>Optimized slots: <strong>{item.chosenRunWindow}</strong></div><div className="text-xs text-[var(--text-muted)]">Baseline: {item.baselineRunWindow} | Allowed: {item.earliestStart} to {item.deadline}</div>
      <div className="flex flex-wrap justify-between gap-2"><span>Cost difference: ${item.costSavedUsd.toFixed(2)} | Emissions difference: {item.carbonAvoidedKg.toFixed(1)} kg</span><button className="rounded-lg border border-[var(--border-hairline)] px-3 py-1" onClick={() => onSelectSlot?.(item.id, item.name, item.chosenRunWindow)}>Shift slots</button></div>
    </div>)}
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] p-4 space-y-2 text-sm"><strong>{batteryTrack.name}</strong><p>Capacity: {batteryTrack.capacityKwh} kWh | Initial charge: {batteryTrack.currentSocPercent}%</p><p>Charge slots: {batteryTrack.chargeWindows.join(', ') || 'Idle'}</p><p>Discharge slots: {batteryTrack.dischargeWindows.join(', ') || 'Idle'}</p><p>Cost difference: ${batteryTrack.costSavedUsd.toFixed(2)} | Emissions difference: {batteryTrack.carbonAvoidedKg.toFixed(1)} kg</p></div>
    <p className="text-xs text-[var(--text-muted)]">{evFleetStub.name}: {evFleetStub.note}</p>
  </section>;
}
