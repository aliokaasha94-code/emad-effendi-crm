import { useState } from "react";
import type { FormEvent } from "react";
import { Coffee, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  error?: string | null;
  onClearError?: () => void;
  loading?: boolean;
}

export function LoginPage({
  onSignIn,
  error,
  onClearError,
  loading = false,
}: LoginPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError(t("أدخل بريداً إلكترونياً صحيحاً.", "Please enter a valid email."));
      return;
    }
    if (!password) {
      setValidationError(t("أدخل كلمة المرور.", "Please enter your password."));
      return;
    }
    setValidationError(null);
    onClearError?.();
    await onSignIn(trimmedEmail, password);
  };

  const errorMessage = validationError ?? error;

  return (
    <div className="flex min-h-screen bg-black-900">
      <div className="hidden w-1/2 flex-col justify-between bg-black-900 p-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-black-50 shadow-gold">
            <Coffee className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold text-black-50">BaristaCRM</span>
        </div>

        <div>
          <p className="text-sm font-bold text-gold-400">إدارة عملاء الكافيه</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-black-50">
            كل عميل عندك، في مكان واحد.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-black-50/70">
            تابع المبيعات، وولاء العملاء، والحملات، واستيراد بيانات Foodics من لوحة تحكم عربية بسيطة.
          </p>
        </div>

        <p className="text-xs text-black-50/40">BaristaCRM — إدارة عملاء الكافيه</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black-200 text-gold-400 shadow-gold">
              <Coffee className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-extrabold text-black-50">BaristaCRM</span>
          </div>

          <div className="surface-glass p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-black-50">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-black-50/60">
              أدخل بيانات حسابك للوصول إلى لوحة التحكم.
            </p>

            <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <Field label="البريد الإلكتروني" htmlFor="email" required>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    invalid={Boolean(errorMessage)}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setValidationError(null);
                      onClearError?.();
                    }}
                    className="pl-10"
                  />
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-50/35" aria-hidden="true" />
                </div>
              </Field>

              <Field label="كلمة المرور" htmlFor="password" required error={errorMessage}>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    invalid={Boolean(errorMessage)}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setValidationError(null);
                      onClearError?.();
                    }}
                    className="pl-10"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-50/35" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={cn(
                      "absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-black-50/50 transition hover:bg-white/5 focus-ring",
                    )}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Field>

              <Button type="submit" fullWidth loading={loading}>
                دخول
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-black-50/50">
            تحتاج إلى حساب؟ تواصل مع مسؤول النظام.
          </p>
        </div>
      </div>
    </div>
  );
}
