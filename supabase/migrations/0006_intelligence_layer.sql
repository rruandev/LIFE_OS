-- LIFE OS · Fase 3: Opportunities, Intelligence e Assistente.

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  origin text not null default '' check (char_length(origin) <= 300),
  origin_url text not null default '' check (char_length(origin_url) <= 2000),
  problem text not null default '' check (char_length(problem) <= 2000),
  audience text not null default '' check (char_length(audience) <= 1000),
  brazil_fit text not null default '' check (char_length(brazil_fit) <= 2000),
  difficulty text check (difficulty in ('low', 'medium', 'high')),
  costs_risks text not null default '' check (char_length(costs_risks) <= 2000),
  next_steps text not null default '' check (char_length(next_steps) <= 2000),
  evidence text not null default '' check (char_length(evidence) <= 4000),
  -- Deixa explícito quando não há dados de mercado suficientes.
  data_status text not null default 'insufficient' check (data_status in ('insufficient', 'partial', 'sufficient')),
  status text not null default 'new' check (status in ('new', 'validating', 'pursuing', 'discarded')),
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (char_length(url) between 8 and 2000),
  topic text not null default 'Geral' check (char_length(topic) between 1 and 40),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

-- Quais módulos o assistente pode ler. Finanças ficam de fora por padrão.
alter table public.settings
  add column ai_scopes text[] not null default '{my-day,projects,knowledge,growth}';

create index opportunities_user on public.opportunities (user_id, status);
create index news_sources_user on public.news_sources (user_id);
create index ai_messages_user on public.ai_messages (user_id, created_at);

do $$
declare t text;
begin
  foreach t in array array['opportunities','news_sources','ai_messages','briefings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: dono lê" on public.%I for select using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono cria" on public.%I for insert with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono altera" on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono exclui" on public.%I for delete using ((select auth.uid()) = user_id)', t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;
