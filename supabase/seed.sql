begin;

insert into public.organizations (name, slug)
values ('Build Fast with AI', 'build-fast-with-ai')
on conflict (slug) do update
set name = excluded.name,
    active = true,
    updated_at = now();

with organization as (
  select id from public.organizations where slug = 'build-fast-with-ai'
)
insert into public.units (organization_id, name)
select organization.id, unit_name
from organization
cross join (
  values
    ('AI & Engineering'),
    ('Marketing & Growth'),
    ('Sales & Service'),
    ('Product'),
    ('Operations & Support')
) as roster_units(unit_name)
on conflict (organization_id, name) do update
set active = true,
    updated_at = now();

with roster(source_key, display_name, work_email, title, unit_name, job_level, employment_type, authority_role) as (
  values
    ('u_aryan_patel', 'Aryan Patel', 'aryan@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 3, 'full_time', 'member'),
    ('u_prathmesh_sadake', 'Prathmesh Sadake', 'prathmesh@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 3, 'full_time', 'member'),
    ('u_sakshi', 'Sakshi', 'sakshi@buildfastwithai.com', 'Marketing & Growth Manager', 'Marketing & Growth', 2, 'full_time', 'member'),
    ('u_sanjeev_patel', 'Sanjeev Patel', 'sanjeev@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 2, 'full_time', 'member'),
    ('u_sanket', 'Sanket', 'sanket@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 2, 'full_time', 'member'),
    ('u_ankit_choudhary', 'Ankit Choudhary', 'ankit@buildfastwithai.com', 'Sales Manager', 'Sales & Service', 2, 'full_time', 'member'),
    ('u_jyoti', 'Jyoti', 'jyoti@buildfastwithai.com', 'Sales Associate', 'Sales & Service', 1, 'full_time', 'member'),
    ('u_nitish', 'Nitish', 'nitish@buildfastwithai.com', 'Video Editor - Associate', 'Marketing & Growth', 1, 'full_time', 'member'),
    ('u_om_pandey', 'Om Pandey', 'om.p@buildfastwithai.com', 'Product Associate', 'Product', 1, 'intern', 'member'),
    ('u_anshuman', 'Anshuman', 'anshuman@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 2, 'intern', 'member'),
    ('u_avi', 'Avi', 'avi@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 1, 'intern', 'member'),
    ('u_bikash', 'Bikash', 'bikash@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 1, 'intern', 'member'),
    ('u_mansa', 'Mansa', 'mansa@buildfastwithai.com', 'Customer Success - Associate', 'Sales & Service', 1, 'intern', 'member'),
    ('u_pratik', 'Pratik', 'pratik@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 2, 'intern', 'member'),
    ('u_rishu', 'Rishu', 'Rishi@buildfastwithai.com', 'AI Engineer', 'AI & Engineering', 2, 'intern', 'member'),
    ('u_satvik', 'Satvik', 'satvik@buildfastwithai.com', 'Founder', 'Operations & Support', 4, 'full_time', 'founder'),
    ('u_sumedha', 'Sumedha', 'sumiadhikari96work@gmail.com', 'People & HR', 'Operations & Support', 4, 'full_time', 'hr_admin')
), organization as (
  select id from public.organizations where slug = 'build-fast-with-ai'
)
insert into public.people (
  organization_id,
  auth_user_id,
  source_key,
  work_email,
  display_name,
  title,
  unit_id,
  job_level,
  employment_type,
  authority_role,
  active,
  joined_at
)
select
  organization.id,
  auth_user.id,
  roster.source_key,
  roster.work_email,
  roster.display_name,
  roster.title,
  unit.id,
  roster.job_level,
  roster.employment_type,
  roster.authority_role,
  true,
  case when auth_user.id is not null then now() end
from roster
cross join organization
join public.units unit
  on unit.organization_id = organization.id
 and unit.name = roster.unit_name
left join auth.users auth_user
  on lower(auth_user.email) = lower(roster.work_email)
on conflict (organization_id, source_key) where source_key is not null do update
set auth_user_id = excluded.auth_user_id,
    work_email = excluded.work_email,
    display_name = excluded.display_name,
    title = excluded.title,
    unit_id = excluded.unit_id,
    job_level = excluded.job_level,
    employment_type = excluded.employment_type,
    authority_role = excluded.authority_role,
    active = true,
    joined_at = coalesce(public.people.joined_at, excluded.joined_at),
    updated_at = now();

with assignments(coachee_key, coach_key) as (
  values
    ('u_aryan_patel', 'u_satvik'),
    ('u_prathmesh_sadake', 'u_satvik'),
    ('u_sakshi', 'u_satvik'),
    ('u_sanjeev_patel', 'u_satvik'),
    ('u_sanket', 'u_satvik'),
    ('u_ankit_choudhary', 'u_satvik'),
    ('u_jyoti', 'u_ankit_choudhary'),
    ('u_nitish', 'u_sakshi'),
    ('u_om_pandey', 'u_prathmesh_sadake'),
    ('u_anshuman', 'u_aryan_patel'),
    ('u_avi', 'u_sanjeev_patel'),
    ('u_bikash', 'u_aryan_patel'),
    ('u_mansa', 'u_ankit_choudhary'),
    ('u_pratik', 'u_sanket'),
    ('u_rishu', 'u_prathmesh_sadake')
), organization as (
  select id from public.organizations where slug = 'build-fast-with-ai'
)
insert into public.coach_assignments (
  organization_id,
  coachee_id,
  coach_id,
  effective_from,
  created_by_person_id
)
select
  organization.id,
  coachee.id,
  coach.id,
  date '2026-07-01',
  founder.id
from assignments
cross join organization
join public.people coachee
  on coachee.organization_id = organization.id
 and coachee.source_key = assignments.coachee_key
join public.people coach
  on coach.organization_id = organization.id
 and coach.source_key = assignments.coach_key
join public.people founder
  on founder.organization_id = organization.id
 and founder.source_key = 'u_satvik'
on conflict (organization_id, coachee_id) where effective_to is null do update
set coach_id = excluded.coach_id,
    created_by_person_id = excluded.created_by_person_id;

commit;
