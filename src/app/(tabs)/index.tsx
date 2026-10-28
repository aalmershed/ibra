import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishCard, FeaturedCard, RestaurantRow } from '../../components/cards';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, Chip, EmptyState, FadeIn, Pressy, SearchBar, SectionTitle, Skeleton, Title, Txt } from '../../components/ui';
import { fetchRecommendedDishes, fetchRestaurants } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { distanceKm, useUserLocation } from '../../lib/location';
import { CATEGORIES, radius } from '../../lib/theme';
import { useColors } from '../../lib/appearance';
import type { DishWithRestaurant, Restaurant } from '../../lib/types';

export default function HomeScreen() {
  const colors = useColors();
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
  const [slide, setSlide] = useState(0);
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
  const cardWidth = width - 56;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabSpace }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ paddingHorizontal: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Txt weight="display" size={24} style={{ letterSpacing: 1.5, writingDirection: 'ltr' }}>
              IBRA
            </Txt>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 8 }} />
          </View>
          <Pressy
            accessibilityLabel="حسابي"
            onPress={() => router.push(session ? '/account' : '/auth/login')}
            scaleTo={0.9}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt weight="display" size={17} color={colors.accent}>
              {(firstName ?? session?.user.email ?? '').charAt(0).toUpperCase() || '؟'}
            </Txt>
          </Pressy>
        </View>

        <View style={{ gap: 4 }}>
          <Txt size={15} color={colors.muted}>
            {greeting()}{firstName ? `، ${firstName}` : ''} 👋
          </Txt>
          <Title size={34} style={{ lineHeight: 46 }}>
            وش ناكل اليوم؟
          </Title>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="ابحث عن مطعم، مطبخ، أو حي" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 16 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </ScrollView>

      {restaurants === null && !error ? (
        <HomeSkeleton width={cardWidth} />
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
            <View style={{ paddingTop: 28, gap: 14 }}>
              <SectionTitle title="اختيارات IBRA" subtitle="أماكن جربناها ونرشحها لك" />
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(r) => r.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 12}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => setSlide(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / (cardWidth + 12)))}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => <FeaturedCard restaurant={item} km={km(item)} width={featured.length > 1 ? cardWidth : width - 40} />}
              />
              {featured.length > 1 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  {featured.map((r, i) => (
                    <View key={r.id} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === slide ? colors.ink : colors.line }} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {!filtering && dishes.length > 0 ? (
            <View style={{ paddingTop: 30, gap: 14 }}>
              <SectionTitle title="أطباق لازم تجربها" subtitle="الأعلى تقييماً هالأسبوع" />
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

          <View style={{ paddingTop: 30, gap: 14 }}>
            <SectionTitle title={filtering ? 'النتائج' : coords ? 'قريب منك' : 'كل الأماكن'} />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {others.map((r, i) => (
                <FadeIn key={r.id} index={i}>
                  <RestaurantRow restaurant={r} km={km(r)} />
                </FadeIn>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** تحية حسب وقت اليوم */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'يومك سعيد';
  return 'مساء الخير';
}

/** شكل الصفحة وقت التحميل */
function HomeSkeleton({ width }: { width: number }) {
  return (
    <View style={{ paddingTop: 28, gap: 14 }}>
      <Skeleton style={{ marginHorizontal: 20, width: 160, height: 24, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
        <Skeleton style={{ width, height: 380, borderRadius: radius.xl }} />
        <Skeleton style={{ width: 40, height: 380, borderRadius: radius.xl }} />
      </View>
      <View style={{ paddingHorizontal: 20, gap: 10, paddingTop: 16 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} style={{ height: 108, borderRadius: radius.lg }} />
        ))}
      </View>
    </View>
  );
}
