import { getRequestClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Person, Role } from "@/lib/types";

interface ProfileRow {
  id: number;
  source_key: string | null;
  work_email: string;
  display_name: string;
  title: string;
  unit_id: number | null;
  job_level: number;
  employment_type: "full_time" | "intern" | "contractor";
  authority_role: "member" | "hr_admin" | "founder";
}

const EMPLOYMENT: Record<ProfileRow["employment_type"], Person["employment"]> = {
  full_time: "Full Time",
  intern: "Intern",
  contractor: "Contractor",
};

const PROFILE_SELECT =
  "id, source_key, work_email, display_name, title, unit_id, job_level, employment_type, authority_role";

/**
 * The application id for a roster row. `source_key` carries the id the seeded
 * roster and its records already use; a person added through the people page
 * falls back to their primary key.
 */
function personId(id: number, sourceKey: string | null) {
  return sourceKey ?? `p_${id}`;
}

/**
 * The signed-in person, read entirely from the roster tables so that a change
 * made on the people page — unit, level, authority, coach — is the change this
 * session sees.
 */
export async function getPersonForAuthUser(
  authUserId: string,
  authUserEmail: string | null = null,
): Promise<Person | null> {
  const supabase = await getRequestClient();
  let { data, error } = await supabase
    .from("people")
    .select(PROFILE_SELECT)
    .eq("auth_user_id", authUserId)
    .eq("active", true)
    .maybeSingle<ProfileRow>();

  // Google can create an Auth user before the roster invite action has linked
  // it. Recover only an active, unlinked row with one exact, case-insensitive
  // email match; never link by editable user metadata.
  if (!error && !data && authUserEmail?.trim()) {
    try {
      const admin = createAdminClient();
      const normalizedEmail = authUserEmail.trim().toLowerCase();
      const escapedEmail = normalizedEmail
        .replaceAll("\\", "\\\\")
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_");
      const { data: matches, error: matchError } = await admin
        .from("people")
        .select(PROFILE_SELECT)
        .is("auth_user_id", null)
        .eq("active", true)
        .ilike("work_email", escapedEmail)
        .limit(2)
        .returns<ProfileRow[]>();

      if (matchError) {
        console.error(`[auth] Pending profile lookup failed for ${authUserId}:`, matchError.message);
      } else if (matches.length === 1) {
        const { data: linked, error: linkError } = await admin
          .from("people")
          .update({ auth_user_id: authUserId })
          .eq("id", matches[0].id)
          .is("auth_user_id", null)
          .select(PROFILE_SELECT)
          .maybeSingle<ProfileRow>();

        if (linkError) {
          console.error(`[auth] Profile auto-link failed for ${authUserId}:`, linkError.message);
        } else if (linked) {
          data = linked;
        }
      } else if (matches.length > 1) {
        console.error(`[auth] Multiple pending profiles match ${authUserId}; refusing auto-link.`);
      }
    } catch (linkSetupError) {
      console.error(`[auth] Profile auto-link is not configured for ${authUserId}:`, linkSetupError);
    }
  }

  // A failed query usually means schema drift (missing migration); a missing
  // row means the account was never linked to the roster. Log both loudly —
  // swallowing them here once produced a redirect loop.
  if (error) {
    console.error(`[auth] Profile query failed for ${authUserId}:`, error.message);
    return null;
  }
  if (!data) {
    console.warn(`[auth] No active people row is linked to auth user ${authUserId}.`);
    return null;
  }

  const [unitResult, coachResult, coacheeResult] = await Promise.all([
    supabase
      .from("units")
      .select("name")
      .eq("id", data.unit_id ?? 0)
      .maybeSingle<{ name: string }>(),
    supabase
      .from("coach_assignments")
      .select("coach_id")
      .eq("coachee_id", data.id)
      .is("effective_to", null)
      .maybeSingle<{ coach_id: number }>(),
    supabase
      .from("coach_assignments")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", data.id)
      .is("effective_to", null),
  ]);

  let coachId: string | null = null;
  if (coachResult.data?.coach_id) {
    const { data: coach } = await supabase
      .from("people")
      .select("id, source_key")
      .eq("id", coachResult.data.coach_id)
      .maybeSingle<{ id: number; source_key: string | null }>();
    if (coach) coachId = personId(coach.id, coach.source_key);
  }

  // Administrator access comes from authority; the coach role is earned by
  // carrying at least one standing coaching line.
  const role: Role =
    data.authority_role === "founder" || data.authority_role === "hr_admin"
      ? "admin"
      : (coacheeResult.count ?? 0) > 0
        ? "coach"
        : "member";

  return {
    id: personId(data.id, data.source_key),
    role,
    name: data.display_name,
    email: data.work_email,
    title: data.title,
    unit: unitResult.data?.name ?? "",
    level: data.job_level,
    employment: EMPLOYMENT[data.employment_type],
    coachId,
    leaderId: null,
  };
}
