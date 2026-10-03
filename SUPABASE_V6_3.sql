-- Portail Saint-Cyr V6.3 : référentiels + bibliothèque documentaire
-- À exécuter une seule fois dans l'éditeur SQL Supabase.
create table if not exists public.portal_settings (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.portal_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text,
  commission text,
  support text,
  url text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portal_settings enable row level security;
alter table public.portal_resources enable row level security;
revoke all on public.portal_settings from anon;
revoke all on public.portal_resources from anon;
grant select,insert,update,delete on public.portal_settings to authenticated;
grant select,insert,update,delete on public.portal_resources to authenticated;
drop policy if exists "portal_settings_authenticated_all" on public.portal_settings;
create policy "portal_settings_authenticated_all" on public.portal_settings for all to authenticated using (true) with check (true);
drop policy if exists "portal_resources_authenticated_all" on public.portal_resources;
create policy "portal_resources_authenticated_all" on public.portal_resources for all to authenticated using (true) with check (true);
do $$ begin
  alter publication supabase_realtime add table public.portal_settings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.portal_resources;
exception when duplicate_object then null; end $$;
