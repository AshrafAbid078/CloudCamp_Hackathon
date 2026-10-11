'use client';

import { useAppStore } from '@/lib/store';
import type { UserRole, RolePermission } from '@/lib/types';

export const ROLE_DEFINITIONS: Record<UserRole, RolePermission> = {
  operator: {
    role: 'operator',
    displayName: 'Grid & Plant Operator',
    description: 'Real-time telemetry monitoring, dispatch execution, and emergency manual override authorization.',
    canOverrideDispatch: true,
    canEditSettings: false,
    canExportData: true,
    canManageUsers: false,
  },
  analyst: {
    role: 'analyst',
    displayName: 'Quantitative Solar Analyst',
    description: 'Irradiance model evaluation, prediction confidence interval analysis, and revenue reconciliation.',
    canOverrideDispatch: false,
    canEditSettings: false,
    canExportData: true,
    canManageUsers: false,
  },
  executive: {
    role: 'executive',
    displayName: 'Portfolio Executive',
    description: 'High-level financial KPIs, revenue arbitrage tracking, emissions reduction, and fleet overview.',
    canOverrideDispatch: false,
    canEditSettings: false,
    canExportData: true,
    canManageUsers: false,
  },
  engineer: {
    role: 'engineer',
    displayName: 'Systems & ML Engineer',
    description: 'Pipeline provenance, latency metrics, model calibration, and sensor mesh configuration.',
    canOverrideDispatch: true,
    canEditSettings: true,
    canExportData: true,
    canManageUsers: true,
  },
};

export function useRole() {
  const currentRole = useAppStore((state) => state.currentRole);
  const setRole = useAppStore((state) => state.setRole);

  const permissions = ROLE_DEFINITIONS[currentRole];

  return {
    role: currentRole,
    permissions,
    setRole,
    allRoles: Object.values(ROLE_DEFINITIONS),
    canOverrideDispatch: permissions.canOverrideDispatch,
    canEditSettings: permissions.canEditSettings,
  };
}
