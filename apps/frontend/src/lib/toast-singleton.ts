export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  duration?: number;
}

export interface ToastApi {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

type ToastInvoker = (type: ToastType, options: ToastOptions) => void;

let toastFn: ToastInvoker | null = null;

export const setToastFn = (fn: ToastInvoker | null) => {
  toastFn = fn;
};

export const callToast = (type: ToastType, message: string, duration?: number) => {
  toastFn?.(type, { message, duration });
};
