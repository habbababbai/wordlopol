import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
      aria-label={theme === 'dark' ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
    >
      {theme === 'dark' ? '☀ Jasny' : '☾ Ciemny'}
    </button>
  );
}
