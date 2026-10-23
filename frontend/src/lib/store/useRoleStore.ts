'use client';

import { create } from 'zustand';
import type { UserRole, RolePermission } from '../types/auth';

export const ROLE_DEFINITIONS: Record<UserRole, RolePermission> = {
  facility_manager: {
    role: 'facility_manager',
    displayName: 'Facility Manager',
    tagline: 'Operational Cost & Carbon Savings',
    badgeEmoji: '⚡',
    description: 'Optimize flexible equipment and rooftop battery schedules to minimize electric demand charges and maximize clean solar usage.',
    perspective: 'action-first',
    canOverrideDispatch: true,
    canEditSettings: true,
    canExportData: true,
    canRunWhatIf: true,
  },
  grid_operator: {
    role: 'grid_operator',
    displayName: 'Grid Operator',
    tagline: 'Feeder Reliability & Stress Mitigation',
    badgeEmoji: '🏭',
    description: 'Monitor aggregate demand, feeder congestion, substation ramping stress, and request dynamic load shifts across enrolled industrial assets.',
    perspective: 'terse-numeric',
    canOverrideDispatch: true,
    canEditSettings: true,
    canExportData: true,
    canRunWhatIf: true,
  },
  admin: {
    role: 'admin',
    displayName: 'System Administrator',
    tagline: 'Platform Infrastructure & User Access',
    badgeEmoji: '🛡️',
    description: 'System administrator with full access to user management, database telemetry, optimization parameters, and regional feeder nodes.',
    perspective: 'action-first',
    canOverrideDispatch: true,
    canEditSettings: true,
    canExportData: true,
    canRunWhatIf: true,
  },
};

export interface AdapterStatus {
  region: {
    live: string;
    architectureReady: string[];
  };
  asset: {
    live: string[];
    architectureReady: string[];
  };
}

interface RoleStoreState {
  // Role state
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  getPermissions: () => RolePermission;

  // Sidebar navigation state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Global forecast horizon filter: 6h / 12h / 24h
  forecastHorizon: '6h' | '12h' | '24h';
  setForecastHorizon: (h: '6h' | '12h' | '24h') => void;

  // Adapter status indicators
  adapters: AdapterStatus;

  // Active AI Model
  activeModel: 'LightGBM' | 'PersistenceBaseline';
  setActiveModel: (model: 'LightGBM' | 'PersistenceBaseline') => void;

  // Data confidence indicator from Electricity Maps & NREL
  dataConfidence: {
    isEstimated: boolean;
    estimationMethod: string;
    lastPollTimestamp: string;
    latencyMs: number;
    cachedFallbackActive: boolean;
  };
  setCachedFallback: (active: boolean) => void;
}

export const useRoleStore = create<RoleStoreState>((set, get) => ({
  role: 'facility_manager',
  setRole: (role) => set({ role }),
  toggleRole: () =>
    set((state) => ({
      role: state.role === 'facility_manager' ? 'grid_operator' : 'facility_manager',
    })),
  getPermissions: () => ROLE_DEFINITIONS[get().role],

  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  forecastHorizon: '24h',
  setForecastHorizon: (h) => set({ forecastHorizon: h }),

  adapters: {
    region: {
      live: 'Bangladesh (BPDB / Electricity Maps)',
      architectureReady: ['EU (ENTSO-E)', 'US (CAISO/ERCOT)'],
    },
    asset: {
      live: ['Industrial Process', 'Battery (BESS)'],
      architectureReady: ['Commercial EV Fleet'],
    },
  },

  activeModel: 'LightGBM',
  setActiveModel: (model) => set({ activeModel: model }),

  dataConfidence: {
    isEstimated: false,
    estimationMethod: 'NOAA GFS + NREL NSRDB Physical Coupling',
    lastPollTimestamp: '14:25 BST (4m ago)',
    latencyMs: 84,
    cachedFallbackActive: false,
  },
  setCachedFallback: (active) =>
    set((state) => ({
      dataConfidence: {
        ...state.dataConfidence,
        cachedFallbackActive: active,
      },
    })),
}));
