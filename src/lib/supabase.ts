import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

const INVALID_URL_MARKERS = ["your-project-ref", "example.supabase.co", "your-project"];
const INVALID_KEY_MARKERS = ["your-anon-key"];

function isPlaceholder(value: string, markers: string[]): boolean {
  const normalized = value.toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
}

function resolveUrl(value: string): string | null {
  if (!value || isPlaceholder(value, INVALID_URL_MARKERS)) return null;

  const cleaned = value.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(cleaned)) return null;

  try {
    new URL(cleaned);
  } catch {
    return null;
  }

  return cleaned;
}

function resolveKey(value: string): string | null {
  if (!value || isPlaceholder(value, INVALID_KEY_MARKERS)) return null;
  return value;
}

const resolvedUrl = resolveUrl(rawUrl);
const resolvedKey = resolveKey(rawKey);

export const isSupabaseConfigured = Boolean(resolvedUrl && resolvedKey);

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && resolvedUrl && resolvedKey
    ? createClient(resolvedUrl, resolvedKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const SUPABASE_SETUP_MESSAGE =
  "إعدادات Supabase غير مكتملة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env ثم أعد تشغيل التطبيق.";

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}
