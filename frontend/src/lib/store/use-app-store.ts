import { create } from 'zustand';
import type { UserRole, CopilotMessage } from '../types';

interface AppState {
  // User & Role State
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  
  // Selected Facility/Plant
  selectedPlantId: string;
  setSelectedPlantId: (plantId: string) => void;

  // Copilot Drawer / Chat State
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  setCopilotOpen: (open: boolean) => void;
  copilotMessages: CopilotMessage[];
  isCopilotLoading: boolean;
  addCopilotMessage: (message: Omit<CopilotMessage, 'id' | 'timestamp'>) => void;
  clearCopilotMessages: () => void;
  setCopilotLoading: (loading: boolean) => void;

  // Active Alerts Count
  unreadAlertsCount: number;
  decrementAlerts: () => void;
}

const INITIAL_MESSAGES: CopilotMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'assistant',
    content: "Hello! I am your Solar & Grid Intelligence Copilot. I can help analyze today's GHI deviations, evaluate battery arbitrage opportunities, or prepare curtailment mitigation overrides.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedActions: [
      { label: "Analyze 13:00 GHI drop", actionType: "inspect", payload: "13:00" },
      { label: "Check battery state of charge", actionType: "navigate", payload: "/dispatch" },
      { label: "Explain curtailment risk", actionType: "inspect", payload: "curtailment" }
    ]
  }
];

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'grid_operator',
  setRole: (role) => set({ currentRole: role }),

  selectedPlantId: 'mohave-solar-bess-1',
  setSelectedPlantId: (plantId) => set({ selectedPlantId: plantId }),

  isCopilotOpen: false,
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),

  copilotMessages: INITIAL_MESSAGES,
  isCopilotLoading: false,
  addCopilotMessage: (msg) =>
    set((state) => ({
      copilotMessages: [
        ...state.copilotMessages,
        {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    })),
  clearCopilotMessages: () => set({ copilotMessages: INITIAL_MESSAGES }),
  setCopilotLoading: (loading) => set({ isCopilotLoading: loading }),

  unreadAlertsCount: 3,
  decrementAlerts: () =>
    set((state) => ({ unreadAlertsCount: Math.max(0, state.unreadAlertsCount - 1) })),
}));
