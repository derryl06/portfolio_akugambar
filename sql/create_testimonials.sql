-- Create testimonials table
create table if not exists testimonials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  content text not null,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Allow anyone to read approved testimonials
create policy "Anyone can read approved testimonials"
  on testimonials for select
  using (is_approved = true);

-- Allow anyone to insert testimonials (public submission)
create policy "Anyone can insert testimonials"
  on testimonials for insert
  with check (true);

-- Enable RLS
alter table testimonials enable row level security;
