-- ============================================================
-- MIGRATION 004: Extend transactions + add monthly_snapshots
-- Run in Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/ffikrwdvafxobhdnmwjd/sql/new
-- ============================================================

-- ── Add missing columns to transactions ───────────────────────────────────
alter table public.transactions
  add column if not exists raw_description   text        not null default '',
  add column if not exists source            text        not null default 'upload',
  add column if not exists is_recurring      boolean     not null default false,
  add column if not exists confidence_score  numeric(3,2) not null default 0.50;

-- ── Monthly snapshots ─────────────────────────────────────────────────────
create table if not exists public.monthly_snapshots (
  id                  uuid        primary key default gen_random_uuid(),
  company_id          uuid        not null references public.companies(id) on delete cascade,
  month               date        not null,          -- first day of the month
  gross_burn          numeric(15,2) not null default 0,
  total_revenue       numeric(15,2) not null default 0,
  net_burn            numeric(15,2) not null default 0,
  cash_balance        numeric(15,2) not null default 0,
  runway_months       numeric(5,1)  not null default 0,
  category_breakdown  jsonb         not null default '{}',
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),
  unique (company_id, month)
);

alter table public.monthly_snapshots enable row level security;

create policy "Users read their company snapshots"
  on public.monthly_snapshots for select
  using (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );
