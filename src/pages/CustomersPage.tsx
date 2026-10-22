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
  QrCode,
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
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { CustomerDetailModal } from "@/components/customers/customer-detail-modal";
import { CustomerPassModal } from "@/components/customers/CustomerPassModal";
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
  const [passCustomer, setPassCustomer] = useState<Customer | null>(null);

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
          <div className="flex items-center gap-2.5">
            <Link
              to="/import"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d4af37]/25 bg-[#1a1d1f] px-4 text-xs font-bold text-[#F5EFE6] transition-all hover:bg-[#22262a] hover:border-[#d4af37] hover:text-[#f5d36e]"
            >
              <Upload className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
              <span>{t("استيراد بيانات", "Import Data")}</span>
            </Link>
            <Button type="button" onClick={openCreate} variant="primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t("إضافة عميل", "Add Customer")}</span>
            </Button>
          </div>
        }
      />

      <Card className="surface-glass p-4 border border-[#d4af37]/15">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Input
              type="search"
              placeholder={t("ابحث بالاسم أو رقم الهاتف...", "Search by name or phone...")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8a34b]" aria-hidden="true" />
          </div>
          <Select
            value={filterSegment}
            onChange={(event) => setFilterSegment(event.target.value as CustomerSegment | "ALL")}
            aria-label={t("التصنيف", "Segment")}
          >
            <option value="ALL">{t("كل التصنيفات (All)", "All Segments")}</option>
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
            <option value="recent">{t("الأحدث زيارة", "Recent Visit")}</option>
            <option value="spent">{t("الأعلى إنفاقاً", "Highest Spend")}</option>
            <option value="name">{t("الاسم أبجدياً", "Name (A-Z)")}</option>
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
        <Card className="surface-glass p-6 text-center">
          <EmptyState
            icon={Users}
            title={t("تعذر تحميل العملاء", "Failed to load customers")}
            description={t("حدث خطأ أثناء الجلب. حاول مرة أخرى.", "An error occurred while loading. Please try again.")}
            action={
              <Button type="button" onClick={() => void refetch()} variant="primary">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("إعادة المحاولة", "Retry")}
              </Button>
            }
          />
        </Card>
      ) : customers.length === 0 ? (
        <Card className="surface-glass p-8 text-center">
          <EmptyState
            icon={Users}
            title={t("لا يوجد عملاء مطابقين", "No Customers Found")}
            description={t("أضف أول عميل لكافيه ومحمصة عماد أفندي أو استورد بيانات فودكس.", "Add your first guest or import CSV orders.")}
            action={
              <Button type="button" onClick={openCreate} variant="primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("إضافة عميل جديد", "Add New Customer")}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="surface-glass overflow-hidden hidden md:block border border-[#d4af37]/15 p-0">
            <table className="w-full text-start">
              <thead className="bg-[#0d0f11] text-xs font-bold text-[#c8a34b] border-b border-[#d4af37]/20">
                <tr>
                  <th className="px-5 py-3.5 text-start font-black">{t("العميل", "Customer")}</th>
                  <th className="px-5 py-3.5 text-start font-black">{t("الهاتف", "Phone")}</th>
                  <th className="px-5 py-3.5 text-start font-black">{t("التصنيف (RFM)", "Segment")}</th>
                  <th className="px-5 py-3.5 text-start font-black">{t("إجمالي الإنفاق", "Total Spent")}</th>
                  <th className="px-5 py-3.5 text-start font-black">{t("آخر زيارة", "Last Visit")}</th>
                  <th className="px-5 py-3.5 text-center font-black">{t("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition-colors hover:bg-white/5">
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => openDetail(customer)}
                        className="group flex items-center gap-3 text-start transition focus:outline-none"
                      >
                        <Avatar name={customer.full_name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#F5EFE6] group-hover:text-[#f5d36e] transition">
                            {customer.full_name}
                          </span>
                          <span className="block text-xs text-[#9CA3AF]">
                            {formatNumber(customer.orders_count)} {t("طلب", "orders")}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-[#9CA3AF]" dir="ltr">
                      {formatPhone(customer.phone_number)}
                    </td>
                    <td className="px-5 py-3.5">
                      <SegmentBadge segment={customer.segment} />
                    </td>
                    <td className="px-5 py-3.5 text-sm font-black text-[#f5d36e]">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">
                      {formatDate(customer.last_seen_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#0d0f11] p-1 w-fit mx-auto">
                        <button
                          type="button"
                          onClick={() => setPassCustomer(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gold transition hover:bg-gold/15"
                          title={t("كارت الولاء الرقمي VIP", "Digital Pass")}
                        >
                          <QrCode className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-400 transition hover:bg-emerald-500/15"
                          title={t("إرسال رسالة واتساب", "Send WhatsApp")}
                        >
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#c8a34b] transition hover:bg-white/10 hover:text-[#f5d36e]"
                          title={t("تعديل العميل", "Edit")}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 transition hover:bg-rose-500/15"
                          title={t("حذف العميل", "Delete")}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Customers Cards */}
          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <Card key={customer.id} className="surface-glass p-4 border border-[#d4af37]/15">
                <div className="flex items-start gap-3">
                  <Avatar name={customer.full_name} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openDetail(customer)}
                      className="block w-full text-start focus:outline-none"
                    >
                      <span className="block truncate text-sm font-bold text-[#F5EFE6]">
                        {customer.full_name}
                      </span>
                      <span className="block text-xs text-[#9CA3AF]" dir="ltr">
                        {formatPhone(customer.phone_number)}
                      </span>
                    </button>
                    <div className="mt-2 flex items-center gap-2">
                      <SegmentBadge segment={customer.segment} />
                      <span className="text-xs text-[#9CA3AF]">
                        {formatNumber(customer.orders_count)} {t("طلب", "orders")}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#f5d36e]">
                    {formatCurrency(customer.total_spent)}
                  </span>
                </div>
                <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPassCustomer(customer)}
                    className="border border-gold/30 text-gold"
                  >
                    <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("الكارت", "Pass")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleWhatsApp(customer)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{t("واتساب", "WhatsApp")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(customer)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#c8a34b]" aria-hidden="true" />
                    <span>{t("تعديل", "Edit")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => openDelete(customer)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("حذف", "Delete")}</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
            <p className="text-xs text-[#9CA3AF]">
              {t(`صفحة ${page} من ${totalPages}`, `Page ${page} of ${totalPages}`)} • {pluralizeCustomers(total)}
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

      <CustomerPassModal
        customer={passCustomer}
        isOpen={Boolean(passCustomer)}
        onClose={() => setPassCustomer(null)}
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
