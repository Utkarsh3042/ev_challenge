'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface Ctx {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = React.createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // SSR-safe no-op fallback
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success-500" />,
  error: <AlertCircle className="h-5 w-5 text-danger-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const TONE_BG: Record<ToastTone, string> = {
  success: 'border-success-500/30',
  error: 'border-danger-500/30',
  info: 'border-blue-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setItems((arr) => [...arr, { id, tone, message }]);
      setTimeout(() => remove(id), 3000);
    },
    [remove],
  );

  const ctx = React.useMemo<Ctx>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-card animate-slide-up',
              TONE_BG[t.tone],
            )}
          >
            <span className="mt-0.5">{ICONS[t.tone]}</span>
            <p className="flex-1 text-sm text-secondary-900">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-secondary-400 hover:text-secondary-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
