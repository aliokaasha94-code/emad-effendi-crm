import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  CUSTOMERS_PAGE_SIZE,
  useCustomer,
  useCustomerMutations,
  useCustomerTransactions,
  useCustomers,
  usePhoneConflict,
} from "@/hooks/useCustomers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import {
  Avatar,
  Card,
  EmptyState,
  SegmentBadge,
  Skeleton,
  StatCard,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerFormModal } from "@/components/customer-form-modal";
import { CustomerDetailModal } from "@/components/customer-detail-modal";
import { isValidEgyptianMobile } from "@/lib/phone";
import { openWhatsApp, personalizeMessage } from "@/lib/whatsapp";
import { SEGMENT_ORDER, SOURCE_LABELS, getSegmentMeta } from "@/lib/segments";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPhone,
  pluralizeCustomers,
} from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  Customer,
  CustomerFilters,
  CustomerInput,
  CustomerSegment,
  CustomerSort,
  Transaction,
} from "@/types/crm";

export function CustomersPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState<CustomerSegment | "ALL">("ALL");
  const [sort, setSort] = useState<CustomerSort>("recent");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo<CustomerFilters>(
    () => ({ search: debouncedSearch, segment: filterSegment, sort, page }),
    [debouncedSearch, filterSegment, sort, page],
  );

  const { data, isLoading, isError, refetch } = useCustomers(filters);
  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));

  const selectedCustomerId = searchParams.get("customer");
  const { data: selectedCustomer, isLoading: selectedLoading } = useCustomer(selectedCustomerId);
  const { data: customerTransactions = [], isLoading: transactionsLoading } = useCustomerTransactions(selectedCustomerId);

  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerMutations();
  const { pushToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [favoriteDrink, setFavoriteDrink] = useState("");
  const [preferredSeating, setPreferredSeating] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [formSegment, setFormSegment] = useState<CustomerSegment>("CUSTOM");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { data: phoneConflict } = usePhoneConflict(phone, editing?.id ?? null);
  const phoneError = phoneConflict
    ? t("رقم الهاتف مسجل بالفعل لعميل آخر.", "Phone number already registered to another customer.")
    : null;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterSegment, sort]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setDateOfBirth("");
    setFavoriteDrink("");
    setPreferredSeating("");
    setCustomNotes("");
    setFormSegment("CUSTOM");
    setFormError(null);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFullName(customer.full_name);
    setPhone(customer.phone_number);
    setEmail(customer.email ?? "");
    setDateOfBirth(customer.date_of_birth ?? "");
    setFavoriteDrink(customer.favorite_drink ?? "");
    setPreferredSeating(customer.preferred_seating ?? "");
    setCustomNotes(customer.custom_notes ?? "");
    setFormSegment(customer.segment);
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const openDetail = (customer: Customer) => {
    setSearchParams({ customer: customer.id });
  };

  const closeDetail = () => {
    setSearchParams({});
  };

  const openDelete = (customer: Customer) => {
    setDeleteTarget(customer);
    setDeleteOpen(true);
  };

  const handleSubmit = async (input: CustomerInput) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateCustomer.mutateAsync({ id: editing.id, input });
        pushToast({ title: t("تم تحديث العميل", "Customer updated"), variant: "success" });
      } else {
        await createCustomer.mutateAsync(input);
        pushToast({ title: t("تمت إضافة العميل", "Customer added"), variant: "success" });
      }
      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("تعذر حفظ العميل.", "Failed to save customer."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      pushToast({ title: t("تم حذف العميل", "Customer deleted"), variant: "success" });
      if (selectedCustomerId === deleteTarget.id) {
        setSearchParams({});
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : t("تعذر حذف العميل.", "Failed to delete customer."),
        variant: "error",
      });
    }
  };

  const handleWhatsApp = (customer: Customer) => {
    const meta = getSegmentMeta(customer.segment);
    openWhatsApp(
      customer.phone_number,
      personalizeMessage(meta.template, {
        name: customer.full_name,
        drink: customer.favorite_drink,
        discount: t("خاص", "Special"),
      }),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={{ ar: "العملاء", en: "Customers" }}
        title={{ ar: "إدارة العملاء", en: "Customer Management" }}
        description={{
          ar: "ابحث، أضف، وعدّل بيانات عملائك من مكان واحد.",
          en: "Search, add, and edit customer data from one place.",
        }}
        actions={
          <>
            <Link
              to="/import"
              className="inline-flex h-11 items-center gap-2 rounded-card border border-brand-950/10 bg-white/5 px-4 text-sm font-bold text-brand-950 transition hover:bg-gold-50 focus-ring"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t("استيراد", "Import")}
            </Link>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("إضافة عميل", "Add Customer")}
            </Button>
          </>
        }
      />

      <Card className="surface p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Input
              type="search"
              placeholder={t("ابحث بالاسم أو رقم الهاتف", "Search by name or phone")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-50/35" aria-hidden="true" />
          </div>
          <Select
            value={filterSegment}
            onChange={(event) => setFilterSegment(event.target.value as CustomerSegment | "ALL")}
            aria-label={t("التصنيف", "Segment")}
          >
            <option value="ALL">{t("كل التصنيفات", "All Segments")}</option>
            {SEGMENT_ORDER.map((segment) => (
              <option key={segment} value={segment}>
                {getSegmentMeta(segment).label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as CustomerSort)}
            aria-label={t("الترتيب", "Sort")}
          >
            <option value="recent">{t("الأحدث", "Recent")}</option>
            <option value="spent">{t("الأعلى إنفاقاً", "Highest Spend")}</option>
            <option value="name">{t("الاسم", "Name")}</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <Card className="surface p-6">
          <EmptyState
            icon={Users}
            title={t("تعذر تحميل العملاء", "Failed to load customers")}
            description={t("حدث خطأ أثناء الجلب. حاول مرة أخرى.", "An error occurred while loading. Please try again.")}
            action={
              <Button type="button" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("إعادة المحاولة", "Retry")}
              </Button>
            }
          />
        </Card>
      ) : customers.length === 0 ? (
        <Card className="surface p-6">
          <EmptyState
            icon={Users}
            title={t("لا يوجد عملاء", "No Customers")}
            description={t("أضف أول عميل أو استورد بيانات Foodics.", "Add your first customer or import Foodics data.")}
            action={
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("إضافة عميل", "Add Customer")}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="surface overflow-hidden hidden md:block">
            <table className="w-full text-right">
              <thead className="bg-brand-950/5 text-xs font-bold text-brand-50/60">
                <tr>
                  <th className="px-4 py-3 font-bold">{t("العميل", "Customer")}</th>
                  <th className="px-4 py-3 font-bold">{t("الهاتف", "Phone")}</th>
                  <th className="px-4 py-3 font-bold">{t("التصنيف", "Segment")}</th>
                  <th className="px-4 py-3 font-bold">{t("الإنفاق", "Spending")}</th>
                  <th className="px-4 py-3 font-bold">{t("آخر زيارة", "Last Visit")}</th>
                  <th className="px-4 py-3 font-bold">{t("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-950/10">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-white/5 focus-ring">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(customer)}
                        className="flex items-center gap-3 rounded-xl p-1 text-right transition hover:bg-white/5 focus-ring"
                      >
                        <Avatar name={customer.full_name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-brand-950">
                            {customer.full_name}
                          </span>
                          <span className="block text-xs text-brand-50/55">
                            {formatNumber(customer.orders_count)} {t("عملية", "orders")}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-50/70">
                      {formatPhone(customer.phone_number)}
                    </td>
                    <td className="px-4 py-3">
                      <SegmentBadge segment={customer.segment} />
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-brand-950">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-50/60">
                      {formatDate(customer.last_seen_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-brand-950/10 bg-white/60 p-3">
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(customer)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50/10 focus-ring"
                          aria-label={t("واتساب", "WhatsApp")}
                        >
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-50/60 transition hover:bg-white/5 focus-ring"
                          aria-label={t("تعديل", "Edit")}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(customer)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-500/10 focus-ring"
                          aria-label={t("حذف", "Delete")}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {t("حذف", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-4 md:hidden">
            {customers.map((customer) => (
              <Card key={customer.id} className="surface p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={customer.full_name} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openDetail(customer)}
                      className="block w-full rounded-card p-1 text-right transition hover:bg-white/5 focus-ring"
                    >
                      <span className="block truncate text-sm font-bold text-brand-950">
                        {customer.full_name}
                      </span>
                      <span className="block text-xs text-brand-50/55">
                        {formatPhone(customer.phone_number)}
                      </span>
                    </button>
                    <div className="mt-2 flex items-center gap-2">
                      <SegmentBadge segment={customer.segment} />
                      <span className="text-xs text-brand-50/55">
                        {formatNumber(customer.orders_count)} {t("عملية", "orders")}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-brand-50">
                    {formatCurrency(customer.total_spent)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleWhatsApp(customer)}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t("واتساب", "WhatsApp")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(customer)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {t("تعديل", "Edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => openDelete(customer)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("حذف", "Delete")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-brand-50/55">
              صفحة {page} من {totalPages} • {pluralizeCustomers(total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t("السابق", "Previous")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                {t("التالي", "Next")}
              </Button>
            </div>
          </div>
        </>
      )}

      <CustomerFormModal
        open={formOpen}
        onClose={closeForm}
        editing={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
        formError={formError}
      />

      <CustomerDetailModal
        open={Boolean(selectedCustomerId)}
        onClose={closeDetail}
        customer={selectedCustomer ?? null}
        transactions={customerTransactions}
        isLoading={selectedLoading || transactionsLoading}
        onEdit={(customer) => {
          openEdit(customer);
          closeDetail();
        }}
        onDelete={(customer) => openDelete(customer)}
        onWhatsApp={(customer) => handleWhatsApp(customer)}
      />
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-white/5 p-3">
      <p className="text-[11px] font-bold text-brand-50/50">{label}</p>
      <div className="mt-1 text-sm font-bold text-brand-50">{children}</div>
    </div>
  );
}
