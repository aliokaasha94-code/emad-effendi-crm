const EGYPT_MOBILE_PATTERN = /^01[0125]\d{8}$/;

export function normalizePhone(value: string): string {
  let digits = value.replace(/[\s\-().]/g, "");

  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith("20") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 10) {
    digits = `0${digits}`;
  }

  return digits;
}

export function isValidEgyptianMobile(value: string): boolean {
  return EGYPT_MOBILE_PATTERN.test(normalizePhone(value));
}

export function toInternationalPhone(value: string): string {
  const normalized = normalizePhone(value);

  if (!EGYPT_MOBILE_PATTERN.test(normalized)) return normalized;

  return `20${normalized.slice(1)}`;
}
