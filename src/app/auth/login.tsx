import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, IconButton, Title, Txt } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('اكتب البريد وكلمة المرور.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError('اكتب بريدك أولاً، وبنرسل لك رابط استعادة كلمة المرور.');
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (err) setError('ما قدرنا نرسل الرابط. تأكد من البريد.');
    else Alert.alert('تم الإرسال', 'راجع بريدك، أرسلنا لك رابط لتغيير كلمة المرور.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, gap: 26 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton name="x" label="إغلاق" bg={colors.surface} onPress={close} />
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt weight="display" size={40} style={{ letterSpacing: 2, writingDirection: 'ltr', lineHeight: 52 }}>
              IBRA
            </Txt>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginTop: 14 }} />
          </View>
          <Title size={26}>أهلاً فيك</Title>
          <Txt color={colors.muted} style={{ lineHeight: 26 }}>
            سجّل دخولك عشان تحفظ مطاعمك المفضلة وتقيّم الأطباق اللي جربتها.
          </Txt>
        </View>

        <View style={{ gap: 16 }}>
          <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" ltr />
          <Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
          <Txt size={14} color={colors.accent} weight="medium" onPress={forgot} accessibilityRole="link" style={{ alignSelf: 'flex-start' }}>
            نسيت كلمة المرور؟
          </Txt>
          {error ? (
            <Txt size={14} color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </Txt>
          ) : null}
          <Button title="تسجيل الدخول" onPress={submit} loading={loading} height={54} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.lineSoft }} />
          <Txt size={13} color={colors.muted}>
            أو
          </Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.lineSoft }} />
        </View>

        <Button title="تصفّح كزائر" variant="outline" height={54} onPress={close} />

        <Txt size={14} color={colors.muted} style={{ textAlign: 'center' }}>
          ما عندك حساب؟{' '}
          <Txt size={14} weight="semibold" color={colors.accent} onPress={() => router.replace('/auth/register')} accessibilityRole="link">
            أنشئ حساب جديد
          </Txt>
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
