import { useEffect } from 'react';

import { POLISH_KEYBOARD_LETTERS } from '@/components/game/polish-keyboard-layout';

const LETTERS = new Set(POLISH_KEYBOARD_LETTERS);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function mapKeyboardEventKey(key: string): string | null {
  if (key === 'Enter') return 'Enter';
  if (key === 'Backspace') return 'Backspace';

  if (key.length !== 1) return null;

  const letter = key.toLocaleUpperCase('pl-PL');
  return LETTERS.has(letter) ? letter : null;
}

type UseGameKeyboardOptions = {
  enabled?: boolean;
};

export function useGameKeyboard(
  onInput: (key: string) => void,
  { enabled = true }: UseGameKeyboardOptions = {},
): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const mapped = mapKeyboardEventKey(event.key);
      if (!mapped) return;

      const isAltGraph = event.getModifierState?.('AltGraph') ?? false;
      if (event.metaKey || (event.ctrlKey && !isAltGraph)) {
        return;
      }

      event.preventDefault();
      onInput(mapped);
    };

    addEventListener('keydown', handleKeyDown);
    return () => {
      removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onInput]);
}
