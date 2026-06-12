export type KeyboardAction = 'Enter' | 'Backspace';

export type KeyboardRowKey =
  | { kind: 'letter'; letter: string }
  | { kind: 'action'; action: KeyboardAction; label: string; display?: string; wide?: boolean };

export const POLISH_KEYBOARD_ROWS: KeyboardRowKey[][] = [
  'Q W E R T Y U I O P'.split(' ').map((letter) => ({ kind: 'letter' as const, letter })),
  'A S D F G H J K L'.split(' ').map((letter) => ({ kind: 'letter' as const, letter })),
  [
    { kind: 'action', action: 'Enter', label: 'Zatwierdź', display: '↵', wide: true },
    ...'Z X C V B N M'.split(' ').map((letter) => ({ kind: 'letter' as const, letter })),
    { kind: 'action', action: 'Backspace', label: 'Usuń', wide: true },
  ],
  'Ą Ć Ę Ł Ń Ó Ś Ź Ż'.split(' ').map((letter) => ({ kind: 'letter' as const, letter })),
];

export const POLISH_KEYBOARD_LETTERS = POLISH_KEYBOARD_ROWS.flatMap((row) =>
  row.flatMap((key) => (key.kind === 'letter' ? [key.letter] : [])),
);
