-- A coach may release their own completed draft reviews directly to the person.
-- Leadership retains the separate calibration/release policy for adjusted scores.
create policy quarterly_reviews_coach_release on public.quarterly_reviews for update to authenticated
  using (
    private.is_assigned_coach(cycle_participant_id)
    and status = 'coach_draft'
  )
  with check (
    private.is_assigned_coach(cycle_participant_id)
    and status = 'released'
  );
