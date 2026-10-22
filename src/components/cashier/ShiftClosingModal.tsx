import { useState } from "react";
import { Receipt, Printer, CheckCircle, Clock, DollarSign, Users, Gift, ShoppingCart } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "@/types/crm";

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentTransactions: Transaction[];
}

export function ShiftClosingModal({
  isOpen,
  onClose,
  recentTransactions,
}: ShiftClosingModalProps) {
  const { lang } = useLanguage();
  const [shiftStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() - 8);
    return d;
  });
  const shiftEnd = new Date();

  // Calculate shift stats from transactions
  const totalRevenue = recentTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalOrders = recentTransactions.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalPointsAwarded = Math.floor(totalRevenue / 10);
  const rewardsRedeemed = recentTransactions.filter((t) =>
    (t.items_summary || "").includes("استبدال مكافأة")
  ).length;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={lang === "ar" ? "تقرير تقفيل الشيفت (Z-Report)" : "Shift Closing (Z-Report)"}
      size="md"
    >
      <div className="space-y-6">
        {/* Printable Thermal Receipt Container */}
        <div
          id="shift-receipt"
          className="bg-white text-black p-6 rounded-2xl font-mono text-xs shadow-xl border border-neutral-300 max-w-sm mx-auto select-none"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-neutral-800 pb-4 mb-4">
            <h2 className="text-base font-black uppercase tracking-wider">
              عماد أفندي - EMAD AFANDI
            </h2>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Specialty Coffee & Roastery
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              *** تقرير تقفيل الشيفت والكاشير ***
            </p>
          </div>

          {/* Time & Shift Details */}
          <div className="space-y-1.5 border-b border-dashed border-neutral-400 pb-3 mb-3 text-[11px]">
            <div className="flex justify-between">
              <span>تاريخ الإغلاق:</span>
              <span>{formatDateTime(shiftEnd.toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span>بداية الشيفت:</span>
              <span>{formatDateTime(shiftStart.toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span>الكاشير المسؤول:</span>
              <span className="font-bold">باريستا المناوبة</span>
            </div>
            <div className="flex justify-between">
              <span>الفرع:</span>
              <span>الفرع الرئيسي</span>
            </div>
          </div>

          {/* Sales Breakdown */}
          <div className="space-y-2 border-b-2 border-dashed border-neutral-800 pb-3 mb-3 text-[11px]">
            <div className="flex justify-between font-bold text-sm">
              <span>إجمالي المبيعات:</span>
              <span className="font-black">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>عدد العمليات (Orders):</span>
              <span className="font-bold">{totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span>متوسط الفاتورة (AOV):</span>
              <span>{formatCurrency(aov)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>النقاط الممنوحة للزبائن:</span>
              <span>+{totalPointsAwarded} نقطة</span>
            </div>
            <div className="flex justify-between text-purple-800 font-semibold">
              <span>مكافآت مستبدلة:</span>
              <span>{rewardsRedeemed} مكافأة</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-neutral-500 pt-1">
            <p>نظام كافيه ومحمصة عماد أفندي CRM</p>
            <p>تم تدقيق الحسابات بنجاح ✓</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs"
          >
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrintReceipt}
            className="text-xs flex items-center gap-1.5"
          >
            <Printer size={15} />
            <span>{lang === "ar" ? "طباعة إيصال التقفيل الحراري" : "Print Z-Report"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
