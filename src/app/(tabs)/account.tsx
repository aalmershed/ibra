import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, EmptyState, Icon, Pressy, Title, Txt, type IconName } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { radius } from '../../lib/theme';
import { useAppearance, useColors, type AppearanceMode } from '../../lib/appearance';

function Row({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: 64,
        paddingHorizontal: 14,
        backgroundColor: pressed ? colors.lineSoft : 'transparent',
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={danger ? colors.danger : colors.ink} />
      </View>
      <Txt size={15} weight="medium" color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>
        {label}
      </Txt>
      {!danger ? <Icon name="chevron-left" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

const MODES: { key: AppearanceMode; label: string; icon: IconName }[] = [
  { key: 'system', label: 'تلقائي', icon: 'smartphone' },
  { key: 'light', label: 'فاتح', icon: 'sun' },
  { key: 'dark', label: 'داكن', icon: 'moon' },
];

/** اختيار المظهر: تلقائي (حسب الجوال) أو فاتح أو داكن */
function AppearancePicker() {
  const { colors, mode, setMode } = useAppearance();
  return (
    <View style={{ gap: 10 }}>
      <Txt weight="semibold" size={15}>
        المظهر
      </Txt>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 4, padding: 5, borderRadius: 28, backgroundColor: colors.surface }}>
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={m.label}
              onPress={() => setMode(m.key)}
              style={({ pressed }) => ({
                flex: 1,
                height: 44,
                borderRadius: 22,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: active ? colors.white : 'transparent',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Icon name={m.icon} size={16} color={active ? colors.accent : colors.muted} />
              <Txt size={14} weight={active ? 'semibold' : 'regular'} color={active ? colors.ink : colors.muted}>
                {m.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { session, profile, isAdmin, signOut } = useAuth();

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', paddingTop: insets.top, paddingBottom: tabSpace }}>
        <EmptyState
          icon="user"
          title="أهلاً فيك في IBRA"
          body="سجّل دخولك عشان تحفظ مطاعمك المفضلة وتقيّم الأطباق اللي جربتها."
          action={
            <View style={{ gap: 10 }}>
              <Button title="تسجيل الدخول" onPress={() => router.push('/auth/login')} />
              <Button title="إنشاء حساب جديد" variant="outline" onPress={() => router.push('/auth/register')} />
            </View>
          }
        />
        <View style={{ paddingHorizontal: 20 }}>
          <AppearancePicker />
        </View>
      </View>
    );
  }

  const name = profile?.full_name || session.user.email?.split('@')[0] || '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabSpace, paddingHorizontal: 20, gap: 20 }}
    >
      <Title size={32} style={{ lineHeight: 44 }}>
        حسابي
      </Title>

      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 22, borderRadius: radius.xl, backgroundColor: colors.surface }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.white }}>
          <Txt weight="display" size={34} color={colors.accent} style={{ lineHeight: 44 }}>
            {name.charAt(0).toUpperCase()}
          </Txt>
        </View>
        <View style={{ alignItems: 'center', gap: 2, paddingHorizontal: 20 }}>
          <Txt weight="display" size={20} numberOfLines={1}>
            {name}
          </Txt>
          <Txt size={13} color={colors.muted} numberOfLines={1} style={{ writingDirection: 'ltr' }}>
            {session.user.email}
          </Txt>
        </View>
        {isAdmin ? (
          <View style={{ height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="shield" size={13} color={colors.white} />
            <Txt size={12} weight="semibold" color={colors.white}>
              مدير
            </Txt>
          </View>
        ) : null}
      </View>

      {isAdmin ? (
        <Pressy
          onPress={() => router.push('/admin')}
          scaleTo={0.98}
          style={{
            backgroundColor: colors.accentFill,
            borderRadius: radius.lg,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="grid" color={colors.onAccent} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" size={16} color={colors.onAccent}>
              لوحة الإدارة
            </Txt>
            <Txt size={13} color="rgba(255,255,255,0.8)">
              أضف المطاعم والأطباق والصور
            </Txt>
          </View>
          <Icon name="chevron-left" color={colors.onAccent} />
        </Pressy>
      ) : null}

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', paddingVertical: 4 }}>
        <Row icon="edit-3" label="تعديل الملف الشخصي" onPress={() => router.push('/profile')} />
        <Row icon="heart" label="المفضلة" onPress={() => router.navigate('/favorites')} />
        <Row icon="map" label="المطاعم القريبة" onPress={() => router.navigate('/map')} />
      </View>

      <AppearancePicker />

      <Button
        title="تسجيل الخروج"
        icon="log-out"
        variant="danger"
        onPress={() =>
          Alert.alert('تسجيل الخروج', 'متأكد تبي تسجّل خروج؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'خروج', style: 'destructive', onPress: () => signOut() },
          ])
        }
      />
    </ScrollView>
  );
}
