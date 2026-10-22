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
    label: "VIP عماد أفندي",
    description: "أفضل العملاء وأكثرهم إنفاقاً وولاءً للكافيه",
    color: "#d4af37",
    badgeClass: "bg-[#d4af37]/15 text-[#f5d36e] border-[#d4af37]/35 shadow-sm",
    dotClass: "bg-[#f5d36e]",
    accentClass: "from-[#d4af37] to-[#f5d36e]",
    template:
      "أهلاً {{name}}، أنت من أهم عملاء عماد أفندي VIP. بمناسبة وفائك الجميل، طلبك الجاي عليه مشروب {{drink}} هدية. كود الخصم: {{discount}}. مستنينك تنورنا في أي وقت!",
  },
  LOYAL_REGULAR: {
    label: "عميل دائم",
    description: "بيزور الكافيه بانتظام وبيطلب باستمرار",
    color: "#10B981",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-400",
    accentClass: "from-emerald-400 to-emerald-600",
    template:
      "أهلاً {{name}}، وحشتنا قهوتك مع عماد أفندي! عميلنا الدائم له مكان خاص: خصم {{discount}} على طلبك الجاي. اختار {{drink}} واستمتع.",
  },
  PROMISING_NEW: {
    label: "عميل جديد",
    description: "أول زيارة أو لسه في بداية التجربة معنا",
    color: "#38BDF8",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-400",
    accentClass: "from-sky-400 to-sky-600",
    template:
      "أهلاً {{name}}، نورت عائلة عماد أفندي! عشان نبدأ التجربة صح، ليك خصم {{discount}} على زيارتك القادمة. جرب {{drink}} وقولنا رأيك.",
  },
  SLIPPING_AWAY: {
    label: "على وشك الفقدان",
    description: "بقاله فترة مجاش ومحتاج رسالة دافية تفكره بينا",
    color: "#F59E0B",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-400",
    accentClass: "from-amber-400 to-amber-600",
    template:
      "وحشتنا يا {{name}}! مكانك لسه محجوز في عماد أفندي وبقالك فترة مجتش. خصم {{discount}} مستنيك على {{drink}} في زيارتك الجاية.",
  },
  CHURNED_LOST: {
    label: "عميل منقطع",
    description: "غاب لفترة طويلة ومحتاجين نرجعه بعرض مغري",
    color: "#F43F5E",
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-400",
    accentClass: "from-rose-400 to-rose-600",
    template:
      "{{name}} الغالي، افتقدنا وجودك جداً في عماد أفندي! جهزنالك خصم خاص {{discount}} وكوباية {{drink}} مظبوطة على حسابنا عشان تنورنا تاني.",
  },
  CUSTOM: {
    label: "تصنيف مخصص",
    description: "عميل بيتابع يدوياً حسب طلب الإدارة",
    color: "#c8a34b",
    badgeClass: "bg-[#c8a34b]/15 text-[#f5d36e] border-[#c8a34b]/30",
    dotClass: "bg-[#c8a34b]",
    accentClass: "from-[#c8a34b] to-[#d4af37]",
    template:
      "أهلاً {{name}}، عندنا عرض خاص ليك في عماد أفندي: خصم {{discount}} على طلبك الجاي. مستنينك تنورنا!",
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

export const SOURCE_LABELS: Record<OrderSource, string> = {
  CASHIER_MANUAL: "الكاشير",
  FOODICS_IMPORT: "فودكس POS",
  WEB_MENU: "المنيو الإلكتروني",
  QR_LOYALTY: "تطبيق الولاء",
};

export function getSegmentMeta(segment: CustomerSegment): SegmentMeta {
  return SEGMENT_MAP[segment] ?? SEGMENT_MAP.CUSTOM;
}
