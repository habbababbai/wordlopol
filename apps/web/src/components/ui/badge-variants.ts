import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-border text-foreground',
        success: 'bg-[var(--tile-correct)] text-[var(--tile-correct-fg)]',
        warning: 'bg-[var(--tile-present)] text-[var(--tile-present-fg)]',
        accent: 'bg-accent text-accent-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
