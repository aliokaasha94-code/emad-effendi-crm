import { useState } from "react";
import { Globe, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-black-50 transition-all hover:bg-gold-400 hover:text-black-50 hover:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-400 active:scale-95",
        hovered && "scale-105"
      )}
      aria-label={lang === "ar" ? "Switch to English" : "Switch to Arabic"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className={cn("whitespace-nowrap", hovered ? "text-black-50" : "text-black-50/70")}>
        {lang === "ar" ? "English" : "العربية"}
      </span>
      {hovered && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 rounded-px border border-white/20 bg-white/90 px-2 py-1 text-[10px] font-bold text-black-900 shadow-card">
          {lang === "ar" ? "English" : "العربية"}
        </span>
      )}
    </button>
  );
}
