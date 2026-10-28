import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '../../components/TabBar';
import { Button, Chip, Icon, IconButton, Photo, Txt } from '../../components/ui';
import { fetchRestaurants } from '../../lib/api';
import { formatDistance } from '../../lib/format';
import { distanceKm, openDirections, RIYADH, useUserLocation } from '../../lib/location';
import { CATEGORIES, categoryLabel, radius, shadow, tintFor } from '../../lib/theme';
import { useAppearance } from '../../lib/appearance';
import type { Restaurant } from '../../lib/types';

export default function MapScreen() {
  const { colors, isDark } = useAppearance();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const mapRef = useRef<MapView>(null);
  const { coords, denied, refresh } = useUserLocation();
  const [all, setAll] = useState<Restaurant[]>([]);
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const centered = useRef(false);

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants().then(setAll).catch(() => {});
    }, []),
  );

  const list = useMemo(() => {
    const filtered = category === 'all' ? all : all.filter((r) => r.category === category);
    if (!coords) return filtered;
    return [...filtered].sort((a, b) => distanceKm(coords, a) - distanceKm(coords, b));
  }, [all, category, coords]);

  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;

  // أول ما يتوفر موقع المستخدم، نقرّب الخريطة عليه
  useEffect(() => {
    if (coords && !centered.current) {
      centered.current = true;
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 600);
    }
  }, [coords]);

  const goToMe = async () => {
    const c = coords ?? (await refresh());
    if (c) mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 500);
  };

  const select = (r: Restaurant) => {
    setSelectedId(r.id);
    mapRef.current?.animateToRegion(
      { latitude: r.latitude - 0.006, longitude: r.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      400,
    );
  };

  const km = selected && coords ? distanceKm(coords, selected) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.mapBg }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        initialRegion={{ ...(coords ?? RIYADH), latitudeDelta: 0.15, longitudeDelta: 0.15 }}
        showsUserLocation={!!coords}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        mapPadding={{ top: insets.top + 110, bottom: tabSpace + 180, left: 0, right: 0 }}
      >
        {list.map((r) => {
          const active = selected?.id === r.id;
          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              onPress={() => select(r)}
              tracksViewChanges={false}
              accessibilityLabel={r.name}
            >
              <View
                style={{
                  width: active ? 42 : 34,
                  height: active ? 42 : 34,
                  borderRadius: 21,
                  backgroundColor: active ? colors.accentFill : colors.white,
                  borderWidth: active ? 3 : 2,
                  borderColor: active ? colors.onAccent : colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={r.category === 'cafe' ? 'coffee' : 'map-pin'} size={active ? 18 : 15} color={active ? colors.onAccent : colors.accent} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, gap: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map((c) => (
            <View key={c.key} style={[{ borderRadius: 19 }, shadow, { shadowOpacity: 0.06, elevation: 2 }]}>
              <Chip label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
            </View>
          ))}
        </ScrollView>
        {denied ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.white, borderRadius: radius.md, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="alert-circle" color={colors.accent} size={18} />
            <Txt size={13} color={colors.muted} style={{ flex: 1 }}>
              فعّل الموقع عشان نعرض لك الأقرب. نعرض لك الرياض حالياً.
            </Txt>
          </View>
        ) : null}
      </View>

      <View style={{ position: 'absolute', end: 16, bottom: tabSpace + (selected ? 214 : 16) }}>
        <View style={[{ borderRadius: 24 }, shadow]}>
          <IconButton name="navigation" label="موقعي الحالي" color={colors.userDot} size={48} onPress={goToMe} />
        </View>
      </View>

      {selected ? (
        <View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.white,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: tabSpace - 4,
              gap: 14,
            },
            shadow,
          ]}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.inputBorder }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt weight="display" size={17}>
              {selectedId ? 'المكان المختار' : coords ? 'الأقرب لك' : 'اقتراح لك'}
            </Txt>
            {km != null ? (
              <Txt size={13} color={colors.muted}>
                على بعد {formatDistance(km)}
              </Txt>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Photo uri={selected.images[0]} tint={tintFor(selected.id)} style={{ width: 76, height: 76, borderRadius: 20 }} iconSize={22} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt weight="semibold" size={16} numberOfLines={1}>
                {selected.name}
              </Txt>
              <Txt size={13} color={colors.muted} numberOfLines={1}>
                {[selected.cuisine || categoryLabel(selected.category), selected.district].filter(Boolean).join(' · ')}
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="الاتجاهات"
              icon="navigation"
              height={48}
              style={{ flex: 1 }}
              onPress={() => openDirections(selected.latitude, selected.longitude, selected.name)}
            />
            <Button title="التفاصيل" variant="outline" height={48} style={{ flex: 1 }} onPress={() => router.push(`/restaurant/${selected.id}`)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
