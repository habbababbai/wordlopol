import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { ToastItem, ToastOptions } from '../components/ui/toast-types';
import { ToastContext } from './toast-context';

const DEFAULT_DURATION_MS = 4000;
export const TOAST_FADE_MS = 200;

function createToastId(): string {
  return crypto.randomUUID();
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    let shouldRemove = false;
    setToasts((current) => {
      const toast = current.find((t) => t.id === id);
      if (!toast || toast.exiting) {
        return current;
      }
      shouldRemove = true;
      return current.map((t) => (t.id === id ? { ...t, exiting: true } : t));
    });

    if (!shouldRemove) return;

    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, TOAST_FADE_MS);
  }, []);

  const toast = useCallback(
    ({ message, variant = 'info', duration = DEFAULT_DURATION_MS }: ToastOptions) => {
      const id = createToastId();
      const item: ToastItem = { id, message, variant };

      setToasts((current) => {
        const next = [...current, item].slice(-4);
        const nextIds = new Set(next.map((t) => t.id));
        for (const toast of current) {
          if (!nextIds.has(toast.id)) {
            const evictedTimer = timersRef.current.get(toast.id);
            if (evictedTimer) {
              clearTimeout(evictedTimer);
              timersRef.current.delete(toast.id);
            }
          }
        }
        return next;
      });

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
