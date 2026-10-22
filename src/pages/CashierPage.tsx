import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Coins,
  RefreshCw,
  Search,
  ShoppingCart,
  Users,
  CheckCircle2,
  Receipt,
  QrCode,
  Sparkles,
} from "lucide-react";
import {
  useCreateTransaction,
  useCustomer,
  useCustomerMutations,
  useCustomers,
  useRecentTransactions,
} from "@/hooks/useCustomers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Avatar, Card, EmptyState, Skeleton } from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuickMenuGrid } from "@/components/cashier/QuickMenuGrid";
import { RewardRedemptionSection } from "@/components/cashier/RewardRedemptionSection";
import { ShiftClosingModal } from "@/components/cashier/ShiftClosingModal";
import { CustomerPassModal } from "@/components/customers/CustomerPassModal";
import { getCustomerTier, type RewardCatalogItem } from "@/lib/rewards";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPhone,
  pluralizeCustomers,
  unwrapEmbeddedCustomer,
} from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer, CustomerFilters, Transaction } from "@/types/crm";

const QUICK_AMOUNTS = [35, 50, 75, 120, 180, 250];

export function CashierPage() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const filters = useMemo<CustomerFilters>(
    () => ({ search: debouncedSearch, segment: "ALL", sort: "recent", page: 1 }),
    [debouncedSearch],
  );

  const { data, isLoading, isError, refetch } = useCustomers(filters);
  const customers = data?.customers ?? [];

  const selectedCustomerId = searchParams.get("customer");
  const { data: selectedCustomer } = useCustomer(selectedCustomerId);

  const {
    mutateAsync: createTransaction,
    isPending: submitting,
  } = useCreateTransaction();

  const { updateCustomer } = useCustomerMutations();

  const { data: recentTransactions = [], isLoading: recentLoading } =
    useRecentTransactions(12);

  const { pushToast } = useToast();

  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [itemsSummary, setItemsSummary] = useState("");

  const parsedAmount = Number(amount);
  const amountError =
    amount.length > 0 &&
    (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000)
      ? t("أدخل مبلغاً صحيحاً أكبر من صفر.", "Please enter a valid amount greater than zero.")
      : null;

  const selectCustomer = (customer: Customer) => {
    setSearchParams({ customer: customer.id });
  };

  const clearCustomer = () => {
    setSearchParams({});
  };

  // Called from QuickMenuGrid when drinks are clicked
  const handleApplyMenuSelection = (totalAmount: number, summary: string) => {
    if (totalAmount > 0) {
      setAmount(String(totalAmount));
      setItemsSummary(summary);
    } else {
      setAmount("");
      setItemsSummary("");
    }
  };

  // Called when redeeming a reward
  const handleRedeemReward = async (reward: RewardCatalogItem) => {
    if (!selectedCustomer) return;
    setRedeeming(true);
    try {
      await createTransaction({
        customer_id: selectedCustomer.id,
        amount: 0,
        receipt_number: `RWD-${Date.now().toString().slice(-4)}`,
        items_summary: `🎁 ${lang === "ar" ? "استبدال مكافأة" : "Reward Redeemed"}: ${
          lang === "ar" ? reward.nameAr : reward.nameEn
        } (-${reward.pointsCost} ${lang === "ar" ? "نقطة" : "pts"})`,
        source: "QR_LOYALTY",
      });

      // Deduct points
      const remainingPoints = Math.max(0, (selectedCustomer.loyalty_points || 0) - reward.pointsCost);
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        input: {
          full_name: selectedCustomer.full_name,
          phone_number: selectedCustomer.phone_number,
          custom_notes: selectedCustomer.custom_notes,
          favorite_drink: selectedCustomer.favorite_drink,
        },
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomer) {
      pushToast({ title: t("اختر العميل أولاً", "Select a customer first"), variant: "error" });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      pushToast({ title: t("أدخل مبلغاً صحيحاً", "Enter a valid amount"), variant: "error" });
      return;
    }

    try {
      await createTransaction({
        customer_id: selectedCustomer.id,
        amount: parsedAmount,
        receipt_number: receiptNumber.trim() || null,
        items_summary: itemsSummary.trim() || null,
        source: "CASHIER_MANUAL",
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#f5d36e", "#000000", "#F5EFE6"],
      });

      const points = Math.floor(parsedAmount / 10);
      pushToast({
        title: t("تم تسجيل العملية بنجاح! 🎉", "Order Recorded Successfully! 🎉"),
        description: t(
          `أُضيفت ${formatNumber(points)} نقطة لعميل ${selectedCustomer.full_name}.`,
          `Added ${formatNumber(points)} loyalty points to ${selectedCustomer.full_name}.`
        ),
        variant: "success",
      });

      setAmount("");
      setReceiptNumber("");
      setItemsSummary("");
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : t("تعذر تسجيل العملية.", "Failed to record order."),
        variant: "error",
      });
    }
  };

  const selectedTier = selectedCustomer ? getCustomerTier(selectedCustomer) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={{ ar: "كاشير ونقاط عماد أفندي", en: "Emad Afandi POS & Loyalty" }}
        title={{ ar: "تسجيل طلب واستبدال المكافآت", en: "Record Order & Rewards" }}
        description={{
          ar: "اختر العميل، حدد المشروبات من القائمة السريعة، وسيتم احتساب نقاط الولاء وتحديث تصنيف العميل فوراً.",
          en: "Select guest, pick drinks from visual menu, and loyalty points update automatically.",
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowShiftModal(true)}
              className="text-xs flex items-center gap-1.5 border border-[#d4af37]/30 text-gold hover:bg-gold/10"
            >
              <Receipt size={14} />
              <span>{t("تقفيل الشيفت (Z-Report)", "Shift Report")}</span>
            </Button>
            {selectedCustomer && (
              <Button
                type="button"
                variant="secondary"
                onClick={clearCustomer}
                className="text-xs"
              >
                <span>{t("إلغاء التحديد", "Clear Selection")}</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Main Selection & Form */}
        <div className="space-y-6 lg:col-span-3">
          {/* Customer Selection Card */}
          <Card className="surface-glass p-5 border border-[#d4af37]/20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#F5EFE6]">
                {t("1. اختيار عميل الكافيه", "1. Select Customer")}
              </h2>
              <span className="text-xs text-[#9CA3AF]">
                {pluralizeCustomers(customers.length)}
              </span>
            </div>

            <div className="relative mb-4">
              <Input
                type="search"
                placeholder={t("ابحث بالاسم أو رقم الهاتف...", "Search by name or mobile number...")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8a34b]" aria-hidden="true" />
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon={Users}
                title={t("تعذر تحميل العملاء", "Failed to load customers")}
                description={t("حاول مرة أخرى.", "Please retry.")}
                action={
                  <Button type="button" onClick={() => void refetch()} variant="primary">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    <span>{t("إعادة المحاولة", "Retry")}</span>
                  </Button>
                }
              />
            ) : customers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("لا يوجد عملاء بهذا الاسم", "No customers match")}
                description={t("أضف عميلاً جديداً من صفحة العملاء.", "Add a new guest from Customers page.")}
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 max-h-56 overflow-y-auto no-scrollbar">
                {customers.map((customer) => {
                  const isSelected = customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-all duration-200 focus:outline-none ${
                        isSelected
                          ? "border-[#d4af37] bg-[#d4af37]/15 shadow-md shadow-[#d4af37]/20"
                          : "border-white/5 bg-[#0d0f11] hover:border-[#d4af37]/30 hover:bg-[#1a1d1f]"
                      }`}
                    >
                      <Avatar name={customer.full_name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-[#F5EFE6]">
                          {customer.full_name}
                        </span>
                        <span className="block text-[11px] text-[#9CA3AF]" dir="ltr">
                          {formatPhone(customer.phone_number)}
                        </span>
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-[#f5d36e]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* If Customer is selected, show Rewards & Pass Bar */}
          {selectedCustomer && (
            <>
              {/* Selected Customer Luxury Profile Card */}
              <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#171a1e] via-[#111417] to-[#0a0c0e] p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedCustomer.full_name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#F5EFE6]">
                        {selectedCustomer.full_name}
                      </p>
                      {selectedTier && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold border"
                          style={{
                            backgroundColor: selectedTier.badgeBg,
                            borderColor: selectedTier.badgeBorder,
                            color: selectedTier.textColor,
                          }}
                        >
                          {lang === "ar" ? selectedTier.nameAr : selectedTier.nameEn}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#c8a34b] font-mono mt-0.5" dir="ltr">
                      {formatPhone(selectedCustomer.phone_number)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPassModal(true)}
                    className="text-xs flex items-center gap-1.5 border border-gold/40 text-gold hover:bg-gold/10"
                  >
                    <QrCode size={14} />
                    <span>{t("كارت الولاء VIP 📱", "Digital Pass")}</span>
                  </Button>
                </div>
              </div>

              {/* Reward Redemption Component */}
              <RewardRedemptionSection
                customer={selectedCustomer}
                onRedeemReward={handleRedeemReward}
                redeeming={redeeming}
              />
            </>
          )}

          {/* Quick Drinks & Desserts Menu Grid */}
          <QuickMenuGrid onApplySelection={handleApplyMenuSelection} />

          {/* Order Details Form */}
          <Card className="surface-glass p-5 border border-[#d4af37]/20">
            <h2 className="mb-4 text-base font-extrabold text-[#F5EFE6]">
              {t("2. تأكيد الفاتورة وتسجيل النقاط", "2. Confirm Bill & Record Points")}
            </h2>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <Field
                label={t("قيمة الطلب (بالجنيه المصري)", "Order Amount (EGP)")}
                htmlFor="amount"
                required
                error={amountError}
              >
                <Input
                  id="amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  invalid={Boolean(amountError)}
                  required
                  className="text-base font-black text-[#f5d36e]"
                />
              </Field>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(String(val))}
                    className="rounded-lg border border-[#d4af37]/20 bg-[#1a1d1f] px-3 py-1.5 text-xs font-bold text-[#F5EFE6] transition-all hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] active:scale-95"
                  >
                    +{formatNumber(val)} {t("ج.م", "EGP")}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <Field
                  label={t("رقم الإيصال / الشيك (اختياري)", "Receipt / Ticket # (Optional)")}
                  htmlFor="receiptNumber"
                >
                  <Input
                    id="receiptNumber"
                    value={receiptNumber}
                    onChange={(event) => setReceiptNumber(event.target.value)}
                    placeholder="#1042"
                  />
                </Field>

                <Field
                  label={t("ملخص المشروبات / الأصناف", "Items Summary")}
                  htmlFor="itemsSummary"
                >
                  <Textarea
                    id="itemsSummary"
                    value={itemsSummary}
                    onChange={(event) => setItemsSummary(event.target.value)}
                    placeholder={t("اسبريسو دبل، لاتيه شوفان، براونيز", "Double Espresso, Oat Latte, Brownies")}
                    rows={2}
                  />
                </Field>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={submitting}
                disabled={!selectedCustomer}
                variant="primary"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <span>{t("تسجيل الطلب واحتساب النقاط", "Record Order & Add Points")}</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Recent Transactions Sidebar */}
        <div className="lg:col-span-2">
          <Card className="surface-glass p-5 border border-[#d4af37]/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-[#F5EFE6]">
                {t("آخر العمليات المسجلة", "Recent Cashier Orders")}
              </h2>
              <span className="text-xs text-[#9CA3AF]">{t("مباشر", "Live")}</span>
            </div>

            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title={t("لا توجد عمليات بعد", "No recent orders")}
                description={t("سجل أول عملية لك في وردية اليوم.", "Record your first order for this shift.")}
              />
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {recentTransactions.map((transaction: Transaction) => {
                  const embedded = unwrapEmbeddedCustomer(transaction.customers);

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0d0f11] p-3 hover:border-white/10 transition"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/25 text-[#f5d36e]">
                        <Coins className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#F5EFE6]">
                          {embedded?.full_name ?? t("عميل كافيه", "Walk-in Guest")}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] truncate">
                          {transaction.items_summary || formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#f5d36e]">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ShiftClosingModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        recentTransactions={recentTransactions}
      />

      <CustomerPassModal
        customer={selectedCustomer ?? null}
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
      />
    </div>
  );
}
