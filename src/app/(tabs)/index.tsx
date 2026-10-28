import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishCard, FeaturedCard, RestaurantRow } from '../../components/cards';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, Chip, EmptyState, IconButton, Loading, SearchBar, Title, Txt } from '../../components/ui';
import { fetchRecommendedDishes, fetchRestaurants } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { distanceKm, useUserLocation } from '../../lib/location';
import { CATEGORIES, colors } from '../../lib/theme';
import type { DishWithRestaurant, Restaurant } from '../../lib/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { session, profile } = useAuth();
  const { coords } = useUserLocation();

  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [dishes, setDishes] = useState<DishWithRestaurant[]>([]);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    try {
      const [rs, ds] = await Promise.all([fetchRestaurants({ category, search }), fetchRecommendedDishes(12)]);
      if (id !== reqId.current) return;
      setRestaurants(rs);
      setDishes(ds);
      setError(false);
    } catch {
      if (id === reqId.current) setError(true);
    }
  }, [category, search]);

  // البحث ينتظر شوي بعد آخر حرف
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const km = (r: Restaurant) => (coords ? distanceKm(coords, r) : null);
  const featured = useMemo(() => (restaurants ?? []).filter((r) => r.is_featured), [restaurants]);
  const others = useMemo(() => {
    const list = [...(restaurants ?? [])];
    if (coords) list.sort((a, b) => distanceKm(coords, a) - distanceKm(coords, b));
    return list;
  }, [restaurants, coords]);
  const filtering = category !== 'all' || search.trim().length > 0;
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabSpace }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ paddingHorizontal: 20, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt weight="display" size={26} style={{ letterSpacing: 1, writingDirection: 'ltr' }}>
              IBRA
            </Txt>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 8 }} />
          </View>
          <IconButton name="user" label="حسابي" bg={colors.surface} onPress={() => router.push(session ? '/account' : '/auth/login')} />
        </View>

        <View style={{ gap: 2 }}>
          <Title size={28}>{firstName ? `هلا ${firstName}، وش ناكل اليوم؟` : 'وش ناكل اليوم؟'}</Title>
          <Txt color={colors.muted}>أفضل المطاعم والكافيهات، مختارة بعناية</Txt>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="ابحث عن مطعم، مطبخ، أو حي" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 16 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </ScrollView>

      {restaurants === null && !error ? (
        <Loading />
      ) : error ? (
        <EmptyState
          icon="wifi-off"
          title="ما قدرنا نحمّل المطاعم"
          body="تأكد من اتصالك بالإنترنت وحاول مرة ثانية."
          action={<Button title="إعادة المحاولة" variant="outline" onPress={load} />}
        />
      ) : (restaurants ?? []).length === 0 ? (
        <EmptyState
          icon={filtering ? 'search' : 'coffee'}
          title={filtering ? 'ما لقينا نتائج' : 'قريباً هنا أفضل المطاعم'}
          body={filtering ? 'جرّب كلمة ثانية أو غيّر التصنيف.' : 'نجهّز لك قائمة مختارة بعناية. ارجع لنا قريب!'}
        />
      ) : (
        <>
          {!filtering && featured.length > 0 ? (
            <View style={{ paddingTop: 26, gap: 12 }}>
              <Title style={{ paddingHorizontal: 20 }}>اختيارات IBRA</Title>
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(r) => r.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 40 + 14}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                renderItem={({ item }) => <FeaturedCard restaurant={item} km={km(item)} width={featured.length > 1 ? width - 60 : width - 40} />}
              />
            </View>
          ) : null}

          {!filtering && dishes.length > 0 ? (
            <View style={{ paddingTop: 28, gap: 12 }}>
              <Title style={{ paddingHorizontal: 20 }}>أطباق لازم تجربها</Title>
              <FlatList
                horizontal
                data={dishes}
                keyExtractor={(d) => d.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => <DishCard dish={item} />}
              />
            </View>
          ) : null}

          <View style={{ paddingTop: 28, paddingHorizontal: 20, gap: 16 }}>
            <Title>{filtering ? 'النتائج' : coords ? 'قريب منك' : 'كل الأماكن'}</Title>
            {others.map((r) => (
              <RestaurantRow key={r.id} restaurant={r} km={km(r)} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
