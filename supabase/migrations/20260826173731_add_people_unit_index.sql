create index people_unit_id_idx
  on public.people (unit_id)
  where unit_id is not null;
