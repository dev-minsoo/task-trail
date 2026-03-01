create index if not exists tasks_archived_archived_at_idx
  on public.tasks (archived_at desc)
  where is_archived = true;

create index if not exists tasks_archived_status_archived_at_idx
  on public.tasks (status_id, archived_at desc)
  where is_archived = true;

create index if not exists tasks_created_at_idx
  on public.tasks (created_at);

create index if not exists tasks_completed_at_idx
  on public.tasks (completed_at)
  where completed_at is not null;
