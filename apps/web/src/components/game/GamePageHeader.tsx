import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import type { badgeVariants } from '@/components/ui/badge-variants';
import { cn } from '@/lib/utils';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

type GamePageHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  subtitle?: string;
  badge?: { label: string; variant?: BadgeVariant };
  className?: string;
};

export function GamePageHeader({
  title,
  description,
  icon,
  subtitle,
  badge,
  className,
}: GamePageHeaderProps) {
  return (
    <header className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {icon ? (
        <div
          className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary [&_svg]:size-6"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-2">
        <h1
          className="text-2xl font-bold text-foreground sm:text-3xl"
          style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
        {subtitle ? <p className="text-base font-medium text-foreground">{subtitle}</p> : null}
        {badge ? <Badge variant={badge.variant ?? 'accent'}>{badge.label}</Badge> : null}
      </div>
    </header>
  );
}
