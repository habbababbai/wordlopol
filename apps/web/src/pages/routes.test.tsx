import { screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { DailyPage } from './DailyPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { InfinitePage } from './InfinitePage';
import { LoginPage } from './LoginPage';
import { ProfilePage } from './ProfilePage';
import { RegisterPage } from './RegisterPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { SettingsPage } from './SettingsPage';
import { VerifyEmailPage } from './VerifyEmailPage';

const stubPages: { title: string; Page: ComponentType }[] = [
  { title: 'Wyzwanie dnia', Page: DailyPage },
  { title: 'Tryb nieskończony', Page: InfinitePage },
  { title: 'Profil', Page: ProfilePage },
  { title: 'Logowanie', Page: LoginPage },
  { title: 'Rejestracja', Page: RegisterPage },
  { title: 'Weryfikacja e-mail', Page: VerifyEmailPage },
  { title: 'Przypomnij hasło', Page: ForgotPasswordPage },
  { title: 'Nowe hasło', Page: ResetPasswordPage },
  { title: 'Ustawienia konta', Page: SettingsPage },
];

describe.each(stubPages)('$title page', ({ title, Page }) => {
  it('renders title without crashing', () => {
    renderWithProviders(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });
});
