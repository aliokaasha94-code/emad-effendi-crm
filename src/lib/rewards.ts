import type { Customer } from "@/types/crm";

export type LoyaltyTierId = "BRONZE" | "SILVER" | "GOLD" | "OBSIDIAN";

export interface LoyaltyTier {
  id: LoyaltyTierId;
  nameAr: string;
  nameEn: string;
  minPoints: number;
  minSpent: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  cashbackMultiplier: number;
  perksAr: string[];
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "BRONZE",
    nameAr: "كلاسيك برونزي",
    nameEn: "Bronze Classic",
    minPoints: 0,
    minSpent: 0,
    color: "#cd7f32",
    badgeBg: "rgba(205, 127, 50, 0.15)",
    badgeBorder: "rgba(205, 127, 50, 0.4)",
    textColor: "#e09f67",
    cashbackMultiplier: 1.0,
    perksAr: ["نقطة لكل 10 جنيه", "مكافأة عيد ميلاد"],
  },
  {
    id: "SILVER",
    nameAr: "فضي بريميوم",
    nameEn: "Silver Premium",
    minPoints: 50,
    minSpent: 500,
    color: "#c0c0c0",
    badgeBg: "rgba(192, 192, 192, 0.15)",
    badgeBorder: "rgba(192, 192, 192, 0.4)",
    textColor: "#e2e8f0",
    cashbackMultiplier: 1.25,
    perksAr: ["1.25 ضعف النقاط", "ترقية مجانية لحجم القهوة", "مكافأة عيد ميلاد"],
  },
  {
    id: "GOLD",
    nameAr: "ذهبي VIP",
    nameEn: "Gold VIP",
    minPoints: 120,
    minSpent: 1200,
    color: "#d4af37",
    badgeBg: "rgba(212, 175, 55, 0.18)",
    badgeBorder: "rgba(212, 175, 55, 0.5)",
    textColor: "#facc15",
    cashbackMultiplier: 1.5,
    perksAr: ["1.5 ضعف النقاط", "حجز طاولة مميزة مسبقاً", "خصم 10% على البن الحبوب"],
  },
  {
    id: "OBSIDIAN",
    nameAr: "أوبسيديان ملكي",
    nameEn: "Obsidian Royal",
    minPoints: 250,
    minSpent: 2500,
    color: "#f3ba2f",
    badgeBg: "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(13, 15, 17, 0.9) 100%)",
    badgeBorder: "#d4af37",
    textColor: "#fef08a",
    cashbackMultiplier: 2.0,
    perksAr: ["ضعف النقاط (2X)", "مشروب ترحيبي شهري مجاني", "دعوة لجلسات تذوق المحاصيل الجديدة"],
  },
];

export function getCustomerTier(customer: Pick<Customer, "loyalty_points" | "total_spent">): LoyaltyTier {
  const points = customer.loyalty_points || 0;
  const spent = customer.total_spent || 0;

  if (points >= 250 || spent >= 2500) return LOYALTY_TIERS[3];
  if (points >= 120 || spent >= 1200) return LOYALTY_TIERS[2];
  if (points >= 50 || spent >= 500) return LOYALTY_TIERS[1];
  return LOYALTY_TIERS[0];
}

export function getNextTier(currentTierId: LoyaltyTierId): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.id === currentTierId);
  if (idx >= 0 && idx < LOYALTY_TIERS.length - 1) {
    return LOYALTY_TIERS[idx + 1];
  }
  return null;
}

export interface RewardCatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  pointsCost: number;
  category: "DRINK" | "DESSERT" | "DISCOUNT";
  descriptionAr: string;
  icon: string;
}

export const REWARD_CATALOG: RewardCatalogItem[] = [
  {
    id: "free_espresso",
    nameAr: "دوبل إسبريسو / أمريكانو",
    nameEn: "Double Espresso / Americano",
    pointsCost: 40,
    category: "DRINK",
    descriptionAr: "شوت دوبل إسبريسو أو كوب أمريكانو مجاناً من اختيارك",
    icon: "Coffee",
  },
  {
    id: "free_v60",
    nameAr: "قهوة مقطرة V60 إثيوبية",
    nameEn: "Ethiopian V60 Pourover",
    pointsCost: 60,
    category: "DRINK",
    descriptionAr: "كوب قهوة V60 إثيوبية فاخرة بتحضير باريستا مختص",
    icon: "Flame",
  },
  {
    id: "free_spanish_latte",
    nameAr: "سبانش لاتيه عماد أفندي",
    nameEn: "Signature Spanish Latte",
    pointsCost: 80,
    category: "DRINK",
    descriptionAr: "المشروب المميز الساخن أو البارد مجاناً",
    icon: "Sparkles",
  },
  {
    id: "free_san_sebastian",
    nameAr: "تشيز كيك سان سباستيان",
    nameEn: "San Sebastian Cheesecake",
    pointsCost: 100,
    category: "DESSERT",
    descriptionAr: "قطعة تشيز كيك سان سباستيان مخبوزة طازجة مع الشوكولاتة",
    icon: "Cake",
  },
  {
    id: "discount_25_pct",
    nameAr: "خصم 25% على الفاتورة",
    nameEn: "25% Off Entire Bill",
    pointsCost: 150,
    category: "DISCOUNT",
    descriptionAr: "خصم ربع الفاتورة الحالية مباشرة في الكاشير",
    icon: "Percent",
  },
];
