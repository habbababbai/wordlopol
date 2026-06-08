import { create } from 'zustand';

type AuthUiState = {
  sessionChecked: boolean;
  setSessionChecked: (value: boolean) => void;
};

export const useAuthUiStore = create<AuthUiState>((set) => ({
  sessionChecked: false,
  setSessionChecked: (value) => set({ sessionChecked: value }),
}));

export function resetAuthUiStore(): void {
  useAuthUiStore.setState({ sessionChecked: false });
}
