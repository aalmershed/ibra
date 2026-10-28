import { router } from 'expo-router';
import { View } from 'react-native';
import { useColors } from '../lib/appearance';
import { useFavorites } from '../lib/favorites';
import { formatDistance, formatPrice } from '../lib/format';
import { categoryLabel, radius, tintFor } from '../lib/theme';
import type { DishWithRestaurant, Restaurant } from '../lib/types';
import { HeartButton, Icon, Photo, Pressy, Scrim, Txt } from './ui';

const WHITE = '#FFFFFF';

function metaLine(r: Restaurant) {
  return [r.cuisine || categoryLabel(r.category), r.district].filter(Boolean).join(' · ');
}

/** شارة صغيرة شبه شفافة فوق الصور */
function PhotoBadge({ icon, label }: { icon?: 'star' | 'navigation'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 11, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.38)' }}>
      {icon ? <Icon name={icon} size={12} color={WHITE} /> : null}
      <Txt weight="semibold" size={12} color={WHITE}>
        {label}
      </Txt>
    </View>
  );
}

/** بطاقة كبيرة بصورة كاملة والاسم مكتوب فوقها */
export function FeaturedCard({ restaurant, km, width }: { restaurant: Restaurant; km?: number | null; width: number }) {
  const colors = useColors();
  const { isFavorite, toggle } = useFavorites();
  const distance = formatDistance(km);
  return (
    <Pressy accessibilityLabel={restaurant.name} onPress={() => router.push(`/restaurant/${restaurant.id}`)} scaleTo={0.98} style={{ width }}>
      <View style={{ height: 380, borderRadius: radius.xl, overflow: 'hidden' }}>
        <Photo uri={restaurant.images[0]} tint={tintFor(restaurant.id)} style={{ flex: 1 }} iconSize={44} />
        <Scrim height="62%" />
        <View style={{ position: 'absolute', top: 16, start: 16, end: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: colors.glass }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
            <Txt weight="semibold" size={12}>
              اختيار IBRA
            </Txt>
          </View>
          <HeartButton size={42} bg={colors.glass} active={isFavorite(restaurant.id)} onPress={() => toggle(restaurant.id)} />
        </View>
        <View style={{ position: 'absolute', bottom: 0, start: 0, end: 0, padding: 20, gap: 8 }}>
          <Txt weight="display" size={26} color={WHITE} numberOfLines={1} style={{ lineHeight: 34 }}>
            {restaurant.name}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt size={14} color="rgba(255,255,255,0.86)" numberOfLines={1} style={{ flexShrink: 1 }}>
              {metaLine(restaurant)}
            </Txt>
            {distance ? <PhotoBadge icon="navigation" label={distance} /> : null}
          </View>
        </View>
      </View>
    </Pressy>
  );
}

/** صف مطعم: صورة مربعة، الاسم والتفاصيل، وزر المفضلة */
export function RestaurantRow({ restaurant, km }: { restaurant: Restaurant; km?: number | null }) {
  const colors = useColors();
  const { isFavorite, toggle } = useFavorites();
  const distance = formatDistance(km);
  return (
    <Pressy
      accessibilityLabel={restaurant.name}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      scaleTo={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface }}
    >
      <Photo uri={restaurant.images[0]} tint={tintFor(restaurant.id)} style={{ width: 88, height: 88, borderRadius: 18 }} iconSize={24} />
      <View style={{ flex: 1, gap: 6 }}>
        <Txt weight="semibold" size={16} numberOfLines={1}>
          {restaurant.name}
        </Txt>
        <Txt size={13} color={colors.muted} numberOfLines={1}>
          {metaLine(restaurant)}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {restaurant.is_featured ? (
            <View style={{ height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: colors.accentSoft, justifyContent: 'center' }}>
              <Txt size={11} weight="semibold" color={colors.accentDark}>
                مُوصى به
              </Txt>
            </View>
          ) : null}
          {distance ? (
            <View style={{ height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="navigation" size={10} color={colors.muted} />
              <Txt size={11} weight="medium" color={colors.muted}>
                {distance}
              </Txt>
            </View>
          ) : null}
        </View>
      </View>
      <HeartButton size={40} active={isFavorite(restaurant.id)} onPress={() => toggle(restaurant.id)} />
    </Pressy>
  );
}

/** بطاقة طبق: صورة طولية والسعر فوقها */
export function DishCard({ dish }: { dish: DishWithRestaurant }) {
  const colors = useColors();
  const price = formatPrice(dish.price);
  return (
    <Pressy
      accessibilityLabel={`${dish.name}${dish.restaurant ? '، ' + dish.restaurant.name : ''}`}
      onPress={() => dish.restaurant && router.push(`/restaurant/${dish.restaurant.id}`)}
      style={{ width: 164, gap: 10 }}
    >
      <View style={{ height: 196, borderRadius: radius.lg, overflow: 'hidden' }}>
        <Photo uri={dish.image_url} tint={tintFor(dish.id)} style={{ flex: 1 }} iconSize={26} />
        {price ? (
          <View style={{ position: 'absolute', bottom: 10, start: 10, height: 28, paddingHorizontal: 11, borderRadius: 14, backgroundColor: colors.glass, justifyContent: 'center' }}>
            <Txt weight="semibold" size={12}>
              {price}
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <Txt weight="semibold" size={15} numberOfLines={1}>
          {dish.name}
        </Txt>
        {dish.restaurant ? (
          <Txt size={12} color={colors.muted} numberOfLines={1}>
            {dish.restaurant.name}
          </Txt>
        ) : null}
      </View>
    </Pressy>
  );
}
