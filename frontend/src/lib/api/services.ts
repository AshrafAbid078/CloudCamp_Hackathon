import type {
  SolarDataPoint,
  ForecastSummaryMetrics,
  ForecastHorizon,
  DispatchInterval,
  DispatchSummary,
  ManualOverrideRequest,
  CopilotMessage,
  SystemService,
  DataProvenanceRecord,
} from '../types';

// Mock dataset generator for 24-hour GHI and Solar PV curve
export function generateMockSolarData(): SolarDataPoint[] {
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '07:00', '08:00', '09:00', '10:00', 
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', 
    '19:00', '20:00', '22:00'
  ];

  return hours.map((hour) => {
    const hourNum = parseInt(hour.split(':')[0], 10);
    // Solar bell curve peaked around 12:00 - 13:00
    let ghiBase = 0;
    if (hourNum >= 6 && hourNum <= 19) {
      const x = (hourNum - 12.5) / 3.5;
      ghiBase = Math.max(0, Math.round(980 * Math.exp(-(x * x))));
    }

    // Add slight simulated cloud drop at 13:00
    const actualDrop = hourNum === 13 ? 120 : 0;
    const actualGhi = hourNum <= 15 ? Math.max(0, ghiBase - actualDrop + (Math.sin(hourNum) * 15)) : undefined;

    return {
      timestamp: hour,
      ghiActual: actualGhi !== undefined ? Math.round(actualGhi) : undefined,
      ghiForecast: ghiBase,
      ghiLowerBound: Math.max(0, Math.round(ghiBase * 0.92)),
      ghiUpperBound: Math.round(ghiBase * 1.08),
      cloudCoverPercent: hourNum === 13 ? 42 : Math.round(Math.random() * 15),
      pvPowerActualMW: actualGhi !== undefined ? +(actualGhi * 0.12).toFixed(1) : undefined,
      pvPowerForecastMW: +(ghiBase * 0.12).toFixed(1),
      temperatureC: Math.round(22 + Math.sin((hourNum - 8) / 4) * 11),
    };
  });
}

// Mock dataset for battery dispatch and market arbitrage intervals
export function generateMockDispatchIntervals(): DispatchInterval[] {
  return [
    {
      id: 'disp-06',
      timestamp: '06:00',
      action: 'idle',
      batteryPowerMW: 0,
      stateOfChargePercent: 45,
      solarGenerationMW: 12.4,
      gridDemandMW: 85.0,
      clearingPricePerMWh: 38.5,
      projectedRevenueUSD: 477,
      curtailmentRiskMW: 0,
    },
    {
      id: 'disp-08',
      timestamp: '08:00',
      action: 'charge',
      batteryPowerMW: -15.0,
      stateOfChargePercent: 55,
      solarGenerationMW: 58.2,
      gridDemandMW: 110.0,
      clearingPricePerMWh: 29.0,
      projectedRevenueUSD: -435,
      curtailmentRiskMW: 0,
    },
    {
      id: 'disp-11',
      timestamp: '11:00',
      action: 'charge',
      batteryPowerMW: -25.0,
      stateOfChargePercent: 88,
      solarGenerationMW: 112.5,
      gridDemandMW: 95.0,
      clearingPricePerMWh: 18.2,
      projectedRevenueUSD: -455,
      curtailmentRiskMW: 8.5,
    },
    {
      id: 'disp-13',
      timestamp: '13:00',
      action: 'hold',
      batteryPowerMW: 0,
      stateOfChargePercent: 95,
      solarGenerationMW: 94.0,
      gridDemandMW: 102.0,
      clearingPricePerMWh: 24.5,
      projectedRevenueUSD: 0,
      curtailmentRiskMW: 2.1,
    },
    {
      id: 'disp-17',
      timestamp: '17:00',
      action: 'discharge',
      batteryPowerMW: 30.0,
      stateOfChargePercent: 72,
      solarGenerationMW: 32.0,
      gridDemandMW: 145.0,
      clearingPricePerMWh: 88.4,
      projectedRevenueUSD: 2652,
      curtailmentRiskMW: 0,
    },
    {
      id: 'disp-19',
      timestamp: '19:00',
      action: 'discharge',
      batteryPowerMW: 35.0,
      stateOfChargePercent: 38,
      solarGenerationMW: 2.1,
      gridDemandMW: 160.0,
      clearingPricePerMWh: 142.0,
      projectedRevenueUSD: 4970,
      curtailmentRiskMW: 0,
    },
  ];
}

export const forecastApi = {
  getForecastSeries: async (_horizon: ForecastHorizon = '24h'): Promise<SolarDataPoint[]> => {
    // In production, will call apiClient<SolarDataPoint[]>('/api/forecast', { params: { horizon } })
    return generateMockSolarData();
  },

  getForecastSummary: async (): Promise<ForecastSummaryMetrics> => {
    return {
      currentGhi: 785,
      peakGhiForecast: 942,
      expectedDailyGenerationMWh: 824.6,
      meanAbsoluteErrorPercent: 3.8,
      rootMeanSquaredError: 18.4,
      cloudVectorDirection: 'NW (285°) @ 14 km/h',
      satelliteFeedStatus: 'live',
      lastModelRunTimestamp: '12 mins ago',
    };
  },
};

export const dispatchApi = {
  getDispatchSchedule: async (): Promise<{ intervals: DispatchInterval[]; summary: DispatchSummary }> => {
    return {
      intervals: generateMockDispatchIntervals(),
      summary: {
        dailyRevenueUSD: 18450,
        curtailmentAvoidedMWh: 42.8,
        batteryCycleCount: 1.15,
        avgStateOfCharge: 68.4,
        peakDischargeWindow: '18:00 - 21:00 ($135/MWh peak)',
        optimizationStatus: 'optimized',
      },
    };
  },

  submitManualOverride: async (payload: ManualOverrideRequest): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: `Manual override confirmed for interval ${payload.intervalId}: ${payload.batteryPowerMW} MW (${payload.action.toUpperCase()}). Safety interlocks verified.`,
    };
  },
};

export const copilotApi = {
  sendQuery: async (prompt: string): Promise<CopilotMessage> => {
    // Simulated intelligent response generator
    const lower = prompt.toLowerCase();
    let responseText = `Telemetry analysis shows fleet solar performance is tracking within 96.2% of expected GHI. Battery state of charge is maintained to maximize evening peak net revenue.`;

    if (lower.includes('ghi') || lower.includes('drop') || lower.includes('cloud')) {
      responseText = `At 13:00, cloud vector tracking registered a localized cumulus cloud band moving NW at 14 km/h. This induced a brief 120 W/m² GHI dip (12.2% reduction in instantaneous PV yield). The automated optimizer transitioned BESS Unit 2 into hold mode, preserving 25 MWh for the 18:00 - 20:00 price surge ($142/MWh).`;
    } else if (lower.includes('curtail') || lower.includes('risk')) {
      responseText = `Grid curtailment risk is currently LOW (2.1 MW remaining headroom at Mohave Interconnection). The battery system absorbed 35 MWh of surplus solar generation between 10:30 and 12:45, preventing $3,400 in negative locational marginal pricing penalties.`;
    } else if (lower.includes('override') || lower.includes('battery') || lower.includes('soc')) {
      responseText = `Battery Fleet Status: Current aggregate SoC is 74.2%. Remaining discharge capacity for the evening peak window is 68 MWh. You can initiate a manual override from the Dispatch Optimizer panel if frequency support is requested by the ISO.`;
    }

    return {
      id: `copilot-${Date.now()}`,
      sender: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        { title: 'GOES-16 Satellite Solar Irradiance Channel', source: 'NOAA / Copernicus', metricValue: '785 W/m²' },
        { title: 'Day-Ahead Locational Marginal Pricing', source: 'CAISO Oasis Feed', metricValue: '$88.40/MWh' },
      ],
      suggestedActions: [
        { label: 'View Forecast Deviation Chart', actionType: 'navigate', payload: '/forecast' },
        { label: 'Open Dispatch Override Panel', actionType: 'navigate', payload: '/dispatch' },
      ],
    };
  },
};

export const systemApi = {
  getServices: async (): Promise<SystemService[]> => {
    return [
      { name: 'GHI Neural Inference Pipeline (v3.2)', status: 'healthy', latencyMs: 42, uptimePercent: 99.98, lastChecked: 'Just now' },
      { name: 'Satellite GOES-16 Geostationary Stream', status: 'healthy', latencyMs: 110, uptimePercent: 99.95, lastChecked: '1m ago' },
      { name: 'Grid ISO LMP Price Feed & Arbitrage Engine', status: 'healthy', latencyMs: 68, uptimePercent: 100, lastChecked: 'Just now' },
      { name: 'BESS SCADA Telemetry Interconnect', status: 'healthy', latencyMs: 25, uptimePercent: 99.99, lastChecked: 'Just now' },
      { name: 'Ground Pyranometer Sensor Mesh', status: 'degraded', latencyMs: 240, uptimePercent: 97.4, lastChecked: '3m ago' },
    ];
  },

  getDataProvenance: async (): Promise<DataProvenanceRecord[]> => {
    return [
      {
        id: 'prov-001',
        sourceName: 'Mohave Array Ground Pyranometer Station #4',
        dataType: 'Pyranometer Sensor',
        ingestionTimestamp: '2026-10-11T16:40:00Z',
        pipelineStage: 'Inference Ready',
        dataQualityScore: 99.4,
        hash: 'sha256:7f8a91b...34c',
        recordCount: 14400,
      },
      {
        id: 'prov-002',
        sourceName: 'NOAA GOES-16 Advanced Baseline Imager',
        dataType: 'Satellite GHI',
        ingestionTimestamp: '2026-10-11T16:35:00Z',
        pipelineStage: 'Inference Ready',
        dataQualityScore: 98.9,
        hash: 'sha256:4b22c8e...d12',
        recordCount: 2880,
      },
      {
        id: 'prov-003',
        sourceName: 'Inverter SCADA Gateway Substation Beta',
        dataType: 'Inverter SCADA',
        ingestionTimestamp: '2026-10-11T16:41:00Z',
        pipelineStage: 'Quality Control',
        dataQualityScore: 97.2,
        hash: 'sha256:91da34e...88f',
        recordCount: 43200,
      },
      {
        id: 'prov-004',
        sourceName: 'CAISO Oasis Real-Time Market Clearing API',
        dataType: 'Market Clearing Price',
        ingestionTimestamp: '2026-10-11T16:30:00Z',
        pipelineStage: 'Feature Store',
        dataQualityScore: 100.0,
        hash: 'sha256:32cda41...01a',
        recordCount: 288,
      },
    ];
  },
};
