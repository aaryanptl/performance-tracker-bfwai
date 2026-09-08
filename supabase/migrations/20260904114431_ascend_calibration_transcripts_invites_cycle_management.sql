begin;

-- Calibration may settle on a rounded score that is not the direct weighted
-- result of the two component ratings. Keep the coach's ratings intact and
-- store the approved calibrated result separately.
alter table public.quarterly_reviews
  add column if not exists calibrated_score numeric(4,2);

alter table public.quarterly_reviews
  drop column quarterly_score;

alter table public.quarterly_reviews
  add column quarterly_score numeric(4,2) generated always as (
    case
      when okr_rating is null or competency_rating is null then null
      when calibrated_score is not null then calibrated_score
      else round((okr_rating::numeric * 0.600) + (competency_rating::numeric * 0.400), 2)
    end
  ) stored;

alter table public.quarterly_reviews
  add constraint quarterly_reviews_calibrated_score_range
  check (calibrated_score is null or calibrated_score between 1 and 5);

alter table public.calibration_events
  add column if not exists previous_calibrated_score numeric(4,2),
  add column if not exists new_calibrated_score numeric(4,2);

alter table public.calibration_events
  add constraint calibration_events_calibrated_score_range check (
    (previous_calibrated_score is null or previous_calibrated_score between 1 and 5)
    and (new_calibrated_score is null or new_calibrated_score between 1 and 5)
  );

alter table public.quarters
  add column if not exists is_full_review boolean not null default false;

update public.quarters
set is_full_review = true
where sequence = 2 and is_full_review = false;

-- One transcript entry belongs to exactly one check-in, impact statement, or
-- quarterly review. The entry is append-only so the conversation record stays
-- auditable while the form fields remain editable in their normal workflow.
create table public.transcript_entries (
  id bigint generated always as identity primary key,
  check_in_id bigint references public.check_ins(id) on delete cascade,
  impact_statement_id bigint references public.impact_statements(id) on delete cascade,
  quarterly_review_id bigint references public.quarterly_reviews(id) on delete cascade,
  author_person_id bigint not null references public.people(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint transcript_entries_one_parent check (
    ((check_in_id is not null)::integer
      + (impact_statement_id is not null)::integer
      + (quarterly_review_id is not null)::integer) = 1
  ),
  constraint transcript_entries_body_not_blank check (btrim(body) <> '')
);

create index transcript_entries_check_in_created_idx
  on public.transcript_entries (check_in_id, created_at)
  where check_in_id is not null;
create index transcript_entries_impact_created_idx
  on public.transcript_entries (impact_statement_id, created_at)
  where impact_statement_id is not null;
create index transcript_entries_review_created_idx
  on public.transcript_entries (quarterly_review_id, created_at)
  where quarterly_review_id is not null;

alter table public.transcript_entries enable row level security;

-- Leadership can read the complete record. Other callers inherit the same
-- visibility as the record the transcript belongs to.
create policy transcript_entries_select on public.transcript_entries for select to authenticated
  using (
    private.is_admin()
    or (check_in_id is not null and private.can_read_check_in_content(check_in_id))
    or (impact_statement_id is not null and private.can_read_impact_statement(impact_statement_id))
    or (quarterly_review_id is not null and private.can_read_review(quarterly_review_id))
  );

create policy transcript_entries_insert on public.transcript_entries for insert to authenticated
  with check (
    author_person_id = (select private.current_person_id())
    and (
      private.is_admin()
      or (check_in_id is not null and private.can_read_check_in_content(check_in_id))
      or (impact_statement_id is not null and private.can_read_impact_statement(impact_statement_id))
      or (quarterly_review_id is not null and private.can_read_review(quarterly_review_id))
    )
  );

-- Only Leadership may change a coach-signed review during calibration. This
-- policy also permits the existing release action to move an uncalibrated
-- review directly to released for backward compatibility.
create policy quarterly_reviews_calibration on public.quarterly_reviews for update to authenticated
  using (
    private.is_founder()
    and status in ('coach_draft', 'calibration', 'founder_signed')
  )
  with check (
    private.is_founder()
    and status in ('calibration', 'founder_signed', 'released')
  );

-- Empty cycles can be removed. Once a roster member has been enrolled, keep
-- the cycle and close it instead so its performance history remains available.
create policy cycles_delete_empty on public.cycles for delete to authenticated
  using (
    private.is_admin()
    and private.is_org_member(organization_id)
    and not exists (
      select 1 from public.cycle_participants cp where cp.cycle_id = cycles.id
    )
  );

grant select, insert on public.transcript_entries to authenticated;
grant usage, select on sequence public.transcript_entries_id_seq to authenticated;
grant delete on public.cycles to authenticated;

notify pgrst, 'reload schema';

commit;
