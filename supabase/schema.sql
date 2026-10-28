-- =============================================================
-- IBRA — قاعدة البيانات والصلاحيات
-- انسخ هذا الملف كامل والصقه في Supabase > SQL Editor ثم اضغط Run
-- =============================================================

-- ---------- 1) ملفات المستخدمين والأدوار ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ينشئ ملف تلقائياً لكل مستخدم جديد يسجّل
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- هل المستخدم الحالي مدير؟
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- 2) المطاعم ----------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'restaurant' check (category in ('restaurant', 'cafe', 'dessert', 'breakfast')),
  cuisine text,
  district text,
  description text,
  phone text,
  latitude double precision not null,
  longitude double precision not null,
  images text[] not null default '{}',
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- 3) الأطباق ----------
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2),
  image_url text,
  is_recommended boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists dishes_restaurant_idx on public.dishes (restaurant_id);

-- ---------- 4) المفضلة ----------
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- ---------- 5) تقييم الأطباق ----------
create table if not exists public.dish_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

-- متوسط التقييم لكل طبق
create or replace view public.dish_rating_stats
with (security_invoker = true) as
  select dish_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*)::int as ratings_count
  from public.dish_ratings
  group by dish_id;

-- =============================================================
-- الصلاحيات (Row Level Security)
-- =============================================================
alter table public.profiles     enable row level security;
alter table public.restaurants  enable row level security;
alter table public.dishes       enable row level security;
alter table public.favorites    enable row level security;
alter table public.dish_ratings enable row level security;

-- الملفات: كل مستخدم يشوف ملفه، والمدير يشوف الكل
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- المستخدم يعدّل اسمه فقط — ما يقدر يرفع صلاحيته لمدير
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- المطاعم: الكل يتصفح (حتى الزوار)، والمدير فقط يضيف ويعدّل ويحذف
drop policy if exists "restaurants_read" on public.restaurants;
create policy "restaurants_read" on public.restaurants
  for select using (true);
drop policy if exists "restaurants_admin_write" on public.restaurants;
create policy "restaurants_admin_write" on public.restaurants
  for all using (public.is_admin()) with check (public.is_admin());

-- الأطباق: نفس المطاعم
drop policy if exists "dishes_read" on public.dishes;
create policy "dishes_read" on public.dishes
  for select using (true);
drop policy if exists "dishes_admin_write" on public.dishes;
create policy "dishes_admin_write" on public.dishes
  for all using (public.is_admin()) with check (public.is_admin());

-- المفضلة: كل مستخدم يدير مفضلته فقط
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- التقييمات: الكل يشوف، والمستخدم المسجل يقيّم ويعدّل تقييمه فقط
drop policy if exists "ratings_read" on public.dish_ratings;
create policy "ratings_read" on public.dish_ratings
  for select using (true);
drop policy if exists "ratings_insert_own" on public.dish_ratings;
create policy "ratings_insert_own" on public.dish_ratings
  for insert with check (user_id = auth.uid());
drop policy if exists "ratings_update_own" on public.dish_ratings;
create policy "ratings_update_own" on public.dish_ratings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "ratings_delete_own" on public.dish_ratings;
create policy "ratings_delete_own" on public.dish_ratings
  for delete using (user_id = auth.uid());

-- =============================================================
-- تخزين الصور: الكل يشوف، والمدير فقط يرفع ويحذف
-- =============================================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "images_admin_insert" on storage.objects;
create policy "images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_update" on storage.objects;
create policy "images_admin_update" on storage.objects
  for update using (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_delete" on storage.objects;
create policy "images_admin_delete" on storage.objects
  for delete using (bucket_id = 'images' and public.is_admin());
