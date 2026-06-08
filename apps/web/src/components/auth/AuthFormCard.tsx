import type { FormHTMLAttributes, ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../ui/card';

type AuthFormCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  formProps?: FormHTMLAttributes<HTMLFormElement>;
};

export function AuthFormCard({
  title,
  description,
  children,
  footer,
  formProps,
}: AuthFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold leading-none">{title}</h1>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <form {...formProps}>
        <CardContent className="flex flex-col gap-3 pt-0">{children}</CardContent>
        {footer && <CardFooter className="flex flex-col gap-3 pt-0">{footer}</CardFooter>}
      </form>
    </Card>
  );
}
