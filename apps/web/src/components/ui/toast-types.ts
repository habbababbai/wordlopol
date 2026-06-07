export type ToastVariant = 'success' | 'warning' | 'error' | 'info' | 'dark';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};
