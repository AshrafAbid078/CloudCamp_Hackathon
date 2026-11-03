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

const INITIAL_MESSAGES: CopilotMessage[] = [{
  id: 'msg-init-1', sender: 'assistant',
  content: 'Ask about the regional forecast, a synthetic portfolio schedule, or an explicit PV capacity in kW. Sources and modeled assumptions appear with each tool result.',
  timestamp: '',
}];

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'grid_operator',
  setRole: (role) => set({ currentRole: role }),

  selectedPlantId: 'bangladesh-demo',
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
