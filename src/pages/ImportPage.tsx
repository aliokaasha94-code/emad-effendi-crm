import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, FileSpreadsheet, RefreshCw, Upload, Users } from "lucide-react";
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
import { fetchExistingPhones, useImportCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Badge, Card, EmptyState, Skeleton, StatCard } from "@/components/ui/Misc";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatNumber } from "@/lib/utils";
import { foodicsIntegration } from "@/lib/integrations/foodics";
import type { CustomerInput } from "@/types/crm";

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsed, setParsed] = useState<ParsedCustomerFile | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>(emptyMapping());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const { mutateAsync: importCustomers, isPending: importPending } = useImportCustomers();
  const { pushToast } = useToast();

  const reset = () => {
    setStep(1);
    setParsed(null);
    setMapping(emptyMapping());
    setPreview(null);
    setError(null);
    setIsParsing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        parseError instanceof Error ? parseError.message : "تعذر قراءة الملف.",
      );
    } finally {
      setIsParsing(false);
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
      const existingPhones = await fetchExistingPhones();
      setPreview(buildImportPreview(rows, existingPhones));
      setStep(3);
    } catch (previewError) {
      setError(
        previewError instanceof Error ? previewError.message : "تعذر تجهيز المعاينة.",
      );
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const readyRows = preview.rows.filter((row) => row.status === "ready");

    if (readyRows.length === 0) {
      pushToast({ title: "لا توجد صفوف جاهزة", variant: "error" });
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
        title: "تم الاستيراد",
        description: `تم إضافة ${formatNumber(result.inserted)} عميل.`,
        variant: "success",
      });
      reset();
    } catch (importError) {
      pushToast({
        title:
          importError instanceof Error ? importError.message : "تعذر الاستيراد.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الاستيراد"
        title="استيراد العملاء"
        description="ارفع ملف CSV أو Excel لاستيراد العملاء، أو استخدم قالباً جاهزاً."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={downloadImportTemplate}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              تنزيل القالب
            </Button>
            {step !== 1 && (
              <Button type="button" variant="secondary" onClick={reset}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                ملف جديد
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="الخطوة الحالية"
          value={step === 1 ? "رفع الملف" : step === 2 ? "تعيين الأعمدة" : "المعاينة"}
          tone="neutral"
        />
        <StatCard
          label="عدد الصفوف"
          value={parsed?.rows.length ?? 0}
          hint={`الحد الأقصى ${formatNumber(MAX_IMPORT_ROWS)}`}
          tone="gold"
        />
        <StatCard
          label="حجم الملف المسموح"
          value={`${formatNumber(Math.round(MAX_IMPORT_FILE_SIZE / (1024 * 1024)))} ميجابايت`}
          tone="neutral"
        />
      </div>

      {step === 1 && (
        <Card className="p-6">
          <div className="rounded-2xl border border-brand-950/10 bg-brand-950/[0.03] p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden="true" />
              <p className="text-xs leading-6 text-brand-950/65">
                {foodicsIntegration.description}
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

          <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-brand-950/20 bg-white/60 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950 text-gold-400">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-brand-950">ارفع ملف العملاء</h2>
            <p className="mt-2 text-sm text-brand-950/60">
              CSV، TSV، TXT، XLSX، أو XLS • حتى {formatNumber(MAX_IMPORT_ROWS)} صف
            </p>

            <Button
              type="button"
              className="mt-5"
              loading={isParsing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isParsing ? "جارٍ القراءة..." : "اختيار ملف"}
            </Button>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"
              >
                {error}
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 2 && parsed && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-brand-950">تعيين الأعمدة</h2>
              <p className="mt-1 text-xs text-brand-950/55">
                {parsed.fileName} • {formatNumber(parsed.rows.length)} صف
              </p>
            </div>
            <Badge variant="brand">الخطوة 2</Badge>
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
                  <option value="">اختر العمود</option>
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
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={reset}>
              إلغاء
            </Button>
            <Button type="button" onClick={() => void generatePreview()}>
              معاينة البيانات
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && preview && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-brand-950">معاينة الاستيراد</h2>
              <p className="mt-1 text-xs text-brand-950/55">
                راجع الصفوف قبل الاستيراد. الصفوف المكررة لن تُضاف.
              </p>
            </div>
            <Badge variant="gold">الخطوة 3</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="صفوف جاهزة"
              value={preview.readyCount}
              tone="success"
            />
            <StatCard
              label="صفوف مكررة"
              value={preview.duplicateCount}
              tone="warning"
            />
            <StatCard
              label="صفوف غير صالحة"
              value={preview.invalidCount}
              tone="danger"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-950/10">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-right">
                <thead className="sticky top-0 bg-brand-950/5 text-xs font-bold text-brand-950/60">
                  <tr>
                    <th className="px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">الاسم</th>
                    <th className="px-4 py-3 font-bold">الهاتف</th>
                    <th className="px-4 py-3 font-bold">الحالة</th>
                    <th className="px-4 py-3 font-bold">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-950/10">
                  {preview.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.phone}`}>
                      <td className="px-4 py-3 text-xs text-brand-950/50">{row.rowNumber}</td>
                      <td className="px-4 py-3 text-sm font-bold text-brand-950">
                        {row.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-950/70">
                        {row.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.status)}>
                          {statusLabel(row.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600">
                        {row.errors.length > 0 ? row.errors.join("، ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              رجوع
            </Button>
            <Button
              type="button"
              onClick={() => void handleImport()}
              loading={importPending}
              disabled={preview.readyCount === 0}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              استيراد {formatNumber(preview.readyCount)} عميل
            </Button>
          </div>
        </Card>
      )}

      {isParsing && (
        <Card className="p-6">
          <Skeleton className="h-24" />
        </Card>
      )}
    </div>
  );
}

function statusLabel(status: "ready" | "duplicate" | "invalid"): string {
  if (status === "ready") return "جاهز";
  if (status === "duplicate") return "مكرر";
  return "غير صالح";
}

function statusVariant(status: "ready" | "duplicate" | "invalid") {
  if (status === "ready") return "success" as const;
  if (status === "duplicate") return "warning" as const;
  return "danger" as const;
}
