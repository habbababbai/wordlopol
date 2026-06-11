import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useLogoutMutation } from '@/hooks/mutations/use-logout-mutation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { Badge } from '../ui/badge';

const focusVisibleRing =
  'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

function NavItem({
  to,
  children,
  onClick,
}: {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          focusVisibleRing,
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

function NavButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
        focusVisibleRing,
      )}
    >
      {children}
    </button>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const MOBILE_NAV_ID = 'mobile-nav';

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function AuthNavItems({
  onNavigate,
  onLogout,
  logoutPending,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  logoutPending: boolean;
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <NavButton onClick={onLogout} disabled={logoutPending}>
        {t('nav.logout')}
      </NavButton>
    );
  }

  return (
    <NavItem to="/login" onClick={onNavigate}>
      {t('nav.login')}
    </NavItem>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoutMutation = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    void (async () => {
      try {
        await logoutMutation.mutateAsync();
        closeMobile();
        void navigate('/');
      } catch {
        toast({ message: t('nav.logoutError'), variant: 'error' });
      }
    })();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2" onClick={closeMobile}>
            <span
              className="text-xl leading-none font-bold tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
            >
              {t('common.appName')}
            </span>
            <Badge className="px-1.5 py-0.5 text-[10px]">{t('home.localeBadge')}</Badge>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label={t('nav.main')}>
            <NavItem to="/daily">{t('nav.daily')}</NavItem>
            <NavItem to="/infinite">{t('nav.infinite')}</NavItem>
            <NavItem to="/profile">{t('nav.profile')}</NavItem>
            <AuthNavItems onLogout={handleLogout} logoutPending={logoutMutation.isPending} />
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <button
              type="button"
              className={cn(
                'flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden [&_svg]:size-4',
                focusVisibleRing,
              )}
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-controls={MOBILE_NAV_ID}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id={MOBILE_NAV_ID}
            className="flex flex-col gap-1 border-t border-border bg-card px-4 py-3 md:hidden"
            aria-label={t('nav.main')}
          >
            <NavItem to="/daily" onClick={closeMobile}>
              {t('nav.daily')}
            </NavItem>
            <NavItem to="/infinite" onClick={closeMobile}>
              {t('nav.infinite')}
            </NavItem>
            <NavItem to="/profile" onClick={closeMobile}>
              {t('nav.profile')}
            </NavItem>
            <AuthNavItems
              onNavigate={closeMobile}
              onLogout={handleLogout}
              logoutPending={logoutMutation.isPending}
            />
          </nav>
        )}
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
