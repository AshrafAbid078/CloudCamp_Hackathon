/**
 * Resilient API Client with Interceptors, Bearer Token Injection & Auth Service
 */

import type { User, UserRole, LoginResponse, SignupRequest } from '../types';

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
    super(`API Error: ${status} ${statusText}`);
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
 * Authentication Endpoints interfacing with FastAPI Backend (backend/auth/router.py)
 */
export const authApi = {
  /**
   * POST /auth/login -> Obtain JWT access token
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const data = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return data;
    } catch (err) {
      // If backend is unreachable (e.g. not running on port 8000), support local simulation
      // for seamless development experience while warning the user.
      if (err instanceof Error && err.message.includes('fetch failed')) {
        console.warn('Backend server on port 8000 is not reachable. Using local session fallback.');
        const role: UserRole = username.toLowerCase().includes('operator') ? 'grid_operator' : 'facility_manager';
        return {
          access_token: `simulated-jwt-${Date.now()}`,
          token_type: 'bearer',
          expires_in_minutes: 60,
          role,
          must_change_password: username === 'admin' && password === 'admin123',
          user: {
            id: 'sim-1',
            name: username.split('@')[0],
            email: username,
            role,
          },
        };
      }
      throw err;
    }
  },

  /**
   * POST /auth/signup -> Register new user and return JWT access token
   */
  async signup(data: SignupRequest): Promise<LoginResponse> {
    try {
      const res = await apiClient<LoginResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          role: data.role,
        }),
      });
      return res;
    } catch (err) {
      if (err instanceof Error && err.message.includes('fetch failed')) {
        console.warn('Backend server on port 8000 is not reachable. Using local session fallback.');
        return {
          access_token: `simulated-jwt-${Date.now()}`,
          token_type: 'bearer',
          expires_in_minutes: 60,
          role: data.role,
          must_change_password: false,
          user: {
            id: `sim-${Date.now()}`,
            name: data.fullName,
            email: data.email || data.username,
            role: data.role,
          },
        };
      }
      throw err;
    }
  },

  /**
   * GET /auth/me -> Get current user profile
   */
  async getMe(): Promise<User> {
    return apiClient<User>('/auth/me');
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
