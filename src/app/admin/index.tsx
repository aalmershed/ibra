import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminGuard } from '../../components/AdminGuard';
import { Button, EmptyState, Icon, Loading, Photo, ScreenHeader, SearchBar, Toast, Txt, type ToastMessage } from '../../components/ui';
import { fetchMemberCount, fetchRestaurants } from '../../lib/api';
import { takeFlash } from '../../lib/flash';
import { ar } from '../../lib/format';
import { categoryLabel, radius, tintFor } from '../../lib/theme';
import { useColors } from '../../lib/appearance';
import type { Restaurant } from '../../lib/types';

function AdminHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Restaurant[] | null>(null);
  const [members, setMembers] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    fetchMemberCount().then(setMembers).catch(() => {});
    try {
      setItems(await fetchRestaurants());
    } catch {
      setItems((p) => p ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const flash = takeFlash();
      if (flash) setToast({ text: flash, id: Date.now() });
    }, [load]),
  );

  const filtered = useMemo(() => {
    const t = search.trim();
    return (items ?? []).filter(
      (r) => (!featuredOnly || r.is_featured) && (!t || [r.name, r.cuisine, r.district].some((v) => v?.includes(t))),
    );
  }, [items, search, featuredOnly]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader title="لوحة الإدارة" />
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, paddingTop: 6, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox label="المطاعم" value={items?.length} active={!featuredOnly} onPress={() => setFeaturedOnly(false)} />
              <StatBox label="المُوصى بها" value={items?.filter((r) => r.is_featured).length} active={featuredOnly} onPress={() => setFeaturedOnly((v) => !v)} />
              <StatBox label="الأعضاء" value={members ?? undefined} />
            </View>
            {(items?.length ?? 0) > 0 ? <SearchBar value={search} onChangeText={setSearch} placeholder="ابحث في المطاعم" /> : null}
          </View>
        }
        ListEmptyComponent={
          items === null ? (
            <Loading />
          ) : (
            <EmptyState
              icon={featuredOnly && !search ? 'star' : 'plus-circle'}
              title={search ? 'ما فيه نتائج' : featuredOnly ? 'ما فيه مطاعم موصى بها' : 'ابدأ بإضافة أول مطعم'}
              body={search ? undefined : featuredOnly ? 'فعّل «مُوصى به من IBRA» داخل صفحة المطعم.' : 'أضف المطاعم والكافيهات مع صورها وموقعها وأطباقها المميزة.'}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`تعديل ${item.name}`}
            onPress={() => router.push({ pathname: '/admin/edit', params: { id: item.id } })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 10,
              borderRadius: radius.lg,
              backgroundColor: pressed ? colors.lineSoft : colors.surface,
            })}
          >
            <Photo uri={item.images[0]} tint={tintFor(item.id)} style={{ width: 60, height: 60, borderRadius: 16 }} iconSize={18} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold" numberOfLines={1}>
                {item.name}
              </Txt>
              <Txt size={13} color={colors.muted} numberOfLines={1}>
                {[categoryLabel(item.category), item.district, item.is_featured ? 'مُوصى به' : null].filter(Boolean).join(' · ')}
              </Txt>
            </View>
            <Icon name="edit-2" size={18} color={colors.muted} />
          </Pressable>
        )}
      />
      <Toast message={toast} bottom={insets.bottom + 104} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: insets.bottom + 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
        <Button title="إضافة مطعم" icon="plus" height={54} onPress={() => router.push('/admin/edit')} />
      </View>
    </View>
  );
}

/** بطاقة رقم. إذا لها onPress تصير فلتر، وتتلوّن لما تكون مفعّلة */
function StatBox({ label, value, active, onPress }: { label: string; value?: number; active?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!active } : undefined}
      accessibilityLabel={`${label}: ${value ?? 0}`}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: active ? colors.accentSoft : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.surface,
        borderRadius: radius.md,
        padding: 14,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Txt size={13} color={active ? colors.accentDark : colors.muted} numberOfLines={1}>
        {label}
      </Txt>
      <Txt weight="display" size={24} color={active ? colors.accent : colors.ink}>
        {value === undefined ? '–' : ar(value)}
      </Txt>
    </Pressable>
  );
}

export default function AdminScreen() {
  return (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  );
}
