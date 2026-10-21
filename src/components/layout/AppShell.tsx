import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Coffee,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShoppingCart,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Misc";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

interface NavItem {
  to: string;
  label: { ar: string; en: string };
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: { ar: "لوحة التحكم", en: "Dashboard" }, icon: LayoutDashboard },
  { to: "/customers", label: { ar: "العملاء", en: "Customers" }, icon: Users },
  { to: "/cashier", label: { ar: "الكاشير", en: "Cashier" }, icon: ShoppingCart },
  { to: "/import", label: { ar: "الاستيراد", en: "Import" }, icon: Upload },
  { to: "/campaigns", label: { ar: "الحملات", en: "Campaigns" }, icon: Megaphone },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const userName =
    session?.user?.user_metadata?.full_name ?? session?.user?.email ?? "مستخدم";
  const userEmail = session?.user?.email ?? "";

  const sidebarContent = (
    <div className="flex h-full flex-col bg-brand-950 text-cream">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-brand-950 shadow-gold">
            <Coffee className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">BaristaCRM</p>
            <p className="text-xs text-cream/50">إدارة عملاء الكافيه</p>
          </div>
        </div>
        <LanguageToggle />
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                  isActive
                    ? "bg-gold-400 text-brand-950 shadow-gold font-extrabold"
                    : "text-cream/70 hover:bg-white/5 hover:text-cream",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t(item.label.ar, item.label.en)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-cream">{userName}</p>
            {userEmail && (
              <p className="truncate text-[11px] text-cream/50">{userEmail}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{t("تسجيل الخروج", "Sign out")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-950/10 bg-brand-950 px-4 py-3 text-cream lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-cream transition hover:bg-white/10"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-extrabold text-gold-400">BaristaCRM</span>
          <LanguageToggle />
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
