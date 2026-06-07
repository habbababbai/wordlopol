import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('renders nav links for main routes', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    );

    expect(screen.getByRole('link', { name: 'Wordlopol' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dziennie' })).toHaveAttribute('href', '/daily');
    expect(screen.getByRole('link', { name: 'Nieskończony' })).toHaveAttribute('href', '/infinite');
    expect(screen.getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Zaloguj' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Ustawienia konta' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});
