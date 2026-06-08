import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Home } from '@/pages/Home';
import { renderWithProviders } from '@/test/render';

describe('Home', () => {
  it('renders hero, feature cards, and how-to-play section', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: 'Wordlopol' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tryb dzienny' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Tryb nieskończony' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Statystyki' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Jak grać?' })).toBeInTheDocument();
  });
});
