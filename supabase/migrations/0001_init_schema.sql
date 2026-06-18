-- Foodracoon initial schema (Phase 1 defines the full spec schema up front).
create extension if not exists pg_trgm;

-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  city text default 'Phnom Penh',
  created_at timestamptz not null default now(),
  followers_count int not null default 0,
  following_count int not null default 0
);

-- restaurants: cached place data (seed/admin/service-role writes only)
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  address text,
  district text,
  latitude float8 not null,
  longitude float8 not null,
  cuisine_type text[] not null default '{}',
  tags text[] not null default '{}',
  price_range int check (price_range between 1 and 4),
  google_rating float4,
  cover_photo_url text,
  phone text,
  website text,
  opening_hours jsonb,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index restaurants_district_idx on public.restaurants (district);
create index restaurants_cuisine_idx on public.restaurants using gin (cuisine_type);
create index restaurants_tags_idx on public.restaurants using gin (tags);
create index restaurants_name_trgm_idx on public.restaurants using gin (name gin_trgm_ops);

-- user_restaurants: the core relationship table
create table public.user_restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  status text check (status in ('want_to_try', 'visited', 'favourite')),
  rating float4 check (rating between 1 and 10),
  review text,
  visited_at date,
  photos text[] not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);
create index user_restaurants_user_idx on public.user_restaurants (user_id);
create index user_restaurants_restaurant_idx on public.user_restaurants (restaurant_id);

-- lists: user-curated named lists
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  emoji text,
  is_public boolean not null default true,
  cover_photo_url text,
  created_at timestamptz not null default now()
);

create table public.list_restaurants (
  list_id uuid not null references public.lists (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  added_at timestamptz not null default now(),
  note text,
  primary key (list_id, restaurant_id)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index recommendations_to_user_idx on public.recommendations (to_user_id);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  added_by uuid references public.profiles (id) on delete set null,
  photo_url text,
  created_at timestamptz not null default now()
);
create index dishes_restaurant_idx on public.dishes (restaurant_id);
create index dishes_name_trgm_idx on public.dishes using gin (name gin_trgm_ops);

create table public.dish_logs (
  id uuid primary key default gen_random_uuid(),
  user_restaurant_id uuid not null references public.user_restaurants (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  rating int check (rating between 1 and 5),
  note text
);

-- keep updated_at fresh on user_restaurants
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_restaurants_set_updated_at
  before update on public.user_restaurants
  for each row execute function public.set_updated_at();
