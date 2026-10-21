import { useQuery } from "@tanstack/react-query";
import { SEGMENT_ORDER } from "@/lib/segments";
import { requireSupabase } from "@/lib/supabase";
import type {
  CustomerSegment,
  DashboardDailyRevenue,
  DashboardOverview,
  DashboardRecentTransaction,
  DashboardSegmentCount,
  DashboardTopCustomer,
  OrderSource,
} from "@/types/crm";

const EMPTY_OVERVIEW: DashboardOverview = {
  total_customers: 0,
  active_customers: 0,
  at_risk: 0,
  total_points: 0,
  month_revenue: 0,
  month_transactions: 0,
  segments: [],
  daily_revenue: [],
  top_customers: [],
  recent_transactions: [],
};

const ORDER_SOURCES: OrderSource[] = [
  "CASHIER_MANUAL",
  "FOODICS_IMPORT",
  "WEB_MENU",
  "QR_LOYALTY",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toSource(value: unknown): OrderSource {
  return typeof value === "string" && ORDER_SOURCES.includes(value as OrderSource)
    ? (value as OrderSource)
    : "CASHIER_MANUAL";
}

function toSegment(value: unknown): CustomerSegment {
  return typeof value === "string" &&
    SEGMENT_ORDER.includes(value as CustomerSegment)
    ? (value as CustomerSegment)
    : "CUSTOM";
}

function segmentOrder(segment: CustomerSegment): number {
  const index = SEGMENT_ORDER.indexOf(segment);
  return index === -1 ? SEGMENT_ORDER.length : index;
}

export function normalizeDashboard(raw: unknown): DashboardOverview {
  if (!isRecord(raw)) {
    return EMPTY_OVERVIEW;
  }

  const segments: DashboardSegmentCount[] = toArray(raw.segments)
    .filter(isRecord)
    .filter((item) => typeof item.segment === "string")
    .map((item) => ({
      segment: toSegment(item.segment),
      count: toNumber(item.count),
    }))
    .sort((left, right) => segmentOrder(left.segment) - segmentOrder(right.segment));

  const dailyRevenue: DashboardDailyRevenue[] = toArray(raw.daily_revenue)
    .filter(isRecord)
    .filter((item) => typeof item.date === "string" && item.date.length > 0)
    .map((item) => ({
      date: item.date as string,
      revenue: toNumber(item.revenue),
      orders: toNumber(item.orders),
    }));

  const topCustomers: DashboardTopCustomer[] = toArray(raw.top_customers)
    .filter(isRecord)
    .filter((item) => typeof item.id === "string")
    .slice(0, 5)
    .map((item) => ({
      id: item.id as string,
      full_name:
        typeof item.name === "string" && item.name.length > 0
          ? item.name
          : typeof item.full_name === "string" && item.full_name.length > 0
            ? item.full_name
            : "عميل",
      phone_number:
        typeof item.phone === "string" && item.phone.length > 0
          ? item.phone
          : typeof item.phone_number === "string"
            ? item.phone_number
            : "",
      total_spent: toNumber(item.total_spent),
      orders_count: toNumber(item.orders_count),
      segment: toSegment(item.segment),
    }));

  const recentTransactions: DashboardRecentTransaction[] = toArray(
    raw.recent_transactions,
  )
    .filter(isRecord)
    .filter(
      (item) => typeof item.id === "string" && typeof item.created_at === "string",
    )
    .slice(0, 8)
    .map((item) => ({
      id: item.id as string,
      amount: toNumber(item.amount),
      created_at: item.created_at as string,
      source: toSource(item.source),
      customer_name:
        typeof item.customer_name === "string" && item.customer_name.length > 0
          ? item.customer_name
          : null,
      customer_phone:
        typeof item.customer_phone === "string" && item.customer_phone.length > 0
          ? item.customer_phone
          : null,
    }));

  return {
    total_customers: toNumber(raw.total_customers),
    active_customers: toNumber(raw.active_customers),
    at_risk: toNumber(raw.at_risk),
    total_points: toNumber(raw.total_points),
    month_revenue: toNumber(raw.month_revenue),
    month_transactions: toNumber(raw.month_transactions),
    segments,
    daily_revenue: dailyRevenue,
    top_customers: topCustomers,
    recent_transactions: recentTransactions,
  };
}

export function useDashboard() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard"],
    staleTime: 60_000,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client.rpc("dashboard_overview");

      if (error) {
        throw new Error("تعذر تحميل بيانات لوحة التحكم.");
      }

      return normalizeDashboard(data);
    },
  });
}
