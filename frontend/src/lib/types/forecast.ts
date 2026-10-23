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
  gridStressIndex?: number; // only when provided by a measured grid-stress service
  carbonIntensityGco2: number; // gCO2 / kWh
  cloudCoverPercent?: number; // 0 - 100%
  temperatureC?: number;
  nsrdbHistoricalGhi?: number;
  gfsPredictedCloud?: number;
  isEstimated?: boolean;
  estimationMethod?: string;
}

export interface ModelBenchmarkAccuracy {
  metric: string;
  lightGbmValue: number | null;
  persistenceValue: number | null;
  unit: string;
  improvementPercent: number | null;
}

export interface ForecastSummaryMetrics {
  currentGhi: number;
  peakGhiForecast: number;
  expectedDailySolarKwh: number | null;
  currentGridStressIndex: number | null;
  peakStressWindow: string | null;
  modelType: 'LightGBM' | 'PersistenceBaseline' | 'OpenMeteoForecast';
  solarSource: string;
  carbonSource: string;
  sourceNote: string | null;
  forecastIssuedAt: string | null;
  isEstimated: boolean;
  estimationMethod: string;
  lastTrainedDate: string | null;
  benchmarks: ModelBenchmarkAccuracy[];
}
