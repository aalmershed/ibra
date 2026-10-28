import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Field, ScreenHeader, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useColors } from '../lib/appearance';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <ScreenHeader title="الملف الشخصي" />
        <EmptyState icon="user" title="سجّل دخولك أولاً" />
      </View>
    );
  }

  const changed = name.trim() !== (profile?.full_name ?? '') || email.trim().toLowerCase() !== (session.user.email ?? '').toLowerCase();

  const save = async () => {
    if (!name.trim()) return setError('اكتب اسمك.');
    if (!EMAIL_RE.test(email.trim())) return setError('صيغة البريد الإلكتروني غير صحيحة.');
    setError(null);
    setSaving(true);
    try {
      const { emailPending } = await updateProfile(name, email);
      if (emailPending) {
        Alert.alert('أكّد إيميلك الجديد', `انحفظ اسمك. وأرسلنا رابط تأكيد إلى ${email.trim()}، والإيميل يتغير بعد ما تضغطه.`, [
          { text: 'تمام', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('تم الحفظ', 'انحفظت بياناتك.', [{ text: 'تمام', onPress: () => router.back() }]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="الملف الشخصي" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="الاسم" value={name} onChangeText={setName} placeholder="اسمك" autoComplete="name" textContentType="name" />
        <Field
          label="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          hint="بتسجّل دخولك بالإيميل الجديد بعد التغيير."
          ltr
        />
        {error ? (
          <Txt size={14} color={colors.danger} accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
        <Button title="حفظ" onPress={save} loading={saving} disabled={!changed} height={54} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
