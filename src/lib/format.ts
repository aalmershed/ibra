const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** يحوّل الأرقام الإنجليزية إلى عربية: 12.5 ← ١٢٫٥ */
export function ar(value: number | string): string {
  return String(value)
    .replace(/\./g, '٫')
    .replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export function formatPrice(price: number | null | undefined): string | null {
  if (price == null) return null;
  const n = Number(price);
  return `${ar(Number.isInteger(n) ? n : n.toFixed(2))} ر.س`;
}

export function formatDistance(km: number | null | undefined): string | null {
  if (km == null || !isFinite(km)) return null;
  if (km < 1) return `${ar(Math.max(50, Math.round((km * 1000) / 50) * 50))} م`;
  return `${ar(km < 10 ? km.toFixed(1) : Math.round(km))} كم`;
}

/** يحوّل الأرقام العربية المكتوبة في الحقول إلى إنجليزية */
export function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, '.');
}
