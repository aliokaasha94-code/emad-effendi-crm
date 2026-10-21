export type CustomerSegment =
  | "VIP_CHAMPION"
  | "LOYAL_REGULAR"
  | "PROMISING_NEW"
  | "SLIPPING_AWAY"
  | "CHURNED_LOST"
  | "CUSTOM";

export type OrderSource =
  | "CASHIER_MANUAL"
  | "FOODICS_IMPORT"
  | "WEB_MENU"
  | "QR_LOYALTY";

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  date_of_birth: string | null;
  favorite_drink: string | null;
  preferred_seating: string | null;
  custom_notes: string | null;
  total_spent: number;
  orders_count: number;
  loyalty_points: number;
  first_seen_at: string;
  last_seen_at: string | null;
  segment: CustomerSegment;
  rfm_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmbeddedCustomer {
  full_name: string;
  phone_number: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  receipt_number: string | null;
  amount: number;
  source: OrderSource;
  items_summary: string | null;
  created_at: string;
  customers?: EmbeddedCustomer | EmbeddedCustomer[] | null;
}

export interface Campaign {
  id: string;
  title: string;
  target_segment: CustomerSegment;
  message_template: string;
  discount_code: string | null;
  recipients_count: number;
  converted_count: number;
  created_at: string;
}

export interface CustomerInput {
  full_name: string;
  phone_number: string;
  email?: string | null;
  date_of_birth?: string | null;
  favorite_drink?: string | null;
  preferred_seating?: string | null;
  custom_notes?: string | null;
  segment?: CustomerSegment;
}

export interface TransactionInput {
  customer_id: string;
  amount: number;
  receipt_number?: string | null;
  items_summary?: string | null;
  source?: OrderSource;
}

export interface CampaignInput {
  title: string;
  target_segment: CustomerSegment;
  message_template: string;
  discount_code?: string | null;
  recipients_count: number;
}

export type CampaignUpdate = Partial<Omit<Campaign, "id" | "created_at">>;

export interface DashboardSegmentCount {
  segment: CustomerSegment;
  count: number;
}

export interface DashboardDailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardTopCustomer {
  id: string;
  full_name: string;
  phone_number: string;
  total_spent: number;
  orders_count: number;
  segment: CustomerSegment;
}

export interface DashboardRecentTransaction {
  id: string;
  amount: number;
  created_at: string;
  source: OrderSource;
  customer_name: string | null;
  customer_phone: string | null;
}

export interface DashboardOverview {
  total_customers: number;
  active_customers: number;
  at_risk: number;
  total_points: number;
  month_revenue: number;
  month_transactions: number;
  segments: DashboardSegmentCount[];
  daily_revenue: DashboardDailyRevenue[];
  top_customers: DashboardTopCustomer[];
  recent_transactions: DashboardRecentTransaction[];
}

export type CustomerSort = "recent" | "spent" | "name";

export interface CustomerFilters {
  search: string;
  segment: CustomerSegment | "ALL";
  sort: CustomerSort;
  page: number;
  pageSize?: number;
}

export interface CustomersPage {
  rows: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
