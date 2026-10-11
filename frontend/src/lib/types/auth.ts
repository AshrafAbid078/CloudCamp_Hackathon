export type UserRole = 'operator' | 'analyst' | 'executive' | 'engineer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedPlantId?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}

export interface RolePermission {
  role: UserRole;
  displayName: string;
  description: string;
  canOverrideDispatch: boolean;
  canEditSettings: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
}
