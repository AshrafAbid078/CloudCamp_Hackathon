export type ServiceStatus = 'healthy' | 'degraded' | 'offline';

export interface SystemService {
  name: string;
  category: 'forecast_engine' | 'data_adapter' | 'optimizer_solver' | 'grid_api';
  status: ServiceStatus;
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
  notes?: string;
}

export interface AdapterHealthDetail {
  id: string;
  name: string;
  type: 'region' | 'asset';
  status: 'live' | 'architecture_ready';
  primarySource: string;
  lastPollTimestamp: string;
  sampleFrequency: string;
  knownGaps: string[];
  fallbackStrategy: string;
}

export interface DataProvenanceRecord {
  id: string;
  sourceName: string;
  dataType: string;
  spatialResolution: string;
  temporalResolution: string;
  ingestionTimestamp: string;
  pipelineStage: 'Raw Ingestion' | 'Quality Control' | 'Feature Store' | 'Inference Ready';
  dataQualityScore: number; // 0 - 100
  hash: string;
  recordCount: number;
  syntheticNotice?: string;
}

export interface CarbonSnapshotRecord {
  id: number;
  polled_at: string;
  reading_datetime: string | null;
  region: string;
  carbon_intensity_gco2eq_kwh: number;
  is_estimated: boolean;
  estimation_method: string | null;
  source: string;

  // CamelCase aliases for frontend ergonomics
  polledAt?: string;
  readingDatetime?: string | null;
  carbonIntensityGco2eqKwh?: number;
  isEstimated?: boolean;
  estimationMethod?: string | null;
}
