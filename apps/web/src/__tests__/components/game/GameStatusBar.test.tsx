import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { GamePageHeader } from '@/components/game/GamePageHeader';
import { GameStatusBar } from '@/components/game/GameStatusBar';

afterEach(() => {
  cleanup();
});

describe('GamePageHeader', () => {
  it('renders title, subtitle, and badge', () => {
    render(
      <GamePageHeader
        title="Wyzwanie dnia"
        subtitle="Wyzwanie na 9 czerwca 2026"
        badge={{ label: 'Słowo 3 z 300' }}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Wyzwanie dnia' })).toBeInTheDocument();
    expect(screen.getByText('Wyzwanie na 9 czerwca 2026')).toBeInTheDocument();
    expect(screen.getByText('Słowo 3 z 300')).toBeInTheDocument();
  });
});

describe('GameStatusBar', () => {
  it('shows guess progress and hint while playing', () => {
    render(
      <GameStatusBar
        variant="playing"
        currentGuess={2}
        maxGuesses={6}
        wordLength={5}
        hintKey="pages.daily.play.hint"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Próba 2 / 6');
    expect(screen.getByText('Odgadnij słowo na 5 liter (6 prób)')).toBeInTheDocument();
  });

  it('shows completed win summary in a card', () => {
    render(<GameStatusBar variant="completed" won answer="maksa" />);

    expect(screen.getByText('Wygrana! Słowo: maksa')).toBeInTheDocument();
  });

  it('shows already-played message in a card', () => {
    render(
      <GameStatusBar variant="alreadyPlayed" message="Już rozwiązałeś dzisiejsze wyzwanie." />,
    );

    expect(screen.getByText('Już rozwiązałeś dzisiejsze wyzwanie.')).toBeInTheDocument();
  });
});
