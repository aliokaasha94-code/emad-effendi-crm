import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { isValidEgyptianMobile, normalizePhone } from "@/lib/phone";
import { requireSupabase } from "@/lib/supabase";
import type {
  Customer,
  CustomerFilters,
  CustomerInput,
  CustomerSegment,
  CustomerSort,
  Transaction,
  TransactionInput,
} from "@/types/crm";

export const CUSTOMERS_PAGE_SIZE = 12;
export const IMPORT_CHUNK_SIZE = 200;
export const SEGMENT_RECIPIENTS_LIMIT = 1000;

export const CUSTOMER_COLUMNS =
  "id, full_name, phone_number, email, date_of_birth, favorite_drink, preferred_seating, custom_notes, total_spent, orders_count, loyalty_points, first_seen_at, last_seen_at, segment, rfm_score, created_at, updated_at";

const CUSTOMERS_ERROR = "تعذر تحميل بيانات العملاء. حاول مرة أخرى.";
const CUSTOMER_ERROR = "تعذر تحميل بيانات العميل. حاول مرة أخرى.";
const CUSTOMER_TRANSACTIONS_ERROR = "تعذر تحميل سجل عمليات العميل. حاول مرة أخرى.";
const SAVE_CUSTOMER_ERROR = "تعذر حفظ بيانات العميل. حاول مرة أخرى.";
const DELETE_CUSTOMER_ERROR = "تعذر حذف العميل. حاول مرة أخرى.";
const PHONE_CONFLICT_MESSAGE = "رقم الهاتف مسجل بالفعل لعميل آخر.";
const PHONE_CHECK_ERROR = "تعذر التحقق من رقم الهاتف. حاول مرة أخرى.";
const IMPORT_ERROR = "تعذر استيراد العملاء. حاول مرة أخرى.";
const TRANSACTION_ERROR = "تعذر تسجيل العملية. حاول مرة أخرى.";
const RECENT_TRANSACTIONS_ERROR = "تعذر تحميل آخر العمليات. حاول مرة أخرى.";
const SEGMENT_RECIPIENTS_ERROR = "تعذر تحميل عملاء الشريحة. حاول مرة أخرى.";

const CUSTOMER_SORT: Record<CustomerSort, { column: string; ascending: boolean }> = {
  recent: { column: "last_seen_at", ascending: false },
  spent: { column: "total_spent", ascending: false },
  name: { column: "full_name", ascending: true },
};

interface CustomerPayload {
  full_name: string;
  phone_number: string;
  email: string | null;
  date_of_birth: string | null;
  favorite_drink: string | null;
  preferred_seating: string | null;
  custom_notes: string | null;
  segment?: CustomerSegment;
}

export interface UpdateCustomerVariables {
  id: string;
  input: CustomerInput;
}

export interface SegmentRecipient {
  id: string;
  full_name: string;
  phone_number: string;
  favorite_drink: string | null;
}

function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[(),%_\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCustomerInput(input: CustomerInput): CustomerPayload {
  const payload: CustomerPayload = {
    full_name: input.full_name.trim(),
    phone_number: normalizePhone(input.phone_number),
    email: input.email?.trim() || null,
    date_of_birth: input.date_of_birth?.trim() || null,
    favorite_drink: input.favorite_drink?.trim() || null,
    preferred_seating: input.preferred_seating?.trim() || null,
    custom_notes: input.custom_notes?.trim() || null,
  };
  if (input.segment) {
    payload.segment = input.segment;
  }
  return payload;
}

function isDuplicatePhoneError(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || Boolean(error.message?.includes("duplicate key"));
}

function invalidateCustomerQueries(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["customers"] }),
    queryClient.invalidateQueries({ queryKey: ["customer"] }),
    queryClient.invalidateQueries({ queryKey: ["customer-transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["segment-recipients"] }),
    queryClient.invalidateQueries({ queryKey: ["phone-conflict"] }),
    queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
  ]);
}

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ customers: Customer[]; total: number }> => {
      const client = requireSupabase();
      const from = (filters.page - 1) * CUSTOMERS_PAGE_SIZE;
      const to = from + CUSTOMERS_PAGE_SIZE - 1;

      let query = client
        .from("customers")
        .select(CUSTOMER_COLUMNS, { count: "exact" });

      if (filters.segment !== "ALL") {
        query = query.eq("segment", filters.segment);
      }

      const term = sanitizeSearchTerm(filters.search);
      if (term) {
        const digits = term.replace(/\D/g, "");
        const phoneTerm = digits.length >= 3 ? digits : term;
        query = query.or(
          `full_name.ilike.%${term}%,phone_number.ilike.%${phoneTerm}%`,
        );
      }

      const sort = CUSTOMER_SORT[filters.sort];
      const { data, error, count } = await query
        .order(sort.column, { ascending: sort.ascending })
        .range(from, to);

      if (error) {
        throw new Error(CUSTOMERS_ERROR);
      }

      return {
        customers: (data ?? []) as Customer[],
        total: count ?? 0,
      };
    },
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customer", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Customer> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("customers")
        .select(CUSTOMER_COLUMNS)
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(CUSTOMER_ERROR);
      }

      return data as Customer;
    },
  });
}

export function useCustomerTransactions(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-transactions", customerId],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<Transaction[]> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(CUSTOMER_TRANSACTIONS_ERROR);
      }

      return (data ?? []) as Transaction[];
    },
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const createCustomer = useMutation({
    mutationFn: async (input: CustomerInput): Promise<Customer> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("customers")
        .insert(normalizeCustomerInput(input))
        .select(CUSTOMER_COLUMNS)
        .single();

      if (error) {
        if (isDuplicatePhoneError(error)) {
          throw new Error(PHONE_CONFLICT_MESSAGE);
        }
        throw new Error(SAVE_CUSTOMER_ERROR);
      }

      return data as Customer;
    },
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });

  const updateCustomer = useMutation({
    mutationFn: async ({
      id,
      input,
    }: UpdateCustomerVariables): Promise<Customer> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("customers")
        .update(normalizeCustomerInput(input))
        .eq("id", id)
        .select(CUSTOMER_COLUMNS)
        .single();

      if (error) {
        if (isDuplicatePhoneError(error)) {
          throw new Error(PHONE_CONFLICT_MESSAGE);
        }
        throw new Error(SAVE_CUSTOMER_ERROR);
      }

      return data as Customer;
    },
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const client = requireSupabase();
      const { error } = await client.from("customers").delete().eq("id", id);

      if (error) {
        throw new Error(DELETE_CUSTOMER_ERROR);
      }
    },
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });

  return { createCustomer, updateCustomer, deleteCustomer };
}

export function usePhoneConflict(
  phone: string,
  excludedCustomerId?: string | null,
) {
  const normalizedPhone = normalizePhone(phone);

  return useQuery({
    queryKey: ["phone-conflict", normalizedPhone, excludedCustomerId ?? null],
    enabled: isValidEgyptianMobile(normalizedPhone),
    staleTime: 10_000,
    queryFn: async (): Promise<Customer | null> => {
      const client = requireSupabase();
      let query = client
        .from("customers")
        .select(CUSTOMER_COLUMNS)
        .eq("phone_number", normalizedPhone);

      if (excludedCustomerId) {
        query = query.neq("id", excludedCustomerId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw new Error(PHONE_CHECK_ERROR);
      }

      return (data as Customer | null) ?? null;
    },
  });
}

export async function fetchExistingPhones(): Promise<Set<string>> {
  const client = requireSupabase();
  const phones = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await client
      .from("customers")
      .select("phone_number")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(CUSTOMERS_ERROR);
    }

    const rows = (data ?? []) as { phone_number: string }[];
    for (const row of rows) {
      const normalized = normalizePhone(row.phone_number);
      if (normalized) {
        phones.add(normalized);
      }
    }

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return phones;
}

export function useImportCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: CustomerInput[]): Promise<{ inserted: number }> => {
      const client = requireSupabase();
      const seen = new Set<string>();
      const payload: CustomerPayload[] = [];

      for (const row of rows) {
        const entry = normalizeCustomerInput(row);
        if (!entry.full_name || !isValidEgyptianMobile(entry.phone_number)) {
          continue;
        }
        if (seen.has(entry.phone_number)) {
          continue;
        }
        seen.add(entry.phone_number);
        payload.push(entry);
      }

      let inserted = 0;

      for (let index = 0; index < payload.length; index += IMPORT_CHUNK_SIZE) {
        const chunk = payload.slice(index, index + IMPORT_CHUNK_SIZE);
        const { data, error } = await client
          .from("customers")
          .upsert(chunk, {
            onConflict: "phone_number",
            ignoreDuplicates: true,
          })
          .select("id");

        if (error) {
          throw new Error(IMPORT_ERROR);
        }

        inserted += (data ?? []).length;
      }

      return { inserted };
    },
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });
}

export function useSegmentRecipients(
  segment: CustomerSegment,
  enabled = true,
) {
  return useQuery({
    queryKey: ["segment-recipients", segment],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<SegmentRecipient[]> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("customers")
        .select("id, full_name, phone_number, favorite_drink")
        .eq("segment", segment)
        .order("last_seen_at", { ascending: false })
        .limit(SEGMENT_RECIPIENTS_LIMIT);

      if (error) {
        throw new Error(SEGMENT_RECIPIENTS_ERROR);
      }

      return (data ?? []) as SegmentRecipient[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransactionInput): Promise<Transaction> => {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        throw new Error("أدخل مبلغاً صحيحاً أكبر من صفر.");
      }

      const client = requireSupabase();
      const { data, error } = await client
        .from("transactions")
        .insert({
          customer_id: input.customer_id,
          amount: input.amount,
          receipt_number: input.receipt_number?.trim() || null,
          items_summary: input.items_summary?.trim() || null,
          source: input.source ?? "CASHIER_MANUAL",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(TRANSACTION_ERROR);
      }

      return data as Transaction;
    },
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });
}

export function useRecentTransactions(limit = 6) {
  return useQuery({
    queryKey: ["recent-transactions", limit],
    queryFn: async (): Promise<Transaction[]> => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("transactions")
        .select("*, customers(full_name, phone_number)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(RECENT_TRANSACTIONS_ERROR);
      }

      return (data ?? []) as Transaction[];
    },
  });
}
