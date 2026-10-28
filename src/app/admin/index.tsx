import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminGuard } from '../../components/AdminGuard';
import { Button, EmptyState, Icon, Loading, Photo, ScreenHeader, SearchBar, Txt } from '../../components/ui';
import { fetchRestaurants } from '../../lib/api';
import { ar } from '../../lib/format';
import { categoryLabel, colors, radius, tintFor } from '../../lib/theme';
import type { Restaurant } from '../../lib/types';

function AdminHome() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Restaurant[] | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchRestaurants());
    } catch {
      setItems((p) => p ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const t = search.trim();
    if (!t) return items ?? [];
    return (items ?? []).filter((r) => [r.name, r.cuisine, r.district].some((v) => v?.includes(t)));
  }, [items, search]);

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
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}>
                <Txt size={13} color={colors.muted}>
                  المطاعم
                </Txt>
                <Txt weight="display" size={24}>
                  {ar(items?.length ?? 0)}
                </Txt>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}>
                <Txt size={13} color={colors.muted}>
                  المُوصى بها
                </Txt>
                <Txt weight="display" size={24}>
                  {ar(items?.filter((r) => r.is_featured).length ?? 0)}
                </Txt>
              </View>
            </View>
            {(items?.length ?? 0) > 0 ? <SearchBar value={search} onChangeText={setSearch} placeholder="ابحث في المطاعم" /> : null}
          </View>
        }
        ListEmptyComponent={
          items === null ? (
            <Loading />
          ) : (
            <EmptyState icon="plus-circle" title={search ? 'ما فيه نتائج' : 'ابدأ بإضافة أول مطعم'} body={search ? undefined : 'أضف المطاعم والكافيهات مع صورها وموقعها وأطباقها المميزة.'} />
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
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.lineSoft,
              backgroundColor: pressed ? colors.surface : colors.white,
            })}
          >
            <Photo uri={item.images[0]} tint={tintFor(item.id)} style={{ width: 56, height: 56, borderRadius: 12 }} iconSize={18} />
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
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: insets.bottom + 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
        <Button title="إضافة مطعم" icon="plus" height={54} onPress={() => router.push('/admin/edit')} />
      </View>
    </View>
  );
}

export default function AdminScreen() {
  return (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  );
}
