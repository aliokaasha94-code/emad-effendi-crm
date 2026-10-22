import { useState } from "react";
import { Cake, AlertTriangle, Send, Sparkles, MessageCircle, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer } from "@/types/crm";

interface SmartTriggersWidgetProps {
  customers: Customer[];
}

export function SmartTriggersWidget({ customers }: SmartTriggersWidgetProps) {
  const { lang } = useLanguage();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<"birthdays" | "winback">("birthdays");

  // 1. Detect Birthdays upcoming in the next 7 days
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const birthdayCustomers = customers.filter((c) => {
    if (!c.date_of_birth) return false;
    const dob = new Date(c.date_of_birth);
    const birthMonth = dob.getMonth() + 1;
    const birthDay = dob.getDate();

    // Matching within current week
    if (birthMonth === currentMonth) {
      return birthDay >= currentDay && birthDay <= currentDay + 7;
    }
    return false;
  });

  // 2. Detect Slipping Away VIPs (VIP Champion or Loyal Regular who last visited > 15 days ago)
  const slippingVips = customers.filter((c) => {
    if (c.segment !== "VIP_CHAMPION" && c.segment !== "LOYAL_REGULAR" && c.segment !== "SLIPPING_AWAY") {
      return false;
    }
    if (!c.last_seen_at) return false;
    const lastSeen = new Date(c.last_seen_at);
    const diffDays = (today.getTime() - lastSeen.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 14;
  });

  const handleSendBirthdayWhatsApp = (customer: Customer) => {
    const template = `أهلاً يا ${customer.full_name}! 🎂
أسرة عماد أفندي بتهنيك بمناسبة عيد ميلادك 🎉
قهوتك المفضلة ${customer.favorite_drink ? `(${customer.favorite_drink})` : "المقطرة"} علينا النهاردة كهدية محبة في فرعنا!
كود هديتك: BDAY-${customer.phone_number.slice(-4)}
في انتظارك تنورنا اليوم! ☕✨`;

    const url = buildWhatsAppLink(customer.phone_number, template);
    window.open(url, "_blank");
    pushToast({
      variant: "success",
      title: lang === "ar" ? "تم فتح واتساب" : "WhatsApp Opened",
      description: lang === "ar" ? `تم تجهيز تهنئة عيد الميلاد لـ ${customer.full_name}` : "Birthday wish prepared",
    });
  };

  const handleSendWinbackWhatsApp = (customer: Customer) => {
    const template = `وحشتنا يا أستاذ ${customer.full_name}! ☕
مكانك المفضل في عماد أفندي مستنيك.. وبالمناسبة مجهزين لك خصم 20% على فاتورتك القادمة مع ${customer.favorite_drink ? customer.favorite_drink : "قهوتك المفضلة"}!
كود الخصم: COMEBACK20
يشرفنا زيارتك في أي وقت ✨`;

    const url = buildWhatsAppLink(customer.phone_number, template);
    window.open(url, "_blank");
    pushToast({
      variant: "success",
      title: lang === "ar" ? "تم فتح واتساب" : "WhatsApp Opened",
      description: lang === "ar" ? `تم تجهيز رسالة الاستعادة لـ ${customer.full_name}` : "Winback message prepared",
    });
  };

  return (
    <div className="surface rounded-2xl p-5 border border-[#242930] space-y-4">
      {/* Widget Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f242a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {lang === "ar" ? "الأتمتة والتنبيهات الذكية" : "Smart Automated Triggers"}
            </h3>
            <p className="text-xs text-neutral-400">
              {lang === "ar"
                ? "فرص تسويقية فورية لزيادة المبيعات والحفاظ على الزبائن"
                : "Instant retention opportunities to boost revenue"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#101316] border border-[#232830]">
          <button
            type="button"
            onClick={() => setActiveTab("birthdays")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "birthdays"
                ? "bg-gold text-black shadow-sm font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Cake size={13} />
            <span>{lang === "ar" ? "أعياد الميلاد" : "Birthdays"}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {birthdayCustomers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("winback")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "winback"
                ? "bg-gold text-black shadow-sm font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <HeartHandshake size={13} />
            <span>{lang === "ar" ? "استعادة الزبائن" : "Win-Back"}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {slippingVips.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "birthdays" ? (
        <div className="space-y-2">
          {birthdayCustomers.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#111417] border border-[#22272e] text-center text-xs text-neutral-400">
              {lang === "ar"
                ? "لا توجد أعياد ميلاد مسجلة لزبائنك خلال الأسبوع الحالي."
                : "No customer birthdays this current week."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {birthdayCustomers.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#111417] border border-[#242a32] hover:border-gold/40 flex items-center justify-between gap-3 transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{c.full_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-normal">
                        🎂 {c.date_of_birth}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1 font-mono">
                      {formatPhone(c.phone_number)}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSendBirthdayWhatsApp(c)}
                    className="text-xs py-1 px-2.5 h-8 flex items-center gap-1"
                  >
                    <MessageCircle size={13} />
                    <span>{lang === "ar" ? "إرسال هدية" : "Send Gift"}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {slippingVips.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#111417] border border-[#22272e] text-center text-xs text-neutral-400">
              {lang === "ar"
                ? "ممتاز! جميع زبائنك الـ VIP منتظمون في الزيارة ولا يوجد عملاء في خطر."
                : "All VIP customers visited recently."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {slippingVips.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#111417] border border-[#242a32] hover:border-amber-500/40 flex items-center justify-between gap-3 transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{c.full_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                        غائب منذ فترة
                      </span>
                    </div>
                    <div className="text-[11px] text-gold mt-1 font-semibold">
                      {formatCurrency(c.total_spent)} • {c.orders_count} زيارات
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSendWinbackWhatsApp(c)}
                    className="text-xs py-1 px-2.5 h-8 flex items-center gap-1 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                  >
                    <Send size={13} />
                    <span>{lang === "ar" ? "استعادة العميل" : "Win Back"}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
