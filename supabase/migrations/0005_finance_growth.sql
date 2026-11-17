-- LIFE OS · Finance e Growth.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 200),
  category text not null default '' check (char_length(category) <= 60),
  occurred_on date not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  amount numeric(12, 2) check (amount is null or amount > 0),
  due_date date not null,
  repeat_monthly boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  area text not null default '' check (char_length(area) <= 60),
  target_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  weekly_target smallint not null default 7 check (weekly_target between 1 and 7),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  done_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, done_on)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 120),
  minutes integer not null check (minutes between 1 and 1440),
  studied_on date not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  achieved_on date not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date on public.transactions (user_id, occurred_on desc);
create index bills_user_due on public.bills (user_id, due_date);
create index financial_goals_user on public.financial_goals (user_id);
create index goals_user on public.goals (user_id, status);
create index habits_user on public.habits (user_id);
create index habit_logs_habit on public.habit_logs (habit_id, done_on);
create index habit_logs_user on public.habit_logs (user_id);
create index study_user_date on public.study_sessions (user_id, studied_on desc);
create index achievements_user on public.achievements (user_id, achieved_on desc);

-- Mesma regra em todas: cada conta só lê e altera as próprias linhas.
do $$
declare t text;
begin
  foreach t in array array['transactions','financial_goals','bills','goals','habits','habit_logs','study_sessions','achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: dono lê" on public.%I for select using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono cria" on public.%I for insert with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono altera" on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: dono exclui" on public.%I for delete using ((select auth.uid()) = user_id)', t, t);
    if t <> 'habit_logs' then
      execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    end if;
  end loop;
end $$;
