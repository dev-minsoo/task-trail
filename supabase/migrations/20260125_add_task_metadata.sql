alter table public.tasks
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create table if not exists public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_status_id uuid references public.statuses(id),
  to_status_id uuid not null references public.statuses(id),
  changed_at timestamptz not null default now()
);

create index if not exists task_status_history_task_id_idx on public.task_status_history(task_id);
create index if not exists task_status_history_changed_at_idx on public.task_status_history(changed_at);
