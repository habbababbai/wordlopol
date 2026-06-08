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
  const {
    'aria-invalid': ariaInvalidProp,
    'aria-describedby': ariaDescribedByProp,
    ...restInputProps
  } = inputProps;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        {...restInputProps}
        id={id}
        aria-invalid={error ? true : ariaInvalidProp}
        aria-describedby={[ariaDescribedByProp, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(className)}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
