export type Role = 'user' | 'admin';

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  cuisine: string | null;
  district: string | null;
  description: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  images: string[];
  is_featured: boolean;
  created_at: string;
};

export type Dish = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_recommended: boolean;
  created_at: string;
};

export type DishWithRestaurant = Dish & {
  restaurant: Pick<Restaurant, 'id' | 'name'> | null;
};

export type RatingStats = { avg_rating: number; ratings_count: number };
