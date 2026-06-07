import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';

type SpinnerProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const spinnerSizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Ładowanie"
      className={cn(
        'spinner-spin rounded-full border-muted border-t-primary',
        spinnerSizes[size],
        className,
      )}
    />
  );
}

type SkeletonProps = ComponentProps<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-sm)] bg-muted', className)}
      {...props}
    />
  );
}

type TileRowSkeletonProps = {
  count?: number;
  delayStep?: number;
};

export function TileRowSkeleton({ count = 5, delayStep = 0.1 }: TileRowSkeletonProps) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-14 w-14"
          style={{ animationDelay: `${index * delayStep}s` }}
        />
      ))}
    </div>
  );
}

export function GameBoardSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <TileRowSkeleton />
      <TileRowSkeleton />
      <Skeleton className="mt-2 h-11 w-full rounded-lg" />
    </div>
  );
}

type ErrorCardProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function ErrorCard({
  title,
  message,
  onRetry,
  retryLabel = 'Spróbuj ponownie',
  icon,
  className,
}: ErrorCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center',
        className,
      )}
    >
      {icon ?? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <span className="text-xl font-bold" aria-hidden>
            ×
          </span>
        </div>
      )}
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {message && <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button type="button" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
