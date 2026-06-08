export const CSRF_HEADER_NAME = 'x-csrf-token';

let storedToken: string | null = null;

export function setCsrfToken(token: string): void {
  storedToken = token;
}

export function clearCsrfToken(): void {
  storedToken = null;
}

export function getCsrfToken(): string | null {
  return storedToken;
}

export function applyCsrfFromResponse(data: unknown): void {
  if (
    typeof data === 'object' &&
    data !== null &&
    'csrfToken' in data &&
    typeof data.csrfToken === 'string'
  ) {
    setCsrfToken((data as { csrfToken: string }).csrfToken);
  }
}

export async function ensureCsrfToken(apiBase: string): Promise<string | null> {
  if (storedToken) {
    return storedToken;
  }

  const res = await fetch(`${apiBase}/auth/csrf`, { credentials: 'include' });

  if (!res.ok) {
    return null;
  }

  const data: unknown = await res.json();
  applyCsrfFromResponse(data);
  return storedToken;
}
