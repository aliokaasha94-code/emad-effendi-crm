import Papa from "papaparse";
import * as XLSX from "xlsx";
import { SEGMENT_MAP } from "@/lib/segments";
import { isValidEgyptianMobile, normalizePhone } from "@/lib/phone";
import type { CustomerSegment } from "@/types/crm";

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 1000;

export type ImportField =
  | "name"
  | "phone"
  | "email"
  | "dateOfBirth"
  | "favoriteDrink"
  | "preferredSeating"
  | "notes"
  | "segment";

export type ImportRowStatus = "ready" | "duplicate" | "invalid";

export interface RawImportRow {
  rowNumber: number;
  values: Record<string, unknown>;
}

export interface ParsedCustomerFile {
  fileName: string;
  headers: string[];
  rows: RawImportRow[];
}

export type ImportMapping = Record<ImportField, string>;

export interface MappingField {
  key: ImportField;
  label: string;
  required: boolean;
}

export interface ImportRow {
  rowNumber: number;
  name: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  favoriteDrink: string | null;
  preferredSeating: string | null;
  notes: string | null;
  segment: CustomerSegment | null;
  status: ImportRowStatus;
  errors: string[];
}

export interface ImportPreview {
  rows: ImportRow[];
  total: number;
  readyCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export const MAPPING_FIELDS: MappingField[] = [
  { key: "name", label: "اسم العميل", required: true },
  { key: "phone", label: "رقم الهاتف", required: true },
  { key: "email", label: "البريد الإلكتروني", required: false },
  { key: "dateOfBirth", label: "تاريخ الميلاد", required: false },
  { key: "favoriteDrink", label: "المشروب المفضل", required: false },
  { key: "preferredSeating", label: "المكان المفضل", required: false },
  { key: "notes", label: "ملاحظات", required: false },
  { key: "segment", label: "التصنيف", required: false },
];

const FIELD_ALIASES: Record<ImportField, string[]> = {
  name: [
    "الاسم",
    "اسم العميل",
    "اسم",
    "الاسم الكامل",
    "اسم كامل",
    "customer name",
    "customer",
    "full name",
    "fullname",
    "name",
  ],
  phone: [
    "رقم الهاتف",
    "الهاتف",
    "الموبايل",
    "رقم الموبايل",
    "التليفون",
    "رقم التليفون",
    "واتساب",
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "whatsapp",
  ],
  email: [
    "البريد الإلكتروني",
    "البريد الالكتروني",
    "الايميل",
    "الإيميل",
    "بريد الكتروني",
    "email",
    "email address",
    "e-mail",
    "mail",
  ],
  dateOfBirth: [
    "تاريخ الميلاد",
    "تاريخ ميلاد",
    "عيد الميلاد",
    "الميلاد",
    "birthday",
    "birth date",
    "date of birth",
    "dob",
  ],
  favoriteDrink: [
    "المشروب المفضل",
    "مشروب مفضل",
    "المشروب",
    "القهوة المفضلة",
    "favorite drink",
    "favourite drink",
    "favorite beverage",
    "drink",
  ],
  preferredSeating: [
    "المكان المفضل",
    "الجلسة المفضلة",
    "مكان الجلوس المفضل",
    "الجلوس المفضل",
    "preferred seating",
    "favorite seat",
    "seating",
  ],
  notes: ["ملاحظات", "ملحوظات", "ملاحظة", "notes", "note", "comments", "comment"],
  segment: ["التصنيف", "الفئة", "الشريحة", "segment", "category", "tier"],
};

const SEGMENT_ALIASES: Record<CustomerSegment, string[]> = {
  VIP_CHAMPION: ["VIP", "vip", "champion", "VIP Champion", "في اي بي", "عميل VIP"],
  LOYAL_REGULAR: ["Loyal", "Regular", "loyal regular", "دائم", "عميل دائم"],
  PROMISING_NEW: ["New", "Promising", "promising new", "جديد", "عميل جديد"],
  SLIPPING_AWAY: ["Slipping", "At risk", "slipping away", "على وشك الفقدان", "في خطر"],
  CHURNED_LOST: ["Churned", "Lost", "churned lost", "مفقود", "عميل مفقود"],
  CUSTOM: ["Custom", "custom", "مخصص", "تصنيف مخصص"],
};

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const INVISIBLE_CHARACTERS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

const SUPPORTED_EXTENSIONS = new Set(["csv", "tsv", "txt", "xlsx", "xls"]);

const SEGMENT_LOOKUP = new Map<string, CustomerSegment>();
for (const [segment, meta] of Object.entries(SEGMENT_MAP) as [
  CustomerSegment,
  (typeof SEGMENT_MAP)[CustomerSegment],
][]) {
  SEGMENT_LOOKUP.set(normalizeKey(segment), segment);
  SEGMENT_LOOKUP.set(normalizeKey(meta.label), segment);
  for (const alias of SEGMENT_ALIASES[segment]) {
    SEGMENT_LOOKUP.set(normalizeKey(alias), segment);
  }
}

export function normalizeKey(value: string): string {
  return normalizeDigits(value)
    .replace(ARABIC_DIACRITICS, "")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function emptyMapping(): ImportMapping {
  return {
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    favoriteDrink: "",
    preferredSeating: "",
    notes: "",
    segment: "",
  };
}

export function guessMapping(headers: string[]): ImportMapping {
  const mapping = emptyMapping();

  for (const field of MAPPING_FIELDS) {
    const aliases = FIELD_ALIASES[field.key].map(normalizeKey);
    const exact = headers.find((header) => aliases.includes(normalizeKey(header)));
    if (exact) {
      mapping[field.key] = exact;
      continue;
    }

    const partial = headers.find((header) => {
      const key = normalizeKey(header);
      if (!key) return false;
      return aliases.some((alias) => key.includes(alias) || alias.includes(key));
    });
    if (partial) {
      mapping[field.key] = partial;
    }
  }

  if (mapping.name && mapping.phone && mapping.name === mapping.phone) {
    mapping.phone = "";
  }

  return mapping;
}

export async function parseCustomerFile(file: File): Promise<ParsedCustomerFile> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error("صيغة الملف غير مدعومة. استخدم CSV أو Excel.");
  }
  if (file.size === 0) {
    throw new Error("الملف فارغ.");
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error("حجم الملف أكبر من 10 ميجابايت.");
  }

  let table: unknown[][];
  if (extension === "xlsx" || extension === "xls") {
    table = await readWorkbook(file);
  } else {
    table = await readDelimitedFile(file);
  }

  return buildParsedFile(table, file.name);
}

export function buildImportRows(
  parsed: ParsedCustomerFile,
  mapping: ImportMapping,
): ImportRow[] {
  if (!mapping.name.trim() || !mapping.phone.trim()) {
    throw new Error("يجب تحديد عمود الاسم ورقم الهاتف.");
  }

  const rows: ImportRow[] = parsed.rows.map((rawRow) => {
    const errors: string[] = [];
    const name = collapseWhitespace(
      cellToText(rawRow.values[mapping.name]),
    );
    const phoneInput = cellToText(rawRow.values[mapping.phone]).trim();
    const emailInput = cellToText(rawRow.values[mapping.email]).trim();
    const birthValue = mapping.dateOfBirth
      ? rawRow.values[mapping.dateOfBirth]
      : "";
    const drink = collapseWhitespace(cellToText(rawRow.values[mapping.favoriteDrink]));
    const seating = collapseWhitespace(
      cellToText(rawRow.values[mapping.preferredSeating]),
    );
    const notes = collapseWhitespace(cellToText(rawRow.values[mapping.notes]));
    const segmentInput = mapping.segment
      ? cellToText(rawRow.values[mapping.segment])
      : "";

    if (!name) {
      errors.push("اسم العميل مطلوب.");
    }

    const phone = normalizePhone(phoneInput);
    if (!phoneInput) {
      errors.push("رقم الهاتف مطلوب.");
    } else if (!isValidEgyptianMobile(phone)) {
      errors.push("رقم الهاتف غير صحيح.");
    }

    let email: string | null = null;
    if (emailInput) {
      if (!isValidEmail(emailInput)) {
        errors.push("البريد الإلكتروني غير صحيح.");
      } else {
        email = emailInput.toLowerCase();
      }
    }

    const birthDate = parseBirthDate(birthValue);
    if (!birthDate.valid) {
      errors.push("تاريخ الميلاد غير صحيح.");
    }

    const segment = parseSegment(segmentInput);
    if (!segment.valid) {
      errors.push("التصنيف غير معروف.");
    }

    return {
      rowNumber: rawRow.rowNumber,
      name,
      phone,
      email,
      dateOfBirth: birthDate.value,
      favoriteDrink: drink || null,
      preferredSeating: seating || null,
      notes: notes || null,
      segment: segment.value,
      status: errors.length > 0 ? "invalid" : "ready",
      errors,
    };
  });

  const phoneCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();

  for (const row of rows) {
    if (isValidEgyptianMobile(row.phone)) {
      phoneCounts.set(row.phone, (phoneCounts.get(row.phone) ?? 0) + 1);
    }
    const norm = normalizeNameForMatch(row.name);
    if (norm) {
      nameCounts.set(norm, (nameCounts.get(norm) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    if ((phoneCounts.get(row.phone) ?? 0) > 1) {
      row.status = "invalid";
      if (!row.errors.includes("رقم الهاتف مكرر داخل الملف.")) {
        row.errors.push("رقم الهاتف مكرر داخل الملف.");
      }
    }
    const norm = normalizeNameForMatch(row.name);
    if (norm && (nameCounts.get(norm) ?? 0) > 1) {
      row.status = "invalid";
      if (!row.errors.includes("اسم العميل مكرر داخل الملف.")) {
        row.errors.push("اسم العميل مكرر داخل الملف.");
      }
    }
  }

  return rows;
}

export function normalizeNameForMatch(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_.]+/g, " ");
}

export function buildImportPreview(
  rows: ImportRow[],
  existingPhones: Iterable<string>,
  existingNames?: Iterable<string>,
): ImportPreview {
  const existing = new Set(
    Array.from(existingPhones, (phone) => normalizePhone(phone)).filter((phone) =>
      isValidEgyptianMobile(phone),
    ),
  );

  const existingNameSet = new Set<string>();
  if (existingNames) {
    for (const name of existingNames) {
      existingNameSet.add(normalizeNameForMatch(name));
    }
  }

  const previewRows = rows.map<ImportRow>((row) => {
    if (row.status !== "ready") return row;
    
    const errors = [...row.errors];
    let isDup = false;

    if (existing.has(row.phone)) {
      isDup = true;
      errors.push("رقم الهاتف مسجل بالفعل في قاعدة البيانات.");
    }

    const normName = normalizeNameForMatch(row.name);
    if (normName && existingNameSet.has(normName)) {
      isDup = true;
      errors.push("اسم العميل مسجل بالفعل في قاعدة البيانات.");
    }

    if (isDup) {
      return { ...row, status: "duplicate", errors };
    }

    return row;
  });

  return {
    rows: previewRows,
    total: previewRows.length,
    readyCount: previewRows.filter((row) => row.status === "ready").length,
    duplicateCount: previewRows.filter((row) => row.status === "duplicate").length,
    invalidCount: previewRows.filter((row) => row.status === "invalid").length,
  };
}

export function downloadImportTemplate(): void {
  const headers = MAPPING_FIELDS.map((field) => field.label);
  const sample = [
    "أحمد محمد",
    "01012345678",
    "ahmed@example.com",
    "1995-04-12",
    "لاتيه",
    "ركن الهدوء",
    "يفضل القهوة بدون سكر",
    "عميل دائم",
  ];
  const csv = [headers, sample]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "قالب-استيراد-العملاء.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function readDelimitedFile(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: (results) => resolve(results.data),
      error: (error) =>
        reject(
          new Error(
            `تعذر قراءة الملف. تأكد من أن الملف سليم ثم حاول مرة أخرى. ${error.message}`,
          ),
        ),
    });
  });
}

async function readWorkbook(file: File): Promise<unknown[][]> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("الملف لا يحتوي على أي ورقة بيانات.");
    }
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("ورقة بيانات")) {
      throw error;
    }
    throw new Error("تعذر قراءة الملف. تأكد من أن الملف سليم ثم حاول مرة أخرى.");
  }
}

function buildParsedFile(table: unknown[][], fileName: string): ParsedCustomerFile {
  const rows = table.filter((row) => row.some((cell) => cellToText(cell).trim() !== ""));
  if (rows.length === 0) {
    throw new Error("الملف فارغ.");
  }

  const headerIndex = table.findIndex((row) =>
    row.some((cell) => cellToText(cell).trim() !== ""),
  );
  const headerRow = table[headerIndex] ?? [];
  let lastHeaderIndex = -1;
  headerRow.forEach((cell, index) => {
    if (cellToText(cell).trim() !== "") lastHeaderIndex = index;
  });

  if (lastHeaderIndex < 0) {
    throw new Error(
      "الملف لا يحتوي على بيانات كافية. يجب أن يحتوي على صف عناوين وصف بيانات واحد على الأقل.",
    );
  }

  const headers: string[] = [];
  const usedHeaders = new Set<string>();
  for (let index = 0; index <= lastHeaderIndex; index += 1) {
    const rawHeader = cellToText(headerRow[index]).trim();
    const baseHeader = rawHeader || `عمود ${index + 1}`;
    let header = baseHeader;
    let suffix = 2;
    while (usedHeaders.has(header)) {
      header = `${baseHeader} (${suffix})`;
      suffix += 1;
    }
    usedHeaders.add(header);
    headers.push(header);
  }

  const dataRows = table
    .slice(headerIndex + 1)
    .map((cells, index) => {
      const values: Record<string, unknown> = {};
      headers.forEach((header, columnIndex) => {
        values[header] = cells[columnIndex] ?? "";
      });
      const hasValue = headers.some(
        (header) => cellToText(values[header]).trim() !== "",
      );
      return { rowNumber: headerIndex + index + 2, values, hasValue };
    })
    .filter((row) => row.hasValue)
    .map(({ rowNumber, values }) => ({ rowNumber, values }));

  if (dataRows.length === 0) {
    throw new Error(
      "الملف لا يحتوي على بيانات كافية. يجب أن يحتوي على صف عناوين وصف بيانات واحد على الأقل.",
    );
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new Error("الملف يحتوي على أكثر من 1000 صف. قسّم الملف ثم حاول مرة أخرى.");
  }

  return { fileName, headers, rows: dataRows };
}

function normalizeDigits(value: string): string {
  return value.replace(ARABIC_INDIC_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatDateParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    ) ?? "";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }
  return String(value).trim();
}

function parseBirthDate(value: unknown): { value: string | null; valid: boolean } {
  if (value === null || value === undefined) {
    return { value: null, valid: true };
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { value: null, valid: false };
    const formatted = formatDateParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    );
    return { value: formatted, valid: formatted !== null };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1) {
      return { value: null, valid: false };
    }
    const date = new Date(
      Date.UTC(1899, 11, 30) + Math.round(value) * 24 * 60 * 60 * 1000,
    );
    const formatted = formatDateParts(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
    return { value: formatted, valid: formatted !== null };
  }

  const text = normalizeDigits(String(value)).trim();
  if (!text) return { value: null, valid: true };

  const yearFirst = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
  if (yearFirst) {
    const formatted = formatDateParts(
      Number(yearFirst[1]),
      Number(yearFirst[2]),
      Number(yearFirst[3]),
    );
    return { value: formatted, valid: formatted !== null };
  }

  const dayFirst = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (dayFirst) {
    const formatted = formatDateParts(
      Number(dayFirst[3]),
      Number(dayFirst[2]),
      Number(dayFirst[1]),
    );
    return { value: formatted, valid: formatted !== null };
  }

  return { value: null, valid: false };
}

function formatDateParts(year: number, month: number, day: number): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (date.getTime() > today) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseSegment(value: string): { value: CustomerSegment | null; valid: boolean } {
  const key = normalizeKey(value);
  if (!key) return { value: null, valid: true };
  return { value: SEGMENT_LOOKUP.get(key) ?? null, valid: SEGMENT_LOOKUP.has(key) };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
