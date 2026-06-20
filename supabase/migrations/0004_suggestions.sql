create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  cuisine text,
  notes text,
  submitted_by uuid references profiles(id) on delete set null,
  status text default 'pending'
    check (status in ('pending', 'imported', 'dismissed')),
  imported_restaurant_id uuid references restaurants(id) on delete set null,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;

create policy "Anyone can submit a suggestion"
  on suggestions for insert
  with check (true);

create policy "Admins can view all suggestions"
  on suggestions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update suggestions"
  on suggestions for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );
