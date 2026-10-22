import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShoppingCart,
  Upload,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  { to: "/customers", label: { ar: "قاعدة العملاء", en: "Customers" }, icon: Users },
  { to: "/cashier", label: { ar: "الكاشير والنقاط", en: "Cashier & Points" }, icon: ShoppingCart },
  { to: "/campaigns", label: { ar: "حملات الواتساب", en: "WhatsApp Campaigns" }, icon: Megaphone },
  { to: "/import", label: { ar: "استيراد البيانات", en: "Data Import" }, icon: Upload },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRtl = lang === "ar";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split("@")[0] ??
    t("كاشير عماد أفندي", "Emad Afandi Staff");
  const userEmail = session?.user?.email ?? "";

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0a0b0d] border-x border-[#d4af37]/20 text-[#F5EFE6] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-[#d4af37]/15 px-5 py-4 bg-[#07080a]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-12 items-center justify-center">
            <img
              src="/assets/logo.png?v=2"
              alt="عماد أفندي"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wide text-[#F5EFE6]">
                {t("عماد أفندي", "EMAD AFANDI")}
              </span>
              <Sparkles className="h-3 w-3 text-[#d4af37]" />
            </div>
            <p className="text-[11px] font-medium text-[#c8a34b] truncate">
              {t("إدارة علاقات العملاء", "Cafe & Roastery CRM")}
            </p>
          </div>
        </div>
        <LanguageToggle />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#d4af37] to-[#f5d36e] text-[#000000] font-black shadow-lg shadow-[#d4af37]/25"
                    : "text-[#F5EFE6]/75 hover:bg-[#15181b] hover:text-[#f5d36e] hover:border-r-2 hover:border-[#d4af37]"
                )
              }
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-[#000000]" : "text-[#d4af37]"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{t(item.label.ar, item.label.en)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="border-t border-[#d4af37]/15 p-4 bg-[#07080a]">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#131618] border border-[#d4af37]/20 p-2.5">
          <Avatar name={userName} size="sm" className="ring-1 ring-[#d4af37]/50" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#F5EFE6]">{userName}</p>
            {userEmail && (
              <p className="truncate text-[10px] text-[#9CA3AF]">{userEmail}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition-all duration-200 hover:bg-rose-600 hover:text-white active:scale-95"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("تسجيل الخروج", "Sign out")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060709] text-[#F5EFE6]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-30 hidden w-72 lg:block",
          isRtl ? "right-0" : "left-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 w-72 shadow-2xl z-50",
                isRtl ? "right-0" : "left-0"
              )}
            >
              <div className="relative h-full">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 left-4 z-50 p-1.5 rounded-lg bg-black/40 text-cream/70 hover:text-cream"
                >
                  <X className="h-5 w-5" />
                </button>
                {sidebarContent}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={cn(isRtl ? "lg:pr-72" : "lg:pl-72")}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#d4af37]/20 bg-[#0a0b0d]/95 backdrop-blur-md px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#131618] text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
              aria-label="القائمة"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png?v=2" alt="لوجو" className="h-8 w-9 object-contain filter drop-shadow" />
              <span className="text-sm font-extrabold text-[#f5d36e]">
                {t("عماد أفندي", "EMAD AFANDI")}
              </span>
            </div>
          </div>
          <LanguageToggle />
        </header>

        {/* Dynamic Animated Page Content */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
