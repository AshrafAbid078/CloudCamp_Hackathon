export type UserRole = 'facility_manager' | 'grid_operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organization?: string;
  facilityLocation?: string;
  mustChangePassword?: boolean;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
  mustChangePassword?: boolean;
}

export interface SignupRequest {
  fullName: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  role: UserRole;
  must_change_password: boolean;
  user?: User;
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

export interface AdminUserRecord {
  id: number;
  username: string;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminCreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}
