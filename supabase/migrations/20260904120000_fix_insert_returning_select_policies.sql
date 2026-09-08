-- The select policies on goal_charters, check_ins, impact_statements and
-- quarterly_reviews delegated to a helper that looked the row up again by id.
-- Those helpers are stable security-definer functions, so during
-- `insert ... returning` they run against the statement's starting snapshot,
-- which does not contain the row being inserted. Postgres then reports the
-- RETURNING check as "new row violates row-level security policy", and every
-- first save of a charter, check-in or impact statement failed.
--
-- Evaluating the policy against the row's own columns removes the self-lookup
-- (and one round trip per row). The `can_read_*` helpers stay in place for the
-- child tables, where the parent row already exists.

begin;

-- Org membership by participant, for the "approved charters are org-visible"
-- rule. cycle_participants and cycles are themselves protected by RLS, so the
-- lookup has to run as a definer function or a plain participant would never
-- see other people's approved charters.
create or replace function private.is_participant_org_member(target_participant_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.cycle_participants cp
      join public.cycles c on c.id = cp.cycle_id
      where cp.id = target_participant_id
        and private.is_org_member(c.organization_id)
    )
$$;

revoke execute on function private.is_participant_org_member(bigint) from public, anon;
grant execute on function private.is_participant_org_member(bigint) to authenticated;

drop policy if exists goal_charters_select on public.goal_charters;
create policy goal_charters_select on public.goal_charters for select to authenticated
  using (
    private.is_self_participant(cycle_participant_id)
    or private.is_assigned_coach(cycle_participant_id)
    or (select private.is_admin())
    or (status = 'approved_locked' and private.is_participant_org_member(cycle_participant_id))
  );

drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins for select to authenticated
  using (
    private.is_self_participant(cycle_participant_id)
    or private.is_assigned_coach(cycle_participant_id)
    or (select private.is_admin())
  );

drop policy if exists impact_statements_select on public.impact_statements;
create policy impact_statements_select on public.impact_statements for select to authenticated
  using (
    private.is_self_participant(cycle_participant_id)
    or (status <> 'draft' and private.is_assigned_coach(cycle_participant_id))
    or (status <> 'draft' and (select private.is_founder()))
  );

drop policy if exists quarterly_reviews_select on public.quarterly_reviews;
create policy quarterly_reviews_select on public.quarterly_reviews for select to authenticated
  using (
    private.is_assigned_coach(cycle_participant_id)
    or (select private.is_founder())
    or (
      status in ('released', 'employee_acknowledged')
      and private.is_self_participant(cycle_participant_id)
    )
  );

notify pgrst, 'reload schema';

commit;
