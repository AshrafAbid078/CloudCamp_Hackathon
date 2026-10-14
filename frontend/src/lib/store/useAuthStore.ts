import { create } from 'zustand';
import type { User, UserRole, SignupRequest } from '../types';
import { authApi } from '../api/client';
import { useRoleStore } from './useRoleStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  backendOnline: boolean | null;

  login: (username: string, password: string) => Promise<boolean>;
  signup: (data: SignupRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkBackendStatus: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  backendOnline: null,

  clearError: () => set({ error: null }),

  checkBackendStatus: async () => {
    try {
      const health = await authApi.checkHealth();
      set({ backendOnline: health.isOnline });
      return health.isOnline;
    } catch {
      set({ backendOnline: false });
      return false;
    }
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('meridian_token');
    const storedUser = localStorage.getItem('meridian_user');

    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        set({ isAuthenticated: true, user: parsed, token });
        if (parsed.role === 'facility_manager' || parsed.role === 'grid_operator') {
          useRoleStore.getState().setRole(parsed.role);
        }
        return;
      } catch {
        // Continue to fetch me
      }
    }

    try {
      const me = await authApi.getMe();
      set({ isAuthenticated: true, user: me, token });
      localStorage.setItem('meridian_user', JSON.stringify(me));
      if (me.role === 'facility_manager' || me.role === 'grid_operator') {
        useRoleStore.getState().setRole(me.role);
      }
    } catch {
      // Keep session if token exists
      set({ isAuthenticated: true, token });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(username, password);
      const user: User = res.user || {
        id: 'user-active',
        name: username.split('@')[0],
        email: username,
        role: res.role,
        facilityLocation: 'Chittagong Industrial Corridor',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('meridian_token', res.access_token);
        localStorage.setItem('meridian_user', JSON.stringify(user));
      }

      set({
        isAuthenticated: true,
        user,
        token: res.access_token,
        isLoading: false,
        error: null,
      });

      // Synchronize role store
      if (res.role === 'facility_manager' || res.role === 'grid_operator') {
        useRoleStore.getState().setRole(res.role);
      }

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials or login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  signup: async (data: SignupRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.signup(data);
      const user: User = res.user || {
        id: `user-${Date.now()}`,
        name: data.fullName,
        email: data.email || data.username,
        role: data.role,
        facilityLocation: 'Bangladesh Regional Node',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('meridian_token', res.access_token);
        localStorage.setItem('meridian_user', JSON.stringify(user));
      }

      set({
        isAuthenticated: true,
        user,
        token: res.access_token,
        isLoading: false,
        error: null,
      });

      if (data.role === 'facility_manager' || data.role === 'grid_operator') {
        useRoleStore.getState().setRole(data.role as UserRole);
      }

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('meridian_token');
      localStorage.removeItem('meridian_user');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
