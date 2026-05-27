-- ============================================================
-- MIGRATION 006: Financial briefs table
-- Stores pre-computed markdown briefs for AI calls
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.financial_briefs (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        not null references public.companies(id) on delete cascade unique,
  brief_markdown  text        not null,
  generated_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.financial_briefs enable row level security;

create policy "Users access own brief"
  on public.financial_briefs for all
  using (
    company_id in (
      select id from public.companies
      where user_id = auth.uid()
    )
  );
