export function loginPathWithReturnTo(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function resolveReturnTo(returnTo: string | null): string {
  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.includes('\\') ||
    returnTo.includes('://')
  ) {
    return '/';
  }

  return returnTo;
}
