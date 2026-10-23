import type {
  SolarDataPoint,
  ForecastSummaryMetrics,
  ForecastHorizon,
  ManualOverrideSubmission,
  OptimizationRunHistory,
  CopilotMessage,
  WhatIfSimulationResponse,
  SystemService,
  AdapterHealthDetail,
  DataProvenanceRecord,
} from '../types';
import { apiClient, ApiError } from './client';
import {
  adaptBackendForecast,
  adaptBackendDispatchPlan,
  type BackendForecastResponse,
  type BackendDispatchPlanResponse,
} from './adapters';

export const forecastApi = {
  getForecastSeries: async (horizon: ForecastHorizon = '24h'): Promise<SolarDataPoint[]> => {
    const data = await apiClient<BackendForecastResponse>(`/forecast/bd?horizon_hours=${Number.parseInt(horizon, 10)}`);
    return adaptBackendForecast(data).series;
  },
  getForecastSummary: async (horizon: ForecastHorizon = '24h'): Promise<ForecastSummaryMetrics> => {
    const data = await apiClient<BackendForecastResponse>(`/forecast/bd?horizon_hours=${Number.parseInt(horizon, 10)}`);
    return adaptBackendForecast(data).summary;
  },
};

export const dispatchApi = {
  getDispatchTracks: async (horizonHours: number = 24) => {
    let planData: BackendDispatchPlanResponse;
    try {
      planData = await apiClient<BackendDispatchPlanResponse>(`/dispatch/runs/latest?hours=${horizonHours}`);
      const firstSlot = planData.forecast_used?.timestamps?.[0];
      const ageHours = firstSlot ? Math.abs(Date.now() - new Date(firstSlot).getTime()) / 3_600_000 : Infinity;
      if (!Number.isFinite(ageHours) || ageHours > 2) {
        planData = await apiClient<BackendDispatchPlanResponse>(`/dispatch/plan?hours=${horizonHours}&region=bd&record=false`);
      }
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      planData = await apiClient<BackendDispatchPlanResponse>(`/dispatch/plan?hours=${horizonHours}&region=bd&record=false`);
    }
    const adapted = adaptBackendDispatchPlan(planData);
    const saved = await apiClient<{ runs: { id: number; created_at: string; hours: number; decision: OptimizationRunHistory['status']; kpis: BackendDispatchPlanResponse['plan']['kpis'] }[] }>('/dispatch/runs?limit=50');
    const history: OptimizationRunHistory[] = saved.runs.map(run => ({
      runId: `RUN-${run.id.toString().padStart(4, '0')}`,
      timestamp: run.created_at,
      costSavedUsd: run.kpis.cost_saved_usd,
      carbonAvoidedKg: run.kpis.co2_saved_kg,
      peakShavedKw: run.kpis.peak_shaved_kw,
      status: run.decision,
    }));
    return {
      industrialTracks: adapted.industrial,
      batteryTrack: adapted.batteries[0] ?? null,
      evFleetStub: { id: 'ev-planned', name: 'EV fleet adapter (planned)', status: 'architecture_ready' as const, vehicleCount: 0, depotCapacityKw: 0, targetConnectionWindow: 'Not connected', note: 'No EV equipment or OCPP integration is connected.' },
      summaryKpis: adapted.kpis,
      history,
      actions: adapted.actions,
      runId: planData.run_id ?? null,
      forecastSources: planData.forecast_used?.sources ?? null,
    };
  },

  createDispatchRun: async (horizonHours: number = 24) => {
    const plan = await apiClient<BackendDispatchPlanResponse>(`/dispatch/runs?hours=${horizonHours}`, { method: 'POST' });
    return adaptBackendDispatchPlan(plan);
  },

  decideRun: async (runId: string, action: 'approve' | 'reject', reason?: string) => {
    const id = Number(runId.replace('RUN-', ''));
    if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid run ID.');
    return apiClient<{ decision: 'approve' | 'reject'; equipment_command_sent: false }>(`/dispatch/runs/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  },

  compareScenario: async (pvCapacityKw: number, horizonHours: number = 24) => {
    return apiClient<{ change: { cost_usd: number; emissions_kg: number; peak_kw: number }; note: string; inputs: { pv_capacity_kw: number } }>('/dispatch/scenarios', {
      method: 'POST',
      body: JSON.stringify({ pv_capacity_kw: pvCapacityKw, horizon_hours: horizonHours }),
    });
  },

  submitManualOverride: async (payload: ManualOverrideSubmission): Promise<{ success: boolean; message: string; plan: BackendDispatchPlanResponse }> => {
    if (payload.overrideType !== 'shift') throw new Error('Only a schedule shift is currently supported.');
    const match = payload.proposedWindow.trim().match(/^(\d{1,2}):00\s*-\s*(\d{1,2}):00$/);
    if (!match) throw new Error('Enter a whole-hour window such as 12:00 - 15:00.');
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 0 || start > 23 || end <= start || end > 24) throw new Error('Enter a valid window within this day.');
    const plan = await apiClient<BackendDispatchPlanResponse>('/dispatch/override', {
      method: 'POST',
      body: JSON.stringify({ asset_id: payload.assetId, forced_start_hour: start, forced_duration: end - start, horizon_hours: payload.horizonHours, region: 'bd', reason: payload.rejectionReason }),
    });
    const applied = plan.plan?.industrial?.find(asset => asset.asset_id === payload.assetId);
    if (plan.status !== 'success' || !plan.run_id || !applied || !applied.optimized_hours.includes(start)) {
      throw new Error('The backend did not confirm the requested asset schedule.');
    }
    return { success: true, message: `Run ${plan.run_id}: ${payload.assetName} shifted to ${payload.proposedWindow}.`, plan };
  },

  getDispatchHistory: async (limit: number = 50): Promise<OptimizationRunHistory[]> => {
    const res = await apiClient<{ runs: { id: number; created_at: string; decision: OptimizationRunHistory['status']; kpis: BackendDispatchPlanResponse['plan']['kpis'] }[] }>(`/dispatch/runs?limit=${limit}`);
    return res.runs.map(run => ({ runId: `RUN-${run.id}`, timestamp: run.created_at, costSavedUsd: run.kpis.cost_saved_usd, carbonAvoidedKg: run.kpis.co2_saved_kg, peakShavedKw: run.kpis.peak_shaved_kw, status: run.decision }));
  },
};

export const copilotApi = {
  sendQuery: async (prompt: string): Promise<CopilotMessage> => {
    void prompt;
    throw new Error('Copilot is planned and has no connected inference service yet.');
  },
  runWhatIf: async (): Promise<WhatIfSimulationResponse> => {
    throw new Error('Scenario simulation is not available yet.');
  },
};

export const systemApi = {
  getServices: async (): Promise<SystemService[]> => {
    const health = await apiClient<{ status: string; forecast_model: string; forecast_sources?: { solar: string; carbon: string }; forecast_ready: boolean; solver_ready: boolean; assets_loaded: boolean }>('/health');
    const checked = new Date().toLocaleString();
    return [
      { name: `Solar source (${health.forecast_model})`, category: 'forecast_engine', status: health.forecast_ready && health.forecast_model === 'OpenMeteoForecast' ? 'healthy' : 'degraded', latencyMs: 0, uptimePercent: 0, lastChecked: checked, notes: health.forecast_sources?.solar === 'open_meteo_weather_forecast' ? 'Current regional weather-model forecast; not on-site telemetry.' : 'Archived 2020 fallback; latency and uptime are not measured.' },
      { name: 'Dispatch solver', category: 'optimizer_solver', status: health.solver_ready ? 'healthy' : 'degraded', latencyMs: 0, uptimePercent: 0, lastChecked: checked, notes: 'Solver smoke check only.' },
      { name: 'Demo asset data', category: 'data_adapter', status: health.assets_loaded ? 'healthy' : 'degraded', latencyMs: 0, uptimePercent: 0, lastChecked: checked, notes: 'Synthetic assets; no equipment connection.' },
    ];
  },
  getAdapterHealthDetails: async (): Promise<AdapterHealthDetail[]> => [],
  getDataProvenance: async (): Promise<DataProvenanceRecord[]> => [],
};
