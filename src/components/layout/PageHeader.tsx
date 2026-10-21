import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type BilingualText = string | { ar: string; en: string };

function resolveText(text: BilingualText | undefined): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  const { lang } = useLanguage();
  return lang === "ar" ? text.ar : text.en;
}

interface PageHeaderProps {
  title: BilingualText;
  description?: BilingualText;
  eyebrow?: BilingualText;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-wide text-gold-400">
            {resolveText(eyebrow)}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-extrabold text-black-50 sm:text-3xl">
          {resolveText(title)}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black-50/60">
            {resolveText(description)}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
