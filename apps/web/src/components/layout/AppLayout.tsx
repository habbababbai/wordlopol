import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from '../ThemeToggle';
import { cn } from '../../lib/utils';

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
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <NavLink
            to="/"
            className="text-lg font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
          >
            Wordlopol
          </NavLink>

          <nav className="flex items-center gap-1" aria-label="Główne">
            <NavItem to="/daily">Dziennie</NavItem>
            <NavItem to="/infinite">Nieskończony</NavItem>
            <NavItem to="/profile">Profil</NavItem>
            <NavItem to="/login">Zaloguj</NavItem>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <NavLink to="/settings" className="hover:text-foreground">
          Ustawienia konta
        </NavLink>
      </footer>
    </div>
  );
}
