-- Migration: Add title columns
-- Run this in your Supabase SQL Editor

-- Add title to journal_entries (for the daily diary title)
alter table journal_entries
  add column if not exists title text default '';

-- Add title to todos (for the task title header)
alter table todos
  add column if not exists title text default '';
