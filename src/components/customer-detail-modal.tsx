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
import { EmptyState, Skeleton } from "@/components/ui/Misc";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
      title={customer.full_name}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("إغلاق", "Close")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => onEdit(customer)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("تعديل", "Edit")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(customer)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t("حذف", "Delete")}
          </Button>
          <Button type="button" onClick={() => onWhatsApp(customer)}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("واتساب", "WhatsApp")}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("لا توجد عمليات", "No Transactions")}
          description={t("لم يتم تسجيل أي عملية لهذا العميل بعد.", "No transactions recorded for this customer yet.")}
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 rounded-2xl border border-brand-950/10 bg-white/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-950">
                  {transaction.items_summary ?? t("عملية شراء", "Purchase")}
                </p>
                <p className="text-xs text-brand-950/50">
                  {SOURCE_LABELS[transaction.source]} • {formatDateTime(transaction.created_at)}
                </p>
              </div>
              <span className="text-sm font-extrabold text-brand-950">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
