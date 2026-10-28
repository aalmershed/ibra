export const colors = {
  accent: '#C2410C',
  accentDark: '#9A3412',
  accentSoft: '#FFF1E8',
  ink: '#1C1917',
  muted: '#6B6460',
  placeholder: '#7A726D',
  line: '#E7E3DF',
  lineSoft: '#EFECE9',
  surface: '#F7F5F2',
  white: '#FFFFFF',
  success: '#15803D',
  danger: '#B91C1C',
  star: '#F59E0B',
  userDot: '#2563EB',
  tints: ['#F1E4D8', '#E6ECE1', '#F3E3E1', '#E8E5EF', '#E3ECEF'],
};

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
  display: 'ReadexPro_600SemiBold',
  displayBold: 'ReadexPro_700Bold',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, pill: 999 };

export const shadow = {
  shadowColor: '#1C1917',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export const CATEGORIES = [
  { key: 'all', label: 'الكل' },
  { key: 'restaurant', label: 'مطاعم' },
  { key: 'cafe', label: 'كافيهات' },
  { key: 'breakfast', label: 'فطور' },
  { key: 'dessert', label: 'حلويات' },
] as const;

export type CategoryKey = Exclude<(typeof CATEGORIES)[number]['key'], 'all'>;

export function categoryLabel(key: string): string {
  const map: Record<string, string> = {
    restaurant: 'مطعم',
    cafe: 'كافيه',
    breakfast: 'فطور',
    dessert: 'حلويات',
  };
  return map[key] ?? key;
}

/** لون خلفية ثابت لكل عنصر (يظهر قبل تحميل الصورة) */
export function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return colors.tints[h % colors.tints.length];
}
