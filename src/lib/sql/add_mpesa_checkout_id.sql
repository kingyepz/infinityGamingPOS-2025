-- Add mpesa_checkout_id to sessions to link STK push with callback
alter table if exists public.sessions
add column if not exists mpesa_checkout_id text;

-- Optional helper to check if an mpesa reference exists (idempotent)
create or replace function public.check_mpesa_ref_exists(ref_code text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.sessions s
    where s.mpesa_reference is not null
      and upper(s.mpesa_reference) like '%' || upper(ref_code) || '%'
  );
$$;

-- Ensure RLS policies allow updating sessions.mpesa_checkout_id and mpesa_reference by service role/middleware as needed.
