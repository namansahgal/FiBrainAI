-- ============================================================
-- MIGRATION 005: Conversations table for Brain chat
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.conversations (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references public.companies(id) on delete cascade,
  messages      jsonb       not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users read their company conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Users insert their company conversations"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Users update their company conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.companies
      where id = company_id and user_id = auth.uid()
    )
  );
