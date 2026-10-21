import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (normalized.includes("email not confirmed")) {
    return "البريد الإلكتروني لم يتم تأكيده بعد.";
  }

  if (normalized.includes("too many requests")) {
    return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.";
  }

  return "تعذر تسجيل الدخول. تأكد من بياناتك ثم حاول مرة أخرى.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!supabase) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mountedRef.current) {
          return;
        }

        if (sessionError) {
          setError("تعذر التحقق من جلسة الدخول. حاول تحديث الصفحة.");
        }

        setSession(data.session ?? null);
      })
      .catch(() => {
        if (!mountedRef.current) {
          return;
        }

        setError("تعذر الاتصال بخدمة المصادقة. تحقق من اتصال الإنترنت.");
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) {
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!supabase) {
        setError(
          "إعدادات Supabase غير مكتملة. أضف بيانات المشروع في ملف .env ثم أعد تشغيل التطبيق.",
        );
        return false;
      }

      setError(null);
      setLoading(true);

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(translateAuthError(signInError.message));
          return false;
        }

        return true;
      } catch {
        setError("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.");
        return false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) {
      return;
    }

    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("تعذر تسجيل الخروج. حاول مرة أخرى.");
      }
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      error,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
      clearError,
    }),
    [session, loading, error, signIn, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
