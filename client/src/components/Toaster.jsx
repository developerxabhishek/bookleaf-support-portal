import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
const DISMISS_AFTER_MS = 5000;

const STYLES = {
  success: { icon: CircleCheck, className: 'border-emerald-200 text-emerald-800' },
  error: { icon: CircleAlert, className: 'border-red-200 text-red-800' },
  info: { icon: Info, className: 'border-brand-200 text-brand-800' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (message, type = 'info') => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      info: (message) => show(message, 'info'),
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className } = STYLES[toast.type];
          return (
            <div key={toast.id} className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-white p-3 text-sm shadow-lg ${className}`}>
              <Icon className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
