import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
      aria-label={theme === 'dark' ? t('theme.enableLight') : t('theme.enableDark')}
    >
      {theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
    </button>
  );
}
