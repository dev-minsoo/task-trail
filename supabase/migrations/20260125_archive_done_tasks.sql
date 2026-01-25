create extension if not exists pg_cron;

create or replace function public.archive_done_tasks() returns void
language plpgsql
as $$
declare
  done_status_id uuid;
begin
  select id into done_status_id from public.statuses where lower(name) = 'done' limit 1;

  if done_status_id is null then
    return;
  end if;

  update public.tasks
  set is_archived = true,
      archived_at = now()
  where is_archived = false
    and status_id = done_status_id
    and completed_at is not null
    and completed_at <= now() - interval '14 days';
end;
$$;

select
  cron.schedule(
    'archive_done_tasks_daily',
    '0 0 * * *',
    $$select public.archive_done_tasks();$$
  );
