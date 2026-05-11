-- Migration: Make todos independent of journal_entries and persist by date
-- Run this in your Supabase SQL Editor

-- 1. Add user_id directly to todos (so tasks don't need a diary entry to exist)
alter table todos
  add column if not exists user_id uuid references auth.users(id);

-- 2. Add entry_date so todos are keyed per-day (not per diary entry)
alter table todos
  add column if not exists entry_date date;

-- 3. Add subtasks column as JSONB text for storing subtask array
alter table todos
  add column if not exists subtasks text default '[]';

-- 4. Backfill user_id from the linked journal_entries (for existing rows)
update todos t
  set user_id = je.user_id,
      entry_date = je.entry_date
  from journal_entries je
  where t.entry_id = je.id
    and t.user_id is null;

-- 5. Create composite index on (user_id, entry_date) for fast date-based queries
create index if not exists idx_todos_user_date on todos(user_id, entry_date);

-- 6. Update RLS policies to be user-scoped (drop old ones, add new)
drop policy if exists "Authenticated users can view todos" on todos;
drop policy if exists "Authenticated users can insert todos" on todos;
drop policy if exists "Authenticated users can update todos" on todos;
drop policy if exists "Authenticated users can delete todos" on todos;
drop policy if exists "Users can view their own todos" on todos;
drop policy if exists "Users can insert their own todos" on todos;
drop policy if exists "Users can update their own todos" on todos;
drop policy if exists "Users can delete their own todos" on todos;

create policy "Users can view their own todos" on todos
  for select using (auth.uid() = user_id);

create policy "Users can insert their own todos" on todos
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own todos" on todos
  for update using (auth.uid() = user_id);

create policy "Users can delete their own todos" on todos
  for delete using (auth.uid() = user_id);
