begin;

-- Password changes are optional. Keep authentication and roster linking as the
-- access controls; do not block application data for users with a temporary
-- password.
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
      'drop policy if exists password_setup_complete on public.%I',
      table_name
    );
  end loop;
end;
$$;

drop trigger if exists auth_users_manage_temporary_password_flag on auth.users;
drop function if exists private.manage_temporary_password_flag();
drop function if exists private.has_completed_password_setup();

notify pgrst, 'reload schema';

commit;
