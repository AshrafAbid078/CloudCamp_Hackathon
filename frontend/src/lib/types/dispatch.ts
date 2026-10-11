export type BatteryAction = 'charge' | 'discharge' | 'idle' | 'hold';

export interface DispatchInterval {
  id: string;
  timestamp: string; // HH:mm
  action: BatteryAction;
  batteryPowerMW: number; // Positive = discharging, negative = charging
  stateOfChargePercent: number; // 0 - 100%
  solarGenerationMW: number;
  gridDemandMW: number;
  clearingPricePerMWh: number; // USD / MWh
  projectedRevenueUSD: number;
  curtailmentRiskMW: number;
  isOverridden?: boolean;
}

export interface DispatchSummary {
  dailyRevenueUSD: number;
  curtailmentAvoidedMWh: number;
  batteryCycleCount: number;
  avgStateOfCharge: number;
  peakDischargeWindow: string;
  optimizationStatus: 'optimized' | 'manual_override' | 'calculating';
}

export interface ManualOverrideRequest {
  intervalId: string;
  action: BatteryAction;
  batteryPowerMW: number;
  reason: string;
  operatorId: string;
  durationMinutes: number;
}
