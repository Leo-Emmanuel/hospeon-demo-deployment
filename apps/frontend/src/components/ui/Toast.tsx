import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2Icon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { setToastFn, ToastApi, ToastOptions, ToastType } from '@/lib/toast-singleton';

interface ToastRecord {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

const ToastContext = createContext<{ toast: ToastApi } | null>(null);

const toastStyles: Record<
  ToastType,
  {
    icon: ReactNode;
    container: string;
    iconWrap: string;
  }
> = {
  success: {
    icon: <CheckCircle2Icon className="w-4 h-4" />,
    container: 'border-success/25 bg-success-soft text-ink-primary dark:border-success/30 dark:bg-success-soft-dark dark:text-ink-primary-dark',
    iconWrap: 'bg-success/15 text-success dark:bg-success/20',
  },
  error: {
    icon: <AlertCircleIcon className="w-4 h-4" />,
    container: 'border-danger/25 bg-danger-soft text-ink-primary dark:border-danger/30 dark:bg-danger-soft-dark dark:text-ink-primary-dark',
    iconWrap: 'bg-danger/15 text-danger dark:bg-danger/20',
  },
  warning: {
    icon: <AlertTriangleIcon className="w-4 h-4" />,
    container: 'border-warning/25 bg-warning-soft text-ink-primary dark:border-warning/30 dark:bg-warning-soft-dark dark:text-ink-primary-dark',
    iconWrap: 'bg-warning/15 text-warning dark:bg-warning/20',
  },
  info: {
    icon: <InfoIcon className="w-4 h-4" />,
    container: 'border-accent/20 bg-accent-soft text-ink-primary dark:border-accent/25 dark:bg-accent-soft-dark dark:text-ink-primary-dark',
    iconWrap: 'bg-accent/15 text-accent dark:bg-accent/20',
  },
};

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type: ToastType, options: ToastOptions) => {
    idRef.current += 1;
    const toast: ToastRecord = {
      id: `toast-${idRef.current}`,
      type,
      message: options.message,
      duration: options.duration ?? DEFAULT_DURATION,
    };

    setToasts((current) => [...current, toast]);
  }, []);

  useEffect(() => {
    setToastFn(pushToast);
    return () => setToastFn(null);
  }, [pushToast]);

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message, duration) => pushToast('success', { message, duration }),
      error: (message, duration) => pushToast('error', { message, duration }),
      warning: (message, duration) => pushToast('warning', { message, duration }),
      info: (message, duration) => pushToast('info', { message, duration }),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onClose={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastRecord; onClose: (id: string) => void }) {
  useEffect(() => {
    const handle = window.setTimeout(() => onClose(toast.id), toast.duration);
    return () => window.clearTimeout(handle);
  }, [onClose, toast.duration, toast.id]);

  const styles = toastStyles[toast.type];

  return (
    <div
      className={cn(
        'animate-[toast-in_180ms_ease-out] rounded-2xl border px-4 py-3 shadow-pop backdrop-blur-sm',
        styles.container
      )}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', styles.iconWrap)}>
          {styles.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="rounded-lg p-1 text-ink-secondary transition-colors hover:bg-surface/70 hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:bg-surface-dark/80 dark:hover:text-ink-primary-dark"
          aria-label="Dismiss toast">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
