-- ============================================================
-- MIGRATION 003: Transactions + Insights Tables
-- Run in Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/ffikrwdvafxobhdnmwjd/sql/new
-- ============================================================

-- ── TRANSACTIONS TABLE ─────────────────────────────────────────────────────
create table if not exists public.transactions (
  id               uuid         primary key default gen_random_uuid(),
  company_id       uuid         not null references public.companies(id) on delete cascade,
  amount           numeric(15,2) not null check (amount >= 0),
  type             text         not null check (type in ('debit','credit')),
  category         text         not null default 'Other',
  description      text         not null default '',
  transaction_date date         not null default current_date,
  created_at       timestamptz  not null default now()
);

create index if not exists transactions_company_date_idx
  on public.transactions (company_id, transaction_date desc);

alter table public.transactions enable row level security;

create policy "Users read their company transactions"
  on public.transactions for select
  using (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- ── INSIGHTS TABLE ─────────────────────────────────────────────────────────
create table if not exists public.insights (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies(id) on delete cascade,
  type        text        not null default 'insight',
  severity    text        not null default 'info'
                          check (severity in ('info','warning','critical')),
  content     text        not null default '',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists insights_company_unread_idx
  on public.insights (company_id, created_at desc)
  where read_at is null;

alter table public.insights enable row level security;

-- Users can select and update (dismiss) their own insights
create policy "Users manage their company insights"
  on public.insights for all
  using (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );
