-- Create Books Table
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  cover_url text,
  created_at timestamp default now()
);

-- Create Journal Entries Table
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id),
  user_id uuid references auth.users(id),
  entry_date date not null,
  title text default '',
  content text,
  mood text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create Entry Images Table
create table entry_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references journal_entries(id),
  image_url text not null,
  template text, -- 'grid', 'collage', 'single'
  created_at timestamp default now()
);

-- Create Todos Table
create table todos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references journal_entries(id),
  title text default '',
  task text not null,
  completed boolean default false,
  created_at timestamp default now()
);

-- Enable RLS (Row Level Security)
alter table books enable row level security;
alter table journal_entries enable row level security;
alter table entry_images enable row level security;
alter table todos enable row level security;

-- Policies for books
create policy "Users can view their own books" on books
  for select using (auth.uid() = user_id);

create policy "Users can insert their own books" on books
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own books" on books
  for update using (auth.uid() = user_id);

create policy "Users can delete their own books" on books
  for delete using (auth.uid() = user_id);

-- Policies for journal_entries
create policy "Users can view their own entries" on journal_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own entries" on journal_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own entries" on journal_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own entries" on journal_entries
  for delete using (auth.uid() = user_id);

-- Policies for entry_images
-- Note: Requires JOIN or checking parent entry for true RLS security, simple implementation assumes authenticated insert
create policy "Authenticated users can select images" on entry_images
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert images" on entry_images
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete images" on entry_images
  for delete using (auth.role() = 'authenticated');

-- Policies for todos
create policy "Authenticated users can view todos" on todos
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert todos" on todos
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update todos" on todos
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete todos" on todos
  for delete using (auth.role() = 'authenticated');
