export type MessageSender = 'user' | 'assistant' | 'system';

export type CopilotToolName = 'get_forecast' | 'get_dispatch_plan' | 'run_whatif' | 'explain_decision';

export interface CopilotToolCall {
  toolName: CopilotToolName;
  args: Record<string, string | number | boolean>;
  outputSummary: string;
  durationMs: number;
}

export interface CopilotCitation {
  title: string;
  source: string;
  timestamp?: string;
  metricValue?: string;
}

export interface CopilotMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  rolePerspective?: 'facility_manager' | 'grid_operator';
  toolCalls?: CopilotToolCall[];
  citations?: CopilotCitation[];
  whatIfDelta?: {
    solarDropPercent: number;
    newCostDeltaUsd: number;
    newCarbonDeltaKg: number;
    reallocatedLoadWindow: string;
  };
  suggestedActions?: {
    label: string;
    actionType: 'navigate' | 'override' | 'inspect' | 'whatif';
    payload?: string;
  }[];
}

export interface WhatIfSimulationRequest {
  solarDeltaPercent: number; // e.g. -30
  targetWindow: string; // e.g. "13:00 - 16:00"
  region: string;
}

export interface WhatIfSimulationResponse {
  originalCostUsd: number;
  simulatedCostUsd: number;
  costDeltaUsd: number;
  originalCarbonKg: number;
  simulatedCarbonKg: number;
  carbonDeltaKg: number;
  mitigationStrategy: string;
  toolCalls: CopilotToolCall[];
}
