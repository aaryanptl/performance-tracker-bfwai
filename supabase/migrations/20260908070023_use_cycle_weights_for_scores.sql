begin;

-- quarterly_score was generated with a programme-wide 0.600/0.400 formula.
-- Make it a maintained value so each review uses the weights of its cycle,
-- while keeping the calibrated override the generated column carried.
alter table public.quarterly_reviews
  alter column quarterly_score drop expression if exists;

create or replace function private.blend_quarterly_score(
  okr_rating smallint,
  competency_rating smallint,
  calibrated_score numeric,
  okr_weight numeric,
  competency_weight numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when okr_rating is null or competency_rating is null then null
    when calibrated_score is not null then calibrated_score
    else round(
      (okr_rating::numeric * coalesce(okr_weight, 0.600)) +
      (competency_rating::numeric * coalesce(competency_weight, 0.400)),
      2
    )
  end;
$$;

create or replace function private.refresh_quarterly_review_blend()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cycle_okr_weight numeric(4,3);
  cycle_competency_weight numeric(4,3);
begin
  select c.okr_weight, c.competency_weight
    into cycle_okr_weight, cycle_competency_weight
  from public.quarters q
  join public.cycles c on c.id = q.cycle_id
  where q.id = new.quarter_id;

  new.quarterly_score := private.blend_quarterly_score(
    new.okr_rating,
    new.competency_rating,
    new.calibrated_score,
    cycle_okr_weight,
    cycle_competency_weight
  );

  return new;
end;
$$;

-- Fires on every write, not just the rating columns, so a client cannot set
-- quarterly_score directly now that it is no longer a generated column.
drop trigger if exists quarterly_reviews_refresh_blend on public.quarterly_reviews;
create trigger quarterly_reviews_refresh_blend
before insert or update on public.quarterly_reviews
for each row execute function private.refresh_quarterly_review_blend();

create or replace function private.refresh_cycle_review_blends()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.quarterly_reviews r
  set quarterly_score = private.blend_quarterly_score(
    r.okr_rating,
    r.competency_rating,
    r.calibrated_score,
    new.okr_weight,
    new.competency_weight
  )
  from public.quarters q
  where q.id = r.quarter_id
    and q.cycle_id = new.id
    and r.calibrated_score is null;

  return new;
end;
$$;

drop trigger if exists cycles_refresh_review_blends on public.cycles;
create trigger cycles_refresh_review_blends
after update of okr_weight, competency_weight on public.cycles
for each row
when (
  old.okr_weight is distinct from new.okr_weight
  or old.competency_weight is distinct from new.competency_weight
)
execute function private.refresh_cycle_review_blends();

update public.quarterly_reviews r
set quarterly_score = private.blend_quarterly_score(
  r.okr_rating,
  r.competency_rating,
  r.calibrated_score,
  c.okr_weight,
  c.competency_weight
)
from public.quarters q
join public.cycles c on c.id = q.cycle_id
where q.id = r.quarter_id;

revoke execute on function private.blend_quarterly_score(smallint, smallint, numeric, numeric, numeric) from public, anon, authenticated;
revoke execute on function private.refresh_quarterly_review_blend() from public, anon, authenticated;
revoke execute on function private.refresh_cycle_review_blends() from public, anon, authenticated;

commit;
