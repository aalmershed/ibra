import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { Icon, Title, Txt } from './ui';

/** تظهر لو ملف .env ما فيه بيانات Supabase */
export function SetupNotice() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 48, gap: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="settings" color={colors.accent} size={26} />
      </View>
      <Title size={24}>باقي خطوة وحدة</Title>
      <Txt size={15} color={colors.muted}>
        التطبيق يحتاج يرتبط بقاعدة البيانات. افتح ملف ‎.env‎ في مجلد المشروع وحط فيه رابط ومفتاح مشروعك في Supabase، بعدين أعد تشغيل الأمر npx expo start.
      </Txt>
      <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16 }}>
        <Txt size={13} style={{ writingDirection: 'ltr', fontFamily: undefined }}>
          {'EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...'}
        </Txt>
      </View>
      <Txt size={14} color={colors.muted}>
        التفاصيل كاملة في ملف «دليل-التشغيل.md».
      </Txt>
    </ScrollView>
  );
}
