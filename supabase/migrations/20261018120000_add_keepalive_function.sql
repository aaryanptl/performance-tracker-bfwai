-- Lightweight no-data function pinged by GitHub Actions so the free-tier
-- project is not paused for inactivity.
create or replace function public.keepalive()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select 1;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
