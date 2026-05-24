-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- WAITLIST TABLE
-- ============================================================
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Index for faster email lookups/upserts
create index if not exists waitlist_email_idx on public.waitlist (email);

-- Enable RLS (server-side service role bypasses these automatically)
alter table public.waitlist enable row level security;

-- No public access — only the service role key (server) can read/write
-- This is safe because all API routes use supabaseAdmin (service role)


-- ============================================================
-- BUILD LOGS TABLE
-- ============================================================
create table if not exists public.build_logs (
  id uuid primary key default gen_random_uuid(),
  week integer not null,
  period text not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Index for sorting by week and recency
create index if not exists build_logs_week_idx on public.build_logs (week desc, created_at desc);

-- Enable RLS
alter table public.build_logs enable row level security;

-- Allow anyone to READ build logs (they are public build-in-public entries)
create policy "Public can read build logs"
  on public.build_logs for select
  using (true);

-- Only service role can insert/update/delete (handled via supabaseAdmin)


-- ============================================================
-- CO-FOUNDER APPLICATIONS TABLE
-- ============================================================
create table if not exists public.cofounder_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  linkedin text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

-- Index for sorting by recency
create index if not exists cofounder_apps_created_idx on public.cofounder_applications (created_at desc);

-- Enable RLS
alter table public.cofounder_applications enable row level security;

-- No public access — private data, only service role can read/write
