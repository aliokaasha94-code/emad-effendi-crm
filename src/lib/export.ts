import * as XLSX from "xlsx";
import type { Customer } from "@/types/crm";
import { getCustomerTier, ROAST_PREFERENCES, GRIND_PREFERENCES } from "@/lib/tiers";
import { getSegmentMeta } from "@/lib/segments";

function getRoastLabel(val?: string | null): string {
  if (!val) return "غير محدد";
  const found = ROAST_PREFERENCES.find((r) => r.value === val);
  return found ? found.label.ar : val;
}

function getGrindLabel(val?: string | null): string {
  if (!val) return "غير محدد";
  const found = GRIND_PREFERENCES.find((g) => g.value === val);
  return found ? found.label.ar : val;
}

export function exportCustomersToExcel(
  customers: Customer[],
  customFilename?: string
): void {
  if (!customers || customers.length === 0) {
    throw new Error("لا توجد بيانات عملاء لتصديرها.");
  }

  const exportData = customers.map((c, index) => {
    const tier = getCustomerTier(c.loyalty_points);
    const segment = getSegmentMeta(c.segment);

    return {
      "#": index + 1,
      "اسم العميل": c.full_name || "بدون اسم",
      "رقم الهاتف": c.phone_number || "",
      "البريد الإلكتروني": c.email || "",
      "فئة الولاء (Tier)": `${tier.badgeTitle} - ${tier.name.ar}`,
      "نقاط الولاء": c.loyalty_points || 0,
      "نسبة خصم الفئة": `${Math.round(tier.discountRate * 100)}%`,
      "شريحة RFM": segment.label,
      "إجمالي الإنفاق (ج.م)": Number(c.total_spent || 0).toFixed(2),
      "عدد الزيارات والطلبات": c.orders_count || 0,
      "المشروب المفضل": c.favorite_drink || "",
      "درجة التحميص": getRoastLabel(c.roast_preference),
      "طريقة الطحن": getGrindLabel(c.grind_preference),
      "الإيحاءات المفضلة": c.flavor_notes_preference || "",
      "المكان المفضل": c.preferred_seating || "",
      "تاريخ الميلاد": c.date_of_birth || "",
      "تاريخ التسجيل": c.first_seen_at ? c.first_seen_at.slice(0, 10) : "",
      "آخر زيارة": c.last_seen_at ? c.last_seen_at.slice(0, 10) : "",
      "ملاحظات خاصة": c.custom_notes || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set RTL on worksheet view
  worksheet["!views"] = [{ rightToLeft: true }];

  // Auto-fit column widths
  const colWidths = [
    { wch: 5 },   // #
    { wch: 25 },  // اسم العميل
    { wch: 15 },  // رقم الهاتف
    { wch: 25 },  // البريد
    { wch: 22 },  // فئة الولاء
    { wch: 12 },  // النقاط
    { wch: 14 },  // نسبة الخصم
    { wch: 18 },  // RFM
    { wch: 18 },  // إجمالي الإنفاق
    { wch: 16 },  // عدد الزيارات
    { wch: 20 },  // المشروب
    { wch: 18 },  // التحميص
    { wch: 20 },  // الطحن
    { wch: 20 },  // الإيحاءات
    { wch: 15 },  // المكان
    { wch: 14 },  // الميلاد
    { wch: 14 },  // التسجيل
    { wch: 14 },  // آخر زيارة
    { wch: 35 },  // ملاحظات
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "عملاء عماد أفندي");

  const today = new Date().toISOString().slice(0, 10);
  const fileName = customFilename || `عملاء_عماد_أفندي_${today}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
