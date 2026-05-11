-- ============================================================
--  Bloomly — Full Database Schema
--  Run this in your Supabase SQL Editor (fresh setup)
--  If you already have data, use schema_migrate_existing.sql
-- ============================================================

-- ── Books ────────────────────────────────────────────────────
create table if not exists books (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  cover_url  text,
  cover_color text,
  cover_meta  jsonb default '{}'::jsonb,
  pages      jsonb default '[]'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ── Journal Entries ──────────────────────────────────────────
-- title   → daily diary title field
-- content → "thoughts" textarea
-- mood    → selected emoji
create table if not exists journal_entries (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid references books(id) on delete set null,
  user_id    uuid references auth.users(id) on delete cascade,
  entry_date date not null,
  title      text default '',
  content    text,
  mood       text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (user_id, entry_date)          -- one diary entry per user per day
);

-- ── Entry Images ─────────────────────────────────────────────
create table if not exists entry_images (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid references journal_entries(id) on delete cascade,
  image_url  text not null,
  template   text,                      -- 'grid' | 'collage' | 'single'
  created_at timestamp default now()
);

-- ── Todos ────────────────────────────────────────────────────
-- user_id    → owner (independent of diary entry)
-- entry_date → which day this task belongs to
-- title      → task group heading (e.g. "Morning Routine")
-- subtasks   → JSON array: [{ "text": "...", "done": false }]
-- completed  → true when all subtasks are done (or toggled manually)
create table if not exists todos (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid references journal_entries(id) on delete set null, -- kept for legacy compat
  user_id    uuid references auth.users(id) on delete cascade,
  entry_date date,
  title      text default '',
  task       text not null default 'Task',
  subtasks   text default '[]',         -- JSON string
  completed  boolean default false,
  created_at timestamp default now()
);

-- ============================================================
--  Row Level Security
-- ============================================================

alter table books           enable row level security;
alter table journal_entries enable row level security;
alter table entry_images    enable row level security;
alter table todos           enable row level security;

-- ── Books policies ───────────────────────────────────────────
drop policy if exists "Users can view their own books"   on books;
drop policy if exists "Users can insert their own books" on books;
drop policy if exists "Users can update their own books" on books;
drop policy if exists "Users can delete their own books" on books;

create policy "Users can view their own books"   on books for select using (auth.uid() = user_id);
create policy "Users can insert their own books" on books for insert with check (auth.uid() = user_id);
create policy "Users can update their own books" on books for update using (auth.uid() = user_id);
create policy "Users can delete their own books" on books for delete using (auth.uid() = user_id);

-- ── Journal Entries policies ─────────────────────────────────
drop policy if exists "Users can view their own entries"   on journal_entries;
drop policy if exists "Users can insert their own entries" on journal_entries;
drop policy if exists "Users can update their own entries" on journal_entries;
drop policy if exists "Users can delete their own entries" on journal_entries;

create policy "Users can view their own entries"   on journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert their own entries" on journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own entries" on journal_entries for update using (auth.uid() = user_id);
create policy "Users can delete their own entries" on journal_entries for delete using (auth.uid() = user_id);

-- ── Entry Images policies ────────────────────────────────────
drop policy if exists "Authenticated users can select images" on entry_images;
drop policy if exists "Authenticated users can insert images" on entry_images;
drop policy if exists "Authenticated users can delete images" on entry_images;

create policy "Authenticated users can select images" on entry_images for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert images" on entry_images for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete images" on entry_images for delete using (auth.role() = 'authenticated');

-- ── Todos policies (user-scoped, not just authenticated) ─────
drop policy if exists "Authenticated users can view todos"   on todos;
drop policy if exists "Authenticated users can insert todos" on todos;
drop policy if exists "Authenticated users can update todos" on todos;
drop policy if exists "Authenticated users can delete todos" on todos;
drop policy if exists "Users can view their own todos"   on todos;
drop policy if exists "Users can insert their own todos" on todos;
drop policy if exists "Users can update their own todos" on todos;
drop policy if exists "Users can delete their own todos" on todos;

create policy "Users can view their own todos"   on todos for select using (auth.uid() = user_id);
create policy "Users can insert their own todos" on todos for insert with check (auth.uid() = user_id);
create policy "Users can update their own todos" on todos for update using (auth.uid() = user_id);
create policy "Users can delete their own todos" on todos for delete using (auth.uid() = user_id);
