begin;

alter table public.people
  add column source_key text;

alter table public.people
  add constraint people_source_key_not_blank
  check (source_key is null or btrim(source_key) <> '');

create unique index people_organization_source_key_unique
  on public.people (organization_id, source_key)
  where source_key is not null;

-- Accounts are provisioned by an administrator with a temporary password.
-- The flag is stored in app_metadata because end users cannot edit it.
create or replace function private.manage_temporary_password_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.raw_app_meta_data = jsonb_set(
      coalesce(new.raw_app_meta_data, '{}'::jsonb),
      '{must_change_password}',
      'true'::jsonb,
      true
    );
  elsif new.encrypted_password is distinct from old.encrypted_password then
    new.raw_app_meta_data = jsonb_set(
      coalesce(new.raw_app_meta_data, '{}'::jsonb),
      '{must_change_password}',
      'false'::jsonb,
      true
    );
  end if;

  return new;
end;
$$;

revoke all on function private.manage_temporary_password_flag() from public, anon, authenticated;

create trigger auth_users_manage_temporary_password_flag
before insert or update of encrypted_password on auth.users
for each row execute function private.manage_temporary_password_flag();

create or replace function private.has_completed_password_setup()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    ((select auth.jwt()) -> 'app_metadata' ->> 'must_change_password')::boolean,
    false
  ) is false
$$;

revoke all on function private.has_completed_password_setup() from public, anon, authenticated;
grant execute on function private.has_completed_password_setup() to authenticated;

-- Users holding a temporary password may only call Supabase Auth. All Data API
-- access remains blocked until the password update refreshes their JWT.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'units', 'people', 'coach_assignments', 'cycles', 'quarters',
    'cycle_participants', 'competencies', 'competency_levels', 'goal_charters',
    'charter_goals', 'charter_competencies', 'charter_decisions', 'check_ins',
    'check_in_notes', 'check_in_actions', 'check_in_acknowledgments',
    'impact_statements', 'impact_items', 'quarterly_reviews', 'goal_scores',
    'competency_review_notes', 'development_actions', 'calibration_events',
    'review_acknowledgments', 'evidence_links', 'performance_summaries',
    'workflow_events', 'audit_log'
  ]
  loop
    execute format(
      'create policy password_setup_complete on public.%I as restrictive for all to authenticated using ((select private.has_completed_password_setup())) with check ((select private.has_completed_password_setup()))',
      table_name
    );
  end loop;
end;
$$;

notify pgrst, 'reload schema';

commit;
