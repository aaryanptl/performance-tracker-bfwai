-- Administrators may optionally calibrate a completed review before release,
-- or release it directly when both coach ratings are already present.
drop policy if exists quarterly_reviews_calibration on public.quarterly_reviews;

create policy quarterly_reviews_calibration on public.quarterly_reviews for update to authenticated
  using (
    private.is_admin()
    and status in ('coach_draft', 'calibration', 'founder_signed')
  )
  with check (
    private.is_admin()
    and status in ('calibration', 'founder_signed', 'released')
  );
