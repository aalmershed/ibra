import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Linking, Pressable, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomFade } from '../../components/BottomFade';
import { Button, EmptyState, FadeIn, HeartButton, Icon, IconButton, Loading, Photo, Scrim, Stars, Title, Txt, type IconName } from '../../components/ui';
import { fetchDishes, fetchMyRatings, fetchRatingStats, fetchRestaurant, rateDish } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { ar, formatDistance, formatPrice } from '../../lib/format';
import { distanceKm, openDirections, useUserLocation } from '../../lib/location';
import { categoryLabel, radius, tintFor } from '../../lib/theme';
import { useColors } from '../../lib/appearance';
import type { Dish, RatingStats, Restaurant } from '../../lib/types';

export default function RestaurantScreen() {
  const colors = useColors();
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
  const scrollY = useRef(new Animated.Value(0)).current;

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
  const HERO = 440;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const share = () => Share.share({ message: `${r.name} — شفته في IBRA\nhttps://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}` });

  // الصورة تتحرك أبطأ من الصفحة (parallax) وتكبر لما تسحب لتحت
  const heroStyle = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [-200, 0, HERO], outputRange: [-100, 0, HERO * 0.45], extrapolateRight: 'clamp' }) },
      { scale: scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.5, 1], extrapolateRight: 'clamp' }) },
    ],
  } as const;
  // شريط العنوان يظهر لما الصورة تختفي
  const barOpacity = scrollY.interpolate({ inputRange: [HERO - 160, HERO - 90], outputRange: [0, 1], extrapolate: 'clamp' });

  const chips: { icon: IconName; label: string }[] = [
    { icon: 'tag', label: r.cuisine || categoryLabel(r.category) },
    ...(r.district ? [{ icon: 'map-pin' as IconName, label: r.district }] : []),
    ...(formatDistance(km) ? [{ icon: 'navigation' as IconName, label: formatDistance(km)! }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[{ height: HERO }, heroStyle]}>
          <FlatList
            horizontal
            pagingEnabled
            data={images}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))}
            renderItem={({ item }) => <Photo uri={item} tint={tintFor(r.id)} style={{ width, height: HERO }} iconSize={48} />}
          />
          <Scrim height="45%" strength={0.55} />
          {images.length > 1 ? (
            <View pointerEvents="none" style={{ position: 'absolute', bottom: 52, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: i === page ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </View>
          ) : null}
        </Animated.View>

        <View style={{ marginTop: -32, backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 20, paddingTop: 26, gap: 20 }}>
          <View style={{ gap: 10 }}>
            {r.is_featured ? (
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.accentSoft }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
                <Txt size={12} weight="semibold" color={colors.accentDark}>
                  اختيار IBRA
                </Txt>
              </View>
            ) : null}
            <Title size={32} style={{ lineHeight: 44 }}>
              {r.name}
            </Title>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {chips.map((c) => (
                <View key={c.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: colors.surface }}>
                  <Icon name={c.icon} size={14} color={colors.muted} />
                  <Txt size={13} weight="medium">
                    {c.label}
                  </Txt>
                </View>
              ))}
            </View>
          </View>

          {r.description ? (
            <Txt size={15} color={colors.muted} style={{ lineHeight: 27 }}>
              {r.description}
            </Txt>
          ) : null}

          <View style={{ gap: 12, paddingTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Title size={21}>الأطباق الموصى بها</Title>
              {dishes.length ? (
                <Txt size={13} color={colors.muted}>
                  اضغط الطبق لتقييمه
                </Txt>
              ) : null}
            </View>
            {dishes.length === 0 ? (
              <Txt color={colors.muted}>بنضيف الأطباق المميزة لهذا المكان قريباً.</Txt>
            ) : (
              dishes.map((d, i) => {
                const s = stats[d.id];
                const open = openDish === d.id;
                const price = formatPrice(d.price);
                return (
                  <FadeIn key={d.id} index={i}>
                    <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityHint="اضغط لتقييم الطبق"
                        onPress={() => setOpenDish(open ? null : d.id)}
                        style={({ pressed }) => ({ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 10, opacity: pressed ? 0.85 : 1 })}
                      >
                        <Photo uri={d.image_url} tint={tintFor(d.id)} style={{ width: 92, height: 92, borderRadius: 18 }} iconSize={22} />
                        <View style={{ flex: 1, gap: 4 }}>
                          <Txt weight="semibold" size={16} numberOfLines={1}>
                            {d.name}
                          </Txt>
                          {d.description ? (
                            <Txt size={13} color={colors.muted} numberOfLines={2}>
                              {d.description}
                            </Txt>
                          ) : null}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {price ? (
                              <Txt weight="semibold" size={14} color={colors.accent}>
                                {price}
                              </Txt>
                            ) : null}
                            {s ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Txt size={13} color={colors.star}>
                                  ★
                                </Txt>
                                <Txt size={13} weight="medium">
                                  {ar(s.avg_rating)}
                                </Txt>
                                <Txt size={12} color={colors.muted}>
                                  ({ar(s.ratings_count)})
                                </Txt>
                              </View>
                            ) : (
                              <Txt size={12} color={colors.muted}>
                                جديد
                              </Txt>
                            )}
                          </View>
                        </View>
                        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
                      </Pressable>
                      {open ? (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 4, alignItems: 'center' }}>
                          <Txt weight="semibold" size={14}>
                            {mine[d.id] ? 'تقييمك' : 'كم تعطيه؟'}
                          </Txt>
                          <Stars value={mine[d.id] ?? 0} onChange={(n) => onRate(d.id, n)} />
                        </View>
                      ) : null}
                    </View>
                  </FadeIn>
                );
              })
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* شريط علوي: أزرار عائمة فوق الصورة، ويتحول لشريط بالعنوان لما تنزل */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 64, backgroundColor: colors.white, opacity: barOpacity, borderBottomWidth: 1, borderBottomColor: colors.lineSoft }}
        />
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, height: insets.top + 64, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconButton name="chevron-right" label="رجوع" bg={colors.glass} onPress={back} />
          <Animated.View style={{ flex: 1, opacity: barOpacity }}>
            <Txt weight="display" size={17} numberOfLines={1} style={{ textAlign: 'center' }}>
              {r.name}
            </Txt>
          </Animated.View>
          {isAdmin ? <IconButton name="edit-2" label="تعديل المطعم" bg={colors.glass} onPress={() => router.push({ pathname: '/admin/edit', params: { id: r.id } })} /> : null}
          <HeartButton bg={colors.glass} active={isFavorite(r.id)} onPress={() => toggle(r.id)} />
        </View>
      </View>

      {/* شريط الأزرار الثابت تحت */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom + 110 }}>
        <BottomFade />
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 14, flexDirection: 'row', gap: 10 }}>
          <Button title="الاتجاهات" icon="navigation" height={56} style={{ flex: 1 }} onPress={() => openDirections(r.latitude, r.longitude, r.name)} />
          {r.phone ? <IconButton name="phone" label="اتصال" size={56} bg={colors.surface} onPress={() => Linking.openURL(`tel:${r.phone}`)} /> : null}
          <IconButton name="share-2" label="مشاركة" size={56} bg={colors.surface} onPress={share} />
        </View>
      </View>
    </View>
  );
}
