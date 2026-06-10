import { screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { renderWithProviders } from '@/test/render';

const stubPages: { title: string; Page: ComponentType }[] = [
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
