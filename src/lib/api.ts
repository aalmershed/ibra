import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { Dish, DishWithRestaurant, RatingStats, Restaurant } from './types';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------------- المطاعم ----------------

export async function fetchRestaurants(opts: { category?: string; search?: string } = {}) {
  let q = supabase.from('restaurants').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  if (opts.category && opts.category !== 'all') q = q.eq('category', opts.category);
  const term = opts.search?.trim().replace(/[%,()]/g, ' ');
  if (term) q = q.or(`name.ilike.%${term}%,cuisine.ilike.%${term}%,district.ilike.%${term}%`);
  const { data, error } = await q;
  fail(error);
  return (data ?? []) as Restaurant[];
}

export async function fetchRestaurant(id: string) {
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).maybeSingle();
  fail(error);
  return data as Restaurant | null;
}

export async function saveRestaurant(input: Partial<Restaurant> & { id?: string }) {
  const { id, created_at: _c, ...fields } = input;
  if (id) {
    const { data, error } = await supabase.from('restaurants').update(fields).eq('id', id).select().single();
    fail(error);
    return data as Restaurant;
  }
  const { data, error } = await supabase.from('restaurants').insert(fields).select().single();
  fail(error);
  return data as Restaurant;
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  fail(error);
}

// ---------------- الأطباق ----------------

export async function fetchDishes(restaurantId: string) {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('is_recommended', { ascending: false })
    .order('created_at', { ascending: true });
  fail(error);
  return (data ?? []) as Dish[];
}

export async function fetchDish(id: string) {
  const { data, error } = await supabase.from('dishes').select('*').eq('id', id).maybeSingle();
  fail(error);
  return data as Dish | null;
}

export async function fetchRecommendedDishes(limit = 12) {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, restaurant:restaurants(id, name)')
    .eq('is_recommended', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  fail(error);
  return (data ?? []) as DishWithRestaurant[];
}

export async function saveDish(input: Partial<Dish> & { restaurant_id: string; id?: string }) {
  const { id, created_at: _c, ...fields } = input;
  if (id) {
    const { error } = await supabase.from('dishes').update(fields).eq('id', id);
    fail(error);
  } else {
    const { error } = await supabase.from('dishes').insert(fields);
    fail(error);
  }
}

export async function deleteDish(id: string) {
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  fail(error);
}

// ---------------- التقييمات ----------------

export async function fetchRatingStats(dishIds: string[]) {
  const result: Record<string, RatingStats> = {};
  if (!dishIds.length) return result;
  const { data, error } = await supabase.from('dish_rating_stats').select('*').in('dish_id', dishIds);
  fail(error);
  for (const row of data ?? []) {
    result[row.dish_id] = { avg_rating: Number(row.avg_rating), ratings_count: row.ratings_count };
  }
  return result;
}

export async function fetchMyRatings(userId: string, dishIds: string[]) {
  const result: Record<string, number> = {};
  if (!dishIds.length) return result;
  const { data, error } = await supabase
    .from('dish_ratings')
    .select('dish_id, rating')
    .eq('user_id', userId)
    .in('dish_id', dishIds);
  fail(error);
  for (const row of data ?? []) result[row.dish_id] = row.rating;
  return result;
}

export async function rateDish(userId: string, dishId: string, rating: number) {
  const { error } = await supabase
    .from('dish_ratings')
    .upsert({ user_id: userId, dish_id: dishId, rating }, { onConflict: 'user_id,dish_id' });
  fail(error);
}

// ---------------- المفضلة ----------------

export async function fetchFavorites(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant:restaurants(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  fail(error);
  return (data ?? [])
    .map((r) => (r as unknown as { restaurant: Restaurant | null }).restaurant)
    .filter((r): r is Restaurant => !!r);
}

export async function fetchFavoriteIds(userId: string) {
  const { data, error } = await supabase.from('favorites').select('restaurant_id').eq('user_id', userId);
  fail(error);
  return new Set((data ?? []).map((r) => r.restaurant_id as string));
}

export async function setFavorite(userId: string, restaurantId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: userId, restaurant_id: restaurantId }, { onConflict: 'user_id,restaurant_id' });
    fail(error);
  } else {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);
    fail(error);
  }
}

// ---------------- الصور ----------------

/** يرفع صورة (base64) إلى Supabase Storage ويرجع رابطها العام */
export async function uploadImage(base64: string, folder: 'restaurants' | 'dishes', mimeType = 'image/jpeg') {
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, decode(base64), {
    contentType: mimeType,
    upsert: false,
  });
  fail(error);
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
}
