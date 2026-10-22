import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#131618] px-3 py-1.5 text-xs font-bold text-[#F5EFE6] transition-all duration-200 hover:border-[#d4af37] hover:bg-[#d4af37] hover:text-[#000000] active:scale-95 shadow-sm",
        className
      )}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-4 w-4 text-[#d4af37] transition-colors group-hover:text-[#000000]" aria-hidden="true" />
      <span className="font-extrabold tracking-wide">
        {lang === "ar" ? "English" : "العربية"}
      </span>
    </button>
  );
}
