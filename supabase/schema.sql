-- Tops MVP — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create extension if not exists "pgcrypto";

-- ============================================================
-- rooms
-- ============================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_session_id text not null,
  theme text not null,
  category text not null,            -- movie | tv | movie_character | music_track | music_artist | music_album | game | food | general
  top_size int not null check (top_size between 3 and 20),
  duration_seconds int not null check (duration_seconds between 30 and 3600),
  status text not null default 'lobby' check (status in ('lobby', 'running', 'reveal', 'finished')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists rooms_code_idx on rooms (code);

-- ============================================================
-- participants
-- ============================================================
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  session_id text not null,
  name text not null,
  is_host boolean not null default false,
  progress_count int not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, session_id)
);

create index if not exists participants_room_idx on participants (room_id);

-- ============================================================
-- rankings (one per participant per room)
-- ============================================================
create table if not exists rankings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  participant_id uuid not null references participants (id) on delete cascade,
  is_final boolean not null default false,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (participant_id)
);

-- ============================================================
-- ranking_items
-- ============================================================
create table if not exists ranking_items (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references rankings (id) on delete cascade,
  position int not null,
  provider text not null,        -- tmdb | spotify | igdb | themealdb | unsplash
  external_id text not null,
  type text not null,            -- movie | tv | person | track | artist | album | game | meal | photo
  name text not null,
  subtitle text,
  image_url text,
  external_url text,
  created_at timestamptz not null default now(),
  unique (ranking_id, position),
  unique (ranking_id, provider, external_id)
);

create index if not exists ranking_items_ranking_idx on ranking_items (ranking_id);

-- ============================================================
-- Row Level Security
-- ============================================================
-- The browser only ever talks to Supabase directly for Realtime
-- subscriptions on `rooms` and `participants` (non-sensitive fields:
-- status, timer, name, progress count). All writes and every read of
-- `rankings` / `ranking_items` go through Next.js server routes using
-- the service role key, so those two tables get NO public policies.

alter table rooms enable row level security;
alter table participants enable row level security;
alter table rankings enable row level security;
alter table ranking_items enable row level security;

drop policy if exists "rooms are publicly readable" on rooms;
create policy "rooms are publicly readable"
  on rooms for select
  using (true);

drop policy if exists "participants are publicly readable" on participants;
create policy "participants are publicly readable"
  on participants for select
  using (true);

-- No insert/update/delete policies for anon: all writes happen via the
-- service role key inside API routes. rankings / ranking_items have RLS
-- enabled with zero policies, so anon has no access at all to them.

-- ============================================================
-- Realtime publication
-- ============================================================
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
