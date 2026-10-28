/** ألوان الوضع الفاتح. `white` معناها خلفية الشاشة، و`ink` لون النص (وتنعكس في الوضع الداكن) */
export const lightColors = {
  accent: '#C2410C',
  /** خلفية الأزرار البرتقالية (النص فوقها أبيض) */
  accentFill: '#C2410C',
  accentDark: '#9A3412',
  accentSoft: '#FFF1E8',
  accentSoftClear: 'rgba(255,241,232,0)',
  onAccent: '#FFFFFF',
  ink: '#1C1917',
  muted: '#6B6460',
  placeholder: '#7A726D',
  line: '#E7E3DF',
  lineSoft: '#EFECE9',
  inputBorder: '#E2DEDA',
  dash: '#D6D0CB',
  upload: '#FBFAF8',
  hairline: 'rgba(28,25,23,0.08)',
  photoIcon: 'rgba(28,25,23,0.25)',
  inverseSoft: 'rgba(255,255,255,0.12)',
  inverseMuted: '#D6D3D1',
  surface: '#F7F5F2',
  white: '#FFFFFF',
  mapBg: '#EEF0EB',
  success: '#15803D',
  danger: '#B91C1C',
  dangerSoft: '#F3C7C7',
  star: '#F59E0B',
  userDot: '#2563EB',
  tints: ['#F1E4D8', '#E6ECE1', '#F3E3E1', '#E8E5EF', '#E3ECEF'],
};

export type Colors = typeof lightColors;

/** ألوان الوضع الداكن: نفس الأسماء بقيم داكنة. البرتقالي للنص أفتح عشان يوضح، والأزرار تبقى بلون الهوية */
export const darkColors: Colors = {
  accent: '#F97316',
  accentFill: '#C2410C',
  accentDark: '#FDBA74',
  accentSoft: '#3A1F12',
  accentSoftClear: 'rgba(58,31,18,0)',
  onAccent: '#FFFFFF',
  ink: '#F5F2EF',
  muted: '#A8A29E',
  placeholder: '#8A837E',
  line: '#2E2A27',
  lineSoft: '#262220',
  inputBorder: '#3A3532',
  dash: '#4A4440',
  upload: '#1A1716',
  hairline: 'rgba(255,255,255,0.08)',
  photoIcon: 'rgba(245,242,239,0.25)',
  inverseSoft: 'rgba(18,16,16,0.08)',
  inverseMuted: '#57534E',
  surface: '#1E1B19',
  white: '#121010',
  mapBg: '#1E201D',
  success: '#4ADE80',
  danger: '#F87171',
  dangerSoft: '#5B2424',
  star: '#FBBF24',
  userDot: '#60A5FA',
  tints: ['#2B241E', '#222821', '#2B2120', '#24222B', '#1F272A'],
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

/** لون خلفية ثابت لكل عنصر (يظهر قبل تحميل الصورة). `Photo` يبدله بنظيره الداكن في الوضع الداكن */
export function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return lightColors.tints[h % lightColors.tints.length];
}
