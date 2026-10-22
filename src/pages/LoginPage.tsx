import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

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
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("baristacrm.admin@gmail.com");
  const [password, setPassword] = useState("Password123456!");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isRtl = lang === "ar";

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
    <div className="relative flex min-h-screen bg-[#000000] text-[#F5EFE6] overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#d4af37]/10 blur-[130px] pointer-events-none" />

      {/* Top bar with Language Toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <LanguageToggle />
      </div>

      {/* Left Branding Side (Desktop) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between border-r border-[#d4af37]/15 bg-gradient-to-b from-[#0a0b0d] to-[#000000] p-12 relative z-10">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.png?v=2"
            alt="عماد أفندي"
            className="h-14 w-16 object-contain filter drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]"
          />
          <div>
            <h2 className="text-base font-black tracking-wide text-[#F5EFE6]">
              {t("عماد أفندي", "EMAD AFANDI")}
            </h2>
            <p className="text-xs font-semibold text-[#c8a34b]">
              CAFE & ROASTERY
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3.5 py-1 text-xs font-bold text-[#f5d36e]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("نظام إدارة العملاء والولاء الذكي", "Smart CRM & Loyalty Platform")}</span>
          </div>

          <h1 className="text-4xl font-black leading-tight text-[#F5EFE6]">
            {t(
              "كل عميل في عماد أفندي.. له تجربة استثنائية.",
              "Every guest at Emad Afandi deserves an extraordinary experience."
            )}
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">
            {t(
              "لوحة تحكم موحدة لكافيه ومحمصة عماد أفندي: تصنيف RFM التلقائي للعملاء، كاشير سريع، تجميع نقاط الولاء، وحملات واتساب موجهة بضغطة زر واحدة.",
              "Unified intelligence suite: Automatic RFM segmentation, quick cashier point recording, loyalty rewards, and 1-click personalized WhatsApp retention campaigns."
            )}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#9CA3AF]/60 border-t border-white/5 pt-6">
          <span>© 2026 {t("عماد أفندي — جميع الحقوق محفوظة", "Emad Afandi — All rights reserved")}</span>
          <span className="text-[#c8a34b] font-bold">{t("عماد أفندي CRM v2.0", "Emad Afandi CRM v2.0")}</span>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img
              src="/assets/logo.png?v=2"
              alt="عماد أفندي"
              className="h-20 w-24 object-contain mb-3 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            />
            <h2 className="text-xl font-black text-[#F5EFE6]">
              {t("عماد أفندي", "EMAD AFANDI")}
            </h2>
            <p className="text-xs font-bold text-[#c8a34b]">
              CAFE & ROASTERY CRM
            </p>
          </div>

          {/* Form Card */}
          <div className="surface-glass rounded-3xl p-7 sm:p-9 shadow-2xl border border-[#d4af37]/25">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#F5EFE6] tracking-tight">
                {t("تسجيل الدخول", "Sign In")}
              </h2>
              <p className="mt-1.5 text-xs text-[#9CA3AF]">
                {t(
                  "أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.",
                  "Enter your credentials to access the management portal."
                )}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <Field
                label={t("البريد الإلكتروني", "Email Address")}
                htmlFor="email"
                required
              >
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@emadafandi.com"
                    value={email}
                    invalid={Boolean(errorMessage)}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setValidationError(null);
                      onClearError?.();
                    }}
                    className={cn(isRtl ? "pr-10" : "pl-10")}
                  />
                  <Mail
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8a34b]",
                      isRtl ? "right-3" : "left-3"
                    )}
                    aria-hidden="true"
                  />
                </div>
              </Field>

              <Field
                label={t("كلمة المرور", "Password")}
                htmlFor="password"
                required
                error={errorMessage}
              >
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
                    className={cn(isRtl ? "pr-10 pl-10" : "pl-10 pr-10")}
                  />
                  <Lock
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8a34b]",
                      isRtl ? "right-3" : "left-3"
                    )}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={cn(
                      "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:text-[#f5d36e] focus:outline-none",
                      isRtl ? "left-2" : "right-2"
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

              <div className="pt-2">
                <Button type="submit" fullWidth loading={loading} variant="primary">
                  <span>{t("دخول إلى النظام", "Sign In to CRM")}</span>
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-[#9CA3AF]">
              {t("تحتاج إلى مساعدة في الحساب؟", "Need assistance?")}{" "}
              <span className="text-[#f5d36e] font-bold">
                {t("تواصل مع الإدارة", "Contact Admin")}
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
