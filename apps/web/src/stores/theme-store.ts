import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'wordlopol-theme';

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const legacyAwareStorage: StateStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    if (value === 'light' || value === 'dark') {
      return JSON.stringify({ state: { theme: value }, version: 0 });
    }
    return value;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme }),
      storage: createJSONStorage(() => legacyAwareStorage),
    },
  ),
);

export function resetThemeStore(): void {
  useThemeStore.setState({ theme: 'dark' });
  void useThemeStore.persist.clearStorage();
}
