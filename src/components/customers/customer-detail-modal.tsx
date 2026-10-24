import {
  Coins,
  Crown,
  Heart,
  MessageCircle,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Coffee,
  Sparkles,
  Flame,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton, Avatar, SegmentBadge } from "@/components/ui/Misc";
import { formatCurrency, formatDateTime, formatPhone, formatNumber } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/segments";
import { getTierProgress, ROAST_PREFERENCES, GRIND_PREFERENCES } from "@/lib/tiers";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer, Transaction } from "@/types/crm";

export interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onWhatsApp: (customer: Customer) => void;
}

export function CustomerDetailModal({
  open,
  onClose,
  customer,
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onWhatsApp,
}: CustomerDetailModalProps) {
  const { t, lang } = useLanguage();

  if (!customer) return null;

  const tierProgress = getTierProgress(customer.loyalty_points);
  const currentTier = tierProgress.currentTier;
  const nextTier = tierProgress.nextTier;

  const roastLabel = ROAST_PREFERENCES.find((r) => r.value === customer.roast_preference)?.label[lang] || customer.roast_preference;
  const grindLabel = GRIND_PREFERENCES.find((g) => g.value === customer.grind_preference)?.label[lang] || customer.grind_preference;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Avatar name={customer.full_name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#F5EFE6]">{customer.full_name}</span>
              <SegmentBadge segment={customer.segment} />
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${currentTier.color.bg} ${currentTier.color.border} ${currentTier.color.text}`}>
                {currentTier.badgeTitle}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]" dir="ltr">{formatPhone(customer.phone_number)}</p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            <span>{t("إغلاق", "Close")}</span>
          </Button>
          <Button type="button" variant="secondary" onClick={() => onEdit(customer)}>
            <Pencil className="h-4 w-4 text-[#c8a34b]" aria-hidden="true" />
            <span>{t("تعديل", "Edit")}</span>
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(customer)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>{t("حذف", "Delete")}</span>
          </Button>
          <Button type="button" variant="primary" onClick={() => onWhatsApp(customer)}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t("واتساب", "WhatsApp")}</span>
          </Button>
        </div>
      }
    >
      {/* Tier & Gamified Loyalty Progress Card */}
      <div className={`mb-5 rounded-2xl border p-4 bg-gradient-to-r ${currentTier.color.bg} ${currentTier.color.border}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Award className={`h-5 w-5 ${currentTier.color.text}`} />
            <div>
              <span className="text-xs font-black text-[#F5EFE6]">
                {currentTier.name[lang]} ({currentTier.badgeTitle})
              </span>
              {currentTier.discountRate > 0 && (
                <span className="mr-2 text-[11px] font-bold text-[#f5d36e]">
                  • {t(`خصم دائم ${Math.round(currentTier.discountRate * 100)}%`, `${Math.round(currentTier.discountRate * 100)}% Member Discount`)}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-black text-[#f5d36e]">
            {customer.loyalty_points} {t("نقطة", "pts")}
          </span>
        </div>

        {nextTier ? (
          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[11px] text-[#9CA3AF]">
              <span>{t(`باقي ${tierProgress.pointsNeeded} نقطة للترقية لـ ${nextTier.name[lang]}`, `${tierProgress.pointsNeeded} pts to ${nextTier.name[lang]}`)}</span>
              <span className="font-bold text-[#F5EFE6]">{tierProgress.progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f5d36e] transition-all duration-500"
                style={{ width: `${tierProgress.progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] font-bold text-purple-300 mt-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("العميل وصل لأعلى فئة حصرية: نادي الباشوات!", "Client reached highest VIP Tier: Elite Club!")}</span>
          </p>
        )}
      </div>

      {/* Customer Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-white/5 bg-[#0d0f11] p-3 text-center">
          <p className="text-[11px] font-bold text-[#c8a34b]">{t("إجمالي الإنفاق", "Total Spent")}</p>
          <p className="mt-1 text-sm font-black text-[#f5d36e]">{formatCurrency(customer.total_spent)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#0d0f11] p-3 text-center">
          <p className="text-[11px] font-bold text-[#c8a34b]">{t("عدد الطلبات", "Total Visits")}</p>
          <p className="mt-1 text-sm font-black text-[#F5EFE6]">{formatNumber(customer.orders_count)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#0d0f11] p-3 text-center">
          <p className="text-[11px] font-bold text-[#c8a34b]">{t("نقاط الولاء", "Loyalty Points")}</p>
          <p className="mt-1 text-sm font-black text-emerald-400">{customer.loyalty_points}</p>
        </div>
      </div>

      {/* Roastery Coffee Taste Profile */}
      {(customer.favorite_drink || customer.roast_preference || customer.grind_preference || customer.flavor_notes_preference || customer.custom_notes) && (
        <div className="mb-5 rounded-2xl border border-[#d4af37]/20 bg-[#0c0e11] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Coffee className="h-4 w-4 text-[#d4af37]" />
            <h4 className="text-xs font-black text-[#f5d36e] uppercase tracking-wider">
              {t("ملف ذوق القهوة وتفضيلات المحمصة", "Roastery & Coffee Profile")}
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {customer.favorite_drink && (
              <div className="rounded-xl bg-white/5 p-2.5">
                <span className="block text-[10px] text-[#9CA3AF]">{t("المشروب المفضل", "Favorite Drink")}</span>
                <span className="font-bold text-[#F5EFE6]">{customer.favorite_drink}</span>
              </div>
            )}
            {roastLabel && (
              <div className="rounded-xl bg-white/5 p-2.5">
                <span className="block text-[10px] text-[#9CA3AF]">{t("درجة التحميص", "Roast Level")}</span>
                <span className="font-bold text-amber-400">{roastLabel}</span>
              </div>
            )}
            {grindLabel && (
              <div className="rounded-xl bg-white/5 p-2.5">
                <span className="block text-[10px] text-[#9CA3AF]">{t("طريقة ونعومة الطحن", "Grind Size")}</span>
                <span className="font-bold text-amber-200">{grindLabel}</span>
              </div>
            )}
            {customer.preferred_seating && (
              <div className="rounded-xl bg-white/5 p-2.5">
                <span className="block text-[10px] text-[#9CA3AF]">{t("المكان المفضل", "Seating")}</span>
                <span className="font-bold text-[#F5EFE6]">{customer.preferred_seating}</span>
              </div>
            )}
            {customer.flavor_notes_preference && (
              <div className="rounded-xl bg-white/5 p-2.5 sm:col-span-2">
                <span className="block text-[10px] text-[#9CA3AF]">{t("الإيحاءات والنكهات", "Flavors")}</span>
                <span className="font-bold text-[#f5d36e]">{customer.flavor_notes_preference}</span>
              </div>
            )}
          </div>

          {customer.custom_notes && (
            <div className="rounded-xl bg-white/5 p-2.5 text-xs text-[#F5EFE6]/90 border border-white/5">
              <span className="block text-[10px] font-bold text-[#c8a34b] mb-1">{t("ملاحظات الباريستا والإدارة:", "Barista & Staff Notes:")}</span>
              <p className="leading-relaxed">{customer.custom_notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#d4af37]">
          {t("سجل الطلبات والعمليات", "Transaction History")}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("لا توجد عمليات سابقة", "No Orders Yet")}
          description={t("لم يتم تسجيل أي طلب أو زيارة لهذا العميل بعد.", "No orders have been recorded for this guest yet.")}
        />
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
          {transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0d0f11] p-3 hover:border-white/10 transition"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#F5EFE6]">
                  {transaction.items_summary ?? t("طلب كافيه", "Cafe Order")}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {SOURCE_LABELS[transaction.source]} • {formatDateTime(transaction.created_at)}
                </p>
              </div>
              <span className="text-xs font-black text-[#f5d36e]">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
