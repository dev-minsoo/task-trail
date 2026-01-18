# Task Trail

Task Trail is a personal checklist app with date-based task views, a lightweight kanban board, customizable statuses, and AI-assisted task suggestions.

## Features

- Date-based checklist view
- Kanban board with drag-and-drop
- Custom status columns with reordering
- AI task suggestion (optional)

## Tech Stack

- Next.js (App Router)
- Supabase (Postgres)
- Tailwind CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a Supabase project.
2. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add the values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

4. Create tables in **SQL Editor**:

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_date_idx on tasks(date);
create index if not exists tasks_status_idx on tasks(status_id);
```

The app auto-seeds default statuses (`To Do`, `In Progress`, `Done`) when the table is empty.

## AI Suggestions

Set `OPENAI_API_KEY` in `.env.local` to enable AI task suggestions. Leave it blank if you do not plan to use AI features.

## Deploy to Vercel

1. Push your repo to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (optional)
4. Deploy.
