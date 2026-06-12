import type { VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import type { badgeVariants } from '@/components/ui/badge-variants';
import { cn } from '@/lib/utils';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

type GamePageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: BadgeVariant };
  className?: string;
};

export function GamePageHeader({ title, subtitle, badge, className }: GamePageHeaderProps) {
  return (
    <header className={cn('flex flex-col items-center gap-2 text-center', className)}>
      <h1
        className="text-2xl font-bold text-foreground sm:text-3xl"
        style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
      >
        {title}
      </h1>
      {subtitle ? <p className="text-base font-medium text-foreground">{subtitle}</p> : null}
      {badge ? <Badge variant={badge.variant ?? 'accent'}>{badge.label}</Badge> : null}
    </header>
  );
}
