import { Link } from "react-router-dom";
import {
  Activity,
  Coins,
  Crown,
  Heart,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  SegmentBadge,
  Skeleton,
  StatCard,
} from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatShortDate,
  greeting,
  pluralizeCustomers,
} from "@/lib/utils";
import { SEGMENT_ORDER, SOURCE_LABELS, getSegmentMeta } from "@/lib/segments";
import type { CustomerSegment } from "@/types/crm";

const cnDotClass = (dotClass: string) => `h-2 w-2 rounded-full ${dotClass}`;

export function DashboardPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { data: overview, isLoading, isError, refetch } = useDashboard();

  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split("@")[0] ??
    (t("مستخدم", "User"));

  const chartData =
    overview?.daily_revenue.map((item) => ({
      label: formatShortDate(item.date),
      revenue: item.revenue,
      orders: item.orders,
    })) ?? [];

  const pieData = SEGMENT_ORDER.map((segment) => ({
    segment,
    label: getSegmentMeta(segment).label,
    count: overview?.segments.find((item) => item.segment === segment)?.count ?? 0,
  })).filter((item) => item.count > 0);

  const totalPie = pieData.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-80 lg:col-span-3" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <Card className="surface-glass p-6">
        <EmptyState
          icon={Activity}
          title={t("تعذر تحميل لوحة التحكم", "Failed to load dashboard")}
          description={t("حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.", "An error occurred while loading data. Please try again.")}
          action={
            <Button type="button" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("إعادة المحاولة", "Retry")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={{ ar: "لوحة التحكم", en: "Dashboard" }}
        title={{ ar: `${greeting()}، ${userName}`, en: `${greeting()}, ${userName}` }}
        description={{
          ar: "نظرة سريعة على عملائك، مبيعاتك، وولائهم.",
          en: "Quick overview of your customers, sales, and loyalty.",
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("إجمالي العملاء", "Total Customers")}
          value={overview.total_customers}
          hint={pluralizeCustomers(overview.total_customers)}
          icon={Users}
          tone="neutral"
        />
        <StatCard
          label={t("العملاء النشطون", "Active Customers")}
          value={overview.active_customers}
          hint={t("VIP أو عميل دائم", "VIP or Loyal")}
          icon={Star}
          tone="gold"
        />
        <StatCard
          label={t("عملاء معرضون للفقدان", "At Risk Customers")}
          value={overview.at_risk}
          hint={t("يحتاجون حملة متابعة", "Need follow-up campaign")}
          icon={Heart}
          tone="danger"
        />
        <StatCard
          label={t("مبيعات الشهر", "Monthly Revenue")}
          value={formatCurrency(overview.month_revenue)}
          hint={`${formatNumber(overview.month_transactions)} ${t("عملية", "orders")}`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label={t("إجمالي النقاط", "Total Loyalty Points")}
          value={overview.total_points}
          hint={t("نقاط الولاء الحالية", "Current loyalty points")}
          icon={Coins}
          tone="gold"
        />
        <StatCard
          label={t("متوسط قيمة العملية", "Avg Order Value")}
          value={
            formatCurrency(
              overview.month_transactions > 0
                ? overview.month_revenue / overview.month_transactions
                : 0,
            )
          }
          hint={t("هذا الشهر", "This month")}
          icon={Activity}
          tone="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="surface-glass p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-black-50">
                {t("مبيعات آخر 30 يوماً", "Sales Last 30 Days")}
              </h2>
              <p className="mt-1 text-xs text-black-50/55">
                {t("الإيراد اليومي بالكامل", "Full daily revenue")}
              </p>
            </div>
            <Badge variant="gold">{t("شهري", "Monthly")}</Badge>
          </div>

          {chartData.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={t("لا توجد مبيعات بعد", "No sales yet")}
              description={t("ستظهر بيانات المبيعات هنا بعد تسجيل العمليات.", "Sales data will appear here after recording transactions.")}
            />
          ) : (
            <div dir="ltr" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f2ae2e" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#f2ae2e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff" strokeOpacity={0.08} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#e6e6e6", opacity: 0.6 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value) => formatNumber(Number(value))}
                    tick={{ fontSize: 11, fill: "#e6e6e6", opacity: 0.6 }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c97512"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="surface-glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-black-50">
                {t("توزيع الشرائح", "Segment Distribution")}
              </h2>
              <p className="mt-1 text-xs text-black-50/55">
                {pluralizeCustomers(overview.total_customers)}
              </p>
            </div>
            <Badge variant="brand">{t("الكل", "All")}</Badge>
          </div>

          {totalPie === 0 ? (
            <EmptyState
              icon={Users}
              title={t("لا توجد شرائح بعد", "No segments yet")}
              description={t("أضف عملاء لعرض التوزيع.", "Add customers to see distribution.")}
            />
          ) : (
            <div dir="ltr" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((item) => (
                      <Cell key={item.segment} fill={getSegmentMeta(item.segment).color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {pieData.map((item) => {
              const meta = getSegmentMeta(item.segment);
              return (
                <div key={item.segment} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-black-50/75">
                    <span className={cnDotClass(meta.dotClass)} aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="text-xs font-extrabold text-black-50">
                    {formatNumber(item.count)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="surface-glass p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-black-50">
              {t("أفضل العملاء", "Top Customers")}
            </h2>
            <Link
              to="/customers"
              className="text-xs font-bold text-gold-700 transition hover:text-gold-800 focus-ring"
            >
              {t("عرض الكل", "View All")}
            </Link>
          </div>

          {overview.top_customers.length === 0 ? (
            <EmptyState
              icon={Crown}
              title={t("لا يوجد عملاء مميزون بعد", "No top customers yet")}
              description={t("أفضل العملاء سيظهرون هنا تلقائياً.", "Top customers will appear here automatically.")}
            />
          ) : (
            <div className="space-y-3">
              {overview.top_customers.map((customer, index) => (
                <Link
                  key={customer.id}
                  to={`/customers?customer=${customer.id}`}
                  className="flex items-center gap-3 rounded-card border border-white/10 bg-white/5 p-3 transition hover:border-gold-300 hover:bg-white focus-ring"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-xs font-extrabold text-gold-800">
                    {index + 1}
                  </span>
                  <Avatar name={customer.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-black-50">
                      {customer.full_name}
                    </p>
                    <p className="text-xs text-black-50/55">
                      {formatNumber(customer.orders_count)} {t("عملية", "orders")}
                    </p>
                  </div>
                  <SegmentBadge segment={customer.segment} />
                  <span className="text-sm font-extrabold text-black-50">
                    {formatCurrency(customer.total_spent)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="surface-glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-black-50">
              {t("آخر العمليات", "Recent Transactions")}
            </h2>
            <Link
              to="/cashier"
              className="text-xs font-bold text-gold-700 transition hover:text-gold-800 focus-ring"
            >
              {t("الكاشير", "Cashier")}
            </Link>
          </div>

          {overview.recent_transactions.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t("لا توجد عمليات بعد", "No transactions yet")}
              description={t("سجل أول عملية من صفحة الكاشير.", "Record your first transaction from the Cashier page.")}
            />
          ) : (
            <div className="space-y-3">
              {overview.recent_transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 rounded-card border border-white/10 bg-white/5 p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black-200 text-black-50">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-black-50">
                      {transaction.customer_name ?? "عميل"}
                    </p>
                    <p className="text-xs text-black-50/55">
                      {SOURCE_LABELS[transaction.source]} • {formatDateTime(transaction.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-black-50">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
