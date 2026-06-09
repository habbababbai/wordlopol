import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PolishKeyboard } from '@/components/game/PolishKeyboard';
import { POLISH_KEYBOARD_LETTERS } from '@/components/game/polish-keyboard-layout';

afterEach(() => {
  cleanup();
});

describe('PolishKeyboard', () => {
  it('renders all layout letters plus Enter and Backspace', () => {
    render(<PolishKeyboard onInput={vi.fn()} />);

    for (const letter of POLISH_KEYBOARD_LETTERS) {
      expect(screen.getByRole('button', { name: `Wpisz literę ${letter}` })).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: 'Zatwierdź' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument();
  });

  it('calls onInput with uppercase letter when a letter key is clicked', async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();

    render(<PolishKeyboard onInput={onInput} />);

    await user.click(screen.getByRole('button', { name: 'Wpisz literę A' }));

    expect(onInput).toHaveBeenCalledWith('A');
  });

  it('calls onInput with Enter and Backspace for action keys', async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();

    render(<PolishKeyboard onInput={onInput} />);

    await user.click(screen.getByRole('button', { name: 'Zatwierdź' }));
    await user.click(screen.getByRole('button', { name: 'Usuń' }));

    expect(onInput).toHaveBeenCalledWith('Enter');
    expect(onInput).toHaveBeenCalledWith('Backspace');
  });

  it('applies key state classes from keyStates', () => {
    render(
      <PolishKeyboard
        onInput={vi.fn()}
        keyStates={{
          A: 'correct',
          S: 'present',
          D: 'absent',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Wpisz literę A' })).toHaveClass(
      'bg-[var(--tile-correct)]',
    );
    expect(screen.getByRole('button', { name: 'Wpisz literę S' })).toHaveClass(
      'bg-[var(--tile-present)]',
    );
    expect(screen.getByRole('button', { name: 'Wpisz literę D' })).toHaveClass(
      'bg-[var(--tile-absent)]',
    );
    expect(screen.getByRole('button', { name: 'Wpisz literę F' })).toHaveClass(
      'bg-[var(--tile-surface)]',
    );
  });

  it('disables all keys when disabled', async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();

    render(<PolishKeyboard onInput={onInput} disabled />);

    const letterKey = screen.getByRole('button', { name: 'Wpisz literę A' });
    expect(letterKey).toBeDisabled();

    await user.click(letterKey);
    expect(onInput).not.toHaveBeenCalled();
  });
});
