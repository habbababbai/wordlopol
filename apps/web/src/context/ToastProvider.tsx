import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import type { ToastItem, ToastOptions } from '../components/ui/toast-types';
import { ToastContext } from './toast-context';

const DEFAULT_DURATION_MS = 4000;

function createToastId(): string {
  return crypto.randomUUID();
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, variant = 'info', duration = DEFAULT_DURATION_MS }: ToastOptions) => {
      const id = createToastId();
      const item: ToastItem = { id, message, variant };

      setToasts((current) => [...current, item].slice(-4));

      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
