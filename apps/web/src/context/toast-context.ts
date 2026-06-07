import { createContext } from 'react';

import type { ToastItem, ToastOptions } from '../components/ui/toast-types';

export type ToastContextValue = {
  toasts: ToastItem[];
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
