begin;

-- The quarterly-review trigger runs as the role that writes the row. It calls
-- this arithmetic-only helper, so the authenticated Data API role needs
-- EXECUTE even though the private schema is not exposed through PostgREST.
grant execute on function private.blend_quarterly_score(
  smallint,
  smallint,
  numeric,
  numeric,
  numeric
) to authenticated;

commit;
