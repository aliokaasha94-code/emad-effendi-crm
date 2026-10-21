import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { Coins, RefreshCw, Search, ShoppingCart, Users } from "lucide-react";
import {
  useCreateTransaction,
  useCustomer,
  useCustomers,
  useRecentTransactions,
} from "@/hooks/useCustomers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Avatar, Card, EmptyState, Skeleton, StatCard } from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPhone,
  unwrapEmbeddedCustomer,
} from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/segments";
import type { Customer, CustomerFilters, Transaction } from "@/types/crm";

const QUICK_AMOUNTS = [30, 50, 75, 100, 150, 200];

export function CashierPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

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
    error: transactionError,
  } = useCreateTransaction();

  const { data: recentTransactions = [], isLoading: recentLoading } =
    useRecentTransactions(6);

  const { pushToast } = useToast();

  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [itemsSummary, setItemsSummary] = useState("");

  const parsedAmount = Number(amount);
  const amountError =
    amount.length > 0 &&
    (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000)
      ? "أدخل مبلغاً صحيحاً أكبر من صفر وأقل من 100000."
      : null;

  const selectCustomer = (customer: Customer) => {
    setSearchParams({ customer: customer.id });
  };

  const clearCustomer = () => {
    setSearchParams({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomer) {
      pushToast({ title: "اختر العميل أولاً", variant: "error" });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      pushToast({ title: "أدخل مبلغاً صحيحاً", variant: "error" });
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
        particleCount: 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ["#D99A1F", "#2A180F", "#F7F2EA", "#4F8A6B"],
      });

      const points = Math.floor(parsedAmount / 10);
      pushToast({
        title: "تم تسجيل العملية",
        description: `أُضيفت ${formatNumber(points)} نقطة لعميل ${selectedCustomer.full_name}.`,
        variant: "success",
      });

      setAmount("");
      setReceiptNumber("");
      setItemsSummary("");
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : "تعذر تسجيل العملية.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الكاشير"
        title="تسجيل عملية بيع"
        description="اختر العميل، أدخل المبلغ، وسجل العملية فوراً."
        actions={
          <Button type="button" variant="secondary" onClick={clearCustomer} disabled={!selectedCustomer}>
            مسح الاختيار
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-extrabold text-brand-950">اختيار العميل</h2>

            <div className="relative mb-4">
              <Input
                type="search"
                placeholder="ابحث بالاسم أو رقم الهاتف"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-950/35" aria-hidden="true" />
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20" />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon={Users}
                title="تعذر تحميل العملاء"
                description="حاول مرة أخرى."
                action={
                  <Button type="button" onClick={() => void refetch()}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    إعادة المحاولة
                  </Button>
                }
              />
            ) : customers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="لا يوجد عملاء"
                description="أضف عميلاً من صفحة العملاء أولاً."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {customers.map((customer) => {
                  const isSelected = customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition focus-ring ${
                        isSelected
                          ? "border-gold-400 bg-gold-50"
                          : "border-brand-950/10 bg-white/60 hover:border-brand-950/20"
                      }`}
                    >
                      <Avatar name={customer.full_name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-brand-950">
                          {customer.full_name}
                        </span>
                        <span className="block text-xs text-brand-950/55">
                          {formatPhone(customer.phone_number)}
                        </span>
                      </span>
                      {isSelected && <span className="text-xs font-bold text-gold-700">محدد</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-extrabold text-brand-950">تفاصيل العملية</h2>

            {selectedCustomer ? (
              <div className="mb-5 rounded-2xl border border-gold-200 bg-gold-50 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedCustomer.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-brand-950">
                      {selectedCustomer.full_name}
                    </p>
                    <p className="text-xs text-brand-950/60">
                      {formatPhone(selectedCustomer.phone_number)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard
                    label="إجمالي الإنفاق"
                    value={formatCurrency(selectedCustomer.total_spent)}
                    tone="gold"
                  />
                  <StatCard
                    label="عدد العمليات"
                    value={selectedCustomer.orders_count}
                    tone="neutral"
                  />
                  <StatCard
                    label="نقاط الولاء"
                    value={selectedCustomer.loyalty_points}
                    tone="success"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-dashed border-brand-950/15 bg-white/60 p-4 text-center text-sm text-brand-950/55">
                اختر عميلاً من القائمة لتسجيل عملية.
              </div>
            )}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {amountError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"
                >
                  {amountError}
                </div>
              )}

              {transactionError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"
                >
                  {transactionError instanceof Error
                    ? transactionError.message
                    : "تعذر تسجيل العملية."}
                </div>
              )}

              <Field label="المبلغ" htmlFor="amount" required error={amountError}>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  invalid={Boolean(amountError)}
                  required
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className="rounded-xl border border-brand-950/10 bg-white px-3 py-2 text-xs font-bold text-brand-950 transition hover:border-gold-300 hover:bg-gold-50 focus-ring"
                  >
                    {formatNumber(value)}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="رقم الإيصال" htmlFor="receiptNumber">
                  <Input
                    id="receiptNumber"
                    value={receiptNumber}
                    onChange={(event) => setReceiptNumber(event.target.value)}
                    placeholder="اختياري"
                  />
                </Field>

                <Field label="ملخص الأصناف" htmlFor="itemsSummary">
                  <Textarea
                    id="itemsSummary"
                    value={itemsSummary}
                    onChange={(event) => setItemsSummary(event.target.value)}
                    placeholder="لاتيه، كرواسون"
                    rows={2}
                  />
                </Field>
              </div>

              <Button type="submit" fullWidth loading={submitting} disabled={!selectedCustomer}>
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                تسجيل العملية
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-brand-950">آخر العمليات</h2>
              <span className="text-xs text-brand-950/55">آخر 6 عمليات</span>
            </div>

            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="لا توجد عمليات"
                description="سجل أول عملية من النموذج."
              />
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: Transaction) => {
                  const embedded = unwrapEmbeddedCustomer(transaction.customers);

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 rounded-2xl border border-brand-950/10 bg-white/60 p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-950/5 text-brand-950">
                        <Coins className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-brand-950">
                          {embedded?.full_name ?? "عميل"}
                        </p>
                        <p className="text-xs text-brand-950/55">
                          {SOURCE_LABELS[transaction.source]} •{" "}
                          {formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-brand-950">
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
    </div>
  );
}
