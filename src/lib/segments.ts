import type { CustomerSegment, OrderSource } from "@/types/crm";

export interface SegmentMeta {
  label: string;
  description: string;
  color: string;
  badgeClass: string;
  dotClass: string;
  accentClass: string;
  template: string;
}

export const SEGMENT_MAP: Record<CustomerSegment, SegmentMeta> = {
  VIP_CHAMPION: {
    label: "VIP",
    description: "أفضل العملاء وأكثرهم إنفاقاً وولاءً",
    color: "#D99A1F",
    badgeClass: "bg-gold-100 text-gold-800 border-gold-200",
    dotClass: "bg-gold-500",
    accentClass: "from-gold-400 to-gold-600",
    template:
      "أهلاً {{name}}، أنت من أفضل عملائنا في BaristaCRM. بمناسبة وفائك، عندك مشروب {{drink}} هدية في زيارتك القادمة. كود الخصم: {{discount}}. مستنينك!",
  },
  LOYAL_REGULAR: {
    label: "عميل دائم",
    description: "بيزورنا بانتظام وبيحقق مشتريات متكررة",
    color: "#4F8A6B",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
    accentClass: "from-emerald-400 to-emerald-600",
    template:
      "أهلاً {{name}}، وحشتنا! عميلنا الدائم له معاملة خاصة: خصم {{discount}} على طلبك الجاي. اختار {{drink}} واستمتع.",
  },
  PROMISING_NEW: {
    label: "عميل جديد",
    description: "أول مرة أو لسه في بداية العلاقة",
    color: "#5B8FB9",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    dotClass: "bg-sky-500",
    accentClass: "from-sky-400 to-sky-600",
    template:
      "أهلاً {{name}}، نورت BaristaCRM! عشان نبدأ صح، خد خصم {{discount}} على أول طلب ليك. جرّب {{drink}} وقولنا رأيك.",
  },
  SLIPPING_AWAY: {
    label: "على وشك الفقدان",
    description: "بقاله فترة مجاش ومحتاج متابعة",
    color: "#D97B45",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    dotClass: "bg-orange-500",
    accentClass: "from-orange-400 to-orange-600",
    template:
      "وحشتنا يا {{name}}! بقالك فترة مجتش. خصم {{discount}} مستنيك على {{drink}} في زيارتك الجاية.",
  },
  CHURNED_LOST: {
    label: "عميل مفقود",
    description: "غاب لفترة طويلة ومحتاج حملة استرجاع",
    color: "#C25B5B",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    dotClass: "bg-red-500",
    accentClass: "from-red-400 to-red-600",
    template:
      "{{name}}، افتقدناك! عايزين نرجع نشوفك تاني في BaristaCRM. خصم {{discount}} على طلبك الجاي، وكوباية {{drink}} على حسابنا.",
  },
  CUSTOM: {
    label: "تصنيف مخصص",
    description: "عميل بيتابع يدوياً حسب احتياج الكافيه",
    color: "#8A6A4F",
    badgeClass: "bg-brand-100 text-brand-800 border-brand-200",
    dotClass: "bg-brand-500",
    accentClass: "from-brand-400 to-brand-600",
    template:
      "أهلاً {{name}}، عندنا عرض خاص ليك: خصم {{discount}} على طلبك الجاي. مستنينك في BaristaCRM.",
  },
};

export const SEGMENT_ORDER: CustomerSegment[] = [
  "VIP_CHAMPION",
  "LOYAL_REGULAR",
  "PROMISING_NEW",
  "SLIPPING_AWAY",
  "CHURNED_LOST",
  "CUSTOM",
];

export function getSegmentMeta(segment: CustomerSegment): SegmentMeta {
  return SEGMENT_MAP[segment] ?? SEGMENT_MAP.CUSTOM;
}

export const SOURCE_LABELS: Record<OrderSource, string> = {
  CASHIER_MANUAL: "كاشير",
  FOODICS_IMPORT: "Foodics",
  WEB_MENU: "منيو الويب",
  QR_LOYALTY: "QR",
};
