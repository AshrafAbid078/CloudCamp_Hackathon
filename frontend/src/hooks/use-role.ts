'use client';

import { useRoleStore, ROLE_DEFINITIONS } from '@/lib/store/useRoleStore';
import type { UserRole } from '@/lib/types/auth';

export function useRole() {
  const role = useRoleStore((state) => state.role);
  const setRole = useRoleStore((state) => state.setRole);
  const toggleRole = useRoleStore((state) => state.toggleRole);

  const permissions = ROLE_DEFINITIONS[role];

  return {
    role,
    permissions,
    setRole: (r: UserRole) => setRole(r),
    toggleRole,
    allRoles: Object.values(ROLE_DEFINITIONS),
    canOverrideDispatch: permissions.canOverrideDispatch,
    canEditSettings: permissions.canEditSettings,
    canRunWhatIf: permissions.canRunWhatIf,
    isFacilityManager: role === 'facility_manager',
    isGridOperator: role === 'grid_operator',
    isAdmin: role === 'admin',
  };
}
