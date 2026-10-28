import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, HeartButton, IconButton, Loading, Photo, Stars, Title, Txt } from '../../components/ui';
import { fetchDishes, fetchMyRatings, fetchRatingStats, fetchRestaurant, rateDish } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { ar, formatDistance, formatPrice } from '../../lib/format';
import { distanceKm, openDirections, useUserLocation } from '../../lib/location';
import { categoryLabel, colors, tintFor } from '../../lib/theme';
import type { Dish, RatingStats, Restaurant } from '../../lib/types';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, isAdmin } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const { coords } = useUserLocation();

  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stats, setStats] = useState<Record<string, RatingStats>>({});
  const [mine, setMine] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [openDish, setOpenDish] = useState<string | null>(null);
  const userId = session?.user.id;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, ds] = await Promise.all([fetchRestaurant(id), fetchDishes(id)]);
      setRestaurant(r);
      setDishes(ds);
      const dishIds = ds.map((d) => d.id);
      setStats(await fetchRatingStats(dishIds));
      if (userId) setMine(await fetchMyRatings(userId, dishIds));
    } catch {
      setRestaurant((prev) => (prev === undefined ? null : prev));
    }
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRate = async (dishId: string, value: number) => {
    if (!userId) {
      Alert.alert('سجّل دخولك', 'عشان تقيّم الأطباق، سجّل دخولك أو أنشئ حساب.', [
        { text: 'لاحقاً', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    const before = mine[dishId];
    setMine((m) => ({ ...m, [dishId]: value }));
    try {
      await rateDish(userId, dishId, value);
      setStats(await fetchRatingStats(dishes.map((d) => d.id)));
    } catch {
      setMine((m) => ({ ...m, [dishId]: before }));
      Alert.alert('ما قدرنا نحفظ التقييم', 'حاول مرة ثانية.');
    }
  };

  if (restaurant === undefined) return <Loading />;
  if (restaurant === null) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center' }}>
        <EmptyState icon="alert-circle" title="ما لقينا هذا المكان" body="يمكن انحذف أو فيه مشكلة اتصال." action={<Button title="رجوع" variant="outline" onPress={() => router.back()} />} />
      </View>
    );
  }

  const r = restaurant;
  const images = r.images.length ? r.images : [null];
  const km = coords ? distanceKm(coords, r) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View>
          <FlatList
            horizontal
            pagingEnabled
            data={images}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))}
            renderItem={({ item }) => <Photo uri={item} tint={tintFor(r.id)} style={{ width, height: 320 }} iconSize={48} />}
          />
          <View style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton name="chevron-right" label="رجوع" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isAdmin ? <IconButton name="edit-2" label="تعديل المطعم" onPress={() => router.push({ pathname: '/admin/edit', params: { id: r.id } })} /> : null}
              <HeartButton active={isFavorite(r.id)} onPress={() => toggle(r.id)} />
            </View>
          </View>
          {images.length > 1 ? (
            <View style={{ position: 'absolute', bottom: 36, end: 16, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: 'rgba(28,25,23,0.6)', justifyContent: 'center' }}>
              <Txt size={12} color={colors.white}>
                {ar(page + 1)} / {ar(images.length)}
              </Txt>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: -24, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 22, gap: 16 }}>
          <View style={{ gap: 6 }}>
            {r.is_featured ? (
              <View style={{ alignSelf: 'flex-start', height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.accentSoft, justifyContent: 'center' }}>
                <Txt size={12} weight="semibold" color={colors.accentDark}>
                  مُوصى به من IBRA
                </Txt>
              </View>
            ) : null}
            <Title size={26}>{r.name}</Title>
            <Txt size={14} color={colors.muted}>
              {[r.cuisine || categoryLabel(r.category), r.district, formatDistance(km)].filter(Boolean).join(' · ')}
            </Txt>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="الاتجاهات" icon="navigation" height={48} style={{ flex: 1 }} onPress={() => openDirections(r.latitude, r.longitude, r.name)} />
            {r.phone ? <IconButton name="phone" label="اتصال" size={48} bordered onPress={() => Linking.openURL(`tel:${r.phone}`)} /> : null}
            <IconButton
              name="share-2"
              label="مشاركة"
              size={48}
              bordered
              onPress={() =>
                Share.share({
                  message: `${r.name} — شفته في IBRA\nhttps://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`,
                })
              }
            />
          </View>

          {r.description ? (
            <Txt size={15} color={colors.ink} style={{ lineHeight: 26 }}>
              {r.description}
            </Txt>
          ) : null}

          <View style={{ height: 1, backgroundColor: colors.lineSoft }} />

          <Title>الأطباق الموصى بها</Title>
          {dishes.length === 0 ? (
            <Txt color={colors.muted}>بنضيف الأطباق المميزة لهذا المكان قريباً.</Txt>
          ) : (
            dishes.map((d) => {
              const s = stats[d.id];
              const open = openDish === d.id;
              const price = formatPrice(d.price);
              return (
                <View key={d.id} style={{ gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint="اضغط لتقييم الطبق"
                    onPress={() => setOpenDish(open ? null : d.id)}
                    style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
                  >
                    <Photo uri={d.image_url} tint={tintFor(d.id)} style={{ width: 72, height: 72, borderRadius: 14 }} iconSize={20} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt weight="semibold" size={15} numberOfLines={1}>
                        {d.name}
                      </Txt>
                      {d.description ? (
                        <Txt size={13} color={colors.muted} numberOfLines={2}>
                          {d.description}
                        </Txt>
                      ) : null}
                      <Txt size={13} color={colors.muted}>
                        {s ? `★ ${ar(s.avg_rating)} (${ar(s.ratings_count)})` : 'لا توجد تقييمات بعد'}
                        {mine[d.id] ? ' · قيّمته' : ''}
                      </Txt>
                    </View>
                    {price ? (
                      <Txt weight="semibold" size={14}>
                        {price}
                      </Txt>
                    ) : null}
                  </Pressable>
                  {open ? (
                    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 6 }}>
                      <Txt weight="semibold" size={14}>
                        {mine[d.id] ? 'تقييمك' : 'قيّم هذا الطبق'}
                      </Txt>
                      <Stars value={mine[d.id] ?? 0} onChange={(n) => onRate(d.id, n)} />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
