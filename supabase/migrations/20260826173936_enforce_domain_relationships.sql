begin;

alter table public.goal_charters
  add constraint goal_charters_id_version_unique unique (id, version);

alter table public.charter_decisions
  add constraint charter_decisions_charter_version_fkey
  foreign key (charter_id, charter_version)
  references public.goal_charters(id, version)
  on delete cascade;

create index charter_decisions_charter_version_idx
  on public.charter_decisions (charter_id, charter_version);

create or replace function private.validate_coach_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  coachee_organization_id bigint;
  coach_organization_id bigint;
begin
  select organization_id into coachee_organization_id from public.people where id = new.coachee_id;
  select organization_id into coach_organization_id from public.people where id = new.coach_id;

  if coachee_organization_id is distinct from new.organization_id
    or coach_organization_id is distinct from new.organization_id then
    raise exception 'Coach and coachee must belong to the assignment organization' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger coach_assignments_validate_scope
before insert or update on public.coach_assignments
for each row execute function private.validate_coach_assignment_scope();

create or replace function private.validate_cycle_participant_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cycle_organization_id bigint;
begin
  select organization_id into cycle_organization_id from public.cycles where id = new.cycle_id;

  if not exists (
    select 1 from public.people p
    where p.id = new.person_id and p.organization_id = cycle_organization_id
  ) then
    raise exception 'Participant must belong to the cycle organization' using errcode = '23514';
  end if;

  if new.coach_id is not null and not exists (
    select 1 from public.people p
    where p.id = new.coach_id and p.organization_id = cycle_organization_id
  ) then
    raise exception 'Coach must belong to the cycle organization' using errcode = '23514';
  end if;

  if new.leader_id is not null and not exists (
    select 1 from public.people p
    where p.id = new.leader_id and p.organization_id = cycle_organization_id
  ) then
    raise exception 'Leader must belong to the cycle organization' using errcode = '23514';
  end if;

  if new.unit_id is not null and not exists (
    select 1 from public.units u
    where u.id = new.unit_id and u.organization_id = cycle_organization_id
  ) then
    raise exception 'Unit must belong to the cycle organization' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger cycle_participants_validate_scope
before insert or update on public.cycle_participants
for each row execute function private.validate_cycle_participant_scope();

create or replace function private.validate_quarter_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cycle_start date;
  cycle_end date;
begin
  select start_date, end_date into cycle_start, cycle_end
  from public.cycles where id = new.cycle_id;

  if new.start_date < cycle_start or new.end_date > cycle_end then
    raise exception 'Quarter dates must fall inside the parent cycle' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger quarters_validate_scope
before insert or update on public.quarters
for each row execute function private.validate_quarter_scope();

create or replace function private.validate_charter_competency_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.goal_charters gc
    join public.cycle_participants cp on cp.id = gc.cycle_participant_id
    join public.cycles cy on cy.id = cp.cycle_id
    join public.competencies c on c.id = new.competency_id
    where gc.id = new.charter_id
      and c.organization_id = cy.organization_id
  ) then
    raise exception 'Competency must belong to the charter organization' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger charter_competencies_validate_scope
before insert or update on public.charter_competencies
for each row execute function private.validate_charter_competency_scope();

create or replace function private.validate_impact_statement_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.quarter_id is not null and not exists (
    select 1
    from public.cycle_participants cp
    join public.quarters q on q.id = new.quarter_id and q.cycle_id = cp.cycle_id
    where cp.id = new.cycle_participant_id
  ) then
    raise exception 'Impact statement quarter must belong to the participant cycle' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger impact_statements_validate_scope
before insert or update on public.impact_statements
for each row execute function private.validate_impact_statement_scope();

create or replace function private.validate_impact_item_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  participant_id bigint;
begin
  select cycle_participant_id into participant_id
  from public.impact_statements where id = new.impact_statement_id;

  if new.charter_goal_id is not null and not exists (
    select 1
    from public.charter_goals cg
    join public.goal_charters gc on gc.id = cg.charter_id
    where cg.id = new.charter_goal_id
      and gc.cycle_participant_id = participant_id
  ) then
    raise exception 'Impact goal must belong to the statement participant charter' using errcode = '23514';
  end if;

  if new.charter_competency_id is not null and not exists (
    select 1
    from public.charter_competencies cc
    join public.goal_charters gc on gc.id = cc.charter_id
    where cc.id = new.charter_competency_id
      and gc.cycle_participant_id = participant_id
  ) then
    raise exception 'Impact competency must belong to the statement participant charter' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger impact_items_validate_scope
before insert or update on public.impact_items
for each row execute function private.validate_impact_item_scope();

create or replace function private.validate_quarterly_review_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.cycle_participants cp
    join public.quarters q on q.id = new.quarter_id and q.cycle_id = cp.cycle_id
    where cp.id = new.cycle_participant_id
      and cp.coach_id = new.coach_id
  ) then
    raise exception 'Review quarter and coach must match the cycle participant snapshot' using errcode = '23514';
  end if;

  if new.impact_statement_id is not null and not exists (
    select 1
    from public.impact_statements ist
    where ist.id = new.impact_statement_id
      and ist.cycle_participant_id = new.cycle_participant_id
      and (ist.quarter_id is null or ist.quarter_id = new.quarter_id)
  ) then
    raise exception 'Review impact statement must match the participant and review period' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger quarterly_reviews_validate_scope
before insert or update on public.quarterly_reviews
for each row execute function private.validate_quarterly_review_scope();

create or replace function private.validate_goal_score_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.quarterly_reviews qr
    join public.charter_goals cg on cg.id = new.charter_goal_id
    join public.goal_charters gc on gc.id = cg.charter_id
    where qr.id = new.quarterly_review_id
      and gc.cycle_participant_id = qr.cycle_participant_id
  ) then
    raise exception 'Goal score must use a goal from the review participant charter' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger goal_scores_validate_scope
before insert or update on public.goal_scores
for each row execute function private.validate_goal_score_scope();

create or replace function private.validate_competency_review_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.quarterly_reviews qr
    join public.charter_competencies cc on cc.id = new.charter_competency_id
    join public.goal_charters gc on gc.id = cc.charter_id
    where qr.id = new.quarterly_review_id
      and gc.cycle_participant_id = qr.cycle_participant_id
  ) then
    raise exception 'Competency review must use a commitment from the participant charter' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger competency_review_notes_validate_scope
before insert or update on public.competency_review_notes
for each row execute function private.validate_competency_review_scope();

create or replace function private.validate_check_in_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.cycle_participants cp
    join public.cycles cy on cy.id = cp.cycle_id
    where cp.id = new.cycle_participant_id
      and cp.coach_id = new.coach_id
      and new.month_start between date_trunc('month', cy.start_date)::date
        and date_trunc('month', cy.end_date)::date
  ) then
    raise exception 'Check-in coach and month must match the participant cycle' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger check_ins_validate_scope
before insert or update on public.check_ins
for each row execute function private.validate_check_in_scope();

create or replace function private.validate_development_action_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.cycle_participants cp
    where cp.id = new.cycle_participant_id and cp.coach_id = new.coach_id
  ) then
    raise exception 'Development action coach must match the participant snapshot' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger development_actions_validate_scope
before insert or update on public.development_actions
for each row execute function private.validate_development_action_scope();

revoke all on function private.validate_coach_assignment_scope() from public, anon, authenticated;
revoke all on function private.validate_cycle_participant_scope() from public, anon, authenticated;
revoke all on function private.validate_quarter_scope() from public, anon, authenticated;
revoke all on function private.validate_charter_competency_scope() from public, anon, authenticated;
revoke all on function private.validate_impact_statement_scope() from public, anon, authenticated;
revoke all on function private.validate_impact_item_scope() from public, anon, authenticated;
revoke all on function private.validate_quarterly_review_scope() from public, anon, authenticated;
revoke all on function private.validate_goal_score_scope() from public, anon, authenticated;
revoke all on function private.validate_competency_review_scope() from public, anon, authenticated;
revoke all on function private.validate_check_in_scope() from public, anon, authenticated;
revoke all on function private.validate_development_action_scope() from public, anon, authenticated;

commit;
