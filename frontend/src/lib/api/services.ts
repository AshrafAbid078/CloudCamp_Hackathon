import type {
  SolarDataPoint,
  ForecastSummaryMetrics,
  ForecastHorizon,
  IndustrialAssetTrack,
  BatteryAssetTrack,
  EvFleetStubAsset,
  ScheduledActionItem,
  DispatchSummaryKpis,
  ManualOverrideSubmission,
  OptimizationRunHistory,
  CopilotMessage,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  SystemService,
  AdapterHealthDetail,
  DataProvenanceRecord,
} from '../types';

// Generate Bangladesh GHI & Grid-Stress dataset across 6h, 12h, or 24h
export function generateMockSolarData(horizon: ForecastHorizon = '24h'): SolarDataPoint[] {
  const allHours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  let hours = allHours;
  if (horizon === '6h') {
    hours = allHours.slice(10, 16); // 10:00 - 15:00 (peak daylight window)
  } else if (horizon === '12h') {
    hours = allHours.slice(6, 18); // 06:00 - 17:00 (daytime)
  }

  return hours.map((hour) => {
    const hourNum = parseInt(hour.split(':')[0], 10);

    // Physical solar radiation bell curve peaked at 12:30 (Bangladesh latitude ~22.3° N)
    let ghiBase = 0;
    let clearsky = 0;
    if (hourNum >= 6 && hourNum <= 18) {
      const x = (hourNum - 12.3) / 3.4;
      clearsky = Math.max(0, Math.round(960 * Math.exp(-(x * x))));
      // Simulated cloud attenuation (e.g. 13:00 afternoon cumulus transit)
      const cloudAttenuation = hourNum === 13 ? 0.78 : (hourNum === 14 ? 0.88 : 0.94);
      ghiBase = Math.max(0, Math.round(clearsky * cloudAttenuation));
    }

    // Actual reading (available up to 14:00)
    const hasActual = hourNum <= 14 && hourNum >= 6;
    const actualGhi = hasActual
      ? Math.max(0, Math.round(ghiBase + (hourNum === 13 ? -45 : Math.sin(hourNum * 1.5) * 20)))
      : undefined;

    // Direct Normal Irradiance (DNI) and Diffuse Horizontal Irradiance (DHI) partition
    const dni = ghiBase > 0 ? Math.round(ghiBase * 0.82) : 0;
    const dhi = ghiBase > 0 ? Math.round(ghiBase * 0.28) : 0;

    // Bangladesh Grid Stress Index (0-100): peaks in evening (18:00 - 21:30) due to air conditioning & lighting
    let gridStress = 32;
    if (hourNum >= 18 && hourNum <= 22) {
      gridStress = 88 - Math.abs(hourNum - 20) * 8; // Peak at 20:00 (88/100)
    } else if (hourNum >= 11 && hourNum <= 14) {
      gridStress = 44; // Moderate industrial load, offset by rooftop solar
    }

    // Carbon intensity in Bangladesh (gCO2/kWh): Gas peakers dispatch during evening peak
    const carbonIntensity = Math.round(520 + (gridStress / 100) * 190);

    return {
      timestamp: hour,
      ghiActual: actualGhi,
      ghiForecast: ghiBase,
      ghiLowerBound: Math.max(0, Math.round(ghiBase * 0.90)),
      ghiUpperBound: Math.round(ghiBase * 1.10),
      dni,
      dhi,
      clearsky,
      gridStressIndex: gridStress,
      carbonIntensityGco2: carbonIntensity,
      cloudCoverPercent: hourNum === 13 ? 48 : (hourNum >= 6 && hourNum <= 17 ? 22 : 10),
      temperatureC: Math.round(27 + Math.sin((hourNum - 8) / 4) * 6),
      nsrdbHistoricalGhi: Math.round(ghiBase * 0.96 + 15),
      gfsPredictedCloud: hourNum === 13 ? 45 : 18,
      isEstimated: false,
      estimationMethod: 'Electricity Maps + GFS Neural ConvNet',
    };
  });
}

// Industrial Process Tracks
export const MOCK_INDUSTRIAL_TRACKS: IndustrialAssetTrack[] = [
  {
    id: 'ind-vat-2',
    name: 'Textile Finishing Dye-Vat #2',
    facility: 'Chittagong Export Processing Zone (CEPZ)',
    powerKw: 450,
    earliestStart: '08:00',
    deadline: '17:00',
    durationHours: 3.5,
    chosenRunWindow: '11:30 – 15:00',
    baselineRunWindow: '08:30 – 12:00',
    status: 'optimal',
    costSavedUsd: 1240,
    carbonAvoidedKg: 6800,
    peakKwShaved: 220,
  },
  {
    id: 'ind-arc-1',
    name: 'Electric Arc Furnace Induction Pre-Heater',
    facility: 'BSRM Steel Re-Rolling Substation',
    powerKw: 650,
    earliestStart: '09:00',
    deadline: '16:30',
    durationHours: 2.0,
    chosenRunWindow: '12:00 – 14:00',
    baselineRunWindow: '17:30 – 19:30',
    status: 'optimal',
    costSavedUsd: 960,
    carbonAvoidedKg: 4200,
    peakKwShaved: 160,
  },
];

// Battery Storage Track
export const MOCK_BATTERY_TRACK: BatteryAssetTrack = {
  id: 'bess-array-1',
  name: 'Chittagong Industrial Substation BESS-1',
  facility: '40 MWh Utility / Microgrid Interconnect',
  capacityKwh: 2000,
  currentSocPercent: 68,
  chargeDischargeRateKw: 500,
  chargeWindows: ['11:00 – 14:00 (Surplus Solar Absorption)'],
  dischargeWindows: ['18:30 – 21:00 (Grid Stress Mitigation)'],
  status: 'optimal',
  costSavedUsd: 1600,
  carbonAvoidedKg: 7400,
  peakKwShaved: 160,
  cyclesCount: 1.12,
};

// EV Fleet Coming-Soon Stub
export const MOCK_EV_FLEET_STUB: EvFleetStubAsset = {
  id: 'ev-depot-stub',
  name: 'Commercial Logistics EV Fleet Depot',
  status: 'architecture_ready',
  vehicleCount: 24,
  depotCapacityKw: 480,
  targetConnectionWindow: 'Overnight & Midday Solar Opportunity',
  note: 'Architecture-ready adapter schema implemented. Awaiting field OCPP 2.0.1 telemetry gateway ingestion.',
};

// Today's Scheduled Actions for Dashboard Sidebar
export const MOCK_SCHEDULED_ACTIONS: ScheduledActionItem[] = [
  {
    id: 'act-01',
    assetId: 'ind-vat-2',
    assetName: 'Dye-Vat #2 (Industrial Batch)',
    assetType: 'industrial',
    scheduledTimeWindow: '11:30 – 15:00',
    costSavedUsd: 480,
    carbonAvoidedKg: 2400,
    peakKwShaved: 220,
    actionSummary: 'Shifted from morning tariff to 920 W/m² peak solar irradiance window.',
  },
  {
    id: 'act-02',
    assetId: 'bess-array-1',
    assetName: 'Chittagong BESS (Absorption Charge)',
    assetType: 'battery',
    scheduledTimeWindow: '11:00 – 14:00',
    costSavedUsd: 360,
    carbonAvoidedKg: 1800,
    peakKwShaved: 0,
    actionSummary: 'Absorbing 1,200 kWh surplus rooftop PV generation at $0.00 fuel cost.',
  },
  {
    id: 'act-03',
    assetId: 'bess-array-1',
    assetName: 'Chittagong BESS (Peak Discharge)',
    assetType: 'battery',
    scheduledTimeWindow: '18:30 – 21:00',
    costSavedUsd: 1240,
    carbonAvoidedKg: 5600,
    peakKwShaved: 380,
    actionSummary: 'Discharging 1,500 kWh into BPDB evening grid peak (avoiding 710 gCO2/kWh peakers).',
  },
  {
    id: 'act-04',
    assetId: 'ind-arc-1',
    assetName: 'Steel Arc Pre-Heater (Load Curtailment)',
    assetType: 'industrial',
    scheduledTimeWindow: '12:00 – 14:00',
    costSavedUsd: 960,
    carbonAvoidedKg: 4200,
    peakKwShaved: 160,
    actionSummary: 'Pre-heating cycle moved forward by 5.5 hours away from national grid stress hours.',
  },
];

// Summary KPIs
export const MOCK_SUMMARY_KPIS: DispatchSummaryKpis = {
  totalCostSavedUsd: 2840,
  unoptimizedCostUsd: 11450,
  costSavedPercent: 24.8,

  totalCarbonAvoidedTons: 14.2,
  unoptimizedCarbonTons: 37.4,
  carbonAvoidedPercent: 38.0,

  totalPeakShavedKw: 380,
  unoptimizedPeakKw: 1180,
  peakShavedPercent: 32.2,

  explanationText:
    'Shifted 420 kWh of heavy industrial dyeing and steel pre-heating into the 11:30–14:30 peak solar irradiance window (GHI 880 W/m²). Battery charged with free rooftop PV surplus and injected 1,500 kWh during the 18:30–21:00 national grid stress peak, avoiding natural gas peaking penalties and shaving 380 kW from the facility demand baseline.',
};

export const forecastApi = {
  getForecastSeries: async (horizon: ForecastHorizon = '24h'): Promise<SolarDataPoint[]> => {
    return generateMockSolarData(horizon);
  },

  getForecastSummary: async (): Promise<ForecastSummaryMetrics> => {
    return {
      currentGhi: 840,
      peakGhiForecast: 925,
      expectedDailySolarKwh: 3840,
      currentGridStressIndex: 42,
      peakStressWindow: '18:30 – 21:30',
      modelType: 'LightGBM',
      isEstimated: false,
      estimationMethod: 'Electricity Maps + NOAA GFS Coupled Model',
      lastTrainedDate: '2026-10-12 (Trained on 10yr NREL NSRDB Bangladesh)',
      benchmarks: [
        {
          metric: 'Mean Absolute Error (MAE)',
          lightGbmValue: 14.2,
          persistenceValue: 24.8,
          unit: 'W/m²',
          improvementPercent: 42.7,
        },
        {
          metric: 'Root Mean Squared Error (RMSE)',
          lightGbmValue: 18.6,
          persistenceValue: 31.4,
          unit: 'W/m²',
          improvementPercent: 40.8,
        },
        {
          metric: 'Mean Absolute Percentage Error (MAPE)',
          lightGbmValue: 3.4,
          persistenceValue: 7.2,
          unit: '%',
          improvementPercent: 52.8,
        },
      ],
    };
  },
};

export const dispatchApi = {
  getDispatchTracks: async (): Promise<{
    industrialTracks: IndustrialAssetTrack[];
    batteryTrack: BatteryAssetTrack;
    evFleetStub: EvFleetStubAsset;
    summaryKpis: DispatchSummaryKpis;
    history: OptimizationRunHistory[];
  }> => {
    return {
      industrialTracks: MOCK_INDUSTRIAL_TRACKS,
      batteryTrack: MOCK_BATTERY_TRACK,
      evFleetStub: MOCK_EV_FLEET_STUB,
      summaryKpis: MOCK_SUMMARY_KPIS,
      history: [
        { runId: 'run-01', timestamp: 'Today 06:00 BST', costSavedUsd: 2840, carbonAvoidedKg: 14200, peakShavedKw: 380, solverConvergenceMs: 142, status: 'optimal' },
        { runId: 'run-02', timestamp: 'Yesterday 06:00 BST', costSavedUsd: 2610, carbonAvoidedKg: 13100, peakShavedKw: 360, solverConvergenceMs: 158, status: 'optimal' },
        { runId: 'run-03', timestamp: '2 days ago 06:00 BST', costSavedUsd: 2450, carbonAvoidedKg: 12400, peakShavedKw: 340, solverConvergenceMs: 135, status: 'optimal' },
        { runId: 'run-04', timestamp: '3 days ago 06:00 BST', costSavedUsd: 2980, carbonAvoidedKg: 14900, peakShavedKw: 410, solverConvergenceMs: 160, status: 'optimal' },
      ],
    };
  },

  getScheduledActions: async (): Promise<ScheduledActionItem[]> => {
    return MOCK_SCHEDULED_ACTIONS;
  },

  submitManualOverride: async (
    payload: ManualOverrideSubmission
  ): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: `Override registered: Asset '${payload.assetName}' updated to '${payload.proposedWindow}'. Rejection reason logged: "${payload.rejectionReason || 'Operator manual adjustment'}". MILP schedule re-converged.`,
    };
  },
};

export const copilotApi = {
  sendQuery: async (
    prompt: string,
    rolePerspective: 'facility_manager' | 'grid_operator' = 'facility_manager'
  ): Promise<CopilotMessage> => {
    const lower = prompt.toLowerCase();
    const isGrid = rolePerspective === 'grid_operator';

    // Role-Tone Demonstration: Terse/numeric for Grid Operator vs Plainer/action-first for Facility Manager
    let responseText = '';
    const toolCalls = [];

    if (lower.includes('drop') || lower.includes('30%') || lower.includes('what-if') || lower.includes('what if')) {
      toolCalls.push(
        {
          toolName: 'get_forecast' as const,
          args: { region: 'Bangladesh', horizon: '12h' },
          outputSummary: 'GHI baseline 880 W/m² @ 13:00; cloud cover vector NW 14 km/h',
          durationMs: 42,
        },
        {
          toolName: 'run_whatif' as const,
          args: { solarDeltaPercent: -30, targetWindow: '13:00 - 16:00', region: 'BD_CEPZ' },
          outputSummary: 'Deficit: 264 kWh solar. Re-allocated Dye-Vat #2 duration window; BESS holds discharge reserve.',
          durationMs: 88,
        }
      );

      if (isGrid) {
        responseText = `SIMULATION RESULTS [SOLAR -30% @ 13:00-16:00 BST]:
• Net Irradiance: Delta -264 W/m² (GHI reduced from 880 to 616 W/m²).
• Substation Inflow: Feeder 33kV import increased by +180 kW.
• Contingency Mitigation: BESS Unit-1 charging rate throttled from 500 kW to 220 kW to avoid line congestion.
• Residual Reserve: Industrial Dye-Vat load permitted without tripping feeder headroom. Status: CONSTRAINTS VALIDATED.`;
      } else {
        responseText = `Here is what happens if solar output drops 30% this afternoon:
1. Solar Loss: You would lose about 264 kWh of rooftop solar generation between 1:00 PM and 4:00 PM.
2. Recommended Action: We automatically slow down your battery charging rate to 220 kW and keep Dye-Vat #2 running on scheduled solar.
3. Cost Impact: Your savings drop by only $64 (instead of a $320 penalty), because the battery protects your peak demand rate.`;
      }
    } else if (lower.includes('dispatch') || lower.includes('explain') || lower.includes('vat')) {
      toolCalls.push(
        {
          toolName: 'explain_decision' as const,
          args: { assetId: 'ind-vat-2', window: '11:30 - 15:00' },
          outputSummary: 'GHI peak 925 W/m² aligns with lowest tariff tier. Demand charge = $0.',
          durationMs: 64,
        }
      );

      if (isGrid) {
        responseText = `DISPATCH EXPLANATION [DYE-VAT #2]:
• Allocation Window: 11:30 - 15:00 BST.
• Load Signature: 450 kW continuous for 3.5 hrs.
• Feeder Objective: Shifted away from 18:30-21:00 peak stress window (Grid Stress Index: 88).
• Coincident Peak Shave: 220 kW avoided on Chittagong 33kV feeder. Cost delta: -$1,240.`;
      } else {
        responseText = `Why Dye-Vat #2 is scheduled for 11:30 AM – 3:00 PM:
• Free Solar Power: That 3.5-hour window matches your brightest sunshine of the day (over 900 W/m²).
• Big Savings: Running now saves your facility $1,240 compared to starting this morning, and keeps your factory completely off the expensive evening grid tariff.
• Deadline Met: The batch finishes safely two hours before your 5:00 PM shipping deadline.`;
      }
    } else {
      toolCalls.push(
        {
          toolName: 'get_forecast' as const,
          args: { region: 'Bangladesh', horizon: '24h' },
          outputSummary: 'GHI curve peaked at 925 W/m². Grid stress low until 18:30 BST.',
          durationMs: 51,
        },
        {
          toolName: 'get_dispatch_plan' as const,
          args: { date: '2026-10-13', facility: 'Chittagong Industrial Cluster' },
          outputSummary: '4 flexible loads scheduled; 1,500 kWh BESS evening injection armed.',
          durationMs: 73,
        }
      );

      if (isGrid) {
        responseText = `SYSTEM STATUS [BANGLADESH REGIONAL ADAPTER]:
• Active Horizon: 24h LightGBM forecast converged.
• Peak Irradiance: 925 W/m² expected at 12:30 BST.
• Evening Ramp Stress: Predicted feeder strain index 88/100 from 18:30 to 21:00 BST.
• Aggregate Demand Shaved: 380 kW transferred to solar absorption windows. Interlocks: NORMAL.`;
      } else {
        responseText = `Good day! Here is your facility energy summary:
• Weather Outlook: Clear sunny day in Chittagong, reaching peak solar power at 12:30 PM.
• Today's Plan: We have scheduled Dye-Vat #2 and the Steel Induction Pre-Heater to run between 11:30 AM and 3:00 PM to maximize free solar power.
• Expected Savings: You are on track to save $2,840 and avoid 14.2 tons of CO₂ emissions today!`;
      }
    }

    return {
      id: `copilot-${Date.now()}`,
      sender: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rolePerspective,
      toolCalls,
      citations: [
        { title: 'Electricity Maps Bangladesh Grid Carbon Feed', source: 'Live API Feed', metricValue: '584 gCO2/kWh' },
        { title: 'NREL NSRDB Solar Irradiance Benchmark', source: 'NOAA GFS / NSRDB', metricValue: '880 W/m² GHI' },
        { title: 'BPDB Industrial Tariff Schedule (Time-of-Use)', source: 'BPDB 2026 Tariff', metricValue: 'Peak: $0.18/kWh' },
      ],
      suggestedActions: [
        { label: 'Run What-If: 30% Solar Drop', actionType: 'whatif', payload: 'solar-drop-30' },
        { label: 'View Today’s Full Dispatch Schedule', actionType: 'navigate', payload: '/dispatch' },
        { label: 'Inspect GHI Forecast Benchmarks', actionType: 'navigate', payload: '/forecast' },
      ],
    };
  },

  runWhatIf: async (req: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> => {
    return {
      originalCostUsd: 2840,
      simulatedCostUsd: 2776,
      costDeltaUsd: -64,
      originalCarbonKg: 14200,
      simulatedCarbonKg: 13880,
      carbonDeltaKg: -320,
      mitigationStrategy:
        'Throttled battery charging rate by 280 kW and prioritized Dye-Vat #2 with remaining rooftop PV. Battery preserved 68% SoC for 18:30 evening stress relief.',
      toolCalls: [
        {
          toolName: 'run_whatif',
          args: { solarDelta: `${req.solarDeltaPercent}%`, window: req.targetWindow, region: req.region },
          outputSummary: 'MILP solver re-optimized in 76ms. Zero grid penalty incurred.',
          durationMs: 76,
        },
      ],
    };
  },
};

export const systemApi = {
  getServices: async (): Promise<SystemService[]> => {
    return [
      {
        name: 'LightGBM Solar Irradiance Predictor (Bangladesh v4.2)',
        category: 'forecast_engine',
        status: 'healthy',
        latencyMs: 38,
        uptimePercent: 99.98,
        lastChecked: 'Just now',
        notes: 'MAE 14.2 W/m² vs 24.8 W/m² persistence baseline',
      },
      {
        name: 'Electricity Maps Real-Time Carbon & Grid Stress Connector',
        category: 'grid_api',
        status: 'healthy',
        latencyMs: 84,
        uptimePercent: 99.91,
        lastChecked: '4m ago (14:25 BST)',
        notes: 'Live Bangladesh generation mix & carbon intensity (584 gCO2/kWh)',
      },
      {
        name: 'NOAA GFS GRIB2 Cloud Attenuation Stream',
        category: 'data_adapter',
        status: 'healthy',
        latencyMs: 112,
        uptimePercent: 99.95,
        lastChecked: '12m ago',
        notes: '0.25° spatial grid resolution covering Bay of Bengal & South Asia',
      },
      {
        name: 'Universal Mixed-Integer LP Dispatch Solver (MILP)',
        category: 'optimizer_solver',
        status: 'healthy',
        latencyMs: 65,
        uptimePercent: 100,
        lastChecked: 'Just now',
        notes: 'Convergences in <150ms across industrial & storage asset tracks',
      },
      {
        name: 'Chittagong Microgrid SCADA & Modbus Gateway',
        category: 'data_adapter',
        status: 'healthy',
        latencyMs: 24,
        uptimePercent: 99.99,
        lastChecked: 'Just now',
        notes: 'Real-time telemetry from 450 kW dye-vats and 2 MWh BESS inverter',
      },
    ];
  },

  getAdapterHealthDetails: async (): Promise<AdapterHealthDetail[]> => {
    return [
      {
        id: 'adapter-region-bd',
        name: 'Bangladesh Regional Adapter',
        type: 'region',
        status: 'live',
        primarySource: 'BPDB Industrial TOU Tariffs + Electricity Maps API',
        lastPollTimestamp: '14:25 BST (4m ago)',
        sampleFrequency: '15-minute intervals',
        knownGaps: [
          'Substation-level telemetry in rural feeders falls back to national grid factor (620 gCO2/kWh)',
          'Day-ahead tariff is fixed TOU rather than real-time locational marginal pricing (LMP)',
        ],
        fallbackStrategy: 'Deterministic hourly TOU schedule with cached grid stress persistence.',
      },
      {
        id: 'adapter-region-eu',
        name: 'EU Regional Adapter (ENTSO-E)',
        type: 'region',
        status: 'architecture_ready',
        primarySource: 'ENTSO-E Transparency Platform Day-Ahead Market API',
        lastPollTimestamp: 'Architecture schema validated',
        sampleFrequency: '15-minute / Hourly settlement',
        knownGaps: ['API keys unconfigured in production environment (sandbox stub active)'],
        fallbackStrategy: 'Synthetic NordPool / EPEX Spot price curves.',
      },
      {
        id: 'adapter-region-us',
        name: 'US Regional Adapter (CAISO / ERCOT)',
        type: 'region',
        status: 'architecture_ready',
        primarySource: 'CAISO Oasis Real-Time & Day-Ahead LMP Feed',
        lastPollTimestamp: 'Architecture schema validated',
        sampleFrequency: '5-minute real-time dispatch',
        knownGaps: ['Geographic node mapping required for specific substation interconnections'],
        fallbackStrategy: 'NP15 / SP15 hub benchmark curves.',
      },
      {
        id: 'adapter-asset-ind',
        name: 'Industrial Flexible Batch Asset Adapter',
        type: 'asset',
        status: 'live',
        primarySource: 'Modbus TCP / OPC-UA Telemetry Ingestion',
        lastPollTimestamp: 'Live 1-sec stream',
        sampleFrequency: '1-second SCADA',
        knownGaps: ['Manual operator override required for unplanned machine maintenance downtime'],
        fallbackStrategy: 'Graceful hold on prior valid operational schedule.',
      },
      {
        id: 'adapter-asset-bess',
        name: 'Battery Energy Storage System (BESS) Adapter',
        type: 'asset',
        status: 'live',
        primarySource: 'CANbus / SunSpec Inverter Protocol',
        lastPollTimestamp: 'Live 1-sec stream',
        sampleFrequency: '1-second SCADA',
        knownGaps: ['Cell degradation model approximates warranty cycles at 1.15 EFC/day'],
        fallbackStrategy: 'Hard-coded interlock capping C-rate at 0.5C.',
      },
      {
        id: 'adapter-asset-ev',
        name: 'Commercial EV Fleet Depot Adapter',
        type: 'asset',
        status: 'architecture_ready',
        primarySource: 'OCPP 2.0.1 Charging Station Management System (CSMS)',
        lastPollTimestamp: 'Architecture schema ready',
        sampleFrequency: '1-minute session metering',
        knownGaps: ['Field chargers currently in depot deployment phase'],
        fallbackStrategy: 'Simulated 24-vehicle charging schedule.',
      },
    ];
  },

  getDataProvenance: async (): Promise<DataProvenanceRecord[]> => {
    return [
      {
        id: 'prov-01',
        sourceName: 'NREL NSRDB (National Solar Radiation Database)',
        dataType: 'Satellite GHI, DNI, DHI, Solar Zenith Angle',
        spatialResolution: '4km x 4km Grid',
        temporalResolution: '30-minute intervals (10-year historical training set)',
        ingestionTimestamp: '2026-10-12 04:00:00Z',
        pipelineStage: 'Inference Ready',
        dataQualityScore: 99.8,
        hash: 'sha256:8f2a1b9c4d3e5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
        recordCount: 175200,
        syntheticNotice: 'Calibrated with ground pyranometer data for Chittagong coastal zone',
      },
      {
        id: 'prov-02',
        sourceName: 'NOAA GFS (Global Forecast System)',
        dataType: 'Atmospheric Cloud Cover, Temperature, Relative Humidity, Wind Vector',
        spatialResolution: '0.25° (~28km)',
        temporalResolution: '1-hour forecast intervals (6h - 24h horizons)',
        ingestionTimestamp: '2026-10-13 06:00:00Z',
        pipelineStage: 'Inference Ready',
        dataQualityScore: 98.4,
        hash: 'sha256:4b22c8e19a7d3f5b8c9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
        recordCount: 2880,
      },
      {
        id: 'prov-03',
        sourceName: 'Electricity Maps Bangladesh Regional API',
        dataType: 'Grid Carbon Intensity (gCO2/kWh) & Generation Breakdown (Gas, Coal, Solar)',
        spatialResolution: 'Country / Zone (BD)',
        temporalResolution: '15-minute live stream',
        ingestionTimestamp: '2026-10-13 14:25:00 BST',
        pipelineStage: 'Inference Ready',
        dataQualityScore: 97.9,
        hash: 'sha256:91da34e88f2a1b9c4d3e5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
        recordCount: 96,
      },
      {
        id: 'prov-04',
        sourceName: 'BPDB Industrial Tariff Schedule (Gazipur & Chittagong Zones)',
        dataType: 'Time-of-Use Electric Tariffs (Peak: 17:00-23:00, Off-Peak: 23:00-17:00)',
        spatialResolution: 'National Industrial Rates',
        temporalResolution: 'Fixed schedule with seasonal adjustments',
        ingestionTimestamp: '2026-10-01 00:00:00Z',
        pipelineStage: 'Feature Store',
        dataQualityScore: 100.0,
        hash: 'sha256:32cda4101a8f2a1b9c4d3e5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        recordCount: 48,
      },
      {
        id: 'prov-05',
        sourceName: 'Chittagong EPZ Synthetic Microgrid SCADA Feed',
        dataType: 'Dye-Vat Power (kW), BESS State-of-Charge (%), Bus Voltage, Frequency',
        spatialResolution: 'Facility Inverter & Main Feeder Substation',
        temporalResolution: '1-second telemetry',
        ingestionTimestamp: '2026-10-13 14:29:00 BST',
        pipelineStage: 'Raw Ingestion',
        dataQualityScore: 99.2,
        hash: 'sha256:7f8a91b34c2a1b9c4d3e5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
        recordCount: 86400,
        syntheticNotice: 'Synthetic SCADA stream modeled from verified Bangladesh textile factory load profiles',
      },
    ];
  },
};
