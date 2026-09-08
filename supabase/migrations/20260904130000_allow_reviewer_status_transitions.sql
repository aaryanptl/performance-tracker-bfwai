-- Every status transition made by someone other than the row's owner was being
-- silently dropped. goal_charters_update only admits the participant, so a
-- coach or Leadership decision updated zero rows while the decision record
-- itself was inserted: the review history said "changes requested" but the
-- charter stayed at "submitted", which keeps the editor locked. The same gap
-- stopped participants signing check-ins and quarterly reviews.
--
-- Each transition gets its own narrow update policy, evaluated on the row's
-- own columns: USING pins the status it may leave, WITH CHECK the status it may
-- arrive at. The owner's existing policies are untouched.

begin;

-- Coach: submitted -> coach_reviewed | coach_changes_requested
-- Leadership: coach_reviewed -> approved_locked | founder_changes_requested
create policy goal_charters_decide on public.goal_charters for update to authenticated
  using (
    (status = 'submitted' and private.is_assigned_coach(cycle_participant_id))
    or (status = 'coach_reviewed' and (select private.is_founder()))
  )
  with check (
    (
      status in ('coach_reviewed', 'coach_changes_requested')
      and private.is_assigned_coach(cycle_participant_id)
    )
    or (
      status in ('approved_locked', 'founder_changes_requested')
      and (select private.is_founder())
    )
  );

-- Participant signs the check-in their coach recorded.
create policy check_ins_acknowledge on public.check_ins for update to authenticated
  using (status = 'coach_recorded' and private.is_self_participant(cycle_participant_id))
  with check (status = 'employee_acknowledged' and private.is_self_participant(cycle_participant_id));

-- Participant signs a released quarterly review.
create policy quarterly_reviews_acknowledge on public.quarterly_reviews for update to authenticated
  using (status = 'released' and private.is_self_participant(cycle_participant_id))
  with check (status = 'employee_acknowledged' and private.is_self_participant(cycle_participant_id));

-- Repair charters whose decision was recorded but whose status never moved:
-- replay the latest decision made since the charter was submitted.
with latest as (
  select distinct on (d.charter_id)
    d.charter_id, d.actor_capacity, d.decision, d.created_at
  from public.charter_decisions d
  join public.goal_charters gc on gc.id = d.charter_id
  where gc.status in ('submitted', 'coach_reviewed')
    and d.created_at >= coalesce(gc.submitted_at, gc.created_at)
  order by d.charter_id, d.created_at desc
)
update public.goal_charters gc
set
  status = case
    when l.actor_capacity = 'coach' and l.decision = 'changes_requested' then 'coach_changes_requested'
    when l.actor_capacity = 'coach' and l.decision = 'reviewed' then 'coach_reviewed'
    when l.actor_capacity = 'founder' and l.decision = 'changes_requested' then 'founder_changes_requested'
    when l.actor_capacity = 'founder' and l.decision = 'approved' then 'approved_locked'
    else gc.status
  end,
  coach_reviewed_at = case
    when l.actor_capacity = 'coach' and l.decision = 'reviewed' then coalesce(gc.coach_reviewed_at, l.created_at)
    else gc.coach_reviewed_at
  end,
  founder_approved_at = case
    when l.actor_capacity = 'founder' and l.decision = 'approved' then coalesce(gc.founder_approved_at, l.created_at)
    else gc.founder_approved_at
  end,
  locked_at = case
    when l.actor_capacity = 'founder' and l.decision = 'approved' then coalesce(gc.locked_at, l.created_at)
    else gc.locked_at
  end
from latest l
where l.charter_id = gc.id
  and (
    (gc.status = 'submitted' and l.actor_capacity = 'coach')
    or (gc.status = 'coach_reviewed' and l.actor_capacity = 'founder')
  );

notify pgrst, 'reload schema';

commit;
