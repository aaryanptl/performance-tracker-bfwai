begin;

grant delete on public.people to authenticated;

create policy people_delete on public.people for delete to authenticated
  using (
    private.is_admin()
    and private.is_org_member(organization_id)
    and auth_user_id is distinct from (select auth.uid())
  );

commit;
