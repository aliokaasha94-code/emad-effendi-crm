import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastRecord {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;

const variantStyles: Record<ToastVariant, { card: string; icon: LucideIcon }> = {
  success: {
    card: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    card: "border-red-500/20 bg-red-500/10 text-red-300",
    icon: AlertCircle,
  },
  info: {
    card: "border-gold-500/20 bg-gold-500/10 text-gold-300",
    icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current;
      nextId.current += 1;

      const record: ToastRecord = {
        id,
        title: toast.title,
        description: toast.description,
        variant: toast.variant ?? "info",
      };

      setToasts((current) => [...current, record]);

      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION);

      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    []
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        dir="rtl"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-float animate-slide-up",
                style.card
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs leading-5 opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-lg p-1 opacity-60 transition hover:bg-white/10 hover:opacity-100 focus-ring"
                aria-label="إغلاق التنبيه"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
