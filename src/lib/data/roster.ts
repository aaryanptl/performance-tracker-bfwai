import type {
  AuthorityRole,
  EmploymentType,
  Roster,
  RosterPerson,
  RosterUnit,
} from "@/lib/data/roster-fields";
import { isAdminAuthority } from "@/lib/data/roster-fields";
import { createClient } from "@/lib/supabase/server";

interface PersonRow {
  id: number;
  auth_user_id: string | null;
  source_key: string | null;
  work_email: string;
  display_name: string;
  title: string;
  unit_id: number | null;
  job_level: number;
  employment_type: EmploymentType;
  authority_role: AuthorityRole;
  active: boolean;
}

/**
 * The whole roster, as an administrator sees it. Row-level security already
 * scopes `people` to the caller's organisation, so no organisation filter is
 * repeated here — anyone else simply reads a roster they cannot write to.
 */
export async function getRoster(): Promise<Roster> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const authUserId = claims?.claims?.sub ?? null;

  const [peopleResult, unitsResult, assignmentResult] = await Promise.all([
    supabase
      .from("people")
      .select(
        "id, auth_user_id, source_key, work_email, display_name, title, unit_id, job_level, employment_type, authority_role, active",
      )
      .order("active", { ascending: false })
      .order("id")
      .returns<PersonRow[]>(),
    supabase
      .from("units")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .returns<RosterUnit[]>(),
    supabase
      .from("coach_assignments")
      .select("coachee_id, coach_id")
      .is("effective_to", null)
      .returns<{ coachee_id: number; coach_id: number }[]>(),
  ]);

  if (peopleResult.error) {
    console.error("[roster] People query failed:", peopleResult.error.message);
    return { people: [], units: [], viewerId: null };
  }

  const units = unitsResult.data ?? [];
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]));

  const coachOf = new Map<number, number>();
  const coacheeCounts = new Map<number, number>();
  for (const assignment of assignmentResult.data ?? []) {
    coachOf.set(assignment.coachee_id, assignment.coach_id);
    coacheeCounts.set(assignment.coach_id, (coacheeCounts.get(assignment.coach_id) ?? 0) + 1);
  }

  const rows = peopleResult.data ?? [];
  const people = rows.map<RosterPerson>((row) => {
    const coacheeCount = coacheeCounts.get(row.id) ?? 0;
    return {
      id: row.id,
      sourceKey: row.source_key,
      name: row.display_name,
      email: row.work_email,
      title: row.title,
      unitId: row.unit_id,
      unitName: row.unit_id ? (unitNames.get(row.unit_id) ?? "—") : "—",
      level: row.job_level,
      employment: row.employment_type,
      authority: row.authority_role,
      active: row.active,
      hasAccount: Boolean(row.auth_user_id),
      coachId: coachOf.get(row.id) ?? null,
      coacheeCount,
      role: isAdminAuthority(row.authority_role) ? "admin" : coacheeCount > 0 ? "coach" : "member",
    };
  });

  const viewer = authUserId ? rows.find((row) => row.auth_user_id === authUserId) : undefined;

  return { people, units, viewerId: viewer?.id ?? null };
}
