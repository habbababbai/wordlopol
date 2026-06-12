export type ToastVariant = 'success' | 'warning' | 'error' | 'info' | 'dark';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
};

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};
