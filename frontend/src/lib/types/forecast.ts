export type ForecastHorizon = '6h' | '12h' | '24h';

export interface SolarDataPoint {
  timestamp: string; // HH:mm
  ghiActual?: number; // W/m² (Global Horizontal Irradiance)
  ghiForecast: number; // W/m²
  ghiLowerBound: number; // 10th percentile
  ghiUpperBound: number; // 90th percentile
  dni?: number; // Direct Normal Irradiance (W/m²)
  dhi?: number; // Diffuse Horizontal Irradiance (W/m²)
  clearsky?: number; // Clearsky physical model (W/m²)
  gridStressIndex: number; // 0 - 100 (feeder congestion / marginal carbon)
  carbonIntensityGco2: number; // gCO2 / kWh
  cloudCoverPercent: number; // 0 - 100%
  temperatureC: number;
  nsrdbHistoricalGhi?: number;
  gfsPredictedCloud?: number;
  isEstimated?: boolean;
  estimationMethod?: string;
}

export interface ModelBenchmarkAccuracy {
  metric: string;
  lightGbmValue: number;
  persistenceValue: number;
  unit: string;
  improvementPercent: number;
}

export interface ForecastSummaryMetrics {
  currentGhi: number;
  peakGhiForecast: number;
  expectedDailySolarKwh: number;
  currentGridStressIndex: number;
  peakStressWindow: string;
  modelType: 'LightGBM' | 'PersistenceBaseline';
  isEstimated: boolean;
  estimationMethod: string;
  lastTrainedDate: string;
  benchmarks: ModelBenchmarkAccuracy[];
}
