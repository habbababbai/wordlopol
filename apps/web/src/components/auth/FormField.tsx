import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';
import { Input } from '../ui/input';

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
} & ComponentProps<'input'>;

export function FormField({ id, label, error, className, ...inputProps }: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(className)}
        {...inputProps}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
