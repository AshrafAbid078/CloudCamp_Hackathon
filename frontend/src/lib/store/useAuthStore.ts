import { create } from 'zustand';
import type { User, SignupRequest } from '../types';
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
    set({ isLoading: true });

    if (!token) {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      return;
    }

    try {
      const me = await authApi.getMe();
      set({ isAuthenticated: true, user: me, token, isLoading: false });
      localStorage.setItem('meridian_user', JSON.stringify(me));
      useRoleStore.getState().setRole(me.role);
    } catch {
      localStorage.removeItem('meridian_token');
      localStorage.removeItem('meridian_user');
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(username, password);
      if (typeof window !== 'undefined') {
        localStorage.setItem('meridian_token', res.access_token);
      }
      const user = await authApi.getMe();
      localStorage.setItem('meridian_user', JSON.stringify(user));

      set({
        isAuthenticated: true,
        user,
        token: res.access_token,
        isLoading: false,
        error: null,
      });

      // Synchronize role store
      useRoleStore.getState().setRole(user.role);

      return true;
    } catch (err: unknown) {
      localStorage.removeItem('meridian_token');
      localStorage.removeItem('meridian_user');
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('meridian_token', res.access_token);
      }
      const user = await authApi.getMe();
      localStorage.setItem('meridian_user', JSON.stringify(user));

      set({
        isAuthenticated: true,
        user,
        token: res.access_token,
        isLoading: false,
        error: null,
      });

      useRoleStore.getState().setRole(user.role);

      return true;
    } catch (err: unknown) {
      localStorage.removeItem('meridian_token');
      localStorage.removeItem('meridian_user');
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
