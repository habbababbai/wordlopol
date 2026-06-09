import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_REDIRECT_DELAY_MS } from '@/components/settings/settings-constants';
import { ApiError } from '@/api/errors';
import { SettingsPage } from '@/pages/SettingsPage';
import { renderWithProviders } from '@/test/render';

const refetchMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const changeDisplayNameMock = vi.hoisted(() => vi.fn());
const changeEmailMock = vi.hoisted(() => vi.fn());
const changePasswordMock = vi.hoisted(() => vi.fn());
const deleteAccountMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/queries/use-profile-query', () => ({
  useProfileQuery: vi.fn(),
}));

vi.mock('@/hooks/mutations/use-change-display-name-mutation', () => ({
  useChangeDisplayNameMutation: () => ({
    mutateAsync: changeDisplayNameMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/mutations/use-change-email-mutation', () => ({
  useChangeEmailMutation: () => ({
    mutateAsync: changeEmailMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/mutations/use-change-password-mutation', () => ({
  useChangePasswordMutation: () => ({
    mutateAsync: changePasswordMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/mutations/use-delete-account-mutation', () => ({
  useDeleteAccountMutation: () => ({
    mutateAsync: deleteAccountMock,
    isPending: false,
  }),
}));

import { useProfileQuery } from '@/hooks/queries/use-profile-query';

const useProfileQueryMock = vi.mocked(useProfileQuery);

const profileFixture = {
  id: 'user-1',
  email: 'player@example.com',
  displayName: 'Gracz',
  emailVerified: true,
  stats: {
    dailyPlayed: 0,
    dailyWon: 0,
    infinitePlayed: 0,
    infiniteWon: 0,
    bestTimedWords: null,
    bestTimedMs: null,
    bestTimedWord: null,
  },
};

function mockProfileLoaded() {
  useProfileQueryMock.mockReturnValue({
    data: profileFixture,
    isPending: false,
    isError: false,
    refetch: refetchMock,
  } as unknown as ReturnType<typeof useProfileQuery>);
}

describe('SettingsPage', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  beforeEach(() => {
    useProfileQueryMock.mockReset();
    refetchMock.mockReset();
    navigateMock.mockReset();
    changeDisplayNameMock.mockReset();
    changeEmailMock.mockReset();
    changePasswordMock.mockReset();
    deleteAccountMock.mockReset();
  });

  it('shows loading state', () => {
    useProfileQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(screen.getByRole('heading', { level: 1, name: 'Ustawienia konta' })).toBeInTheDocument();
    expect(screen.getByText('Ładowanie ustawień…')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const user = userEvent.setup();
    useProfileQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(screen.getByText('Nie udało się wczytać ustawień')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('renders profile data in forms', () => {
    mockProfileLoaded();

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(screen.getByDisplayValue('Gracz')).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nazwa wyświetlana' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Adres e-mail' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hasło' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Strefa niebezpieczna' })).toBeInTheDocument();
  });

  it('updates display name on success', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();
    changeDisplayNameMock.mockResolvedValueOnce({
      user: { ...profileFixture, displayName: 'Nowy Gracz' },
    });

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    const displayNameInput = screen.getByLabelText('Nazwa wyświetlana');
    await user.clear(displayNameInput);
    await user.type(displayNameInput, 'Nowy Gracz');
    await user.click(screen.getByRole('button', { name: 'Zapisz nazwę' }));

    await waitFor(() => {
      expect(changeDisplayNameMock).toHaveBeenCalledWith({ displayName: 'Nowy Gracz' });
      expect(screen.getByText('Nazwa wyświetlana została zaktualizowana.')).toBeInTheDocument();
    });
  });

  it('shows email change success message', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();
    changeEmailMock.mockResolvedValueOnce({ message: 'Verification email sent' });

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await user.type(screen.getByLabelText('Nowy adres e-mail'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Zmień e-mail' }));

    await waitFor(() => {
      expect(changeEmailMock).toHaveBeenCalledWith({ newEmail: 'new@example.com' });
      expect(
        screen.getByText(
          'Wysłaliśmy link weryfikacyjny na nowy adres e-mail. Konto zostanie zaktualizowane po potwierdzeniu.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows password mismatch validation error', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await user.type(screen.getByLabelText('Obecne hasło'), 'old-password');
    await user.type(screen.getByLabelText('Nowe hasło'), 'new-password-1');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Hasła nie są identyczne');
    });
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('redirects to login after password change', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();
    changePasswordMock.mockResolvedValueOnce({ message: 'Password changed' });

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await user.type(screen.getByLabelText('Obecne hasło'), 'old-password');
    await user.type(screen.getByLabelText('Nowe hasło'), 'new-password-1');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'new-password-1');
    await user.click(screen.getByRole('button', { name: 'Zmień hasło' }));

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
      });
      expect(
        screen.getByText('Hasło zostało zmienione. Za chwilę przekierujemy do logowania.'),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith('/login');
      },
      { timeout: SETTINGS_REDIRECT_DELAY_MS + 500 },
    );
  });

  it('requires confirmation before delete account submit', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await user.click(screen.getByRole('button', { name: 'Usuń moje konto' }));

    const submitButton = screen.getByRole('button', { name: 'Usuń konto na stałe' });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Potwierdź hasłem'), 'my-password');
    expect(submitButton).toBeEnabled();
  });

  it('shows API error on display name change failure', async () => {
    const user = userEvent.setup();
    mockProfileLoaded();
    changeDisplayNameMock.mockRejectedValueOnce(new ApiError(400, 'Display name unchanged'));

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await user.click(screen.getByRole('button', { name: 'Zapisz nazwę' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Display name unchanged');
    });
  });
});
