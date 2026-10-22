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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton, Avatar, SegmentBadge } from "@/components/ui/Misc";
import { formatCurrency, formatDateTime, formatPhone, formatNumber } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/segments";
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
  const { t } = useLanguage();

  if (!customer) return null;

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
      {/* Customer Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
