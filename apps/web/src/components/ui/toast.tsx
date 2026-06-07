import { cn } from '../../lib/utils';
import type { ToastVariant } from './toast-types';

const variantStyles: Record<ToastVariant, { container: string; icon: string; glyph: string }> = {
  success: {
    container: 'border-[var(--tile-correct)]/25 bg-[var(--tile-correct)]/10 text-foreground',
    icon: 'text-[var(--tile-correct)]',
    glyph: '✓',
  },
  warning: {
    container: 'border-[var(--tile-present)]/25 bg-[var(--tile-present)]/10 text-foreground',
    icon: 'text-[var(--tile-present)]',
    glyph: '!',
  },
  error: {
    container: 'border-destructive/25 bg-destructive/10 text-foreground',
    icon: 'text-destructive',
    glyph: '×',
  },
  info: {
    container: 'border-primary/20 bg-accent text-foreground',
    icon: 'text-primary',
    glyph: 'i',
  },
  dark: {
    container: 'border-transparent bg-foreground text-background shadow-lg',
    icon: 'text-background',
    glyph: '',
  },
};

type ToastProps = {
  message: string;
  variant: ToastVariant;
  onDismiss?: () => void;
  className?: string;
};

export function Toast({ message, variant, onDismiss, className }: ToastProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium',
        styles.container,
        className,
      )}
    >
      {variant !== 'dark' && (
        <span className={cn('text-base font-bold leading-none', styles.icon)} aria-hidden>
          {styles.glyph}
        </span>
      )}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Zamknij"
        >
          ×
        </button>
      )}
    </div>
  );
}
