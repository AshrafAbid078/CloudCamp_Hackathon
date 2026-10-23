import { describe, expect, it } from 'vitest';
import { adaptBackendDispatchPlan, adaptBackendForecast, type BackendDispatchPlanResponse } from './adapters';

describe('backend response adapters', () => {
  it('keeps negative improvements and legitimate zeroes', () => {
    const data: BackendDispatchPlanResponse = {
      status: 'success', region: 'bd', hours: 24,
      plan: { industrial: [], batteries: [], kpis: {
        baseline_cost: 100, optimized_cost: 100, cost_saved: 0, cost_saved_usd: 0,
        co2_saved_kg: -200, peak_baseline_kw: 100, peak_optimized_kw: 120,
        peak_shaved_kw: -20, baseline_emissions_gco2: 1_000_000,
        optimized_emissions_gco2: 1_200_000,
      } },
    };
    const result = adaptBackendDispatchPlan(data).kpis;
    expect(result.costSavedPercent).toBe(0);
    expect(result.carbonAvoidedPercent).toBe(-20);
    expect(result.peakShavedPercent).toBe(-20);
  });

  it('converts fractional MAPE to percent and uses Bangladesh time', () => {
    const result = adaptBackendForecast({
      region: 'bd', horizon_hours: 1,
      accuracy: { model: 'LightGBM', rmse: 122.3, mape: 0.506 },
      forecast: { timestamps: ['2020-12-31T18:00:00+00:00'], solar_ghi_w_m2: [0], solar_ghi_lower: [0], solar_ghi_upper: [0], grid_stress_gco2_kwh: [625] },
    });
    expect(result.series[0].timestamp).toBe('00:00');
    expect(result.summary.benchmarks[1].lightGbmValue).toBe(50.6);
    expect(result.summary.benchmarks[0].persistenceValue).toBeNull();
    expect(result.summary.expectedDailySolarKwh).toBeNull();
  });
});
