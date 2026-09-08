begin;

alter table public.check_in_notes
  add column if not exists open_context text;

commit;
