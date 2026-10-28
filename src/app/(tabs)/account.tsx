import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, EmptyState, Icon, Title, Txt, type IconName } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors, radius } from '../../lib/theme';

function Row({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: 58,
        paddingHorizontal: 16,
        backgroundColor: pressed ? colors.surface : colors.white,
      })}
    >
      <Icon name={icon} size={20} color={danger ? colors.danger : colors.ink} />
      <Txt size={15} weight="medium" color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>
        {label}
      </Txt>
      {!danger ? <Icon name="chevron-left" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

export default function AccountScreen() {
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
      </View>
    );
  }

  const name = profile?.full_name || session.user.email?.split('@')[0] || '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabSpace, paddingHorizontal: 20, gap: 20 }}
    >
      <Title size={26}>حسابي</Title>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Txt weight="display" size={24} color={colors.accent}>
            {name.charAt(0).toUpperCase()}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="semibold" size={18} numberOfLines={1}>
            {name}
          </Txt>
          <Txt size={13} color={colors.muted} numberOfLines={1} style={{ writingDirection: 'ltr', textAlign: 'auto' }}>
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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin')}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            borderRadius: radius.lg,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="grid" color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" size={16} color={colors.white}>
              لوحة الإدارة
            </Txt>
            <Txt size={13} color="#D6D3D1">
              أضف المطاعم والأطباق والصور
            </Txt>
          </View>
          <Icon name="chevron-left" color={colors.white} />
        </Pressable>
      ) : null}

      <View style={{ borderWidth: 1, borderColor: colors.lineSoft, borderRadius: radius.lg, overflow: 'hidden' }}>
        <Row icon="heart" label="المفضلة" onPress={() => router.navigate('/favorites')} />
        <View style={{ height: 1, backgroundColor: colors.lineSoft, marginHorizontal: 16 }} />
        <Row icon="map" label="المطاعم القريبة" onPress={() => router.navigate('/map')} />
        <View style={{ height: 1, backgroundColor: colors.lineSoft, marginHorizontal: 16 }} />
        <Row
          icon="log-out"
          label="تسجيل الخروج"
          danger
          onPress={() =>
            Alert.alert('تسجيل الخروج', 'متأكد تبي تسجّل خروج؟', [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'خروج', style: 'destructive', onPress: () => signOut() },
            ])
          }
        />
      </View>
    </ScrollView>
  );
}
