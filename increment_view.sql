-- Run this in your Supabase SQL Editor to enable view counting

-- 1. Create the RPC function
create or replace function increment_view(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update portfolio_items
  set views = coalesce(views, 0) + 1
  where id = p_id;
end;
$$;

-- 2. Ensure the views column exists and has a default
alter table portfolio_items 
add column if not exists views integer default 0;
