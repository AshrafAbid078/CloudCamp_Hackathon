export interface SolarDataPoint {
  timestamp: string; // ISO string or HH:mm
  ghiActual?: number; // W/m² (Global Horizontal Irradiance)
  ghiForecast: number; // W/m²
  ghiLowerBound?: number; // 10th percentile
  ghiUpperBound?: number; // 90th percentile
  dni?: number; // Direct Normal Irradiance
  dhi?: number; // Diffuse Horizontal Irradiance
  cloudCoverPercent: number; // 0 - 100%
  pvPowerActualMW?: number; // Megawatts
  pvPowerForecastMW: number; // Megawatts
  temperatureC: number;
}

export type ForecastHorizon = '15m' | '1h' | '4h' | '24h' | '48h';

export interface ForecastSummaryMetrics {
  currentGhi: number;
  peakGhiForecast: number;
  expectedDailyGenerationMWh: number;
  meanAbsoluteErrorPercent: number;
  rootMeanSquaredError: number;
  cloudVectorDirection: string;
  satelliteFeedStatus: 'live' | 'delayed' | 'offline';
  lastModelRunTimestamp: string;
}
