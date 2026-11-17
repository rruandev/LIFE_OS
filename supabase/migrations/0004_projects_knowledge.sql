-- LIFE OS · Projects e Knowledge.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  goal text not null default '' check (char_length(goal) <= 2000),
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('idea', 'link')),
  title text not null check (char_length(title) between 1 and 200),
  url text not null default '' check (char_length(url) <= 2000),
  body text not null default '' check (char_length(body) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column project_id uuid references public.projects (id) on delete set null;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 50000),
  kind text not null default 'note' check (kind in ('note', 'idea', 'learning', 'link')),
  category text not null default '' check (char_length(category) <= 60),
  tags text[] not null default '{}',
  url text not null default '' check (char_length(url) <= 2000),
  project_id uuid references public.projects (id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user on public.projects (user_id, status);
create index project_items_project on public.project_items (project_id);
create index tasks_project on public.tasks (project_id);
create index notes_user on public.notes (user_id, updated_at desc);
create index notes_project on public.notes (project_id);

alter table public.projects enable row level security;
alter table public.project_items enable row level security;
alter table public.notes enable row level security;

create policy "projects: dono lê" on public.projects for select using ((select auth.uid()) = user_id);
create policy "projects: dono cria" on public.projects for insert with check ((select auth.uid()) = user_id);
create policy "projects: dono altera" on public.projects for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects: dono exclui" on public.projects for delete using ((select auth.uid()) = user_id);

create policy "project_items: dono lê" on public.project_items for select using ((select auth.uid()) = user_id);
create policy "project_items: dono cria" on public.project_items for insert with check ((select auth.uid()) = user_id);
create policy "project_items: dono altera" on public.project_items for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "project_items: dono exclui" on public.project_items for delete using ((select auth.uid()) = user_id);

create policy "notes: dono lê" on public.notes for select using ((select auth.uid()) = user_id);
create policy "notes: dono cria" on public.notes for insert with check ((select auth.uid()) = user_id);
create policy "notes: dono altera" on public.notes for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes: dono exclui" on public.notes for delete using ((select auth.uid()) = user_id);

create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger project_items_touch before update on public.project_items for each row execute function public.touch_updated_at();
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();
