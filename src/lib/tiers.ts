export type CustomerTierKey = "BRONZE" | "SILVER" | "GOLD" | "BLACK_DIAMOND";

export interface TierInfo {
  key: CustomerTierKey;
  name: { ar: string; en: string };
  badgeTitle: string;
  minPoints: number;
  maxPoints: number | null;
  discountRate: number; // e.g. 0.05 for 5%
  perks: { ar: string; en: string }[];
  color: {
    bg: string;
    border: string;
    text: string;
    gradient: string;
    ring: string;
  };
  iconName: string;
}

export const TIERS_CONFIG: Record<CustomerTierKey, TierInfo> = {
  BRONZE: {
    key: "BRONZE",
    name: { ar: "مستكشف القهوة", en: "Coffee Explorer" },
    badgeTitle: "برونزي 🥉",
    minPoints: 0,
    maxPoints: 149,
    discountRate: 0,
    perks: [
      { ar: "تجميع نقطة مقابل كل 10 جنيه", en: "Earn 1 pt per 10 EGP spent" },
      { ar: "استبدال النقاط بمشروبات مجانية", en: "Redeem points for free drinks" },
    ],
    color: {
      bg: "bg-amber-950/20",
      border: "border-amber-700/40",
      text: "text-amber-500",
      gradient: "from-amber-700/30 via-amber-900/10 to-transparent",
      ring: "ring-amber-700/30",
    },
    iconName: "Compass",
  },
  SILVER: {
    key: "SILVER",
    name: { ar: "عميل المحمصة الدائم", en: "Roastery Regular" },
    badgeTitle: "فضي 🥈",
    minPoints: 150,
    maxPoints: 499,
    discountRate: 0.05,
    perks: [
      { ar: "خصم 5% دائم على جميع حبوب وبن المحمصة", en: "5% permanent discount on whole & ground beans" },
      { ar: "هدية عيد ميلاد مجانية سنوية", en: "Free annual birthday specialty coffee" },
      { ar: "أولوية التحضير في الكاشير", en: "Express priority bar ordering" },
    ],
    color: {
      bg: "bg-slate-800/30",
      border: "border-slate-400/40",
      text: "text-slate-200",
      gradient: "from-slate-400/20 via-slate-700/10 to-transparent",
      ring: "ring-slate-400/30",
    },
    iconName: "ShieldCheck",
  },
  GOLD: {
    key: "GOLD",
    name: { ar: "أفندي ذهبي", en: "Gold Afandi" },
    badgeTitle: "ذهبي 🥇",
    minPoints: 500,
    maxPoints: 999,
    discountRate: 0.10,
    perks: [
      { ar: "خصم 10% دائم على البن والمشروبات", en: "10% permanent discount across menu & beans" },
      { ar: "ترقية حجم الكوباية (Size Upgrade) مجاناً دائماً", en: "Free cup size upgrade on all espresso drinks" },
      { ar: "دعوات تجربة المحاصيل والخلطات الجديدة قبل النزول", en: "Early-access new harvest coffee tastings" },
    ],
    color: {
      bg: "bg-[#d4af37]/20",
      border: "border-[#d4af37]/60",
      text: "text-[#f5d36e]",
      gradient: "from-[#d4af37]/40 via-[#d4af37]/10 to-transparent",
      ring: "ring-[#d4af37]/40",
    },
    iconName: "Crown",
  },
  BLACK_DIAMOND: {
    key: "BLACK_DIAMOND",
    name: { ar: "نادي الباشوات (VIP Elite)", en: "Afandi Elite Club" },
    badgeTitle: "باشا 👑",
    minPoints: 1000,
    maxPoints: null,
    discountRate: 0.15,
    perks: [
      { ar: "خصم 15% VIP على كل المبيعات والمنتجات", en: "15% VIP discount on all orders" },
      { ar: "فنجان قهوة مجاني أسبوعياً من اختيارك", en: "1 free specialty brew every single week" },
      { ar: "علبة بن مخصصة بإسم العميل كهدية نصف سنوية", en: "Personalized custom roast pack twice a year" },
      { ar: "رقم مباشر للإدارة لحجز المقاعد والطلبات الخاصة", en: "Direct concierge line for VIP seating & orders" },
    ],
    color: {
      bg: "bg-gradient-to-r from-purple-950/40 to-black/80",
      border: "border-purple-400/60 shadow-[0_0_15px_rgba(212,175,55,0.25)]",
      text: "text-purple-300",
      gradient: "from-purple-900/40 via-amber-900/20 to-black",
      ring: "ring-purple-400/50",
    },
    iconName: "Sparkles",
  },
};

export function getCustomerTier(points: number = 0): TierInfo {
  const safePoints = Math.max(0, Number(points) || 0);

  if (safePoints >= 1000) return TIERS_CONFIG.BLACK_DIAMOND;
  if (safePoints >= 500) return TIERS_CONFIG.GOLD;
  if (safePoints >= 150) return TIERS_CONFIG.SILVER;
  return TIERS_CONFIG.BRONZE;
}

export interface TierProgress {
  currentTier: TierInfo;
  nextTier: TierInfo | null;
  progressPercent: number;
  pointsNeeded: number;
  currentPoints: number;
}

export function getTierProgress(points: number = 0): TierProgress {
  const safePoints = Math.max(0, Number(points) || 0);
  const currentTier = getCustomerTier(safePoints);

  if (currentTier.key === "BLACK_DIAMOND") {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      pointsNeeded: 0,
      currentPoints: safePoints,
    };
  }

  let nextTierKey: CustomerTierKey = "SILVER";
  if (currentTier.key === "SILVER") nextTierKey = "GOLD";
  if (currentTier.key === "GOLD") nextTierKey = "BLACK_DIAMOND";

  const nextTier = TIERS_CONFIG[nextTierKey];
  const tierMin = currentTier.minPoints;
  const target = nextTier.minPoints;

  const pointsInCurrentTier = safePoints - tierMin;
  const pointsRange = target - tierMin;
  const progressPercent = Math.min(100, Math.max(0, Math.round((pointsInCurrentTier / pointsRange) * 100)));
  const pointsNeeded = Math.max(0, target - safePoints);

  return {
    currentTier,
    nextTier,
    progressPercent,
    pointsNeeded,
    currentPoints: safePoints,
  };
}

export const ROAST_PREFERENCES = [
  { value: "LIGHT", label: { ar: "تحميص فاتح (Light)", en: "Light Roast" }, notes: "حمضية فواكه منعشة وزهور" },
  { value: "MEDIUM", label: { ar: "تحميص وسط متوازن (Medium)", en: "Medium Roast" }, notes: "قوام معتدل مع شوكولاتة وكراميل" },
  { value: "DARK", label: { ar: "تحميص غامق كثيف (Dark)", en: "Dark Roast" }, notes: "مرارة محببة مع كاكاو غني" },
] as const;

export const GRIND_PREFERENCES = [
  { value: "WHOLE_BEAN", label: { ar: "حبوب كاملة (Whole Bean)", en: "Whole Bean" }, icon: "Coffee" },
  { value: "TURKISH", label: { ar: "طحنة تركي ناعمة جداً", en: "Extra-Fine (Turkish)" }, icon: "Flame" },
  { value: "ESPRESSO", label: { ar: "طحنة اسبريسو ناعمة", en: "Fine (Espresso / Moka)" }, icon: "Zap" },
  { value: "V60_FILTER", label: { ar: "طحنة فلتر V60 / كيمكس", en: "Medium (V60 / Pour-over)" }, icon: "Droplets" },
  { value: "FRENCH_PRESS", label: { ar: "طحنة فرنش برس / كولد برو", en: "Coarse (French Press / Cold Brew)" }, icon: "CupSoda" },
] as const;

export const FLAVOR_TAGS = [
  "شوكولاتة داكنة",
  "بندق ومكسرات",
  "كراميل",
  "فواكه حمضية",
  "توت بري",
  "زهور وياسمين",
  "توابل وقرفة",
  "مستكة وحبهان",
];
