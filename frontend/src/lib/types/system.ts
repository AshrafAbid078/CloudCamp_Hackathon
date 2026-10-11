export type ServiceStatus = 'healthy' | 'degraded' | 'offline';

export interface SystemService {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
}

export interface DataProvenanceRecord {
  id: string;
  sourceName: string;
  dataType: 'Satellite GHI' | 'Pyranometer Sensor' | 'Inverter SCADA' | 'Market Clearing Price' | 'Weather API';
  ingestionTimestamp: string;
  pipelineStage: 'Raw Stream' | 'Quality Control' | 'Feature Store' | 'Inference Ready';
  dataQualityScore: number; // 0 - 100
  hash: string;
  recordCount: number;
}
