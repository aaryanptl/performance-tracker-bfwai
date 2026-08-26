begin;

-- Ascend is a single-organisation application today, but every domain row is
-- scoped by organisation so access rules remain explicit and future-safe.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- New Supabase projects require explicit Data API grants. Keep future objects
-- private until a migration deliberately grants access.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create table public.organizations (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_slug_unique unique (slug)
);

create table public.units (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_name_not_blank check (btrim(name) <> ''),
  constraint units_organization_name_unique unique (organization_id, name)
);

create table public.people (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  work_email text not null,
  display_name text not null,
  title text not null,
  unit_id bigint references public.units(id) on delete set null,
  job_level smallint not null,
  employment_type text not null,
  authority_role text not null default 'member',
  active boolean not null default true,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_email_not_blank check (btrim(work_email) <> ''),
  constraint people_display_name_not_blank check (btrim(display_name) <> ''),
  constraint people_title_not_blank check (btrim(title) <> ''),
  constraint people_job_level_range check (job_level between 1 and 10),
  constraint people_employment_type_check check (employment_type in ('full_time', 'intern', 'contractor')),
  constraint people_authority_role_check check (authority_role in ('member', 'hr_admin', 'founder'))
);

create unique index people_organization_email_unique
  on public.people (organization_id, lower(work_email));
create index people_auth_user_id_idx on public.people (auth_user_id) where auth_user_id is not null;
create index people_organization_unit_idx on public.people (organization_id, unit_id) where active;

create table public.coach_assignments (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  coachee_id bigint not null references public.people(id) on delete restrict,
  coach_id bigint not null references public.people(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  created_by_person_id bigint references public.people(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint coach_assignments_not_self check (coachee_id <> coach_id),
  constraint coach_assignments_date_order check (effective_to is null or effective_to >= effective_from)
);

create unique index coach_assignments_one_active_per_coachee
  on public.coach_assignments (organization_id, coachee_id)
  where effective_to is null;
create index coach_assignments_coach_active_idx
  on public.coach_assignments (coach_id, effective_from, effective_to);
create index coach_assignments_coachee_idx on public.coach_assignments (coachee_id);
create index coach_assignments_created_by_idx on public.coach_assignments (created_by_person_id);

create table public.cycles (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  goal_window_start date not null,
  goal_window_end date not null,
  okr_weight numeric(4,3) not null default 0.600,
  competency_weight numeric(4,3) not null default 0.400,
  max_goals smallint not null default 5,
  status text not null default 'draft',
  created_by_person_id bigint references public.people(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cycles_name_not_blank check (btrim(name) <> ''),
  constraint cycles_date_order check (end_date >= start_date),
  constraint cycles_goal_window_order check (goal_window_end >= goal_window_start and goal_window_end <= start_date),
  constraint cycles_weight_range check (okr_weight between 0 and 1 and competency_weight between 0 and 1),
  constraint cycles_weights_total check (okr_weight + competency_weight = 1.000),
  constraint cycles_max_goals_range check (max_goals between 1 and 5),
  constraint cycles_status_check check (status in ('draft', 'goal_setting', 'active', 'calibration', 'closed')),
  constraint cycles_organization_name_unique unique (organization_id, name)
);

create index cycles_organization_status_dates_idx
  on public.cycles (organization_id, status, start_date, end_date);
create index cycles_created_by_idx on public.cycles (created_by_person_id);

create table public.quarters (
  id bigint generated always as identity primary key,
  cycle_id bigint not null references public.cycles(id) on delete cascade,
  sequence smallint not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  scoring_due_at timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quarters_sequence_check check (sequence in (1, 2)),
  constraint quarters_name_not_blank check (btrim(name) <> ''),
  constraint quarters_date_order check (end_date >= start_date),
  constraint quarters_status_check check (status in ('scheduled', 'active', 'scoring', 'calibration', 'released', 'closed')),
  constraint quarters_cycle_sequence_unique unique (cycle_id, sequence)
);

create index quarters_cycle_status_idx on public.quarters (cycle_id, status);

create table public.cycle_participants (
  id bigint generated always as identity primary key,
  cycle_id bigint not null references public.cycles(id) on delete cascade,
  person_id bigint not null references public.people(id) on delete restrict,
  coach_id bigint references public.people(id) on delete restrict,
  leader_id bigint references public.people(id) on delete restrict,
  unit_id bigint references public.units(id) on delete set null,
  title_snapshot text not null,
  job_level_snapshot smallint not null,
  employment_type_snapshot text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cycle_participants_not_self_coached check (coach_id is null or coach_id <> person_id),
  constraint cycle_participants_job_level_range check (job_level_snapshot between 1 and 10),
  constraint cycle_participants_employment_type_check check (employment_type_snapshot in ('full_time', 'intern', 'contractor')),
  constraint cycle_participants_cycle_person_unique unique (cycle_id, person_id)
);

create index cycle_participants_person_cycle_idx on public.cycle_participants (person_id, cycle_id);
create index cycle_participants_coach_cycle_idx on public.cycle_participants (coach_id, cycle_id) where coach_id is not null;
create index cycle_participants_leader_idx on public.cycle_participants (leader_id) where leader_id is not null;
create index cycle_participants_unit_idx on public.cycle_participants (unit_id) where unit_id is not null;

create table public.competencies (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  evidence_guidance text,
  fixed_for_everyone boolean not null default false,
  replaces_for_coaches_id bigint references public.competencies(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competencies_name_not_blank check (btrim(name) <> ''),
  constraint competencies_category_not_blank check (btrim(category) <> ''),
  constraint competencies_description_not_blank check (btrim(description) <> ''),
  constraint competencies_organization_name_unique unique (organization_id, name)
);

create index competencies_organization_active_idx on public.competencies (organization_id, active, category);
create index competencies_replacement_idx on public.competencies (replaces_for_coaches_id) where replaces_for_coaches_id is not null;

create table public.competency_levels (
  id bigint generated always as identity primary key,
  competency_id bigint not null references public.competencies(id) on delete cascade,
  job_level smallint,
  rating smallint not null,
  label text not null,
  behaviour_description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competency_levels_job_level_range check (job_level is null or job_level between 1 and 10),
  constraint competency_levels_rating_range check (rating between 1 and 5),
  constraint competency_levels_label_not_blank check (btrim(label) <> ''),
  constraint competency_levels_description_not_blank check (btrim(behaviour_description) <> '')
);

create unique index competency_levels_scope_unique
  on public.competency_levels (competency_id, coalesce(job_level, 0), rating);
create index competency_levels_competency_idx on public.competency_levels (competency_id);

create table public.goal_charters (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  version integer not null default 1,
  cycle_intent text,
  context text,
  status text not null default 'draft',
  submitted_at timestamptz,
  coach_reviewed_at timestamptz,
  founder_approved_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_charters_version_positive check (version > 0),
  constraint goal_charters_status_check check (status in ('draft', 'submitted', 'coach_changes_requested', 'coach_reviewed', 'founder_changes_requested', 'approved_locked')),
  constraint goal_charters_participant_version_unique unique (cycle_participant_id, version)
);

create index goal_charters_participant_status_idx on public.goal_charters (cycle_participant_id, status);

create table public.charter_goals (
  id bigint generated always as identity primary key,
  charter_id bigint not null references public.goal_charters(id) on delete cascade,
  sort_order smallint not null,
  outcome text not null,
  key_result text not null,
  baseline text not null,
  target text not null,
  measurement_unit text,
  data_source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charter_goals_sort_order_range check (sort_order between 1 and 5),
  constraint charter_goals_outcome_not_blank check (btrim(outcome) <> ''),
  constraint charter_goals_key_result_not_blank check (btrim(key_result) <> ''),
  constraint charter_goals_baseline_not_blank check (btrim(baseline) <> ''),
  constraint charter_goals_target_not_blank check (btrim(target) <> ''),
  constraint charter_goals_data_source_not_blank check (btrim(data_source) <> ''),
  constraint charter_goals_charter_order_unique unique (charter_id, sort_order)
);

create index charter_goals_charter_idx on public.charter_goals (charter_id);

create table public.charter_competencies (
  id bigint generated always as identity primary key,
  charter_id bigint not null references public.goal_charters(id) on delete cascade,
  competency_id bigint not null references public.competencies(id) on delete restrict,
  sort_order smallint not null,
  selection_type text not null,
  commitment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charter_competencies_sort_order_range check (sort_order between 1 and 5),
  constraint charter_competencies_selection_type_check check (selection_type in ('fixed', 'selected')),
  constraint charter_competencies_commitment_not_blank check (btrim(commitment) <> ''),
  constraint charter_competencies_charter_competency_unique unique (charter_id, competency_id),
  constraint charter_competencies_charter_order_unique unique (charter_id, sort_order)
);

create index charter_competencies_charter_idx on public.charter_competencies (charter_id);
create index charter_competencies_competency_idx on public.charter_competencies (competency_id);

create table public.charter_decisions (
  id bigint generated always as identity primary key,
  charter_id bigint not null references public.goal_charters(id) on delete cascade,
  charter_version integer not null,
  actor_person_id bigint not null references public.people(id) on delete restrict,
  actor_capacity text not null,
  decision text not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint charter_decisions_version_positive check (charter_version > 0),
  constraint charter_decisions_capacity_check check (actor_capacity in ('coach', 'founder')),
  constraint charter_decisions_decision_check check (decision in ('changes_requested', 'reviewed', 'approved', 'rejected'))
);

create index charter_decisions_charter_created_idx on public.charter_decisions (charter_id, created_at);
create index charter_decisions_actor_idx on public.charter_decisions (actor_person_id);

create table public.check_ins (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  coach_id bigint not null references public.people(id) on delete restrict,
  month_start date not null,
  check_in_number smallint not null,
  scheduled_at timestamptz,
  held_at timestamptz,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_ins_month_first_day check (extract(day from month_start) = 1),
  constraint check_ins_number_range check (check_in_number between 1 and 6),
  constraint check_ins_status_check check (status in ('planned', 'held', 'coach_recorded', 'employee_acknowledged', 'complete', 'missed')),
  constraint check_ins_participant_month_unique unique (cycle_participant_id, month_start)
);

create index check_ins_participant_status_month_idx on public.check_ins (cycle_participant_id, status, month_start);
create index check_ins_coach_status_idx on public.check_ins (coach_id, status, month_start);

create table public.check_in_notes (
  check_in_id bigint primary key references public.check_ins(id) on delete cascade,
  progress_summary text not null,
  blockers text,
  recognition text,
  way_forward text not null,
  support_to_arrange text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_notes_progress_not_blank check (btrim(progress_summary) <> ''),
  constraint check_in_notes_way_forward_not_blank check (btrim(way_forward) <> '')
);

create table public.check_in_actions (
  id bigint generated always as identity primary key,
  check_in_id bigint not null references public.check_ins(id) on delete cascade,
  owner_person_id bigint not null references public.people(id) on delete restrict,
  action_text text not null,
  due_date date,
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_actions_text_not_blank check (btrim(action_text) <> ''),
  constraint check_in_actions_status_check check (status in ('open', 'complete', 'cancelled'))
);

create index check_in_actions_check_in_idx on public.check_in_actions (check_in_id);
create index check_in_actions_owner_status_idx on public.check_in_actions (owner_person_id, status, due_date);

create table public.check_in_acknowledgments (
  id bigint generated always as identity primary key,
  check_in_id bigint not null references public.check_ins(id) on delete cascade,
  actor_person_id bigint not null references public.people(id) on delete restrict,
  actor_capacity text not null,
  acknowledged_at timestamptz not null default now(),
  constraint check_in_acknowledgments_capacity_check check (actor_capacity in ('coach', 'participant')),
  constraint check_in_acknowledgments_actor_unique unique (check_in_id, actor_person_id, actor_capacity)
);

create index check_in_acknowledgments_actor_idx on public.check_in_acknowledgments (actor_person_id);

create table public.impact_statements (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  quarter_id bigint references public.quarters(id) on delete cascade,
  period_type text not null,
  status text not null default 'draft',
  learning_carried_forward text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_statements_period_type_check check (period_type in ('quarterly', 'half_year')),
  constraint impact_statements_period_shape check ((period_type = 'quarterly' and quarter_id is not null) or (period_type = 'half_year' and quarter_id is null)),
  constraint impact_statements_status_check check (status in ('draft', 'submitted', 'verified', 'locked'))
);

create unique index impact_statements_period_unique
  on public.impact_statements (cycle_participant_id, period_type, coalesce(quarter_id, 0));
create index impact_statements_quarter_idx on public.impact_statements (quarter_id) where quarter_id is not null;

create table public.impact_items (
  id bigint generated always as identity primary key,
  impact_statement_id bigint not null references public.impact_statements(id) on delete cascade,
  charter_goal_id bigint references public.charter_goals(id) on delete set null,
  charter_competency_id bigint references public.charter_competencies(id) on delete set null,
  sort_order smallint not null,
  impact_created text not null,
  numbers_and_evidence text not null,
  competency_demonstrated text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_items_sort_order_positive check (sort_order > 0),
  constraint impact_items_impact_not_blank check (btrim(impact_created) <> ''),
  constraint impact_items_evidence_not_blank check (btrim(numbers_and_evidence) <> ''),
  constraint impact_items_statement_order_unique unique (impact_statement_id, sort_order)
);

create index impact_items_statement_idx on public.impact_items (impact_statement_id);
create index impact_items_goal_idx on public.impact_items (charter_goal_id) where charter_goal_id is not null;
create index impact_items_competency_idx on public.impact_items (charter_competency_id) where charter_competency_id is not null;

create table public.quarterly_reviews (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  quarter_id bigint not null references public.quarters(id) on delete cascade,
  coach_id bigint not null references public.people(id) on delete restrict,
  impact_statement_id bigint references public.impact_statements(id) on delete set null,
  goal_attainment_average numeric(5,4),
  okr_rating smallint,
  competency_rating smallint,
  quarterly_score numeric(4,2) generated always as (
    case
      when okr_rating is null or competency_rating is null then null
      else round((okr_rating::numeric * 0.600) + (competency_rating::numeric * 0.400), 2)
    end
  ) stored,
  coach_verified_impact text,
  development_needs text,
  support_to_provide text,
  recommendation text,
  intern_conversion boolean,
  status text not null default 'coach_draft',
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quarterly_reviews_goal_average_range check (goal_attainment_average is null or goal_attainment_average between 0 and 1),
  constraint quarterly_reviews_okr_rating_range check (okr_rating is null or okr_rating between 1 and 5),
  constraint quarterly_reviews_competency_rating_range check (competency_rating is null or competency_rating between 1 and 5),
  constraint quarterly_reviews_recommendation_check check (recommendation is null or recommendation in ('fast_track_growth', 'on_track', 'focused_improvement', 'intern_conversion')),
  constraint quarterly_reviews_status_check check (status in ('coach_draft', 'calibration', 'founder_signed', 'released', 'employee_acknowledged')),
  constraint quarterly_reviews_participant_quarter_unique unique (cycle_participant_id, quarter_id)
);

create index quarterly_reviews_participant_status_idx on public.quarterly_reviews (cycle_participant_id, status, quarter_id);
create index quarterly_reviews_coach_status_idx on public.quarterly_reviews (coach_id, status, quarter_id);
create index quarterly_reviews_quarter_status_idx on public.quarterly_reviews (quarter_id, status);
create index quarterly_reviews_impact_idx on public.quarterly_reviews (impact_statement_id) where impact_statement_id is not null;

create table public.goal_scores (
  id bigint generated always as identity primary key,
  quarterly_review_id bigint not null references public.quarterly_reviews(id) on delete cascade,
  charter_goal_id bigint not null references public.charter_goals(id) on delete restrict,
  actual_result text not null,
  attainment numeric(5,4) not null,
  evidence_note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_scores_actual_not_blank check (btrim(actual_result) <> ''),
  constraint goal_scores_attainment_range check (attainment between 0 and 1),
  constraint goal_scores_evidence_not_blank check (btrim(evidence_note) <> ''),
  constraint goal_scores_review_goal_unique unique (quarterly_review_id, charter_goal_id)
);

create index goal_scores_review_idx on public.goal_scores (quarterly_review_id);
create index goal_scores_goal_idx on public.goal_scores (charter_goal_id);

create table public.competency_review_notes (
  id bigint generated always as identity primary key,
  quarterly_review_id bigint not null references public.quarterly_reviews(id) on delete cascade,
  charter_competency_id bigint not null references public.charter_competencies(id) on delete restrict,
  evidence_note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competency_review_notes_evidence_not_blank check (btrim(evidence_note) <> ''),
  constraint competency_review_notes_review_competency_unique unique (quarterly_review_id, charter_competency_id)
);

create index competency_review_notes_review_idx on public.competency_review_notes (quarterly_review_id);
create index competency_review_notes_competency_idx on public.competency_review_notes (charter_competency_id);

create table public.development_actions (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  coach_id bigint not null references public.people(id) on delete restrict,
  action_text text not null,
  support_type text,
  due_date date,
  status text not null default 'planned',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint development_actions_text_not_blank check (btrim(action_text) <> ''),
  constraint development_actions_status_check check (status in ('planned', 'in_progress', 'complete', 'cancelled'))
);

create index development_actions_participant_status_idx on public.development_actions (cycle_participant_id, status, due_date);
create index development_actions_coach_status_idx on public.development_actions (coach_id, status, due_date);

create table public.calibration_events (
  id bigint generated always as identity primary key,
  quarterly_review_id bigint not null references public.quarterly_reviews(id) on delete cascade,
  actor_person_id bigint not null references public.people(id) on delete restrict,
  previous_okr_rating smallint,
  new_okr_rating smallint,
  previous_competency_rating smallint,
  new_competency_rating smallint,
  rationale text not null,
  created_at timestamptz not null default now(),
  constraint calibration_events_rating_ranges check (
    (previous_okr_rating is null or previous_okr_rating between 1 and 5)
    and (new_okr_rating is null or new_okr_rating between 1 and 5)
    and (previous_competency_rating is null or previous_competency_rating between 1 and 5)
    and (new_competency_rating is null or new_competency_rating between 1 and 5)
  ),
  constraint calibration_events_rationale_not_blank check (btrim(rationale) <> '')
);

create index calibration_events_review_created_idx on public.calibration_events (quarterly_review_id, created_at);
create index calibration_events_actor_idx on public.calibration_events (actor_person_id);

create table public.review_acknowledgments (
  id bigint generated always as identity primary key,
  quarterly_review_id bigint not null references public.quarterly_reviews(id) on delete cascade,
  actor_person_id bigint not null references public.people(id) on delete restrict,
  actor_capacity text not null,
  decision text not null default 'acknowledged',
  verbatim_comment text,
  acknowledged_at timestamptz not null default now(),
  constraint review_acknowledgments_capacity_check check (actor_capacity in ('coach', 'founder', 'participant')),
  constraint review_acknowledgments_decision_check check (decision in ('signed', 'acknowledged')),
  constraint review_acknowledgments_actor_unique unique (quarterly_review_id, actor_person_id, actor_capacity)
);

create index review_acknowledgments_actor_idx on public.review_acknowledgments (actor_person_id);

create table public.evidence_links (
  id bigint generated always as identity primary key,
  impact_item_id bigint references public.impact_items(id) on delete cascade,
  goal_score_id bigint references public.goal_scores(id) on delete cascade,
  label text not null,
  url text not null,
  source_note text,
  created_at timestamptz not null default now(),
  constraint evidence_links_one_parent check (num_nonnulls(impact_item_id, goal_score_id) = 1),
  constraint evidence_links_label_not_blank check (btrim(label) <> ''),
  constraint evidence_links_url_not_blank check (btrim(url) <> '')
);

create index evidence_links_impact_item_idx on public.evidence_links (impact_item_id) where impact_item_id is not null;
create index evidence_links_goal_score_idx on public.evidence_links (goal_score_id) where goal_score_id is not null;

create table public.performance_summaries (
  id bigint generated always as identity primary key,
  cycle_participant_id bigint not null references public.cycle_participants(id) on delete cascade,
  summary_type text not null,
  calendar_year integer not null,
  first_component_score numeric(4,2) not null,
  second_component_score numeric(4,2) not null,
  final_score numeric(4,2) generated always as (round((first_component_score + second_component_score) / 2.0, 2)) stored,
  status text not null default 'draft',
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performance_summaries_type_check check (summary_type in ('half_year', 'annual')),
  constraint performance_summaries_year_range check (calendar_year between 2020 and 2200),
  constraint performance_summaries_component_ranges check (first_component_score between 1 and 5 and second_component_score between 1 and 5),
  constraint performance_summaries_status_check check (status in ('draft', 'released')),
  constraint performance_summaries_scope_unique unique (cycle_participant_id, summary_type, calendar_year)
);

create index performance_summaries_participant_status_idx on public.performance_summaries (cycle_participant_id, status, calendar_year);

create table public.workflow_events (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  record_type text not null,
  record_id bigint not null,
  actor_person_id bigint references public.people(id) on delete set null,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint workflow_events_record_type_check check (record_type in ('charter', 'check_in', 'impact_statement', 'quarterly_review', 'performance_summary')),
  constraint workflow_events_to_status_not_blank check (btrim(to_status) <> '')
);

create index workflow_events_record_idx on public.workflow_events (record_type, record_id, created_at);
create index workflow_events_organization_created_idx on public.workflow_events (organization_id, created_at);
create index workflow_events_actor_idx on public.workflow_events (actor_person_id) where actor_person_id is not null;

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id bigint references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_person_id bigint references public.people(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_action_not_blank check (btrim(action) <> ''),
  constraint audit_log_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_log_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_log_organization_created_idx on public.audit_log (organization_id, created_at);
create index audit_log_actor_user_idx on public.audit_log (actor_user_id, created_at) where actor_user_id is not null;
create index audit_log_actor_person_idx on public.audit_log (actor_person_id, created_at) where actor_person_id is not null;
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at);

-- Updated-at triggers.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'units', 'people', 'cycles', 'quarters', 'cycle_participants',
    'competencies', 'competency_levels', 'goal_charters', 'charter_goals',
    'charter_competencies', 'check_ins', 'check_in_notes', 'check_in_actions',
    'impact_statements', 'impact_items', 'quarterly_reviews', 'goal_scores',
    'competency_review_notes', 'development_actions', 'performance_summaries'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

create or replace function private.enforce_charter_goal_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.charter_goals where charter_id = new.charter_id) >= 5 then
    raise exception 'A charter can contain no more than five goals' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger charter_goals_limit
before insert on public.charter_goals
for each row execute function private.enforce_charter_goal_limit();

create or replace function private.enforce_charter_competency_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.charter_competencies where charter_id = new.charter_id) >= 5 then
    raise exception 'A charter can contain no more than five competency commitments' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger charter_competencies_limit
before insert on public.charter_competencies
for each row execute function private.enforce_charter_competency_limit();

create or replace function private.refresh_quarterly_review_score()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  review_id bigint := coalesce(new.quarterly_review_id, old.quarterly_review_id);
  average_attainment numeric(5,4);
  derived_okr_rating smallint;
begin
  select round(avg(attainment), 4)
    into average_attainment
  from public.goal_scores
  where quarterly_review_id = review_id;

  derived_okr_rating := case
    when average_attainment is null then null
    when average_attainment >= 0.95 then 5
    when average_attainment >= 0.80 then 4
    when average_attainment >= 0.65 then 3
    when average_attainment >= 0.45 then 2
    else 1
  end;

  update public.quarterly_reviews
  set goal_attainment_average = average_attainment,
      okr_rating = derived_okr_rating
  where id = review_id;

  return null;
end;
$$;

create trigger goal_scores_refresh_review
after insert or update or delete on public.goal_scores
for each row execute function private.refresh_quarterly_review_score();

revoke execute on function private.enforce_charter_goal_limit() from public, anon, authenticated;
revoke execute on function private.enforce_charter_competency_limit() from public, anon, authenticated;
revoke execute on function private.refresh_quarterly_review_score() from public, anon, authenticated;

-- RLS helper functions live outside the exposed schema. Each function checks
-- the caller's auth identity explicitly before reading authorization tables.
create or replace function private.current_person_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.people p
  where (select auth.uid()) is not null
    and p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function private.current_organization_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.organization_id
  from public.people p
  where (select auth.uid()) is not null
    and p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function private.current_authority_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.authority_role
  from public.people p
  where (select auth.uid()) is not null
    and p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function private.is_org_member(target_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.people p
      where p.auth_user_id = (select auth.uid())
        and p.organization_id = target_organization_id
        and p.active
    )
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.people p
      where p.auth_user_id = (select auth.uid())
        and p.authority_role in ('hr_admin', 'founder')
        and p.active
    )
$$;

create or replace function private.is_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.people p
      where p.auth_user_id = (select auth.uid())
        and p.authority_role = 'founder'
        and p.active
    )
$$;

create or replace function private.is_self_participant(target_participant_id bigint)
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
      join public.people p on p.id = cp.person_id
      where cp.id = target_participant_id
        and p.auth_user_id = (select auth.uid())
        and p.active
    )
$$;

create or replace function private.is_assigned_coach(target_participant_id bigint)
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
      join public.people coach on coach.id = cp.coach_id
      where cp.id = target_participant_id
        and coach.auth_user_id = (select auth.uid())
        and coach.active
    )
$$;

create or replace function private.can_read_charter_metadata(target_charter_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.goal_charters gc
      join public.cycle_participants cp on cp.id = gc.cycle_participant_id
      join public.cycles c on c.id = cp.cycle_id
      where gc.id = target_charter_id
        and (
          private.is_self_participant(cp.id)
          or private.is_assigned_coach(cp.id)
          or private.is_admin()
          or (gc.status = 'approved_locked' and private.is_org_member(c.organization_id))
        )
    )
$$;

create or replace function private.can_read_charter_content(target_charter_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.goal_charters gc
      join public.cycle_participants cp on cp.id = gc.cycle_participant_id
      join public.cycles c on c.id = cp.cycle_id
      where gc.id = target_charter_id
        and (
          private.is_self_participant(cp.id)
          or private.is_assigned_coach(cp.id)
          or private.is_founder()
          or (gc.status = 'approved_locked' and private.is_org_member(c.organization_id))
        )
    )
$$;

create or replace function private.can_edit_charter(target_charter_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.goal_charters gc
      where gc.id = target_charter_id
        and gc.status in ('draft', 'coach_changes_requested', 'founder_changes_requested')
        and private.is_self_participant(gc.cycle_participant_id)
    )
$$;

create or replace function private.can_decide_charter(target_charter_id bigint, target_capacity text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.goal_charters gc
      where gc.id = target_charter_id
        and (
          (target_capacity = 'coach' and private.is_assigned_coach(gc.cycle_participant_id))
          or (target_capacity = 'founder' and private.is_founder())
        )
    )
$$;

create or replace function private.can_read_check_in_metadata(target_check_in_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.check_ins ci
      where ci.id = target_check_in_id
        and (
          private.is_self_participant(ci.cycle_participant_id)
          or private.is_assigned_coach(ci.cycle_participant_id)
          or private.is_admin()
        )
    )
$$;

create or replace function private.can_read_check_in_content(target_check_in_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.check_ins ci
      where ci.id = target_check_in_id
        and (
          private.is_self_participant(ci.cycle_participant_id)
          or private.is_assigned_coach(ci.cycle_participant_id)
        )
    )
$$;

create or replace function private.can_manage_check_in(target_check_in_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.check_ins ci
      where ci.id = target_check_in_id
        and private.is_assigned_coach(ci.cycle_participant_id)
    )
$$;

create or replace function private.can_read_impact_statement(target_statement_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.impact_statements ist
      where ist.id = target_statement_id
        and (
          private.is_self_participant(ist.cycle_participant_id)
          or (ist.status <> 'draft' and private.is_assigned_coach(ist.cycle_participant_id))
          or (ist.status <> 'draft' and private.is_founder())
        )
    )
$$;

create or replace function private.can_edit_impact_statement(target_statement_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.impact_statements ist
      where ist.id = target_statement_id
        and ist.status = 'draft'
        and private.is_self_participant(ist.cycle_participant_id)
    )
$$;

create or replace function private.can_read_review(target_review_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.quarterly_reviews qr
      where qr.id = target_review_id
        and (
          private.is_assigned_coach(qr.cycle_participant_id)
          or private.is_founder()
          or (qr.status in ('released', 'employee_acknowledged') and private.is_self_participant(qr.cycle_participant_id))
        )
    )
$$;

create or replace function private.can_manage_review(target_review_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.quarterly_reviews qr
      where qr.id = target_review_id
        and qr.status = 'coach_draft'
        and private.is_assigned_coach(qr.cycle_participant_id)
    )
$$;

create or replace function private.can_acknowledge_review(target_review_id bigint, target_capacity text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.quarterly_reviews qr
      where qr.id = target_review_id
        and (
          (target_capacity = 'participant'
            and qr.status in ('released', 'employee_acknowledged')
            and private.is_self_participant(qr.cycle_participant_id))
          or (target_capacity = 'coach'
            and private.is_assigned_coach(qr.cycle_participant_id))
          or (target_capacity = 'founder' and private.is_founder())
        )
    )
$$;

create or replace function private.can_read_score_for_participant(target_participant_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      private.is_self_participant(target_participant_id)
      or private.is_assigned_coach(target_participant_id)
      or private.is_founder()
    )
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_person_id() to authenticated;
grant execute on function private.current_organization_id() to authenticated;
grant execute on function private.current_authority_role() to authenticated;
grant execute on function private.is_org_member(bigint) to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_founder() to authenticated;
grant execute on function private.is_self_participant(bigint) to authenticated;
grant execute on function private.is_assigned_coach(bigint) to authenticated;
grant execute on function private.can_read_charter_metadata(bigint) to authenticated;
grant execute on function private.can_read_charter_content(bigint) to authenticated;
grant execute on function private.can_edit_charter(bigint) to authenticated;
grant execute on function private.can_decide_charter(bigint, text) to authenticated;
grant execute on function private.can_read_check_in_metadata(bigint) to authenticated;
grant execute on function private.can_read_check_in_content(bigint) to authenticated;
grant execute on function private.can_manage_check_in(bigint) to authenticated;
grant execute on function private.can_read_impact_statement(bigint) to authenticated;
grant execute on function private.can_edit_impact_statement(bigint) to authenticated;
grant execute on function private.can_read_review(bigint) to authenticated;
grant execute on function private.can_manage_review(bigint) to authenticated;
grant execute on function private.can_acknowledge_review(bigint, text) to authenticated;
grant execute on function private.can_read_score_for_participant(bigint) to authenticated;

-- Enable RLS on every exposed table before granting Data API access.
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
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

-- Organisation, roster, programme configuration, and libraries.
create policy organizations_select on public.organizations for select to authenticated
  using (private.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (private.is_admin() and private.is_org_member(id))
  with check (private.is_admin() and private.is_org_member(id));

create policy units_select on public.units for select to authenticated
  using (private.is_org_member(organization_id));
create policy units_insert on public.units for insert to authenticated
  with check (private.is_admin() and private.is_org_member(organization_id));
create policy units_update on public.units for update to authenticated
  using (private.is_admin() and private.is_org_member(organization_id))
  with check (private.is_admin() and private.is_org_member(organization_id));

create policy people_select on public.people for select to authenticated
  using (private.is_org_member(organization_id));
create policy people_insert on public.people for insert to authenticated
  with check (private.is_admin() and private.is_org_member(organization_id));
create policy people_update on public.people for update to authenticated
  using (private.is_admin() and private.is_org_member(organization_id))
  with check (private.is_admin() and private.is_org_member(organization_id));

create policy coach_assignments_select on public.coach_assignments for select to authenticated
  using (
    private.is_admin()
    or coachee_id = (select private.current_person_id())
    or coach_id = (select private.current_person_id())
  );
create policy coach_assignments_insert on public.coach_assignments for insert to authenticated
  with check (private.is_admin() and private.is_org_member(organization_id));
create policy coach_assignments_update on public.coach_assignments for update to authenticated
  using (private.is_admin() and private.is_org_member(organization_id))
  with check (private.is_admin() and private.is_org_member(organization_id));

create policy cycles_select on public.cycles for select to authenticated
  using (private.is_org_member(organization_id));
create policy cycles_insert on public.cycles for insert to authenticated
  with check (private.is_admin() and private.is_org_member(organization_id));
create policy cycles_update on public.cycles for update to authenticated
  using (private.is_admin() and private.is_org_member(organization_id))
  with check (private.is_admin() and private.is_org_member(organization_id));

create policy quarters_select on public.quarters for select to authenticated
  using (exists (select 1 from public.cycles c where c.id = cycle_id and private.is_org_member(c.organization_id)));
create policy quarters_insert on public.quarters for insert to authenticated
  with check (private.is_admin() and exists (select 1 from public.cycles c where c.id = cycle_id and private.is_org_member(c.organization_id)));
create policy quarters_update on public.quarters for update to authenticated
  using (private.is_admin() and exists (select 1 from public.cycles c where c.id = cycle_id and private.is_org_member(c.organization_id)))
  with check (private.is_admin() and exists (select 1 from public.cycles c where c.id = cycle_id and private.is_org_member(c.organization_id)));

create policy cycle_participants_select on public.cycle_participants for select to authenticated
  using (private.is_self_participant(id) or private.is_assigned_coach(id) or private.is_admin());
create policy cycle_participants_insert on public.cycle_participants for insert to authenticated
  with check (private.is_admin());
create policy cycle_participants_update on public.cycle_participants for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy competencies_select on public.competencies for select to authenticated
  using (private.is_org_member(organization_id));
create policy competencies_insert on public.competencies for insert to authenticated
  with check (private.is_admin() and private.is_org_member(organization_id));
create policy competencies_update on public.competencies for update to authenticated
  using (private.is_admin() and private.is_org_member(organization_id))
  with check (private.is_admin() and private.is_org_member(organization_id));

create policy competency_levels_select on public.competency_levels for select to authenticated
  using (exists (select 1 from public.competencies c where c.id = competency_id and private.is_org_member(c.organization_id)));
create policy competency_levels_insert on public.competency_levels for insert to authenticated
  with check (private.is_admin() and exists (select 1 from public.competencies c where c.id = competency_id and private.is_org_member(c.organization_id)));
create policy competency_levels_update on public.competency_levels for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Goal charters: HR may monitor charter metadata, but draft content remains with
-- the participant, assigned coach, and Founder. Approved content is org-visible.
create policy goal_charters_select on public.goal_charters for select to authenticated
  using (private.can_read_charter_metadata(id));
create policy goal_charters_insert on public.goal_charters for insert to authenticated
  with check (status = 'draft' and private.is_self_participant(cycle_participant_id));
create policy goal_charters_update on public.goal_charters for update to authenticated
  using (private.can_edit_charter(id))
  with check (private.can_edit_charter(id));

create policy charter_goals_select on public.charter_goals for select to authenticated
  using (private.can_read_charter_content(charter_id));
create policy charter_goals_insert on public.charter_goals for insert to authenticated
  with check (private.can_edit_charter(charter_id));
create policy charter_goals_update on public.charter_goals for update to authenticated
  using (private.can_edit_charter(charter_id))
  with check (private.can_edit_charter(charter_id));
create policy charter_goals_delete on public.charter_goals for delete to authenticated
  using (private.can_edit_charter(charter_id));

create policy charter_competencies_select on public.charter_competencies for select to authenticated
  using (private.can_read_charter_content(charter_id));
create policy charter_competencies_insert on public.charter_competencies for insert to authenticated
  with check (private.can_edit_charter(charter_id));
create policy charter_competencies_update on public.charter_competencies for update to authenticated
  using (private.can_edit_charter(charter_id))
  with check (private.can_edit_charter(charter_id));
create policy charter_competencies_delete on public.charter_competencies for delete to authenticated
  using (private.can_edit_charter(charter_id));

create policy charter_decisions_select on public.charter_decisions for select to authenticated
  using (private.can_read_charter_metadata(charter_id));
create policy charter_decisions_insert on public.charter_decisions for insert to authenticated
  with check (
    actor_person_id = (select private.current_person_id())
    and private.can_decide_charter(charter_id, actor_capacity)
  );

-- Check-ins: metadata is visible to programme admins; notes/actions are only
-- visible to the participant and assigned coach.
create policy check_ins_select on public.check_ins for select to authenticated
  using (private.can_read_check_in_metadata(id));
create policy check_ins_insert on public.check_ins for insert to authenticated
  with check (private.is_assigned_coach(cycle_participant_id) and coach_id = (select private.current_person_id()));
create policy check_ins_update on public.check_ins for update to authenticated
  using (private.can_manage_check_in(id))
  with check (private.can_manage_check_in(id));

create policy check_in_notes_select on public.check_in_notes for select to authenticated
  using (private.can_read_check_in_content(check_in_id));
create policy check_in_notes_insert on public.check_in_notes for insert to authenticated
  with check (private.can_manage_check_in(check_in_id));
create policy check_in_notes_update on public.check_in_notes for update to authenticated
  using (private.can_manage_check_in(check_in_id))
  with check (private.can_manage_check_in(check_in_id));

create policy check_in_actions_select on public.check_in_actions for select to authenticated
  using (private.can_read_check_in_content(check_in_id));
create policy check_in_actions_insert on public.check_in_actions for insert to authenticated
  with check (private.can_manage_check_in(check_in_id));
create policy check_in_actions_update on public.check_in_actions for update to authenticated
  using (private.can_manage_check_in(check_in_id))
  with check (private.can_manage_check_in(check_in_id));

create policy check_in_acknowledgments_select on public.check_in_acknowledgments for select to authenticated
  using (private.can_read_check_in_metadata(check_in_id));
create policy check_in_acknowledgments_insert on public.check_in_acknowledgments for insert to authenticated
  with check (
    actor_person_id = (select private.current_person_id())
    and private.can_read_check_in_content(check_in_id)
  );

-- Impact statements are authored by the participant. Coaches and Founder only
-- see them after submission; HR sees workflow metadata through workflow_events.
create policy impact_statements_select on public.impact_statements for select to authenticated
  using (private.can_read_impact_statement(id));
create policy impact_statements_insert on public.impact_statements for insert to authenticated
  with check (status = 'draft' and private.is_self_participant(cycle_participant_id));
create policy impact_statements_update on public.impact_statements for update to authenticated
  using (private.can_edit_impact_statement(id))
  with check (private.can_edit_impact_statement(id));

create policy impact_items_select on public.impact_items for select to authenticated
  using (private.can_read_impact_statement(impact_statement_id));
create policy impact_items_insert on public.impact_items for insert to authenticated
  with check (private.can_edit_impact_statement(impact_statement_id));
create policy impact_items_update on public.impact_items for update to authenticated
  using (private.can_edit_impact_statement(impact_statement_id))
  with check (private.can_edit_impact_statement(impact_statement_id));
create policy impact_items_delete on public.impact_items for delete to authenticated
  using (private.can_edit_impact_statement(impact_statement_id));

-- Scores are private to participant, assigned coach, and Founder. Participants
-- only see a quarterly review after it is released.
create policy quarterly_reviews_select on public.quarterly_reviews for select to authenticated
  using (private.can_read_review(id));
create policy quarterly_reviews_insert on public.quarterly_reviews for insert to authenticated
  with check (status = 'coach_draft' and private.is_assigned_coach(cycle_participant_id) and coach_id = (select private.current_person_id()));
create policy quarterly_reviews_update on public.quarterly_reviews for update to authenticated
  using (private.can_manage_review(id))
  with check (private.can_manage_review(id));

create policy goal_scores_select on public.goal_scores for select to authenticated
  using (private.can_read_review(quarterly_review_id));
create policy goal_scores_insert on public.goal_scores for insert to authenticated
  with check (private.can_manage_review(quarterly_review_id));
create policy goal_scores_update on public.goal_scores for update to authenticated
  using (private.can_manage_review(quarterly_review_id))
  with check (private.can_manage_review(quarterly_review_id));
create policy goal_scores_delete on public.goal_scores for delete to authenticated
  using (private.can_manage_review(quarterly_review_id));

create policy competency_review_notes_select on public.competency_review_notes for select to authenticated
  using (private.can_read_review(quarterly_review_id));
create policy competency_review_notes_insert on public.competency_review_notes for insert to authenticated
  with check (private.can_manage_review(quarterly_review_id));
create policy competency_review_notes_update on public.competency_review_notes for update to authenticated
  using (private.can_manage_review(quarterly_review_id))
  with check (private.can_manage_review(quarterly_review_id));

create policy development_actions_select on public.development_actions for select to authenticated
  using (
    private.is_self_participant(cycle_participant_id)
    or private.is_assigned_coach(cycle_participant_id)
    or private.is_founder()
  );
create policy development_actions_insert on public.development_actions for insert to authenticated
  with check (private.is_assigned_coach(cycle_participant_id) and coach_id = (select private.current_person_id()));
create policy development_actions_update on public.development_actions for update to authenticated
  using (private.is_assigned_coach(cycle_participant_id))
  with check (private.is_assigned_coach(cycle_participant_id));

create policy calibration_events_select on public.calibration_events for select to authenticated
  using (private.can_read_review(quarterly_review_id));
create policy calibration_events_insert on public.calibration_events for insert to authenticated
  with check (private.is_founder() and actor_person_id = (select private.current_person_id()));

create policy review_acknowledgments_select on public.review_acknowledgments for select to authenticated
  using (private.can_read_review(quarterly_review_id));
create policy review_acknowledgments_insert on public.review_acknowledgments for insert to authenticated
  with check (
    actor_person_id = (select private.current_person_id())
    and private.can_acknowledge_review(quarterly_review_id, actor_capacity)
  );

create policy evidence_links_select on public.evidence_links for select to authenticated
  using (
    (impact_item_id is not null and exists (
      select 1 from public.impact_items ii
      where ii.id = impact_item_id and private.can_read_impact_statement(ii.impact_statement_id)
    ))
    or (goal_score_id is not null and exists (
      select 1 from public.goal_scores gs
      where gs.id = goal_score_id and private.can_read_review(gs.quarterly_review_id)
    ))
  );
create policy evidence_links_insert on public.evidence_links for insert to authenticated
  with check (
    (impact_item_id is not null and exists (
      select 1 from public.impact_items ii
      where ii.id = impact_item_id and private.can_edit_impact_statement(ii.impact_statement_id)
    ))
    or (goal_score_id is not null and exists (
      select 1 from public.goal_scores gs
      where gs.id = goal_score_id and private.can_manage_review(gs.quarterly_review_id)
    ))
  );
create policy evidence_links_delete on public.evidence_links for delete to authenticated
  using (
    (impact_item_id is not null and exists (
      select 1 from public.impact_items ii
      where ii.id = impact_item_id and private.can_edit_impact_statement(ii.impact_statement_id)
    ))
    or (goal_score_id is not null and exists (
      select 1 from public.goal_scores gs
      where gs.id = goal_score_id and private.can_manage_review(gs.quarterly_review_id)
    ))
  );

create policy performance_summaries_select on public.performance_summaries for select to authenticated
  using (status = 'released' and private.can_read_score_for_participant(cycle_participant_id));

create policy workflow_events_select on public.workflow_events for select to authenticated
  using (private.is_admin() or actor_person_id = (select private.current_person_id()));

create policy audit_log_select on public.audit_log for select to authenticated
  using (private.is_admin() and (organization_id is null or private.is_org_member(organization_id)));

-- Data API grants are explicit and paired with RLS. No application table is
-- granted to anon. Derived/audit tables remain read-only to authenticated users.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select on all tables in schema public to authenticated;
grant insert, update on public.units, public.people, public.coach_assignments,
  public.cycles, public.quarters, public.cycle_participants, public.competencies,
  public.competency_levels, public.goal_charters, public.charter_goals,
  public.charter_competencies, public.check_ins, public.check_in_notes,
  public.check_in_actions, public.impact_statements, public.impact_items,
  public.quarterly_reviews, public.goal_scores, public.competency_review_notes,
  public.development_actions to authenticated;
grant insert on public.charter_decisions, public.check_in_acknowledgments,
  public.calibration_events, public.review_acknowledgments, public.evidence_links to authenticated;
grant delete on public.charter_goals, public.charter_competencies, public.impact_items,
  public.goal_scores, public.evidence_links to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

notify pgrst, 'reload schema';

commit;
