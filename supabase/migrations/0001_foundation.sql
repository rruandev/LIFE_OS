-- LIFE OS · Fundação: perfil e preferências.
-- Toda tabela tem Row Level Security: cada conta só enxerga as próprias linhas.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  reduce_transparency boolean not null default false,
  sidebar text not null default 'expanded' check (sidebar in ('expanded', 'compact')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.settings enable row level security;

create policy "profiles: dono lê" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles: dono cria" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles: dono altera" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "settings: dono lê" on public.settings
  for select using ((select auth.uid()) = user_id);
create policy "settings: dono cria" on public.settings
  for insert with check ((select auth.uid()) = user_id);
create policy "settings: dono altera" on public.settings
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- updated_at automático (reutilizado pelas próximas tabelas).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Ao criar a conta, nasce o perfil (com o nome do cadastro) e as preferências padrão.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 40));
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
