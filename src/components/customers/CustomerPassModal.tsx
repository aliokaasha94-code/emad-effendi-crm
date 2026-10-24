import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Sparkles, Printer, Copy, Check, ShieldCheck, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getCustomerTier as getRoasteryTier, ROAST_PREFERENCES, GRIND_PREFERENCES } from "@/lib/tiers";
import { getCustomerTier } from "@/lib/rewards";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer } from "@/types/crm";

interface CustomerPassModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerPassModal({
  customer,
  isOpen,
  onClose,
}: CustomerPassModalProps) {
  const { lang } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!customer) return;

    // Generate QR code for customer phone or loyalty URL
    const payload = JSON.stringify({
      id: customer.id,
      phone: customer.phone_number,
      name: customer.full_name,
    });

    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: {
        dark: "#060709",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [customer]);

  if (!customer) return null;

  const tier = getCustomerTier(customer);
  const roasteryTier = getRoasteryTier(customer.loyalty_points);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/cashier?customer=${customer.id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={lang === "ar" ? "بطاقة الولاء الرقمية VIP" : "Digital VIP Loyalty Pass"}
      size="md"
    >
      <div className="space-y-6">
        {/* The Obsidian Gold Membership Card */}
        <div
          id="digital-pass-card"
          className="relative overflow-hidden rounded-3xl p-6 border shadow-2xl transition-all select-none"
          style={{
            background:
              "linear-gradient(135deg, #181c22 0%, #0d0f12 50%, #060709 100%)",
            borderColor: tier.badgeBorder,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.15)",
          }}
        >
          {/* Subtle Background Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px)",
              backgroundSize: "100% 100%, 20px 20px",
            }}
          />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/assets/logo.png?v=2"
                  alt="Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-gold font-bold">
                  {lang === "ar" ? "عماد أفندي" : "Emad Afandi"}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Specialty Coffee & Roastery
                </div>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-sm ${roasteryTier.color.bg} ${roasteryTier.color.border} ${roasteryTier.color.text}`}
            >
              <Sparkles size={12} />
              <span>{roasteryTier.badgeTitle}</span>
              {roasteryTier.discountRate > 0 && (
                <span className="text-[10px] opacity-90">({roasteryTier.discountRate * 100}%)</span>
              )}
            </div>
          </div>

          {/* Customer Details & Points */}
          <div className="relative z-10 my-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold text-white tracking-wide">
                {customer.full_name}
              </div>
              <div className="text-xs text-neutral-400 mt-1 font-mono">
                {formatPhone(customer.phone_number)}
              </div>
              {customer.favorite_drink && (
                <div className="text-[11px] text-gold/90 mt-2 flex items-center gap-1 font-semibold">
                  <span>☕</span>
                  <span>{customer.favorite_drink}</span>
                </div>
              )}
              {(customer.roast_preference || customer.grind_preference) && (
                <div className="text-[10px] text-neutral-300 mt-1.5 flex flex-wrap items-center gap-1.5">
                  {customer.roast_preference && (
                    <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      🔥 {ROAST_PREFERENCES.find(r => r.value === customer.roast_preference)?.label[lang === "ar" ? "ar" : "en"] || customer.roast_preference}
                    </span>
                  )}
                  {customer.grind_preference && (
                    <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      ⚙️ {GRIND_PREFERENCES.find(g => g.value === customer.grind_preference)?.label[lang === "ar" ? "ar" : "en"] || customer.grind_preference}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                {lang === "ar" ? "رصيد النقاط" : "Points Balance"}
              </div>
              <div className="text-3xl font-black text-gold tracking-tight mt-0.5">
                {customer.loyalty_points || 0}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                {lang === "ar" ? "إجمالي الإنفاق" : "Total Spent"}: {formatCurrency(customer.total_spent)}
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="relative z-10 flex flex-col items-center justify-center p-3 rounded-2xl bg-white shadow-xl mt-4 max-w-[200px] mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Loyalty QR Code"
                className="w-36 h-36 object-contain"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center">
                <QrCode size={32} className="text-neutral-400 animate-pulse" />
              </div>
            )}
            <div className="text-[10px] font-bold text-black tracking-widest uppercase mt-1">
              SCAN AT CASHIER
            </div>
          </div>

          {/* Member Privileges / Perks */}
          <div className="relative z-10 mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-gold flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>{lang === "ar" ? `مزايا فئة ${roasteryTier.badgeTitle}:` : `${roasteryTier.badgeTitle} Perks:`}</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[10px] text-neutral-300">
              {roasteryTier.perks.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-gold">•</span>
                  <span>{lang === "ar" ? p.ar : p.en}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[10px] text-neutral-500 border-t border-white/10 pt-3 mt-4">
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={12} />
              <span>{lang === "ar" ? "عضوية موثقة" : "Verified Member"}</span>
            </div>
            <div>ID: {customer.id.slice(0, 8)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopyLink}
            className="text-xs flex items-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? (lang === "ar" ? "تم النسخ!" : "Copied!") : (lang === "ar" ? "نسخ رابط العميل" : "Copy Link")}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrint}
              className="text-xs flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>{lang === "ar" ? "طباعة الكارت" : "Print Pass"}</span>
            </Button>
            <Button type="button" variant="primary" onClick={onClose} className="text-xs">
              {lang === "ar" ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
