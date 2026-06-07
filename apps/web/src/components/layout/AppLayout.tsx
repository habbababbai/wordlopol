import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ThemeToggle';

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <NavLink
            to="/"
            className="text-lg font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
          >
            {t('common.appName')}
          </NavLink>

          <nav className="flex items-center gap-1" aria-label={t('nav.main')}>
            <NavItem to="/daily">{t('nav.daily')}</NavItem>
            <NavItem to="/infinite">{t('nav.infinite')}</NavItem>
            <NavItem to="/profile">{t('nav.profile')}</NavItem>
            <NavItem to="/login">{t('nav.login')}</NavItem>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <NavLink to="/settings" className="hover:text-foreground">
          {t('nav.accountSettings')}
        </NavLink>
      </footer>
    </div>
  );
}
