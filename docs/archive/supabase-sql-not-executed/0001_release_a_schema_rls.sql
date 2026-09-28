-- Bunny Library — Supabase schema (Release A subset) + Row Level Security policies
-- Port of prisma/schema.prisma to Postgres for the Supabase production path
-- (docs/DECISIONS.md D-11/D-12, ARCHITECTURE.md §5).
-- Local demo runtime uses SQLite + data-layer enforcement; this file is the source of truth
-- for the Supabase deployment. Run in Supabase SQL editor or via supabase CLI migration.

create extension if not exists "pgcrypto";

-- ============ enums ============
create type user_role as enum ('reader', 'editor', 'admin');
create type series_format as enum ('manga', 'webtoon', 'novel'); -- novel reserved for Release B
create type series_status as enum ('ongoing', 'completed', 'hiatus');
create type chapter_workflow as enum ('draft', 'review', 'published');
create type reading_direction as enum ('rtl', 'ltr');

-- ============ tables ============
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  nickname text not null,
  password_hash text, -- unused on Supabase (Auth manages credentials); kept for schema parity
  role user_role not null default 'reader',
  avatar_seed text not null default 'v1',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_original text,
  synopsis_ar text not null,
  format series_format not null,
  status series_status not null default 'ongoing',
  genres_json jsonb not null default '[]',
  tags_json jsonb not null default '[]',
  author text not null,
  translator text,
  cover_path text not null default '',
  accent text not null default '#9B7BFF',
  is_featured boolean not null default false,
  rating_avg numeric(3,1) not null default 0,
  rating_count int not null default 0,
  display_order int not null default 0,
  reads int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references series(id) on delete cascade,
  number int not null,
  title_ar text not null,
  workflow chapter_workflow not null default 'draft',
  published_at timestamptz,
  is_premium_demo boolean not null default false,
  reading_direction reading_direction not null default 'rtl',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, number)
);

create table chapter_pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  page_index int not null,
  image_path text not null,
  width int not null default 800,
  height int not null default 1200,
  unique (chapter_id, page_index)
);

create table reading_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  series_id uuid not null references series(id) on delete cascade,
  chapter_id uuid not null references chapters(id) on delete cascade,
  page_index int not null default 0,
  percent numeric(5,2) not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (profile_id, chapter_id)
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  series_id uuid references series(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  meta_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table editorial_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  theme text not null default 'violet',
  display_order int not null default 0,
  is_featured boolean not null default false,
  series_slugs_json jsonb not null default '[]', -- Release B: normalize into collection_series join
  created_at timestamptz not null default now()
);

create index chapters_series_published_idx on chapters (series_id, workflow, number);
create index reading_progress_profile_idx on reading_progress (profile_id, updated_at desc);
create index analytics_events_created_idx on analytics_events (created_at desc);

-- ============ role helpers ============
create or replace function current_profile_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where auth_user_id = auth.uid();
$$;

create or replace function is_editor_or_admin() returns boolean
language sql stable as $$ select current_profile_role() in ('editor','admin') $$;

create or replace function is_admin() returns boolean
language sql stable as $$ select current_profile_role() = 'admin' $$;

-- ============ Row Level Security (docs/ARCHITECTURE.md §5) ============
alter table profiles enable row level security;
alter table series enable row level security;
alter table chapters enable row level security;
alter table chapter_pages enable row level security;
alter table reading_progress enable row level security;
alter table analytics_events enable row level security;
alter table editorial_collections enable row level security;

-- profiles: public read; owner update; admins manage
create policy profiles_public_read on profiles for select using (true);
create policy profiles_owner_update on profiles for update using (auth_user_id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin());

-- series: public read (published gating lives on chapters)
create policy series_public_read on series for select using (true);
create policy series_editor_write on series for all using (is_editor_or_admin());

-- chapters: public read ONLY published; editors manage everything
create policy chapters_public_read on chapters for select using (workflow = 'published');
create policy chapters_editor_write on chapters for all using (is_editor_or_admin());

-- chapter_pages: public read only for pages of published chapters
create policy pages_public_read on chapter_pages for select using (
  exists (select 1 from chapters c where c.id = chapter_id and c.workflow = 'published')
);
create policy pages_editor_write on chapter_pages for all using (is_editor_or_admin());

-- reading_progress: strictly owner-scoped (T2 pattern: (select auth.uid()))
create policy progress_owner_all on reading_progress for all
  using ((select auth.uid()) = (select auth_user_id from profiles p where p.id = profile_id));

-- analytics: authenticated insert; staff read
create policy events_insert_authenticated on analytics_events for insert
  with check ((select auth.uid()) is not null);
create policy events_staff_read on analytics_events for select using (is_editor_or_admin());

-- collections: public read; editors manage
create policy collections_public_read on editorial_collections for select using (true);
create policy collections_editor_write on editorial_collections for all using (is_editor_or_admin());

-- ============ Storage buckets (run in Supabase SQL editor against storage schema) ============
-- insert into storage.buckets (id, name, public) values
--   ('covers', 'covers', true),
--   ('pages',  'pages',  true),
--   ('panels', 'panels', true)
-- on conflict do nothing;
-- create policy "covers public read" on storage.objects for select using (bucket_id = 'covers');
-- create policy "storage staff write" on storage.objects for insert with check (
--   bucket_id in ('covers','pages','panels') and is_editor_or_admin()
-- );

-- ============ Seed note ============
-- Demo data lives in prisma/seed.ts (SQLite demo). For Supabase, run the same manifest via
-- a service-role seeding script (scripts/seed-supabase.ts — Release C deliverable).
