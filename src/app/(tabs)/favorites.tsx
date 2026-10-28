import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RestaurantRow } from '../../components/cards';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, EmptyState, Loading, Title, Txt } from '../../components/ui';
import { fetchFavorites } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { distanceKm, useUserLocation } from '../../lib/location';
import { ar } from '../../lib/format';
import { useColors } from '../../lib/appearance';
import type { Restaurant } from '../../lib/types';

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { session } = useAuth();
  const { ids, version } = useFavorites();
  const { coords } = useUserLocation();
  const [items, setItems] = useState<Restaurant[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const userId = session?.user.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setItems(await fetchFavorites(userId));
    } catch {
      setItems((prev) => prev ?? []);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, version]),
  );

  const visible = (items ?? []).filter((r) => ids.has(r.id));

  if (!userId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 40, justifyContent: 'center', paddingBottom: tabSpace }}>
        <EmptyState
          icon="heart"
          title="احفظ أماكنك المفضلة"
          body="سجّل دخولك عشان تحفظ المطاعم اللي عجبتك وترجع لها بسرعة."
          action={<Button title="تسجيل الدخول" onPress={() => router.push('/auth/login')} />}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.white }}
      data={visible}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabSpace, paddingHorizontal: 20, gap: 16 }}
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
        <View style={{ gap: 2, marginBottom: 6 }}>
          <Title size={26}>المفضلة</Title>
          {visible.length ? (
            <Txt color={colors.muted}>{ar(visible.length)} {visible.length > 10 || visible.length < 3 ? 'مكان' : 'أماكن'} محفوظة</Txt>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        items === null ? (
          <Loading />
        ) : (
          <EmptyState
            icon="heart"
            title="ما حفظت شي للحين"
            body="اضغط على القلب في أي مطعم يعجبك وبيظهر هنا."
            action={<Button title="استكشف المطاعم" variant="outline" onPress={() => router.navigate('/')} />}
          />
        )
      }
      renderItem={({ item }) => <RestaurantRow restaurant={item} km={coords ? distanceKm(coords, item) : null} />}
    />
  );
}
