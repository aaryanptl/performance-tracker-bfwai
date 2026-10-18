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
  revalidatePath("/charter");
  revalidatePath("/charter/edit");
  revalidatePath("/coaching/approvals");
  revalidatePath("/");
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
  const assignmentChanged = !current || current.coach_id !== coachId;

  if (assignmentChanged && current) {
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

  if (assignmentChanged && coachId !== null) {
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

  // The active cycle stores the coach snapshot used by the approvals queue and
  // its RLS policies. Keep that snapshot in sync when the standing assignment
  // changes after the person was already enrolled in the cycle.
  const { data: activeCycle, error: activeCycleError } = await supabase
    .from("cycles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number }>();

  if (activeCycleError) {
    console.error("[roster] Active cycle lookup failed:", activeCycleError.message);
    return { error: "The coach changed, but the active cycle could not be updated." };
  }

  if (activeCycle) {
    const { error: participantError } = await supabase
      .from("cycle_participants")
      .update({ coach_id: coachId })
      .eq("cycle_id", activeCycle.id)
      .eq("person_id", coacheeId);

    if (participantError) {
      console.error(
        "[roster] Active cycle coach snapshot update failed:",
        participantError.message,
      );
      return { error: "The coach changed, but the active cycle could not be updated." };
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

/** Add an active roster member to the current cycle with historical snapshots. */
export async function enrollPersonInCurrentCycle(personId: number): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  if (!Number.isInteger(personId) || personId <= 0) {
    return { error: "Choose a valid roster member." };
  }

  const { supabase, organizationId } = context;
  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number; name: string }>();

  if (cycleError || !cycle) {
    return { error: "There is no active cycle to enrol this person in." };
  }

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, title, job_level, employment_type, unit_id, active")
    .eq("id", personId)
    .eq("organization_id", organizationId)
    .maybeSingle<{
      id: number;
      title: string;
      job_level: number;
      employment_type: string;
      unit_id: number | null;
      active: boolean;
    }>();

  if (personError || !person) return { error: "That roster member could not be found." };
  if (!person.active) return { error: "Restore this person’s roster access before enrolling them." };

  const { data: existing, error: existingError } = await supabase
    .from("cycle_participants")
    .select("id, active")
    .eq("cycle_id", cycle.id)
    .eq("person_id", person.id)
    .maybeSingle<{ id: number; active: boolean }>();

  if (existingError) return { error: "The current cycle access could not be checked." };
  if (existing) {
    if (existing.active) return OK;
    const { error } = await supabase
      .from("cycle_participants")
      .update({ active: true })
      .eq("id", existing.id);
    if (error) return { error: `Cycle access could not be restored: ${error.message}` };
    refresh();
    return OK;
  }

  const { data: assignment } = await supabase
    .from("coach_assignments")
    .select("coach_id")
    .eq("coachee_id", person.id)
    .is("effective_to", null)
    .maybeSingle<{ coach_id: number }>();

  const { error: insertError } = await supabase.from("cycle_participants").insert({
    cycle_id: cycle.id,
    person_id: person.id,
    coach_id: assignment?.coach_id ?? null,
    leader_id: null,
    unit_id: person.unit_id,
    title_snapshot: person.title,
    job_level_snapshot: person.job_level,
    employment_type_snapshot: person.employment_type,
    active: true,
  });

  if (insertError) {
    if (insertError.code === "23505") return OK;
    return { error: `The person could not be enrolled: ${insertError.message}` };
  }

  refresh();
  return OK;
}

/** Add every active roster member to the current cycle without changing existing access. */
export async function enrollAllPeopleInCurrentCycle(): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase, organizationId } = context;

  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number; name: string }>();

  if (cycleError || !cycle) {
    return { error: "There is no active cycle to enrol people in." };
  }

  const [peopleResult, participantsResult] = await Promise.all([
    supabase
      .from("people")
      .select("id, title, job_level, employment_type, unit_id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .returns<
        {
          id: number;
          title: string;
          job_level: number;
          employment_type: EmploymentType;
          unit_id: number | null;
        }[]
      >(),
    supabase
      .from("cycle_participants")
      .select("person_id, active")
      .eq("cycle_id", cycle.id)
      .returns<{ person_id: number; active: boolean }[]>(),
  ]);

  if (peopleResult.error || participantsResult.error) {
    console.error(
      "[roster] Bulk cycle access lookup failed:",
      peopleResult.error?.message ?? participantsResult.error?.message,
    );
    return { error: "The roster or current cycle access could not be read." };
  }

  const people = peopleResult.data ?? [];
  const existing = new Map(
    (participantsResult.data ?? []).map((participant) => [
      participant.person_id,
      participant.active,
    ]),
  );
  const missing = people.filter((person) => !existing.has(person.id));
  const inactiveParticipantIds = people
    .filter((person) => existing.get(person.id) === false)
    .map((person) => person.id);

  if (inactiveParticipantIds.length > 0) {
    const { error } = await supabase
      .from("cycle_participants")
      .update({ active: true })
      .eq("cycle_id", cycle.id)
      .in("person_id", inactiveParticipantIds);
    if (error) {
      console.error("[roster] Bulk cycle access restore failed:", error.message);
      return { error: "Existing cycle access could not be restored." };
    }
  }

  if (missing.length === 0) {
    if (inactiveParticipantIds.length > 0) refresh();
    return OK;
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("coach_assignments")
    .select("coachee_id, coach_id")
    .in(
      "coachee_id",
      missing.map((person) => person.id),
    )
    .is("effective_to", null)
    .returns<{ coachee_id: number; coach_id: number }[]>();

  if (assignmentError) {
    console.error("[roster] Bulk coach lookup failed:", assignmentError.message);
    return { error: "Current coach assignments could not be read." };
  }

  const coachOf = new Map(
    (assignments ?? []).map((assignment) => [assignment.coachee_id, assignment.coach_id]),
  );
  const rows = missing.map((person) => ({
    cycle_id: cycle.id,
    person_id: person.id,
    coach_id: coachOf.get(person.id) ?? null,
    leader_id: null,
    unit_id: person.unit_id,
    title_snapshot: person.title,
    job_level_snapshot: person.job_level,
    employment_type_snapshot: person.employment_type,
    active: true,
  }));

  const { error: insertError } = await supabase
    .from("cycle_participants")
    .upsert(rows, { onConflict: "cycle_id,person_id", ignoreDuplicates: true });

  if (insertError) {
    console.error("[roster] Bulk cycle access insert failed:", insertError.message);
    return { error: "The people could not be added to the current cycle." };
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

/** Permanently remove a roster row when no retained records require it. */
export async function removePerson(personId: number): Promise<RosterActionResult> {
  const context = await adminContext();
  if (!isContext(context)) return context;
  const { supabase, organizationId } = context;

  if (personId === context.personId) {
    return { error: "You cannot remove your own administrator profile." };
  }

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id")
    .eq("id", personId)
    .eq("organization_id", organizationId)
    .maybeSingle<{ id: number }>();
  if (personError || !person) return { error: "That roster member could not be found." };

  const { data: removed, error } = await supabase
    .from("people")
    .delete()
    .eq("id", person.id)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error?.code === "23503") {
    return {
      error:
        "This person is still linked to cycle, coaching, or performance history. Nothing was removed. Deactivate them instead to preserve those records.",
    };
  }
  if (error) {
    console.error("[roster] Person removal failed:", error.message);
    return { error: "The person could not be removed." };
  }
  if (!removed) return { error: "The person could not be removed from this roster." };

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

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[roster] Invite setup failed:", error);
    return {
      error: "Invites are not configured. Add SUPABASE_SECRET_KEY to the server environment and restart the app.",
    };
  }

  const normalizedEmail = person.work_email.trim().toLowerCase();
  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) {
    return { error: `The existing Auth accounts could not be checked: ${usersError.message}` };
  }

  const existingUser = usersPage.users.find(
    (user) => user.email?.trim().toLowerCase() === normalizedEmail,
  );
  let authUserId = existingUser?.id;
  let inviteSent = false;

  if (!authUserId) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
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
    authUserId = invited.user.id;
    inviteSent = true;
  }

  const { data: linked, error: linkError } = await admin
    .from("people")
    .update({
      auth_user_id: authUserId,
      ...(inviteSent ? { invited_at: new Date().toISOString() } : {}),
    })
    .eq("id", personId)
    .is("auth_user_id", null)
    .select("id")
    .maybeSingle<{ id: number }>();
  if (linkError)
    return { error: `The Auth account exists, but the roster link failed: ${linkError.message}` };
  if (!linked) return { error: "The Auth account exists, but the roster row could not be linked." };

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
