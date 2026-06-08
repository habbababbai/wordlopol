import type {
  DevMessageResponseDto,
  EmailOnlyRequestDto,
  HealthResponseDto,
  LoginRequestDto,
  MessageResponseDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  UserProfileResponseDto,
  VerifyEmailRequestDto,
} from '@wordlopol/shared';

import { ApiError } from './errors';
import { parseApiErrorMessage, parseAuthResponse, parseRefreshResponse } from './parse-response';
import { clearAccessToken, getAccessToken, setAccessToken } from './token';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/resend-verification',
]);

let refreshPromise: Promise<string> | null = null;

export function redirectToLogin(): void {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  const loginPath = returnTo && returnTo !== '%2F' ? `/login?returnTo=${returnTo}` : '/login';
  window.location.assign(loginPath);
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    return parseApiErrorMessage(data);
  } catch {
    return 'Request failed';
  }
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new ApiError(res.status, await parseErrorMessage(res));
      }

      const data: unknown = await res.json();
      const session = parseRefreshResponse(data);
      setAccessToken(session.accessToken);
      return session.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  retried?: boolean;
  skipRefresh?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, retried = false, skipRefresh = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipRefresh && !retried && !NO_REFRESH_PATHS.has(path)) {
    try {
      await refreshAccessToken();
      return request<T>(path, { method, body, retried: true, skipRefresh });
    } catch {
      clearAccessToken();
      redirectToLogin();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function tryRestoreSession(): Promise<UserProfileResponseDto | null> {
  try {
    const data: unknown = await request('/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    });
    const session = parseRefreshResponse(data);
    setAccessToken(session.accessToken);
    return await request<UserProfileResponseDto>('/user/profile');
  } catch {
    clearAccessToken();
    return null;
  }
}

export const api = {
  getHealth: () => request<HealthResponseDto>('/health'),

  login: async (body: LoginRequestDto) => {
    const data: unknown = await request('/auth/login', { method: 'POST', body });
    const session = parseAuthResponse(data);
    setAccessToken(session.accessToken);
    return session;
  },

  logout: async () => {
    try {
      await request<MessageResponseDto>('/auth/logout', { method: 'POST', skipRefresh: true });
    } finally {
      clearAccessToken();
    }
  },

  refresh: async () => {
    const data: unknown = await request('/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    });
    const session = parseRefreshResponse(data);
    setAccessToken(session.accessToken);
    return session;
  },

  getProfile: () => request<UserProfileResponseDto>('/user/profile'),

  register: (body: RegisterRequestDto) =>
    request<DevMessageResponseDto>('/auth/register', {
      method: 'POST',
      body,
    }),

  verifyEmail: (body: VerifyEmailRequestDto) =>
    request<MessageResponseDto>('/auth/verify-email', { method: 'POST', body }),

  resendVerification: (body: EmailOnlyRequestDto) =>
    request<DevMessageResponseDto>('/auth/resend-verification', {
      method: 'POST',
      body,
    }),

  forgotPassword: (body: EmailOnlyRequestDto) =>
    request<DevMessageResponseDto>('/auth/forgot-password', {
      method: 'POST',
      body,
    }),

  resetPassword: (body: ResetPasswordRequestDto) =>
    request<MessageResponseDto>('/auth/reset-password', { method: 'POST', body }),
};
