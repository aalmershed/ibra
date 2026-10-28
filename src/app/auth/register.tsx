import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Field, IconButton, Title, Txt } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('عبّ كل الحقول.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور لازم تكون ٦ أحرف أو أكثر.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp(name, email, password);
      if (needsConfirmation) setSentTo(email.trim());
      else close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', paddingTop: insets.top }}>
        <EmptyState
          icon="mail"
          title="فعّل حسابك"
          body={`أرسلنا رابط تفعيل إلى ${sentTo}. افتحه، بعدين ارجع وسجّل دخولك.`}
          action={<Button title="تسجيل الدخول" onPress={() => router.replace('/auth/login')} />}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton name="x" label="إغلاق" bg={colors.surface} onPress={close} />
        </View>

        <View style={{ gap: 6 }}>
          <Title size={26}>حساب جديد</Title>
          <Txt color={colors.muted}>دقيقة وحدة وتصير جاهز.</Txt>
        </View>

        <View style={{ gap: 16 }}>
          <Field label="الاسم" value={name} onChangeText={setName} placeholder="اسمك" autoComplete="name" textContentType="name" />
          <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" ltr />
          <Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="٦ أحرف أو أكثر" secureTextEntry autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} returnKeyType="go" />
          {error ? (
            <Txt size={14} color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </Txt>
          ) : null}
          <Button title="إنشاء الحساب" onPress={submit} loading={loading} height={54} />
        </View>

        <Txt size={14} color={colors.muted} style={{ textAlign: 'center' }}>
          عندك حساب؟{' '}
          <Txt size={14} weight="semibold" color={colors.accent} onPress={() => router.replace('/auth/login')} accessibilityRole="link">
            سجّل دخولك
          </Txt>
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
