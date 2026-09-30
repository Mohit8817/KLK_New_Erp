import { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_ICONS = {
  success: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultTitle = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information',
      }[type];
      setToasts((prev) => [...prev, { id, type, message, title: title || defaultTitle }]);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      success: (msg: string, title?: string) => addToast('success', msg, title),
      error: (msg: string, title?: string) => addToast('error', msg, title),
      warning: (msg: string, title?: string) => addToast('warning', msg, title),
      info: (msg: string, title?: string) => addToast('info', msg, title),
      removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        toasts.length > 0 &&
        createPortal(
          <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
            {toasts.map((t) => {
              const config = {
                success: {
                  bg: 'bg-emerald-600 dark:bg-emerald-700',
                  border: 'border border-emerald-500/80',
                  shadow: 'shadow-lg shadow-emerald-950/25',
                  badgeBg: 'bg-emerald-700/70 dark:bg-emerald-800/80',
                  msgColor: 'text-emerald-50',
                },
                error: {
                  bg: 'bg-rose-600 dark:bg-rose-700',
                  border: 'border border-rose-500/80',
                  shadow: 'shadow-lg shadow-rose-950/25',
                  badgeBg: 'bg-rose-700/70 dark:bg-rose-800/80',
                  msgColor: 'text-rose-50',
                },
                warning: {
                  bg: 'bg-amber-500 dark:bg-amber-600',
                  border: 'border border-amber-400/80',
                  shadow: 'shadow-lg shadow-amber-950/25',
                  badgeBg: 'bg-amber-600/70 dark:bg-amber-700/80',
                  msgColor: 'text-amber-50',
                },
                info: {
                  bg: 'bg-sky-600 dark:bg-sky-700',
                  border: 'border border-sky-500/80',
                  shadow: 'shadow-lg shadow-sky-950/25',
                  badgeBg: 'bg-sky-700/70 dark:bg-sky-800/80',
                  msgColor: 'text-sky-50',
                },
              }[t.type];

              return (
                <div
                  key={t.id}
                  className={`pointer-events-auto relative overflow-hidden rounded-xl ${config.bg} ${config.border} ${config.shadow} transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 p-4 text-white`}
                  role="alert"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.badgeBg} flex items-center justify-center mt-0.5 shadow-inner`}>
                    {TOAST_ICONS[t.type]}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">{t.title}</h5>
                    <p className={`mt-0.5 text-xs ${config.msgColor} leading-relaxed break-words font-medium`}>{t.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="flex-shrink-0 text-white/70 hover:text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                    aria-label="Close notification"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
                    <div className="h-full bg-white/40 animate-pulse w-full" />
                  </div>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
