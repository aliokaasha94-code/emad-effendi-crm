import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, FileSpreadsheet, RefreshCw, Upload, Users, Sparkles, CheckCircle2 } from "lucide-react";
import {
  MAX_IMPORT_FILE_SIZE,
  MAX_IMPORT_ROWS,
  MAPPING_FIELDS,
  buildImportPreview,
  buildImportRows,
  downloadImportTemplate,
  emptyMapping,
  guessMapping,
  parseCustomerFile,
} from "@/lib/importer";
import type {
  ImportMapping,
  ImportPreview,
  ParsedCustomerFile,
} from "@/lib/importer";
import { fetchExistingCustomerKeys, useImportCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Badge, Card, EmptyState, Skeleton, StatCard } from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatNumber, cn } from "@/lib/utils";
import { foodicsIntegration } from "@/lib/integrations/foodics";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CustomerInput } from "@/types/crm";

export function ImportPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsed, setParsed] = useState<ParsedCustomerFile | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>(emptyMapping());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { mutateAsync: importCustomers, isPending: importPending } = useImportCustomers();
  const { pushToast } = useToast();

  const reset = () => {
    setStep(1);
    setParsed(null);
    setMapping(emptyMapping());
    setPreview(null);
    setError(null);
    setIsParsing(false);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setParsed(null);
    setPreview(null);
    setMapping(emptyMapping());
    setIsParsing(true);
    setStep(1);

    try {
      const result = await parseCustomerFile(file);
      setParsed(result);
      setMapping(guessMapping(result.headers));
      setStep(2);
    } catch (parseError) {
      setError(
        parseError instanceof Error ? parseError.message : t("تعذر قراءة الملف.", "Failed to read file."),
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleMappingChange = (fieldKey: keyof ImportMapping, value: string) => {
    setMapping((current) => ({ ...current, [fieldKey]: value }));
  };

  const generatePreview = async () => {
    if (!parsed) return;

    setError(null);

    try {
      const rows = buildImportRows(parsed, mapping);
      const existing = await fetchExistingCustomerKeys();
      setPreview(buildImportPreview(rows, existing.phones, existing.names));
      setStep(3);
    } catch (previewError) {
      setError(
        previewError instanceof Error ? previewError.message : t("تعذر تجهيز المعاينة.", "Failed to build preview."),
      );
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const readyRows = preview.rows.filter((row) => row.status === "ready");

    if (readyRows.length === 0) {
      pushToast({ title: t("لا توجد صفوف جاهزة للاستيراد", "No ready rows to import"), variant: "error" });
      return;
    }

    const input: CustomerInput[] = readyRows.map((row) => ({
      full_name: row.name,
      phone_number: row.phone,
      email: row.email,
      date_of_birth: row.dateOfBirth,
      favorite_drink: row.favoriteDrink,
      preferred_seating: row.preferredSeating,
      custom_notes: row.notes,
      segment: row.segment ?? undefined,
    }));

    try {
      const result = await importCustomers(input);
      pushToast({
        title: t("تم استيراد البيانات بنجاح! 🚀", "Data Imported Successfully! 🚀"),
        description:
          result.skipped > 0
            ? t(
                `تمت إضافة ${formatNumber(result.inserted)} عميل جديد، وتخطي ${formatNumber(result.skipped)} عميل مكرر (بالاسم أو الهاتف).`,
                `Added ${formatNumber(result.inserted)} new guests, skipped ${formatNumber(result.skipped)} duplicates.`
              )
            : t(`تمت إضافة ${formatNumber(result.inserted)} عميل جديد.`, `Added ${formatNumber(result.inserted)} new guests.`),
        variant: "success",
      });
      reset();
    } catch (importError) {
      pushToast({
        title:
          importError instanceof Error ? importError.message : t("تعذر الاستيراد.", "Import failed."),
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={{ ar: "استيراد البيانات", en: "Data Migration" }}
        title={{ ar: "استيراد العملاء والمبيعات", en: "Import Guests & CSV" }}
        description={{
          ar: "ارفع شيت إكسيل أو تقرير مبيعات فودكس POS لاستيراد وتحديث العملاء وحساب RFM تلقائياً.",
          en: "Upload CSV or Excel exports from Foodics POS to ingest guests with automatic RFM sync.",
        }}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={downloadImportTemplate}
            >
              <Download className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
              <span>{t("تنزيل قالب إكسيل التجريبي", "Download Template")}</span>
            </Button>
            {step !== 1 && (
              <Button type="button" variant="secondary" onClick={reset}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>{t("ملف جديد", "New File")}</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("مرحلة الاستيراد", "Current Step")}
          value={
            step === 1
              ? t("1. رفع الشيت", "1. Upload File")
              : step === 2
              ? t("2. تعيين الأعمدة", "2. Map Columns")
              : t("3. فحص المعاينة", "3. Preview & Commit")
          }
          tone="neutral"
        />
        <StatCard
          label={t("عدد الصفوف في الملف", "Rows in File")}
          value={parsed?.rows.length ?? 0}
          hint={t(`أقصى حد: ${formatNumber(MAX_IMPORT_ROWS)} صف`, `Max limit: ${formatNumber(MAX_IMPORT_ROWS)}`)}
          tone="gold"
        />
        <StatCard
          label={t("حجم الملف المسموح", "Max File Size")}
          value={`${formatNumber(Math.round(MAX_IMPORT_FILE_SIZE / (1024 * 1024)))} MB`}
          tone="neutral"
        />
      </div>

      {step === 1 && (
        <Card className="surface-glass p-6 border border-[#d4af37]/20">
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0d0f11] p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-[#f5d36e]" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-[#F5EFE6]/80">
                {t(
                  "متوافق مع تقارير مبيعات وعملاء فودكس (Foodics POS) وأي ملف Excel أو CSV يحتوي على الاسم ورقم الهاتف.",
                  "Fully compatible with Foodics POS customer exports, and any standard CSV/Excel format containing names and mobile numbers."
                )}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={(event) => void handleFile(event)}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-all duration-300 select-none",
              isDragging
                ? "border-[#d4af37] bg-[#d4af37]/15 scale-[1.01] shadow-2xl shadow-[#d4af37]/20"
                : "border-[#d4af37]/30 bg-[#0d0f11] hover:border-[#d4af37] hover:bg-[#131618]"
            )}
          >
            <span
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 mb-4",
                isDragging
                  ? "bg-[#d4af37] text-black border-[#d4af37] scale-110 animate-bounce"
                  : "bg-[#d4af37]/15 border-[#d4af37]/30 text-[#f5d36e]"
              )}
            >
              <Upload className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-black text-[#F5EFE6]">
              {isDragging
                ? t("أفلت ملف الإكسيل هنا الآن! 📥", "Drop Excel file here now! 📥")
                : t("اضغط هنا أو اسحب الملف (Drag & Drop) لاختيار ملف إكسيل أو CSV", "Click or Drag & Drop Excel or CSV file")}
            </h2>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              CSV, XLSX, XLS • {t(`حتى ${formatNumber(MAX_IMPORT_ROWS)} صف لكل ملف`, `Up to ${formatNumber(MAX_IMPORT_ROWS)} rows per file`)}
            </p>

            <Button
              type="button"
              className="mt-5"
              loading={isParsing}
              variant="primary"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{isParsing ? t("جارٍ القراءة...", "Parsing file...") : t("تصفح الملفات من جهازك", "Browse File")}</span>
            </Button>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-bold text-rose-300"
              >
                {error}
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 2 && parsed && (
        <Card className="surface-glass p-6 border border-[#d4af37]/20">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#F5EFE6]">
                {t("تعيين أعمدة الملف", "Map Spreadsheet Columns")}
              </h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {parsed.fileName} • {formatNumber(parsed.rows.length)} {t("صف مكتشف", "rows detected")}
              </p>
            </div>
            <Badge variant="brand">{t("الخطوة 2", "Step 2")}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MAPPING_FIELDS.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                required={field.required}
                htmlFor={`mapping-${field.key}`}
              >
                <Select
                  id={`mapping-${field.key}`}
                  value={mapping[field.key]}
                  onChange={(event) => handleMappingChange(field.key, event.target.value)}
                >
                  <option value="">{t("اختر العمود المقابل...", "Select matching column...")}</option>
                  {parsed.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-bold text-rose-300"
            >
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-end gap-2.5 border-t border-white/5 pt-5">
            <Button type="button" variant="secondary" onClick={reset}>
              <span>{t("إلغاء", "Cancel")}</span>
            </Button>
            <Button type="button" onClick={() => void generatePreview()} variant="primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("معاينة وفحص البيانات", "Preview & Validate")}</span>
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && preview && (
        <Card className="surface-glass p-6 border border-[#d4af37]/20">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#F5EFE6]">
                {t("معاينة نتائج الفحص قبل الحفظ", "Validation & Import Summary")}
              </h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {t("الأرقام المكررة سيتم تخطيها تلقائياً للحفاظ على سلامة البيانات.", "Duplicate phone numbers will be automatically bypassed.")}
              </p>
            </div>
            <Badge variant="gold">{t("الخطوة 3", "Step 3")}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={t("جاهز للإضافة فوراً", "Ready to Insert")}
              value={preview.readyCount}
              tone="success"
            />
            <StatCard
              label={t("أرقام مسجلة مسبقاً (مكرر)", "Duplicates")}
              value={preview.duplicateCount}
              tone="warning"
            />
            <StatCard
              label={t("بيانات غير صالحة (خطأ)", "Invalid Rows")}
              value={preview.invalidCount}
              tone="danger"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f11]">
            <div className="max-h-96 overflow-y-auto no-scrollbar">
              <table className="w-full text-start">
                <thead className="sticky top-0 bg-[#131618] text-xs font-bold text-[#c8a34b] border-b border-[#d4af37]/20">
                  <tr>
                    <th className="px-4 py-3 text-start font-black">#</th>
                    <th className="px-4 py-3 text-start font-black">{t("الاسم", "Name")}</th>
                    <th className="px-4 py-3 text-start font-black">{t("الهاتف", "Phone")}</th>
                    <th className="px-4 py-3 text-start font-black">{t("الحالة", "Status")}</th>
                    <th className="px-4 py-3 text-start font-black">{t("ملاحظات الفحص", "Notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.phone}`} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-xs text-[#9CA3AF]">{row.rowNumber}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#F5EFE6]">
                        {row.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#9CA3AF]" dir="ltr">
                        {row.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.status)}>
                          {statusLabel(row.status, t)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-rose-400">
                        {row.errors.length > 0 ? row.errors.join("، ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-white/5 pt-5">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              <span>{t("رجوع للتعيين", "Back to Mapping")}</span>
            </Button>
            <Button
              type="button"
              onClick={() => void handleImport()}
              loading={importPending}
              disabled={preview.readyCount === 0}
              variant="primary"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>{t(`تأكيد استيراد ${formatNumber(preview.readyCount)} عميل`, `Confirm Import ${formatNumber(preview.readyCount)} Guests`)}</span>
            </Button>
          </div>
        </Card>
      )}

      {isParsing && (
        <Card className="surface-glass p-6">
          <Skeleton className="h-28" />
        </Card>
      )}
    </div>
  );
}

function statusLabel(status: "ready" | "duplicate" | "invalid", t: (ar: string, en: string) => string): string {
  if (status === "ready") return t("جاهز للإضافة", "Ready");
  if (status === "duplicate") return t("مكرر", "Duplicate");
  return t("غير صالح", "Invalid");
}

function statusVariant(status: "ready" | "duplicate" | "invalid") {
  if (status === "ready") return "success" as const;
  if (status === "duplicate") return "warning" as const;
  return "danger" as const;
}
