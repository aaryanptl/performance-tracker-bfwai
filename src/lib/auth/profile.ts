import { getPerson } from "@/data/people";
import { createClient } from "@/lib/supabase/server";
import type { Person, Role } from "@/lib/types";

interface ProfileRow {
  source_key: string | null;
  work_email: string;
  display_name: string;
  title: string;
  job_level: number;
  employment_type: "full_time" | "intern" | "contractor";
  authority_role: "member" | "hr_admin" | "founder";
}

function applicationRole(profile: ProfileRow, rosterRole: Role): Role {
  if (profile.authority_role === "founder" || profile.authority_role === "hr_admin") {
    return "admin";
  }
  return rosterRole;
}

export async function getPersonForAuthUser(authUserId: string): Promise<Person | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      "source_key, work_email, display_name, title, job_level, employment_type, authority_role",
    )
    .eq("auth_user_id", authUserId)
    .eq("active", true)
    .maybeSingle<ProfileRow>();

  // A failed query usually means schema drift (missing migration); a missing
  // source_key means the roster row exists but provisioning never finished.
  // Log both loudly — swallowing them here once produced a redirect loop.
  if (error) {
    console.error(`[auth] Profile query failed for ${authUserId}:`, error.message);
    return null;
  }
  if (!data?.source_key) {
    console.warn(
      `[auth] No active people row with a source_key is linked to auth user ${authUserId}.`,
    );
    return null;
  }

  const rosterPerson = getPerson(data.source_key);
  if (!rosterPerson) return null;

  return {
    ...rosterPerson,
    role: applicationRole(data, rosterPerson.role),
    name: data.display_name,
    email: data.work_email,
    title: data.title,
    level: data.job_level,
    employment: data.employment_type === "full_time" ? "Full Time" : "Intern",
  };
}
