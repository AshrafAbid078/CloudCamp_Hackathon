/**
 * Resilient API Client with Interceptors, Bearer Token Injection & Auth Service
 */

import type {
  User,
  LoginResponse,
  SignupRequest,
  AdminUserRecord,
  AdminCreateUserRequest,
  CarbonSnapshotRecord,
} from '../types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    const detail = data && typeof data === 'object' && 'detail' in data ? (data as { detail: unknown }).detail : null;
    super(typeof detail === 'string' ? detail : `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Automatically attach Bearer token if present
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('meridian_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      if (response.status === 401 && endpoint !== '/auth/login' && typeof window !== 'undefined') {
        localStorage.removeItem('meridian_token');
        localStorage.removeItem('meridian_user');
        window.dispatchEvent(new Event('meridian-session-expired'));
      }
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      error instanceof Error ? error.message : 'Unknown network failure'
    );
  }
}

/**
 * Determines whether an error is due to network refusal, offline backend, or fetch failure,
 * as opposed to an actual HTTP status error returned by a running backend.
 */
export function isNetworkOrOfflineError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return false;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      err.name === 'TypeError' ||
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('connection') ||
      msg.includes('refused') ||
      msg.includes('failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('load failed') ||
      msg.includes('abort')
    );
  }
  return true;
}

/**
 * Authentication Endpoints interfacing with FastAPI Backend (backend/auth/router.py)
 */
export const authApi = {
  /**
   * POST /auth/login -> Obtain JWT access token
   */
  async login(username: string, password: string): Promise<LoginResponse> {
      return apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
  },

  /**
   * POST /auth/signup -> Register new user and return JWT access token
   */
  async signup(data: SignupRequest): Promise<LoginResponse> {
      return apiClient<LoginResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
  },

  /**
   * GET /auth/me -> Get current user profile
   */
  async getMe(): Promise<User> {
    const account = await apiClient<{ id: number; username: string; role: User['role']; must_change_password: boolean }>('/auth/me');
    return { id: String(account.id), name: account.username, email: account.username, role: account.role, mustChangePassword: account.must_change_password };
  },

  /**
   * PUT /auth/me/password -> Change own password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ detail: string }> {
      return apiClient<{ detail: string }>('/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
  },

  /**
   * GET /health -> Check backend operational status
   */
  async checkHealth(): Promise<{ status: string; version: string; isOnline: boolean }> {
    try {
      const res = await apiClient<{ status: string; version: string }>('/health');
      return { ...res, isOnline: true };
    } catch {
      return { status: 'offline', version: 'unknown', isOnline: false };
    }
  },
};

/**
 * Admin Console Endpoints interfacing with FastAPI Backend (backend/auth/router.py)
 */
export const adminApi = {
  /**
   * GET /auth/users -> List all users (admin only)
   */
  async getUsers(): Promise<AdminUserRecord[]> {
    return apiClient<AdminUserRecord[]>('/auth/users');
  },

  /**
   * POST /auth/register -> Create user account (admin only)
   */
  async registerUser(payload: AdminCreateUserRequest): Promise<AdminUserRecord> {
    return await apiClient<AdminUserRecord>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * DELETE /auth/users/{user_id} -> Soft-delete user account (admin only)
   */
  async deactivateUser(userId: number): Promise<{ detail: string }> {
    return await apiClient<{ detail: string }>(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Provenance & Carbon Telemetry Endpoints interfacing with FastAPI Backend (backend/main.py)
 */
export const dataApi = {
  /**
   * GET /data/carbon-snapshots -> List latest Electricity Maps carbon readings
   */
  async getCarbonSnapshots(limit: number = 50): Promise<CarbonSnapshotRecord[]> {
    try {
      const res = await apiClient<{ count: number; snapshots: Array<{
        id: number;
        polled_at: string | null;
        reading_datetime: string | null;
        region: string;
        carbon_intensity_gco2eq_kwh: number;
        is_estimated: boolean;
        estimation_method: string | null;
        source: string | null;
      }> }>('/data/carbon-snapshots', {
        params: { limit },
      });
      return (res.snapshots || []).map((s) => {
        const polledAt = s.polled_at || new Date().toISOString();
        const readingDatetime = s.reading_datetime || s.polled_at || new Date().toISOString();
        const ci = Math.round(s.carbon_intensity_gco2eq_kwh * 10) / 10;
        const isEst = s.is_estimated ?? true;
        const estMethod = s.estimation_method || 'Electricity Maps live API feed';
        const source = s.source || 'electricity_maps';

        return {
          id: s.id,
          polled_at: polledAt,
          polledAt,
          reading_datetime: readingDatetime,
          readingDatetime,
          region: s.region || 'BD',
          carbon_intensity_gco2eq_kwh: ci,
          carbonIntensityGco2eqKwh: ci,
          is_estimated: isEst,
          isEstimated: isEst,
          estimation_method: estMethod,
          estimationMethod: estMethod,
          source,
        };
      });
    } catch (err) {
      throw err;
    }
  },
};

