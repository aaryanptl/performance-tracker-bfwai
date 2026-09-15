/*
 * Remove one person's performance records for one cycle while preserving their
 * roster row, Auth account, coach assignment, and the shared competency library.
 * This is intentionally exposed only as an admin-checked RPC because the
 * cycle-participant table has no general authenticated delete policy.
 */
create or replace function public.reset_person_cycle_data(
  target_cycle_id bigint,
  target_person_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_participant_id bigint;
  caller_organization_id bigint;
begin
  if not (select private.is_admin()) then
    raise exception using
      errcode = '42501',
      message = 'Only an administrator can reset person data.';
  end if;

  caller_organization_id := (select private.current_organization_id());

  select cp.id
  into target_participant_id
  from public.cycle_participants cp
  join public.cycles c on c.id = cp.cycle_id
  where cp.cycle_id = target_cycle_id
    and cp.person_id = target_person_id
    and cp.active
    and c.organization_id = caller_organization_id;

  if target_participant_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'That person is not enrolled in the selected cycle.';
  end if;

  /* Remove the non-cascading score/reference children first. */
  delete from public.goal_scores
  where quarterly_review_id in (
    select id from public.quarterly_reviews
    where cycle_participant_id = target_participant_id
  );

  delete from public.competency_review_notes
  where quarterly_review_id in (
    select id from public.quarterly_reviews
    where cycle_participant_id = target_participant_id
  );

  /* These are not FK-owned by the participant, so remove their workflow trail
     explicitly before the parent rows disappear. */
  delete from public.workflow_events
  where organization_id = caller_organization_id
    and (
      (record_type = 'charter' and record_id in (
        select id from public.goal_charters
        where cycle_participant_id = target_participant_id
      ))
      or (record_type = 'check_in' and record_id in (
        select id from public.check_ins
        where cycle_participant_id = target_participant_id
      ))
      or (record_type = 'impact_statement' and record_id in (
        select id from public.impact_statements
        where cycle_participant_id = target_participant_id
      ))
      or (record_type = 'quarterly_review' and record_id in (
        select id from public.quarterly_reviews
        where cycle_participant_id = target_participant_id
      ))
      or (record_type = 'performance_summary' and record_id in (
        select id from public.performance_summaries
        where cycle_participant_id = target_participant_id
      ))
    );

  /* Remove the participant's records, but keep their cycle enrollment row so
     resetting test data does not change access, coach, or roster snapshots. */
  delete from public.quarterly_reviews
  where cycle_participant_id = target_participant_id;

  delete from public.impact_statements
  where cycle_participant_id = target_participant_id;

  delete from public.goal_charters
  where cycle_participant_id = target_participant_id;

  delete from public.check_ins
  where cycle_participant_id = target_participant_id;

  delete from public.development_actions
  where cycle_participant_id = target_participant_id;

  delete from public.performance_summaries
  where cycle_participant_id = target_participant_id;

  return target_participant_id;
end;
$$;

revoke execute on function public.reset_person_cycle_data(bigint, bigint) from public, anon;
grant execute on function public.reset_person_cycle_data(bigint, bigint) to authenticated;
