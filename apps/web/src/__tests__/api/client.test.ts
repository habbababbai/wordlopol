import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/token';
import { clearCsrfToken, CSRF_HEADER_NAME, setCsrfToken } from '@/api/csrf';
import { api, redirectToLogin } from '@/api/client';

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
    clearCsrfToken();
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
      .mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token', csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }));

    const result = await api.getHealth();

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API_BASE}/auth/csrf`);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`${API_BASE}/auth/refresh`);
    const retryInit = fetchMock.mock.calls[3]?.[1] as RequestInit;
    expect(retryInit.headers).toMatchObject({ Authorization: 'Bearer new-token' });
  });

  it('deduplicates concurrent refresh calls', async () => {
    setAccessToken('expired-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token', csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }))
      .mockResolvedValueOnce(jsonResponse({ id: '123', email: 'user@example.com' }));

    const [result1, result2] = await Promise.all([api.getHealth(), api.getProfile()]);

    expect(result1).toEqual({ status: 'ok' });
    expect(result2).toEqual({ id: '123', email: 'user@example.com' });
    expect(fetchMock).toHaveBeenCalledTimes(6);

    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === `${API_BASE}/auth/refresh`,
    );
    expect(refreshCalls).toHaveLength(1);
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

  it('changeDisplayName sends PATCH with auth and csrf headers', async () => {
    setAccessToken('test-token');
    setCsrfToken('csrf-token');
    const body = { displayName: 'New Name' };
    const response = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'New Name',
        emailVerified: true,
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(response));

    const result = await api.changeDisplayName(body);

    expect(result).toEqual(response);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/auth/change-display-name`);
    expect(init.method).toBe('PATCH');
    expect(init.credentials).toBe('include');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      [CSRF_HEADER_NAME]: 'csrf-token',
      'Content-Type': 'application/json',
    });
  });

  it('changeEmail sends PATCH with auth and csrf headers', async () => {
    setAccessToken('test-token');
    setCsrfToken('csrf-token');
    const body = { newEmail: 'new@example.com' };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Verification email sent' }));

    const result = await api.changeEmail(body);

    expect(result).toEqual({ message: 'Verification email sent' });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/auth/change-email`);
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      [CSRF_HEADER_NAME]: 'csrf-token',
    });
  });

  it('changePassword sends PATCH with auth and csrf headers', async () => {
    setAccessToken('test-token');
    setCsrfToken('csrf-token');
    const body = { currentPassword: 'old-pass', newPassword: 'new-pass-1' };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Password changed' }));

    const result = await api.changePassword(body);

    expect(result).toEqual({ message: 'Password changed' });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/auth/change-password`);
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      [CSRF_HEADER_NAME]: 'csrf-token',
    });
  });

  it('getDailyToday fetches challenge metadata without auth', async () => {
    const response = { date: '2026-06-09', maxGuesses: 6, wordLength: 5 };
    fetchMock.mockResolvedValueOnce(jsonResponse(response));

    const result = await api.getDailyToday();

    expect(result).toEqual(response);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/daily/today`);
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('submitDailyGuess sends POST with JSON body and csrf header', async () => {
    setCsrfToken('csrf-token');
    const body = { guess: 'mleko', guessNumber: 1 };
    const response = {
      results: ['absent', 'present', 'absent', 'absent', 'correct'],
      won: false,
      finished: false,
      guessNumber: 1,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(response));

    const result = await api.submitDailyGuess(body);

    expect(result).toEqual(response);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/daily/guess`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toMatchObject({
      [CSRF_HEADER_NAME]: 'csrf-token',
      'Content-Type': 'application/json',
    });
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('submitDailyGuess attaches Bearer token when set', async () => {
    setAccessToken('test-token');
    setCsrfToken('csrf-token');
    const body = { guess: 'mleko' };
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        results: ['correct', 'correct', 'correct', 'correct', 'correct'],
        won: true,
        finished: true,
        guessNumber: 1,
        answer: 'mleko',
      }),
    );

    await api.submitDailyGuess(body);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      [CSRF_HEADER_NAME]: 'csrf-token',
    });
    expect(init.body).toBe(JSON.stringify(body));
  });

  it('deleteAccount sends DELETE with auth and csrf headers', async () => {
    setAccessToken('test-token');
    setCsrfToken('csrf-token');
    const body = { password: 'my-password' };
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Account deleted' }));

    const result = await api.deleteAccount(body);

    expect(result).toEqual({ message: 'Account deleted' });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/auth/account`);
    expect(init.method).toBe('DELETE');
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      [CSRF_HEADER_NAME]: 'csrf-token',
    });
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
