import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAccessToken, getAccessToken, setAccessToken } from './token';
import { api, redirectToLogin } from './client';

const API_BASE = '/api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const assignMock = vi.fn();

  beforeEach(() => {
    clearAccessToken();
    fetchMock.mockReset();
    assignMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', {
      pathname: '/profile',
      search: '',
      assign: assignMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches Bearer token when set', async () => {
    setAccessToken('test-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok' }));

    await api.getHealth();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/health`);
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('refreshes on 401 and retries the original request', async () => {
    setAccessToken('expired-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }));

    const result = await api.getHealth();

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API_BASE}/auth/refresh`);
    const retryInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    expect(retryInit.headers).toMatchObject({ Authorization: 'Bearer new-token' });
  });

  it('redirects to login when refresh fails', async () => {
    setAccessToken('expired-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: 'Missing refresh token' }, 401));

    await expect(api.getHealth()).rejects.toThrow('Session expired');
    expect(assignMock).toHaveBeenCalledWith('/login?returnTo=%2Fprofile');
  });

  it('does not refresh on login failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Invalid credentials' }, 401));

    await expect(api.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
      'Invalid credentials',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('clears token on logout', async () => {
    setAccessToken('test-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Logged out' }));

    await api.logout();

    expect(getAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/auth/logout`,
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});

describe('redirectToLogin', () => {
  it('omits returnTo on home path', () => {
    const assignMock = vi.fn();
    vi.stubGlobal('location', {
      pathname: '/',
      search: '',
      assign: assignMock,
    });

    redirectToLogin();

    expect(assignMock).toHaveBeenCalledWith('/login');
    vi.unstubAllGlobals();
  });
});
