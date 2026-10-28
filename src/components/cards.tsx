import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useFavorites } from '../lib/favorites';
import { formatDistance, formatPrice } from '../lib/format';
import { categoryLabel, colors, radius, tintFor } from '../lib/theme';
import type { DishWithRestaurant, Restaurant } from '../lib/types';
import { HeartButton, Photo, Txt } from './ui';

function metaLine(r: Restaurant, km?: number | null) {
  return [r.cuisine || categoryLabel(r.category), r.district, formatDistance(km)].filter(Boolean).join(' · ');
}

export function FeaturedCard({ restaurant, km, width }: { restaurant: Restaurant; km?: number | null; width: number }) {
  const { isFavorite, toggle } = useFavorites();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={restaurant.name}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      style={({ pressed }) => ({ width, gap: 10, opacity: pressed ? 0.92 : 1 })}
    >
      <View>
        <Photo uri={restaurant.images[0]} tint={tintFor(restaurant.id)} style={{ height: 200, borderRadius: radius.lg }} iconSize={40} />
        {restaurant.is_featured ? (
          <View
            style={{
              position: 'absolute',
              top: 14,
              start: 14,
              height: 28,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: colors.white,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
            <Txt weight="semibold" size={12}>
              مُوصى به
            </Txt>
          </View>
        ) : null}
        <View style={{ position: 'absolute', top: 10, end: 10 }}>
          <HeartButton size={38} active={isFavorite(restaurant.id)} onPress={() => toggle(restaurant.id)} />
        </View>
      </View>
      <View>
        <Txt weight="semibold" size={17} numberOfLines={1}>
          {restaurant.name}
        </Txt>
        <Txt size={14} color={colors.muted} numberOfLines={1}>
          {metaLine(restaurant, km)}
        </Txt>
      </View>
    </Pressable>
  );
}

export function RestaurantRow({ restaurant, km }: { restaurant: Restaurant; km?: number | null }) {
  const { isFavorite, toggle } = useFavorites();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={restaurant.name}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.85 : 1 })}
    >
      <Photo uri={restaurant.images[0]} tint={tintFor(restaurant.id)} style={{ width: 84, height: 84, borderRadius: 16 }} iconSize={24} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="semibold" size={16} numberOfLines={1}>
          {restaurant.name}
        </Txt>
        <Txt size={13} color={colors.muted} numberOfLines={2}>
          {metaLine(restaurant, km)}
        </Txt>
      </View>
      <View style={{ borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 22 }}>
        <HeartButton size={40} active={isFavorite(restaurant.id)} onPress={() => toggle(restaurant.id)} />
      </View>
    </Pressable>
  );
}

export function DishCard({ dish }: { dish: DishWithRestaurant }) {
  const price = formatPrice(dish.price);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}${dish.restaurant ? '، ' + dish.restaurant.name : ''}`}
      onPress={() => dish.restaurant && router.push(`/restaurant/${dish.restaurant.id}`)}
      style={({ pressed }) => ({ width: 152, gap: 6, opacity: pressed ? 0.85 : 1 })}
    >
      <Photo uri={dish.image_url} tint={tintFor(dish.id)} style={{ height: 116, borderRadius: 16 }} iconSize={24} />
      <Txt weight="semibold" size={14} numberOfLines={1}>
        {dish.name}
      </Txt>
      <Txt size={12} color={colors.muted} numberOfLines={1}>
        {[dish.restaurant?.name, price].filter(Boolean).join(' · ')}
      </Txt>
    </Pressable>
  );
}
