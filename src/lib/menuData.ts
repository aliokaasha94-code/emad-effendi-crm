export interface MenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  category: "specialty" | "cold" | "dessert";
  badge?: string;
}

export const CAFE_MENU_ITEMS: MenuItem[] = [
  // قهوة مختصة
  {
    id: "v60_ethiopia",
    nameAr: "V60 إثيوبي",
    nameEn: "Ethiopian V60",
    price: 65,
    category: "specialty",
    badge: "الأكثر طلباً",
  },
  {
    id: "chemex_colombia",
    nameAr: "كيمكس كولومبي",
    nameEn: "Colombian Chemex",
    price: 75,
    category: "specialty",
  },
  {
    id: "spanish_latte_hot",
    nameAr: "سبانش لاتيه (ساخن)",
    nameEn: "Hot Spanish Latte",
    price: 75,
    category: "specialty",
    badge: "توقيع أفندي",
  },
  {
    id: "flat_white",
    nameAr: "فلات وايت",
    nameEn: "Flat White",
    price: 55,
    category: "specialty",
  },
  {
    id: "cortado",
    nameAr: "كورتادو كلاسيك",
    nameEn: "Cortado Classic",
    price: 50,
    category: "specialty",
  },
  {
    id: "espresso_double",
    nameAr: "دوبل إسبريسو",
    nameEn: "Double Espresso",
    price: 40,
    category: "specialty",
  },

  // مشروبات باردة
  {
    id: "iced_spanish_latte",
    nameAr: "آيسد سبانش لاتيه",
    nameEn: "Iced Spanish Latte",
    price: 80,
    category: "cold",
    badge: "الأكثر مبيعاً",
  },
  {
    id: "cold_brew_cascara",
    nameAr: "كولد برو كاسكارا",
    nameEn: "Cascara Cold Brew",
    price: 70,
    category: "cold",
  },
  {
    id: "iced_pistachio",
    nameAr: "آيسد بستاشيو لاتيه",
    nameEn: "Iced Pistachio Latte",
    price: 90,
    category: "cold",
  },
  {
    id: "iced_americano",
    nameAr: "آيسد أمريكانو",
    nameEn: "Iced Americano",
    price: 50,
    category: "cold",
  },
  {
    id: "mojito_berry",
    nameAr: "موهيتو توت وباشن",
    nameEn: "Berry Passion Mojito",
    price: 65,
    category: "cold",
  },

  // حلى ومخبوزات
  {
    id: "san_sebastian",
    nameAr: "سان سباستيان تشيزكيك",
    nameEn: "San Sebastian Cheesecake",
    price: 85,
    category: "dessert",
    badge: "شيف سبيشال",
  },
  {
    id: "french_toast_caramel",
    nameAr: "فرنش توست كراميل",
    nameEn: "Caramel French Toast",
    price: 95,
    category: "dessert",
  },
  {
    id: "belgian_cookie",
    nameAr: "كوكيز شوكولاتة بلجيكي",
    nameEn: "Belgian Choc Cookie",
    price: 45,
    category: "dessert",
  },
  {
    id: "almond_croissant",
    nameAr: "كرواسون لوز فرنسي",
    nameEn: "Almond Croissant",
    price: 55,
    category: "dessert",
  },
];
