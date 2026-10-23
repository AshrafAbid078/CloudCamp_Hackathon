/**
 * Data Adapters: Transform FastAPI Backend Responses to Frontend Types
 *
 * Bridges the backend Python schemas (parallel forecast arrays, PuLP LP dispatch
 * results, and database models) directly to Meridian Grid's TypeScript models.
 */

import type {
  SolarDataPoint,
  ForecastSummaryMetrics,
  ModelBenchmarkAccuracy,
} from '../types/forecast';
import type {
  IndustrialAssetTrack,
  BatteryAssetTrack,
  DispatchSummaryKpis,
  ScheduledActionItem,
} from '../types/dispatch';
import type { CarbonSnapshotRecord } from '../types/system';

// ---------------------------------------------------------------------------
// Helpers: Time & formatting
// ---------------------------------------------------------------------------

function formatHourIndex(hour: number, isIntervalEnd = false): string {
  const h = Math.floor(hour);
  if (h === 24) {
    return isIntervalEnd ? '24:00' : '00:00';
  }
  const normalized = ((h % 24) + 24) % 24;
  return `${normalized.toString().padStart(2, '0')}:00`;
}

function formatHourRange(hours: number[]): string {
  if (!hours || hours.length === 0) return 'Idle';
  const sorted = [...hours].sort((a, b) => a - b);
  const start = sorted[0];
  const end = sorted[sorted.length - 1] + 1;
  return `${formatHourIndex(start)} - ${formatHourIndex(end, true)}`;
}

function groupContiguousHours(hours: number[]): string[] {
  if (!hours || hours.length === 0) return [];
  const sorted = Array.from(new Set(hours)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push(`${formatHourIndex(rangeStart)} - ${formatHourIndex(prev + 1, true)}`);
      rangeStart = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push(`${formatHourIndex(rangeStart)} - ${formatHourIndex(prev + 1, true)}`);
  return ranges;
}

// ---------------------------------------------------------------------------
// 1. Forecast Adapter
// ---------------------------------------------------------------------------

export interface BackendForecastResponse {
  region: string;
  horizon_hours: number;
  accuracy: {
    model: string;
    rmse?: number | null;
    mape?: number | null;
    note?: string;
  };
  sources?: {
    solar: string;
    carbon: string;
    location?: string | { latitude: number; longitude: number };
    weather_fetched_at?: string;
    carbon_as_of?: string | null;
    note?: string;
    fallback?: boolean;
  };
  forecast: {
    timestamps: string[];
    solar_ghi_w_m2: number[];
    solar_ghi_lower: number[];
    solar_ghi_upper: number[];
    grid_stress_gco2_kwh: number[];
  };
}

export function adaptBackendForecast(
  data: BackendForecastResponse
): { series: SolarDataPoint[]; summary: ForecastSummaryMetrics } {
  const { forecast, accuracy } = data;
  const count = forecast.timestamps.length;

  const series: SolarDataPoint[] = [];

  for (let i = 0; i < count; i++) {
    const rawTs = forecast.timestamps[i];
    const d = new Date(rawTs);
    if (Number.isNaN(d.getTime())) throw new Error('Forecast contains an invalid timestamp.');
    const timeLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

    const ghi = Math.max(0, Math.round((forecast.solar_ghi_w_m2[i] || 0) * 10) / 10);
    const ghiLower = Math.max(0, Math.round((forecast.solar_ghi_lower[i] || 0) * 10) / 10);
    const ghiUpper = Math.max(ghi, Math.round((forecast.solar_ghi_upper[i] || 0) * 10) / 10);
    const carbonIntensity = Math.round(forecast.grid_stress_gco2_kwh[i] ?? 0);

    series.push({
      timestamp: timeLabel,
      ghiForecast: ghi,
      ghiLowerBound: ghiLower,
      ghiUpperBound: ghiUpper,
      carbonIntensityGco2: carbonIntensity,
      isEstimated: true,
      estimationMethod: data.sources?.solar === 'open_meteo_weather_forecast' ? 'Current weather-model forecast' : 'Archived solar input',
    });
  }

  const allGhi = series.map((s) => s.ghiForecast);
  const peakGhi = Math.max(...allGhi, 0);
  const totalKwh = null; // PV capacity is unknown; GHI cannot be converted to facility kWh.

  const benchmarks: ModelBenchmarkAccuracy[] = [
    {
      metric: 'RMSE (W/m²)',
      lightGbmValue: accuracy.rmse == null ? null : Math.round(accuracy.rmse * 10) / 10,
      persistenceValue: null,
      unit: 'W/m²',
      improvementPercent: null,
    },
    {
      metric: 'MAPE (%)',
      lightGbmValue: accuracy.mape == null ? null : Math.round(accuracy.mape * 1000) / 10,
      persistenceValue: null,
      unit: '%',
      improvementPercent: null,
    },
  ];

  const summary: ForecastSummaryMetrics = {
    currentGhi: series[0]?.ghiForecast ?? 0,
    peakGhiForecast: peakGhi,
    expectedDailySolarKwh: totalKwh,
    currentGridStressIndex: null,
    peakStressWindow: null,
    modelType: accuracy.model === 'OpenMeteoForecast' ? 'OpenMeteoForecast' : accuracy.model.toLowerCase().includes('gbm') ? 'LightGBM' : 'PersistenceBaseline',
    solarSource: data.sources?.solar ?? 'archived_2020',
    carbonSource: data.sources?.carbon ?? 'archived',
    sourceNote: data.sources?.note ?? null,
    forecastIssuedAt: data.sources?.weather_fetched_at ?? null,
    isEstimated: true,
    estimationMethod: accuracy.model,
    lastTrainedDate: null,
    benchmarks,
  };

  return { series, summary };
}

// ---------------------------------------------------------------------------
// 2. Dispatch Plan Adapter
// ---------------------------------------------------------------------------

export interface BackendProcessPlan {
  asset_id: string;
  asset_type: string;
  name?: string;
  power_kw: number;
  duration: number;
  earliest_start: number;
  deadline: number;
  baseline_hours: number[];
  optimized_hours: number[];
  baseline_cost: number;
  optimized_cost: number;
  cost_saved: number;
  baseline_emissions_gco2: number;
  optimized_emissions_gco2: number;
  emissions_saved_gco2: number;
  objective_improvement: number;
}

export interface BackendBatteryScheduleStep {
  hour: number;
  charge_kw: number;
  discharge_kw: number;
  energy_kwh: number;
}

export interface BackendBatteryPlan {
  asset_id: string;
  asset_type: string;
  capacity_kwh: number;
  initial_soc: number;
  charge_rate_kw: number;
  discharge_rate_kw: number;
  schedule: BackendBatteryScheduleStep[];
  baseline_cost: number;
  optimized_cost: number;
  cost_saved: number;
  baseline_emissions_gco2: number;
  optimized_emissions_gco2: number;
  emissions_saved_gco2: number;
  peak_discharge_kw?: number;
}

export interface BackendDispatchPlanResponse {
  status: string;
  region: string;
  hours: number;
  run_id?: number;
  assets?: {
    industrial_count: number;
    battery_count: number;
  };
  forecast_used?: {
    model: string;
    sources?: BackendForecastResponse['sources'];
    timestamps: string[];
    prices_usd_kwh: number[];
    carbon_intensity_gco2_kwh: number[];
  };
  plan: {
    industrial: BackendProcessPlan[];
    batteries: BackendBatteryPlan[];
    kpis: {
      baseline_cost: number;
      optimized_cost: number;
      cost_saved: number;
      cost_saved_usd: number;
      co2_saved_kg: number;
      peak_baseline_kw: number;
      peak_optimized_kw: number;
      peak_shaved_kw: number;
      baseline_emissions_gco2?: number;
      optimized_emissions_gco2?: number;
      emissions_saved_gco2?: number;
    };
  };
}

export function adaptBackendDispatchPlan(data: BackendDispatchPlanResponse): {
  industrial: IndustrialAssetTrack[];
  batteries: BatteryAssetTrack[];
  kpis: DispatchSummaryKpis;
  actions: ScheduledActionItem[];
} {
  const { plan } = data;

  // 1. Industrial tracks
  const industrial: IndustrialAssetTrack[] = (plan.industrial || []).map((proc) => {

    return {
      id: proc.asset_id,
      name: proc.name || `Industrial Unit ${proc.asset_id.replace('proc_', '')}`,
      facility: 'Bangladesh demo facility',
      powerKw: proc.power_kw,
      earliestStart: formatHourIndex(proc.earliest_start),
      deadline: formatHourIndex(proc.deadline),
      durationHours: proc.duration,
      chosenRunWindow: formatHourRange(proc.optimized_hours),
      baselineRunWindow: formatHourRange(proc.baseline_hours),
      status: 'optimal',
      costSavedUsd: Math.round(proc.cost_saved * 100) / 100,
      carbonAvoidedKg: Math.round((proc.emissions_saved_gco2 / 1000) * 10) / 10,
      peakKwShaved: 0,
    };
  });

  // 2. Battery tracks
  const batteries: BatteryAssetTrack[] = (plan.batteries || []).map((bat) => {
    const chargeHours = (bat.schedule || [])
      .filter((s) => s.charge_kw > 0.05)
      .map((s) => s.hour);
    const dischargeHours = (bat.schedule || [])
      .filter((s) => s.discharge_kw > 0.05)
      .map((s) => s.hour);

    const chargeWindows = groupContiguousHours(chargeHours);
    const dischargeWindows = groupContiguousHours(dischargeHours);

    const capacityKwh = bat.capacity_kwh;
    let socPercent = 0;
    if (bat.schedule && bat.schedule.length > 0 && capacityKwh > 0 && typeof bat.schedule[0].energy_kwh === 'number') {
      socPercent = Math.min(100, Math.max(0, Math.round((bat.schedule[0].energy_kwh / capacityKwh) * 100)));
    } else if (typeof bat.initial_soc === 'number') {
      if (bat.initial_soc <= 1.0) {
        socPercent = Math.round(bat.initial_soc * 100);
      } else if (capacityKwh > 0) {
        socPercent = Math.min(100, Math.max(0, Math.round((bat.initial_soc / capacityKwh) * 100)));
      }
    }

    return {
      id: bat.asset_id,
      name: `Commercial BESS ${bat.asset_id.replace('bat_', '')}`,
      facility: 'Bangladesh demo facility',
      capacityKwh,
      currentSocPercent: socPercent,
      chargeDischargeRateKw: Math.max(bat.charge_rate_kw, bat.discharge_rate_kw),
      chargeWindows,
      dischargeWindows,
      status: 'optimal',
      costSavedUsd: Math.round(bat.cost_saved * 100) / 100,
      carbonAvoidedKg: Math.round((bat.emissions_saved_gco2 / 1000) * 10) / 10,
      peakKwShaved: 0,
      cyclesCount: 0,
    };
  });

  // 3. System KPIs
  const rawKpis = plan.kpis || {
    baseline_cost: 0,
    optimized_cost: 0,
    cost_saved: 0,
    cost_saved_usd: 0,
    co2_saved_kg: 0,
    peak_baseline_kw: 0,
    peak_optimized_kw: 0,
    peak_shaved_kw: 0,
  };

  const costSavedUsd = rawKpis.cost_saved_usd ?? rawKpis.cost_saved ?? 0;
  const baseCost = rawKpis.baseline_cost;
  const costPct = baseCost ? Math.round((costSavedUsd / baseCost) * 100) : 0;

  const co2SavedTons = (rawKpis.co2_saved_kg ?? 0) / 1000;
  const baseCo2Tons = rawKpis.baseline_emissions_gco2 != null
    ? rawKpis.baseline_emissions_gco2 / 1_000_000
    : 0;
  const co2Pct = baseCo2Tons ? Math.round((co2SavedTons / baseCo2Tons) * 100) : 0;

  const peakShavedKw = rawKpis.peak_shaved_kw ?? 0;
  const basePeak = rawKpis.peak_baseline_kw;
  const peakPct = basePeak ? Math.round((peakShavedKw / basePeak) * 100) : 0;

  const kpis: DispatchSummaryKpis = {
    totalCostSavedUsd: Math.round(costSavedUsd * 100) / 100,
    unoptimizedCostUsd: Math.round(rawKpis.baseline_cost * 100) / 100,
    costSavedPercent: costPct,

    totalCarbonAvoidedTons: Math.round(co2SavedTons * 100) / 100,
    unoptimizedCarbonTons: Math.round(baseCo2Tons * 100) / 100,
    carbonAvoidedPercent: co2Pct,

    totalPeakShavedKw: Math.round(peakShavedKw * 10) / 10,
    unoptimizedPeakKw: Math.round(rawKpis.peak_baseline_kw * 10) / 10,
    peakShavedPercent: peakPct,

    explanationText: 'Optimized demo schedules against the configured tariff and carbon signals. Review each asset window before making an operational decision.',
  };

  // 4. Action items
  const actions: ScheduledActionItem[] = [
    ...industrial.map((item) => ({
      id: `act-${item.id}`,
      assetId: item.id,
      assetName: item.name,
      assetType: 'industrial' as const,
      scheduledTimeWindow: item.chosenRunWindow,
      costSavedUsd: item.costSavedUsd,
      carbonAvoidedKg: item.carbonAvoidedKg,
      peakKwShaved: item.peakKwShaved,
      actionSummary: `Baseline ${item.baselineRunWindow}; optimized ${item.chosenRunWindow}`,
      isOverridden: false,
    })),
    ...batteries.map((item) => ({
      id: `act-${item.id}`,
      assetId: item.id,
      assetName: item.name,
      assetType: 'battery' as const,
      scheduledTimeWindow: `${item.chargeWindows.join(', ') || 'Idle'} (Charge) / ${item.dischargeWindows.join(', ') || 'Idle'} (Discharge)`,
      costSavedUsd: item.costSavedUsd,
      carbonAvoidedKg: item.carbonAvoidedKg,
      peakKwShaved: item.peakKwShaved,
      actionSummary: `Battery schedule at up to ${item.chargeDischargeRateKw} kW`,
      isOverridden: false,
    })),
  ];

  return { industrial, batteries, kpis, actions };
}

// ---------------------------------------------------------------------------
// 4. Carbon Telemetry Snapshot Adapter
// ---------------------------------------------------------------------------

export interface BackendCarbonSnapshotResponse {
  count: number;
  snapshots: {
    id: number;
    polled_at: string | null;
    reading_datetime: string | null;
    region: string;
    carbon_intensity_gco2eq_kwh: number;
    is_estimated: boolean;
    estimation_method: string | null;
    source: string | null;
  }[];
}

export function adaptBackendCarbonSnapshots(
  data: BackendCarbonSnapshotResponse
): CarbonSnapshotRecord[] {
  return (data.snapshots || []).map((s) => {
    const polledAt = s.polled_at || new Date().toISOString();
    const readingDatetime = s.reading_datetime || s.polled_at || new Date().toISOString();
    const ci = Math.round(s.carbon_intensity_gco2eq_kwh * 10) / 10;
    const isEst = s.is_estimated ?? true;
    const estMethod = s.estimation_method || 'Electricity Maps live API feed';
    const source = s.source || 'electricity_maps';

    return {
      id: s.id,
      polled_at: polledAt,
      polledAt,
      reading_datetime: readingDatetime,
      readingDatetime,
      region: s.region || 'BD',
      carbon_intensity_gco2eq_kwh: ci,
      carbonIntensityGco2eqKwh: ci,
      is_estimated: isEst,
      isEstimated: isEst,
      estimation_method: estMethod,
      estimationMethod: estMethod,
      source,
    };
  });
}

