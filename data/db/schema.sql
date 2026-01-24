create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.estates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.estate_members (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  user_id uuid references auth.users(id),
  email text not null,
  role text not null check (role in ('admin', 'executor', 'heir')),
  status text not null check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  unique (estate_id, email)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  name text not null,
  description text,
  location text,
  notes text,
  value_low numeric,
  value_high numeric,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  heir_id uuid not null references auth.users(id),
  emotional_score integer not null check (emotional_score between 0 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (asset_id, heir_id)
);

create table if not exists public.decedent_boosts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  heir_id uuid not null references auth.users(id),
  boost integer not null check (boost between 0 and 2),
  note text,
  created_at timestamptz not null default now(),
  unique (asset_id, heir_id)
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  heir_id uuid not null references auth.users(id),
  name text not null check (name in ('A', 'B', 'C')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estate_id, heir_id, name)
);

create table if not exists public.scenario_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (scenario_id, asset_id)
);

create or replace function public.is_estate_member(target_estate_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.estate_members em
    where em.estate_id = target_estate_id
      and em.user_id = auth.uid()
      and em.status = 'active'
  );
$$;

create or replace function public.is_estate_admin(target_estate_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.estate_members em
    where em.estate_id = target_estate_id
      and em.user_id = auth.uid()
      and em.status = 'active'
      and em.role in ('admin', 'executor')
  );
$$;

create or replace function public.is_scenario_owner(target_scenario_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.scenarios s
    where s.id = target_scenario_id
      and s.heir_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.estates enable row level security;
alter table public.estate_members enable row level security;
alter table public.assets enable row level security;
alter table public.asset_documents enable row level security;
alter table public.preferences enable row level security;
alter table public.decedent_boosts enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_items enable row level security;

create policy "profiles are self readable"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles are self writable"
on public.profiles
for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "estates are readable by members"
on public.estates
for select
to authenticated
using (public.is_estate_member(id));

create policy "estates are insertable by authenticated"
on public.estates
for insert
to authenticated
with check (created_by = auth.uid());

create policy "estates are updatable by admins"
on public.estates
for update
to authenticated
using (public.is_estate_admin(id))
with check (public.is_estate_admin(id));

create policy "estate members readable by members"
on public.estate_members
for select
to authenticated
using (public.is_estate_member(estate_id));

create policy "estate members insertable by admins"
on public.estate_members
for insert
to authenticated
with check (public.is_estate_admin(estate_id));

create policy "estate members updatable by admins"
on public.estate_members
for update
to authenticated
using (public.is_estate_admin(estate_id))
with check (public.is_estate_admin(estate_id));

create policy "assets readable by members"
on public.assets
for select
to authenticated
using (public.is_estate_member(estate_id));

create policy "assets writable by admins"
on public.assets
for all
to authenticated
using (public.is_estate_admin(estate_id))
with check (public.is_estate_admin(estate_id));

create policy "asset documents readable by members"
on public.asset_documents
for select
to authenticated
using (
  public.is_estate_member(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
);

create policy "asset documents writable by admins"
on public.asset_documents
for all
to authenticated
using (
  public.is_estate_admin(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
)
with check (
  public.is_estate_admin(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
);

create policy "preferences readable by members"
on public.preferences
for select
to authenticated
using (
  public.is_estate_member(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
);

create policy "preferences writable by owner"
on public.preferences
for all
to authenticated
using (heir_id = auth.uid())
with check (heir_id = auth.uid());

create policy "decedent boosts readable by members"
on public.decedent_boosts
for select
to authenticated
using (
  public.is_estate_member(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
);

create policy "decedent boosts writable by admins"
on public.decedent_boosts
for all
to authenticated
using (
  public.is_estate_admin(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
)
with check (
  public.is_estate_admin(
    (select a.estate_id from public.assets a where a.id = asset_id)
  )
);

create policy "scenarios readable by members"
on public.scenarios
for select
to authenticated
using (public.is_estate_member(estate_id));

create policy "scenarios writable by owner"
on public.scenarios
for all
to authenticated
using (heir_id = auth.uid())
with check (heir_id = auth.uid());

create policy "scenario items readable by members"
on public.scenario_items
for select
to authenticated
using (
  public.is_estate_member(
    (select s.estate_id from public.scenarios s where s.id = scenario_id)
  )
);

create policy "scenario items writable by owner"
on public.scenario_items
for all
to authenticated
using (public.is_scenario_owner(scenario_id))
with check (public.is_scenario_owner(scenario_id));

alter table public.scenarios drop constraint if exists scenarios_name_check;
alter table public.scenarios
  add constraint scenarios_name_check check (name in ('A', 'B', 'C'));

alter table public.assets
  add column if not exists asset_type text,
  add column if not exists asset_category text,
  add column if not exists size_label text,
  add column if not exists ai_value_low numeric,
  add column if not exists ai_value_high numeric,
  add column if not exists ai_confidence numeric,
  add column if not exists ai_factors text[],
  add column if not exists ai_disclaimer text;

alter table public.asset_documents
  add column if not exists title text,
  add column if not exists doc_type text,
  add column if not exists summary text,
  add column if not exists ai_summary text,
  add column if not exists doc_text text;

create table if not exists public.estate_rules (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  rule_type text not null,
  title text not null,
  description text,
  config jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.estate_rule_acceptances (
  id uuid primary key default gen_random_uuid(),
  estate_rule_id uuid not null references public.estate_rules(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  accepted_at timestamptz not null default now(),
  unique (estate_rule_id, user_id)
);

alter table public.estate_rules enable row level security;
alter table public.estate_rule_acceptances enable row level security;

create policy "estate rules readable by members"
on public.estate_rules
for select
to authenticated
using (public.is_estate_member(estate_id));

create policy "estate rules writable by admins"
on public.estate_rules
for all
to authenticated
using (public.is_estate_admin(estate_id))
with check (public.is_estate_admin(estate_id));

create policy "estate rule acceptances readable by members"
on public.estate_rule_acceptances
for select
to authenticated
using (
  public.is_estate_member(
    (select estate_id from public.estate_rules er where er.id = estate_rule_id)
  )
);

create policy "estate rule acceptances writable by owner"
on public.estate_rule_acceptances
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- NOTE: Storage policies must be created by the storage owner role.
-- The SQL editor may not allow `set role supabase_storage_admin`.
-- If you see permission errors, create these via the Supabase UI
-- (Storage -> Policies) or ask for elevated SQL execution.
--
-- Storage policy definitions (apply in Supabase UI if needed):
-- alter table storage.objects enable row level security;
--
-- create policy "asset docs readable by estate members"
-- on storage.objects
-- for select
-- to authenticated
-- using (
--   bucket_id = 'asset-docs'
--   and public.is_estate_member((storage.foldername(name))[1]::uuid)
-- );
--
-- create policy "asset docs writable by estate admins"
-- on storage.objects
-- for all
-- to authenticated
-- using (
--   bucket_id = 'asset-docs'
--   and public.is_estate_admin((storage.foldername(name))[1]::uuid)
-- )
-- with check (
--   bucket_id = 'asset-docs'
--   and public.is_estate_admin((storage.foldername(name))[1]::uuid)
-- );
