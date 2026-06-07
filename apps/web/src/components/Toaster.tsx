import { Toast } from './ui/toast';
import { useToast } from '../hooks/useToast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      aria-live="polite"
      aria-label="Powiadomienia"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <Toast message={item.message} variant={item.variant} onDismiss={() => dismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}
