-- ============================================================
-- MIGRATION 002: Onboarding Tables
-- Run this in Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/ffikrwdvafxobhdnmwjd/sql/new
-- Created: 2026-05-27
-- ============================================================

-- ── COMPANIES TABLE ────────────────────────────────────────────────────────
create table if not exists public.companies (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,
  name                 text        not null,
  sector               text        not null default '',
  company_age          text        not null default '',
  team_size            text        not null default '',
  primary_pain_point   text        not null default '',
  onboarding_completed boolean     not null default false,
  created_at           timestamptz not null default now()
);

create index if not exists companies_user_id_idx on public.companies (user_id);

alter table public.companies enable row level security;

-- Only service role can insert (done via API route)
-- Users can read/update their own company
create policy "Users can read their own company"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "Users can update their own company"
  on public.companies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── COMPANY FINANCIALS TABLE ───────────────────────────────────────────────
create table if not exists public.company_financials (
  id                   uuid        primary key default gen_random_uuid(),
  company_id           uuid        not null references public.companies(id) on delete cascade,
  funding_stage        text        not null default '',
  cash_balance_range   text        not null default '',
  monthly_spend_range  text        not null default '',
  created_at           timestamptz not null default now()
);

create index if not exists company_financials_company_id_idx
  on public.company_financials (company_id);

alter table public.company_financials enable row level security;

-- Users can read financials for their own company
create policy "Users can read their company financials"
  on public.company_financials for select
  using (
    exists (
      select 1 from public.companies
      where id = company_id
      and user_id = auth.uid()
    )
  );
