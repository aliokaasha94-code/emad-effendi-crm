import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EmbeddedCustomer } from "@/types/crm";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number): string {
  return `${numberFormatter.format(value)} ج.م`;
}

const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date) : "—";
}

export function daysSince(value: string | Date | null | undefined): number | null {
  const date = toDate(value);
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";

  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return value;
}

export function greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "نهارك سعيد";
  return "مساء الخير";
}

export function pluralizeCustomers(count: number): string {
  if (count === 1) return "عميل واحد";
  if (count === 2) return "عميلان";
  if (count >= 3 && count <= 10) return `${formatNumber(count)} عملاء`;
  return `${formatNumber(count)} عميلاً`;
}

export function unwrapEmbeddedCustomer(
  value: EmbeddedCustomer | EmbeddedCustomer[] | null | undefined,
): EmbeddedCustomer | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
