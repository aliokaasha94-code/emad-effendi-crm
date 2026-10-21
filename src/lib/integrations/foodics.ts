export const foodicsIntegration = {
  enabled: false,
  name: "Foodics",
  description:
    "ربط Foodics المباشر غير مفعّل بعد. استخدم صفحة الاستيراد لرفع تقرير المبيعات من Foodics بصيغة CSV أو Excel.",
} as const;

export type FoodicsIntegration = typeof foodicsIntegration;
