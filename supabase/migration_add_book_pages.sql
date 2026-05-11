-- Migration: Persist book cover metadata and page entries
-- Run this in your Supabase SQL Editor

alter table books
  add column if not exists cover_color text,
  add column if not exists cover_meta jsonb default '{}'::jsonb,
  add column if not exists pages jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamp default now();

update books
  set cover_meta = coalesce(cover_meta, '{}'::jsonb),
      pages = coalesce(pages, '[]'::jsonb),
      updated_at = coalesce(updated_at, now());
