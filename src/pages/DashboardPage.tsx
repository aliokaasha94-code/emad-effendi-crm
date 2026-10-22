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
  ArrowUpRight,
  Sparkles,
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
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartTriggersWidget } from "@/components/dashboard/SmartTriggersWidget";
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

const cnDotClass = (dotClass: string) => `h-2 w-2 rounded-full ${dotClass}`;

export function DashboardPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { data: overview, isLoading, isError, refetch } = useDashboard();
  const { data: customersData } = useCustomers({
    search: "",
    segment: "ALL",
    sort: "recent",
    page: 1,
    pageSize: 100,
  });

  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split("@")[0] ??
    t("كاشير عماد أفندي", "Emad Afandi Staff");

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
      <Card className="surface-glass p-6 text-center">
        <EmptyState
          icon={Activity}
          title={t("تعذر تحميل لوحة التحكم", "Failed to load dashboard")}
          description={t("حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.", "An error occurred while loading data. Please try again.")}
          action={
            <Button type="button" onClick={() => void refetch()} variant="primary">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("إعادة المحاولة", "Retry")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow={{ ar: "كافيه ومحمصة عماد أفندي", en: "Emad Afandi Cafe & Roastery" }}
        title={{
          ar: `${greeting()}، ${userName} 👋`,
          en: `${greeting()}, ${userName} 👋`,
        }}
        description={{
          ar: "تحليلات فورية لقاعدة العملاء، سلوك الشراء، والمبيعات اليومية.",
          en: "Real-time analytics for your customer base, purchasing behavior, and revenue.",
        }}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/cashier">
              <Button variant="primary" size="sm">
                <Coins className="h-4 w-4" />
                <span>{t("تسجيل طلب سريع", "Quick Order")}</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          label={t("إجمالي العملاء", "Total Customers")}
          value={overview.total_customers}
          hint={pluralizeCustomers(overview.total_customers)}
          icon={Users}
          tone="neutral"
        />
        <StatCard
          label={t("العملاء النشطون (VIP والدائمين)", "Active VIP & Regulars")}
          value={overview.active_customers}
          hint={t("يشكلون أعلى نسبة مبيعات", "Driving core repeat visits")}
          icon={Star}
          tone="gold"
        />
        <StatCard
          label={t("عملاء على وشك الفقدان", "At-Risk Customers")}
          value={overview.at_risk}
          hint={t("يحتاجون إرسال رسالة واتساب", "Ready for WhatsApp campaign")}
          icon={Heart}
          tone="danger"
        />
        <StatCard
          label={t("مبيعات هذا الشهر", "Monthly Revenue")}
          value={formatCurrency(overview.month_revenue)}
          hint={`${formatNumber(overview.month_transactions)} ${t("طلب مسجل", "completed orders")}`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label={t("نقاط الولاء المجمعة", "Total Loyalty Points")}
          value={overview.total_points}
          hint={t("رصيد نقاط عملاء الكافيه", "Active customer balance")}
          icon={Coins}
          tone="gold"
        />
        <StatCard
          label={t("متوسط قيمة الطلب (AOV)", "Avg Order Value")}
          value={
            formatCurrency(
              overview.month_transactions > 0
                ? overview.month_revenue / overview.month_transactions
                : 0,
            )
          }
          hint={t("خلال الشهر الحالي", "During current month")}
          icon={Activity}
          tone="neutral"
        />
      </motion.div>

      {/* Smart Retention & Birthday Triggers */}
      <SmartTriggersWidget customers={customersData?.customers ?? []} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Area Chart */}
        <Card className="surface-glass p-5 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#F5EFE6]">
                  {t("مبيعات آخر 30 يوماً", "Sales Last 30 Days")}
                </h2>
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {t("الإيراد اليومي المباشر بالجنيه المصري", "Daily revenue trend in EGP")}
              </p>
            </div>
            <Badge variant="gold">{t("آخر 30 يوم", "30 Days")}</Badge>
          </div>

          {chartData.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={t("لا توجد مبيعات بعد", "No sales yet")}
              description={t("ستظهر بيانات المبيعات هنا بعد تسجيل العمليات.", "Sales data will appear here after recording transactions.")}
            />
          ) : (
            <div dir="ltr" className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#d4af37" strokeOpacity={0.08} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(value) => formatNumber(Number(value))}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131618",
                      borderColor: "rgba(212, 175, 55, 0.4)",
                      borderRadius: "12px",
                      color: "#F5EFE6",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#f5d36e", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t("الإيراد (ج.م)", "Revenue (EGP)")}
                    stroke="#d4af37"
                    strokeWidth={2.5}
                    fill="url(#goldRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Customer Segmentation Distribution */}
        <Card className="surface-glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#F5EFE6]">
                {t("توزيع شرائح العملاء (RFM)", "RFM Segments")}
              </h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {pluralizeCustomers(overview.total_customers)}
              </p>
            </div>
            <Badge variant="brand">{t("التصنيف الذكي", "Smart RFM")}</Badge>
          </div>

          {totalPie === 0 ? (
            <EmptyState
              icon={Users}
              title={t("لا توجد شرائح بعد", "No segments yet")}
              description={t("أضف عملاء لعرض التوزيع.", "Add customers to see distribution.")}
            />
          ) : (
            <div dir="ltr" className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((item) => (
                      <Cell
                        key={item.segment}
                        fill={getSegmentMeta(item.segment).color}
                        stroke="#131618"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131618",
                      borderColor: "rgba(212, 175, 55, 0.4)",
                      borderRadius: "12px",
                      color: "#F5EFE6",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
            {pieData.map((item) => {
              const meta = getSegmentMeta(item.segment);
              return (
                <div
                  key={item.segment}
                  className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-white/5 transition"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-[#F5EFE6]/80">
                    <span className={cnDotClass(meta.dotClass)} aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="text-xs font-extrabold text-[#f5d36e]">
                    {formatNumber(item.count)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Customers & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Top VIP Customers */}
        <Card className="surface-glass p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#d4af37]" />
              <h2 className="text-base font-extrabold text-[#F5EFE6]">
                {t("أفضل عملاء عماد أفندي", "Top Emad Afandi Customers")}
              </h2>
            </div>
            <Link
              to="/customers"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#f5d36e] transition hover:text-[#d4af37]"
            >
              <span>{t("عرض كل العملاء", "View All")}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {overview.top_customers.length === 0 ? (
            <EmptyState
              icon={Crown}
              title={t("لا يوجد عملاء بعد", "No customers yet")}
              description={t("أفضل العملاء سيظهرون هنا تلقائياً بعد تسجيل الطلبات.", "Top customers will appear here automatically.")}
            />
          ) : (
            <div className="space-y-2.5">
              {overview.top_customers.map((customer, index) => (
                <Link
                  key={customer.id}
                  to={`/customers?customer=${customer.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#0d0f11] p-3 transition-all duration-200 hover:border-[#d4af37]/40 hover:bg-[#1a1d1f]"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      index === 0
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f5d36e] text-black shadow-md shadow-[#d4af37]/20"
                        : index === 1
                        ? "bg-slate-300 text-black"
                        : index === 2
                        ? "bg-amber-700/80 text-white"
                        : "bg-white/10 text-[#9CA3AF]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={customer.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#F5EFE6] group-hover:text-[#f5d36e] transition">
                      {customer.full_name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {formatNumber(customer.orders_count)} {t("طلب", "orders")}
                    </p>
                  </div>
                  <SegmentBadge segment={customer.segment} />
                  <span className="text-xs font-black text-[#f5d36e]">
                    {formatCurrency(customer.total_spent)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="surface-glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-[#F5EFE6]">
              {t("آخر العمليات", "Recent Transactions")}
            </h2>
            <Link
              to="/cashier"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#f5d36e] transition hover:text-[#d4af37]"
            >
              <span>{t("الكاشير", "Cashier")}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {overview.recent_transactions.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t("لا توجد عمليات بعد", "No transactions yet")}
              description={t("سجل أول عملية من صفحة الكاشير.", "Record your first transaction from the Cashier page.")}
            />
          ) : (
            <div className="space-y-2.5">
              {overview.recent_transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0d0f11] p-3 hover:border-white/10 transition"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/25 text-[#f5d36e]">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#F5EFE6]">
                      {transaction.customer_name ?? t("عميل كافيه", "Walk-in Guest")}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {SOURCE_LABELS[transaction.source]} • {formatDateTime(transaction.created_at)}
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#F5EFE6]">
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
