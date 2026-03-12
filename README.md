<p align="center">
  <img src="docs/banner.svg" alt="Task Trail banner" width="100%" />
</p>

<h1 align="center">Task Trail</h1>

<p align="center">
  Personal task manager with date-based checklists, kanban movement, archive recovery, and throughput reporting.
</p>

<p align="center">
  <a href="#installation"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js"></a>
  <a href="#installation"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg"></a>
</p>

<p align="center">
  <code>npm install && npm run dev</code>
</p>

Task Trail keeps daily capture, status movement, archive lookup, and lightweight reporting in one workflow.

## At a Glance

- Date-based checklist flow with Inbox, In Progress, and Done states
- Kanban board and archive restore/search for moving between current and past work
- Throughput reporting plus optional AI parsing for turning free text into tasks

## Screenshots

<p align="center">
  <img src="docs/task.png" alt="Task capture screen" width="48%" />
  <img src="docs/inprogress.png" alt="In progress task board" width="48%" />
</p>

<p align="center">
  <img src="docs/done.png" alt="Done tasks view" width="48%" />
  <img src="docs/aisummary.png" alt="AI summary input and parsing" width="48%" />
</p>

## Why Task Trail

- Daily work and longer-running tasks live in the same model
- Status history and reporting are built around actual execution flow, not just storage
- The app stays lightweight enough for personal use while still exposing useful review data

## Core Features

- Date-based task capture
- Custom statuses with seeded defaults
- Drag-and-drop kanban board
- Archived task search and restore
- 7-day / 30-day throughput reports
- Optional AI-assisted task parsing

## Installation

### Requirements

- Node.js 20.9+
- A Supabase project

### Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=10000
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `OPENAI_API_KEY`: enable AI parsing
- `OPENAI_MODEL`: defaults to `gpt-4.1-mini`, then falls back to `gpt-4o-mini`
- `OPENAI_TIMEOUT_MS`: request timeout in milliseconds, defaults to `10000`

Leave `OPENAI_API_KEY` empty if you do not want AI parsing.

### Database Setup

Create the tables below in Supabase SQL Editor:

```sql
create table if not exists statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" integer not null,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status_id uuid not null references statuses(id) on delete cascade,
  date text not null,
  "order" integer not null,
  started_at timestamptz,
  completed_at timestamptz,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  from_status_id uuid references statuses(id),
  to_status_id uuid not null references statuses(id),
  changed_at timestamptz not null default now()
);

create index if not exists task_status_history_task_id_idx on task_status_history(task_id);
create index if not exists task_status_history_changed_at_idx on task_status_history(changed_at);

create index if not exists tasks_archived_archived_at_idx
  on tasks (archived_at desc)
  where is_archived = true;

create index if not exists tasks_archived_status_archived_at_idx
  on tasks (status_id, archived_at desc)
  where is_archived = true;

create index if not exists tasks_created_at_idx on tasks (created_at);
create index if not exists tasks_completed_at_idx
  on tasks (completed_at)
  where completed_at is not null;
```

Seeded statuses are created automatically by the app on first run: `Inbox`, `In Progress`, `Done`.

### Supabase Security Note

This app currently talks to Supabase directly from the browser with the public anon key and does not include Supabase Auth. That means your `statuses`, `tasks`, and `task_status_history` access rules must match that architecture.

For a personal/private project, the simplest setup is:

- keep this Supabase project private to you
- disable RLS for these tables, or create permissive policies only if you understand the tradeoff

For a public or shared deployment, do not ship it this way. Add authentication and proper RLS policies first.

### Optional Archival Automation

Archived-task automation is available in [supabase/migrations/20260125_archive_done_tasks.sql](supabase/migrations/20260125_archive_done_tasks.sql).

It does two things:

- creates `public.archive_done_tasks()`
- schedules a daily `pg_cron` job that archives completed `Done` tasks after 14 days

To enable it, run that SQL in Supabase SQL Editor. Your Supabase project must support `pg_cron`.

## Usage

- Capture tasks for a specific day
- Move work across Inbox, In Progress, and Done
- Restore archived work when context returns
- Review recent throughput in the reports view
- Use AI parsing to turn rough notes into task candidates

## Deploy

```bash
npm run build
```

### Vercel

When creating the Vercel project:

- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`

Add the same environment variables used locally:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` if AI parsing is enabled
- `OPENAI_MODEL` optionally
- `OPENAI_TIMEOUT_MS` optionally

Recommended:

- add the variables to `Production`, `Preview`, and `Development`
- redeploy after changing environment variables

If the deployed app shows Supabase permission errors, revisit the RLS note above before debugging Vercel itself.

## Contributing

Before opening a PR:

```bash
npm run lint
npm run build
```

If AI parsing behavior changes, verify both the AI path and the fallback path.

Issue reports should include:

- Browser and OS
- Reproduction steps
- Expected vs actual behavior
- Relevant Supabase setup details with secrets removed

Recommended commit prefixes: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
