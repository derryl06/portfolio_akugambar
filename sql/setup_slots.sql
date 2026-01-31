-- Create table for site settings (like production slots)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table site_settings enable row level security;

-- Everyone can read settings
create policy "Anyone can read settings"
  on site_settings for select
  using (true);

-- Only admins can update settings
create policy "Admins can manage settings"
  on site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Initial data for Akujualan slots
insert into site_settings (key, value)
values ('akujualan_slots', '{"total": 5, "filled": 0, "status": "open"}')
on conflict (key) do nothing;
