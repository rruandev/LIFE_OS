-- LIFE OS · My Day: tarefas e compromissos.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 4000),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date date,
  due_time time,
  remind_at timestamptz,
  reminded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 4000),
  location text not null default '' check (char_length(location) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  remind_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index tasks_user_due on public.tasks (user_id, due_date);
create index events_user_start on public.events (user_id, starts_at);

alter table public.tasks enable row level security;
alter table public.events enable row level security;

create policy "tasks: dono lê" on public.tasks for select using ((select auth.uid()) = user_id);
create policy "tasks: dono cria" on public.tasks for insert with check ((select auth.uid()) = user_id);
create policy "tasks: dono altera" on public.tasks for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks: dono exclui" on public.tasks for delete using ((select auth.uid()) = user_id);

create policy "events: dono lê" on public.events for select using ((select auth.uid()) = user_id);
create policy "events: dono cria" on public.events for insert with check ((select auth.uid()) = user_id);
create policy "events: dono altera" on public.events for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "events: dono exclui" on public.events for delete using ((select auth.uid()) = user_id);

create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
