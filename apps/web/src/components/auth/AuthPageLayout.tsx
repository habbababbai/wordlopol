import type { ReactNode } from 'react';

type AuthPageLayoutProps = {
  children: ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">{children}</div>;
}
