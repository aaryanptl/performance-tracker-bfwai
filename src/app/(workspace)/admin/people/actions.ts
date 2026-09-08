"use server";

import { revalidatePath } from "next/cache";

import {
  AUTHORITY_ROLES,
  type AuthorityRole,
  EMPLOYMENT_TYPES,
  type EmploymentType,
  isAdminAuthority,
} from "@/lib/data/roster-fields";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface RosterActionResult {
  error: string | null;
}

const OK: RosterActionResult = { error: null };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AdminContext {
  supabase: SupabaseClient;
  personId: number;
  organizationId: number;
}

/**
 * Row-level security is the real gate — `people_update` and the
 * `coach_assignments` policies already require `private.is_admin()`. This check
 * runs first only so the table can show a sentence instead of a policy refusal.
 */
async function adminContext(): Promise<AdminContext | RosterActionResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const authUserId = claims?.claims?.sub;
  if (!authUserId) return { error: "Your session has expired. Sign in again." };

  const { data, error } = await supabase
    .from("people")
    .select("id, organization_id, authority_role")
    .eq("auth_user_id", authUserId)
    .eq("active", true)
    .maybeSingle<{ id: number; organization_id: number; authority_role: AuthorityRole }>();

  if (error || !data) return { error: "Your roster profile could not be read." };
  if (!isAdminAuthority(data.authority_role)) {
    return { error: "Only an administrator can change the roster." };
  }
  return { supabase, personId: data.id, organizationId: data.organization_id };
}

function isContext(value: AdminContext | RosterActionResult): value is AdminContext {
  return "supabase" in value;
}

function refresh() {
  revalidatePath("/admin/people");
  revalidatePath("/admin/dashboard");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface PersonInput {
  display_name: string;
  work_email: string;
  title: string;
  unit_id: number;
  job_level: number;
  employment_type: EmploymentType;
  authority_role: AuthorityRole;
}

/** One validator for both forms, so add and edit cannot drift apart. */
function readPersonForm(formData: FormData): PersonInput | RosterActionResult {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const unitId = Number(formData.get("unitId"));
  const level = Number(formData.get("level"));
  const employment = String(formData.get("employment") ?? "");
  const authority = String(formData.get("authority") ?? "");

  if (!name) return { error: "Enter the person's name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid work email address." };
  if (!title) return { error: "Enter their position." };
  if (!Number.isInteger(unitId) || unitId <= 0) return { error: "Choose a unit." };
  if (!Number.isInteger(level) || level < 1 || level > 10) {
    return { error: "A level sits between 1 and 10." };
  }
  if (!EMPLOYMENT_TYPES.includes(employment as EmploymentType)) {
    return { error: "Choose an employment type." };
  }
  if (!AUTHORITY_ROLES.includes(authority as AuthorityRole)) {
    return { error: "Choose an authority." };
  }

  return {
    display_name: name,
    work_email: email,
    title,
    unit_id: unitId,
    job_level: level,
    employment_type: employment as EmploymentType,
    authority_role: authority as AuthorityRole,
  };
}

function isPersonInput(value: PersonInput | RosterActionResult): value is PersonInput {
  return "display_name" in value;
}

export async function savePerson(
  personId: number,
  formData: FormData,
): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase } = context;

  const input = readPersonForm(formData);
  if (!isPersonInput(input)) return input;

  if (personId === context.personId && !isAdminAuthority(input.authority_role)) {
    return { error: "You cannot remove your own administrator access." };
  }

  const { error } = await supabase.from("people").update(input).eq("id", personId);
  if (error) {
    if (error.code === "23505") return { error: "That email is already on the roster." };
    console.error("[roster] Person update failed:", error.message);
    return { error: "The change could not be saved." };
  }

  refresh();
  return OK;
}

/**
 * A coach change closes the standing assignment and opens a new one, so the
 * coaching history stays readable instead of being overwritten in place.
 */
export async function assignCoach(
  coacheeId: number,
  coachId: number | null,
): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase, organizationId } = context;

  if (coachId !== null && coachId === coacheeId) {
    return { error: "A person cannot coach themselves." };
  }

  const { data: current, error: currentError } = await supabase
    .from("coach_assignments")
    .select("id, coach_id, effective_from")
    .eq("coachee_id", coacheeId)
    .is("effective_to", null)
    .maybeSingle<{ id: number; coach_id: number; effective_from: string }>();

  if (currentError) {
    console.error("[roster] Coach lookup failed:", currentError.message);
    return { error: "The current coach could not be read." };
  }
  if (current && current.coach_id === coachId) return OK;

  if (current) {
    // An assignment may not end before it began, so a change made on the day a
    // line opened closes that line on its own start date.
    const closedOn = current.effective_from > today() ? current.effective_from : today();
    const { error } = await supabase
      .from("coach_assignments")
      .update({ effective_to: closedOn })
      .eq("id", current.id);
    if (error) {
      console.error("[roster] Closing the coaching line failed:", error.message);
      return { error: "The previous coaching line could not be closed." };
    }
  }

  if (coachId !== null) {
    const { error } = await supabase.from("coach_assignments").insert({
      organization_id: organizationId,
      coachee_id: coacheeId,
      coach_id: coachId,
      effective_from: today(),
      created_by_person_id: context.personId,
    });
    if (error) {
      console.error("[roster] Coach assignment failed:", error.message);
      refresh();
      return { error: "The new coach could not be assigned, so this person now has no coach." };
    }
  }

  refresh();
  return OK;
}

/** Update the team leader recorded for this person's active cycle. */
export async function assignLeader(
  personId: number,
  leaderId: number | null,
): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase } = context;

  if (leaderId !== null && leaderId === personId) {
    return { error: "A person cannot be their own team leader." };
  }

  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .select("id")
    .eq("status", "active")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number }>();
  if (cycleError || !cycle) {
    return { error: "Create or activate a cycle before assigning team leaders." };
  }

  const { data: updated, error } = await supabase
    .from("cycle_participants")
    .update({ leader_id: leaderId })
    .eq("cycle_id", cycle.id)
    .eq("person_id", personId)
    .select("id")
    .maybeSingle<{ id: number }>();
  if (error) {
    console.error("[roster] Team leader update failed:", error.message);
    return { error: "The team leader could not be saved for the current cycle." };
  }
  if (!updated) {
    return { error: "This person is not enrolled in the current cycle." };
  }

  refresh();
  return OK;
}

/**
 * People are deactivated rather than deleted: check-ins, charters and scores
 * reference the row, and the schema restricts deletes for that reason.
 */
export async function setPersonActive(
  personId: number,
  active: boolean,
): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase } = context;

  if (!active && personId === context.personId) {
    return { error: "You cannot deactivate your own account." };
  }

  if (!active) {
    const { count } = await supabase
      .from("coach_assignments")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", personId)
      .is("effective_to", null);
    if (count && count > 0) {
      return {
        error: `Move their ${count} coachee${count === 1 ? "" : "s"} to another coach first.`,
      };
    }
  }

  const { error } = await supabase.from("people").update({ active }).eq("id", personId);
  if (error) {
    console.error("[roster] Active flag update failed:", error.message);
    return { error: "The change could not be saved." };
  }

  refresh();
  return OK;
}

/** Send a Supabase invite to a roster member who has no linked account. */
export async function invitePerson(personId: number): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase } = context;

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, display_name, work_email, auth_user_id, active")
    .eq("id", personId)
    .maybeSingle<{
      id: number;
      display_name: string;
      work_email: string;
      auth_user_id: string | null;
      active: boolean;
    }>();
  if (personError || !person) return { error: "That roster member could not be found." };
  if (!person.active)
    return { error: "Invite the person only after restoring their roster access." };
  if (person.auth_user_id) return { error: "This person already has a sign-in account." };

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    person.work_email.trim().toLowerCase(),
    {
      data: { display_name: person.display_name },
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/signin`
        : undefined,
    },
  );
  if (inviteError || !invited.user) {
    return { error: `The invite could not be sent: ${inviteError?.message ?? "unknown error"}` };
  }

  const { error: linkError } = await supabase
    .from("people")
    .update({ auth_user_id: invited.user.id, invited_at: new Date().toISOString() })
    .eq("id", personId);
  if (linkError)
    return { error: `The invite was sent, but the roster link failed: ${linkError.message}` };

  refresh();
  return { error: null };
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base ? `u_${base}` : null;
}

export async function addPerson(
  _previous: RosterActionResult,
  formData: FormData,
): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase, organizationId } = context;

  const input = readPersonForm(formData);
  if (!isPersonInput(input)) return input;

  const slug = slugify(input.display_name);
  let sourceKey = slug;
  if (slug) {
    const { data: taken } = await supabase
      .from("people")
      .select("source_key")
      .like("source_key", `${slug}%`)
      .returns<{ source_key: string | null }[]>();
    const used = new Set((taken ?? []).map((row) => row.source_key));
    let suffix = 2;
    while (used.has(sourceKey) && suffix < 100) {
      sourceKey = `${slug}_${suffix}`;
      suffix += 1;
    }
  }

  const { data: inserted, error } = await supabase
    .from("people")
    .insert({
      ...input,
      organization_id: organizationId,
      source_key: sourceKey,
      invited_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error || !inserted) {
    if (error?.code === "23505") return { error: "That email is already on the roster." };
    console.error("[roster] Person insert failed:", error?.message);
    return { error: "The person could not be added." };
  }

  const coachValue = String(formData.get("coachId") ?? "");
  const coachId = coachValue ? Number(coachValue) : null;
  if (coachId) {
    const { error: assignmentError } = await supabase.from("coach_assignments").insert({
      organization_id: organizationId,
      coachee_id: inserted.id,
      coach_id: coachId,
      effective_from: today(),
      created_by_person_id: context.personId,
    });
    if (assignmentError) {
      console.error("[roster] Coach assignment failed:", assignmentError.message);
      refresh();
      return { error: "The person was added, but a coach could not be assigned." };
    }
  }

  refresh();
  return OK;
}
