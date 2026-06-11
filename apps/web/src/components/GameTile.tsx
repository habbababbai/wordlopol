import type { CSSProperties } from 'react';

import { cn } from '../lib/utils';

export type TileState = 'empty' | 'filled' | 'active' | 'correct' | 'present' | 'absent';

type GameTileProps = {
  letter?: string;
  state: TileState;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  waveBounce?: boolean;
  waveDelay?: number;
  className?: string;
};

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-11 w-11 text-lg sm:h-14 sm:w-14 sm:text-xl',
  lg: 'h-16 w-16 text-2xl',
} as const;

const stateClasses: Record<TileState, string> = {
  empty: 'border-2 border-[var(--tile-empty-border)] bg-[var(--tile-surface)] text-foreground',
  filled: 'border-2 border-[var(--tile-filled-border)] bg-[var(--tile-surface)] text-foreground',
  active: 'border-2 border-[var(--tile-active-border)] bg-[var(--tile-surface)] text-foreground',
  correct: 'border-2 border-transparent bg-[var(--tile-correct)] text-[var(--tile-correct-fg)]',
  present: 'border-2 border-transparent bg-[var(--tile-present)] text-[var(--tile-present-fg)]',
  absent: 'border-2 border-transparent bg-[var(--tile-absent)] text-[var(--tile-absent-fg)]',
};

export function GameTile({
  letter = '',
  state,
  delay = 0,
  size = 'md',
  waveBounce = false,
  waveDelay = 0,
  className,
}: GameTileProps) {
  const revealed = state === 'correct' || state === 'present' || state === 'absent';

  const animationStyle: CSSProperties = {
    animationDelay: `${waveBounce ? waveDelay : delay}s`,
    perspective: 250,
    transformStyle: 'preserve-3d',
  };

  const animationClass = waveBounce
    ? 'animate-tile-wave'
    : revealed
      ? 'animate-tile-flip'
      : letter
        ? 'animate-tile-pop'
        : undefined;

  return (
    <div
      className={cn(
        sizeClasses[size],
        stateClasses[state],
        'relative flex select-none items-center justify-center overflow-hidden rounded-[var(--radius-sm)] font-bold uppercase',
        animationClass,
        className,
      )}
      style={animationStyle}
    >
      <span className="relative z-10 tracking-wider">{letter}</span>
    </div>
  );
}
