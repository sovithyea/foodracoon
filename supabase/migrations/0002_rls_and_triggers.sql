-- Row Level Security from day one.
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.user_restaurants enable row level security;
alter table public.lists enable row level security;
alter table public.list_restaurants enable row level security;
alter table public.recommendations enable row level security;
alter table public.follows enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_logs enable row level security;

-- profiles: world-readable; you may only write your own row.
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- restaurants: world-readable; writes via service role only (no anon/authenticated policy).
create policy "restaurants_select_all" on public.restaurants
  for select using (true);

-- user_restaurants: visible if public or owner; writable only by owner.
create policy "user_restaurants_select_public_or_own" on public.user_restaurants
  for select using (is_public or auth.uid() = user_id);
create policy "user_restaurants_insert_own" on public.user_restaurants
  for insert with check (auth.uid() = user_id);
create policy "user_restaurants_update_own" on public.user_restaurants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_restaurants_delete_own" on public.user_restaurants
  for delete using (auth.uid() = user_id);

-- lists: visible if public or owner; writable only by owner.
create policy "lists_select_public_or_own" on public.lists
  for select using (is_public or auth.uid() = user_id);
create policy "lists_insert_own" on public.lists
  for insert with check (auth.uid() = user_id);
create policy "lists_update_own" on public.lists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lists_delete_own" on public.lists
  for delete using (auth.uid() = user_id);

-- list_restaurants: readable when the parent list is visible; writable by list owner.
create policy "list_restaurants_select_visible" on public.list_restaurants
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and (l.is_public or l.user_id = auth.uid())
    )
  );
create policy "list_restaurants_write_owner" on public.list_restaurants
  for all using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

-- follows: world-readable; you may only create/remove your own follow edges.
create policy "follows_select_all" on public.follows
  for select using (true);
create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- recommendations: visible to sender or recipient; sender creates; recipient may update (mark read).
create policy "recommendations_select_party" on public.recommendations
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "recommendations_insert_sender" on public.recommendations
  for insert with check (auth.uid() = from_user_id);
create policy "recommendations_update_recipient" on public.recommendations
  for update using (auth.uid() = to_user_id) with check (auth.uid() = to_user_id);

-- dishes: world-readable; any authenticated user may add a dish.
create policy "dishes_select_all" on public.dishes
  for select using (true);
create policy "dishes_insert_authenticated" on public.dishes
  for insert with check (auth.uid() = added_by);

-- dish_logs: scoped through the owning user_restaurants row.
create policy "dish_logs_select_visible" on public.dish_logs
  for select using (
    exists (
      select 1 from public.user_restaurants ur
      where ur.id = user_restaurant_id and (ur.is_public or ur.user_id = auth.uid())
    )
  );
create policy "dish_logs_write_owner" on public.dish_logs
  for all using (
    exists (select 1 from public.user_restaurants ur where ur.id = user_restaurant_id and ur.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.user_restaurants ur where ur.id = user_restaurant_id and ur.user_id = auth.uid())
  );

-- Create a profiles row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
