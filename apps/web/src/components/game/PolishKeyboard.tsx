import { cn } from '../../lib/utils';
import {
  POLISH_KEYBOARD_ROWS,
  type KeyboardAction,
  type KeyboardRowKey,
} from './polish-keyboard-layout';

export type KeyState = 'unused' | 'absent' | 'present' | 'correct';

type PolishKeyboardProps = {
  onInput: (key: string) => void;
  keyStates?: Partial<Record<string, KeyState>>;
  disabled?: boolean;
  className?: string;
};

const keyStateClasses: Record<KeyState, string> = {
  unused:
    'border border-[var(--tile-empty-border)] bg-[var(--tile-surface)] text-foreground hover:bg-muted',
  absent: 'border-transparent bg-[var(--tile-absent)] text-[var(--tile-absent-fg)]',
  present: 'border-transparent bg-[var(--tile-present)] text-[var(--tile-present-fg)]',
  correct: 'border-transparent bg-[var(--tile-correct)] text-[var(--tile-correct-fg)]',
};

function getInputValue(key: KeyboardRowKey): string {
  return key.kind === 'letter' ? key.letter : key.action;
}

function getAriaLabel(key: KeyboardRowKey): string {
  if (key.kind === 'letter') {
    return `Wpisz literę ${key.letter}`;
  }

  return key.label;
}

type KeyboardKeyButtonProps = {
  keyboardKey: KeyboardRowKey;
  keyState: KeyState;
  disabled?: boolean;
  onInput: (value: string) => void;
  className?: string;
};

function KeyboardKeyButton({
  keyboardKey,
  keyState,
  disabled = false,
  onInput,
  className,
}: KeyboardKeyButtonProps) {
  const value = getInputValue(keyboardKey);
  const isWide = keyboardKey.kind === 'action' && keyboardKey.wide;
  const isAction = keyboardKey.kind === 'action';

  const handleClick = () => {
    onInput(value);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={getAriaLabel(keyboardKey)}
      onClick={handleClick}
      className={cn(
        'flex h-12 min-w-8 flex-1 select-none items-center justify-center rounded-sm px-1 text-xs font-bold uppercase outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-14 sm:min-w-10 sm:text-sm',
        keyStateClasses[keyState],
        isWide && 'flex-[1.5] text-[10px] sm:text-xs',
        isAction && 'normal-case',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {keyboardKey.kind === 'letter' ? keyboardKey.letter : keyboardKey.label}
    </button>
  );
}

export function PolishKeyboard({
  onInput,
  keyStates = {},
  disabled = false,
  className,
}: PolishKeyboardProps) {
  const handleInput = (value: string) => {
    if (disabled) return;
    onInput(value);
  };

  return (
    <div
      role="group"
      aria-label="Klawiatura"
      className={cn('flex w-full max-w-lg flex-col gap-1.5', className)}
    >
      {POLISH_KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((keyboardKey, keyIndex) => {
            const letter = keyboardKey.kind === 'letter' ? keyboardKey.letter : null;
            const keyState = letter ? (keyStates[letter] ?? 'unused') : 'unused';

            return (
              <KeyboardKeyButton
                key={`${rowIndex}-${keyIndex}`}
                keyboardKey={keyboardKey}
                keyState={keyState}
                disabled={disabled}
                onInput={handleInput}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export type { KeyboardAction, KeyboardRowKey };
