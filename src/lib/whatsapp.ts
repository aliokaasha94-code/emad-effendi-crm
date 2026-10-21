import { toInternationalPhone } from "@/lib/phone";

export interface PersonalizeOptions {
  name?: string | null;
  drink?: string | null;
  discount?: string | null;
}

export function personalizeMessage(template: string, options: PersonalizeOptions): string {
  const rawName = options.name?.trim() || "عميلنا";
  const firstName = rawName.split(/\s+/)[0] || rawName;
  const drink = options.drink?.trim() || "قهوتك المفضلة";
  const discount = options.discount?.trim() || "خاص";

  return template
    .replaceAll("{{name}}", firstName)
    .replaceAll("{{drink}}", drink)
    .replaceAll("{{discount}}", discount);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const international = toInternationalPhone(phone);
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  window.open(buildWhatsAppLink(phone, message), "_blank", "noopener,noreferrer");
}
