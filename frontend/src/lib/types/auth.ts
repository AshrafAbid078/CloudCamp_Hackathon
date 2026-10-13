export type UserRole = 'facility_manager' | 'grid_operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organization?: string;
  facilityLocation?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
  mustChangePassword?: boolean;
}

export interface RolePermission {
  role: UserRole;
  displayName: string;
  tagline: string;
  badgeEmoji: string;
  description: string;
  perspective: 'action-first' | 'terse-numeric';
  canOverrideDispatch: boolean;
  canEditSettings: boolean;
  canExportData: boolean;
  canRunWhatIf: boolean;
}
