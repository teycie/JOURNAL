-- ============================================================
--  Bloomly — Migration for EXISTING database
--  Run this if you already have data you want to keep.
--  Safe to run multiple times (all changes are idempotent).
-- ============================================================

-- 1. Add "title" to journal_entries (daily diary title)
alter table journal_entries
  add column if not exists title text default '';

-- 2. Add "unique" constraint so upsert works correctly
--    (skip if you already have duplicate user_id+entry_date rows)
alter table journal_entries
  drop constraint if exists journal_entries_user_id_entry_date_key;
alter table journal_entries
  add constraint journal_entries_user_id_entry_date_key unique (user_id, entry_date);

-- 3. Add missing columns to todos
alter table todos
  add column if not exists user_id    uuid references auth.users(id) on delete cascade;
alter table todos
  add column if not exists entry_date date;
alter table todos
  add column if not exists title      text default '';
alter table todos
  add column if not exists subtasks   text default '[]';

-- 4. Backfill user_id + entry_date from linked journal_entries (for existing rows)
update todos t
  set user_id    = je.user_id,
      entry_date = je.entry_date
  from journal_entries je
  where t.entry_id = je.id
    and t.user_id is null;

-- 5. Replace broad "authenticated" todo policies with user-scoped ones
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
