export type AssetType = 'industrial' | 'battery' | 'ev_fleet';

export interface IndustrialAssetTrack {
  id: string;
  name: string;
  facility: string;
  powerKw: number;
  earliestStart: string; // HH:mm
  deadline: string; // HH:mm
  durationHours: number;
  chosenRunWindow: string; // "11:30 - 15:00"
  status: 'optimal' | 'scheduled' | 'overridden' | 'locked';
  costSavedUsd: number;
  carbonAvoidedKg: number;
  peakKwShaved: number;
  baselineRunWindow: string;
}

export interface BatteryAssetTrack {
  id: string;
  name: string;
  facility: string;
  capacityKwh: number;
  currentSocPercent: number;
  chargeDischargeRateKw: number;
  chargeWindows: string[]; // ["11:00 - 14:00"]
  dischargeWindows: string[]; // ["18:30 - 21:00"]
  status: 'optimal' | 'charging' | 'discharging' | 'idle' | 'overridden';
  costSavedUsd: number;
  carbonAvoidedKg: number;
  peakKwShaved: number;
  cyclesCount: number;
}

export interface EvFleetStubAsset {
  id: string;
  name: string;
  status: 'architecture_ready';
  vehicleCount: number;
  depotCapacityKw: number;
  targetConnectionWindow: string;
  note: string;
}

export interface ScheduledActionItem {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  scheduledTimeWindow: string;
  costSavedUsd: number;
  carbonAvoidedKg: number;
  peakKwShaved: number;
  actionSummary: string;
  isOverridden?: boolean;
}

export interface DispatchSummaryKpis {
  totalCostSavedUsd: number;
  unoptimizedCostUsd: number;
  costSavedPercent: number;

  totalCarbonAvoidedTons: number;
  unoptimizedCarbonTons: number;
  carbonAvoidedPercent: number;

  totalPeakShavedKw: number;
  unoptimizedPeakKw: number;
  peakShavedPercent: number;

  explanationText: string;
}

export interface ManualOverrideSubmission {
  actionId: string;
  assetId: string;
  assetName: string;
  originalWindow: string;
  proposedWindow: string;
  horizonHours: number;
  overrideType: 'approve' | 'shift' | 'reject';
  rejectionReason?: string;
  operatorNotes?: string;
}

export interface OptimizationRunHistory {
  runId: string;
  timestamp: string;
  costSavedUsd: number;
  carbonAvoidedKg: number;
  peakShavedKw: number;
  solverConvergenceMs?: number;
  status: 'pending' | 'approve' | 'reject';
}

export interface DispatchInterval {
  intervalStart: string;
  intervalEnd: string;
  solarKw: number;
  batteryFlowKw: number;
  gridDemandKw: number;
  marketRateUsdPerKwh: number;
  projectedRevenueUSD: number;
}
