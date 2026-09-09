"use server";

import { revalidatePath } from "next/cache";

import { LIBRARY_COMPETENCIES } from "@/data/library";
import { COACH_ADDON_UNIT } from "@/data/performance";
import { getViewer, type SupabaseClient } from "@/lib/data/viewer";
import { formatDate } from "@/lib/utils";

export interface CycleActionResult {
  error: string | null;
  message?: string;
}

const OK: CycleActionResult = { error: null };

function refresh() {
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/dashboard");
  revalidatePath("/charter");
  revalidatePath("/");
}

function readDate(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

interface CycleEnrollmentSync {
  error: string | null;
  added: number;
  restored: number;
}

/**
 * Keep the active cycle aligned with the active roster. Existing snapshots are
 * preserved; only missing rows are created and previously inactive rows are
 * reactivated.
 */
async function syncCycleParticipants(
  supabase: SupabaseClient,
  organizationId: number,
  cycleId: number,
): Promise<CycleEnrollmentSync> {
  const { data: people, error: peopleError } = await supabase
    .from("people")
    .select("id, title, job_level, employment_type, unit_id")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .returns<
      {
        id: number;
        title: string;
        job_level: number;
        employment_type: string;
        unit_id: number | null;
      }[]
    >();
  if (peopleError) {
    return { error: "The active roster could not be read.", added: 0, restored: 0 };
  }

  const [{ data: assignments }, { data: existing, error: existingError }] = await Promise.all([
    supabase
      .from("coach_assignments")
      .select("coachee_id, coach_id")
      .eq("organization_id", organizationId)
      .is("effective_to", null)
      .returns<{ coachee_id: number; coach_id: number }[]>(),
    supabase
      .from("cycle_participants")
      .select("id, person_id, active")
      .eq("cycle_id", cycleId)
      .returns<{ id: number; person_id: number; active: boolean }[]>(),
  ]);
  if (existingError) {
    return { error: "The existing cycle access could not be read.", added: 0, restored: 0 };
  }

  const existingByPerson = new Map((existing ?? []).map((row) => [row.person_id, row]));
  const coachOf = new Map((assignments ?? []).map((row) => [row.coachee_id, row.coach_id]));
  const inactiveIds = (existing ?? []).filter((row) => !row.active).map((row) => row.id);

  if (inactiveIds.length > 0) {
    const { error } = await supabase
      .from("cycle_participants")
      .update({ active: true })
      .in("id", inactiveIds);
    if (error) {
      return { error: "Previously disabled cycle access could not be restored.", added: 0, restored: 0 };
    }
  }

  const missing = (people ?? [])
    .filter((person) => !existingByPerson.has(person.id))
    .map((person) => ({
      cycle_id: cycleId,
      person_id: person.id,
      coach_id: coachOf.get(person.id) ?? null,
      leader_id: null,
      unit_id: person.unit_id,
      title_snapshot: person.title,
      job_level_snapshot: person.job_level,
      employment_type_snapshot: person.employment_type,
      active: true,
    }));

  if (missing.length > 0) {
    const { error } = await supabase.from("cycle_participants").insert(missing);
    if (error) {
      return { error: "New active roster members could not be enrolled.", added: 0, restored: 0 };
    }
  }

  return { error: null, added: missing.length, restored: inactiveIds.length };
}

/** Update an existing cycle and keep its generated quarter dates in sync. */
export async function updateCycle(cycleId: number, formData: FormData): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can update a cycle." };
  if (!Number.isInteger(cycleId) || cycleId <= 0) return { error: "Choose a valid cycle." };

  const name = String(formData.get("name") ?? "").trim();
  const startDate = readDate(formData, "start_date");
  const endDate = readDate(formData, "end_date");
  const goalWindowStart = readDate(formData, "goal_window_start");
  const goalWindowEnd = readDate(formData, "goal_window_end");
  const okrWeight = Number(formData.get("okr_weight"));
  const competencyWeight = Number(formData.get("competency_weight"));
  const maxGoals = Number(formData.get("max_goals"));

  if (!name) return { error: "Give the cycle a name." };
  if (![startDate, endDate, goalWindowStart, goalWindowEnd].every(Boolean)) {
    return { error: "Set all cycle dates." };
  }
  if (endDate < startDate) return { error: "The cycle cannot end before it starts." };
  if (goalWindowEnd < goalWindowStart || goalWindowEnd > startDate) {
    return { error: "The goal window must close on or before the cycle starts." };
  }
  if (!Number.isFinite(okrWeight) || !Number.isFinite(competencyWeight)) {
    return { error: "Enter both score weights." };
  }
  if (Math.abs(okrWeight + competencyWeight - 1) > 0.001) {
    return { error: "The two score weights must add up to 1.00." };
  }
  if (!Number.isInteger(maxGoals) || maxGoals < 1 || maxGoals > 5) {
    return { error: "Maximum goals must be between 1 and 5." };
  }

  const { error } = await viewer.supabase
    .from("cycles")
    .update({
      name,
      start_date: startDate,
      end_date: endDate,
      goal_window_start: goalWindowStart,
      goal_window_end: goalWindowEnd,
      okr_weight: okrWeight,
      competency_weight: competencyWeight,
      max_goals: maxGoals,
    })
    .eq("id", cycleId);
  if (error) return { error: `The cycle could not be updated: ${error.message}` };

  const { data: quarters } = await viewer.supabase
    .from("quarters")
    .select("id, sequence")
    .eq("cycle_id", cycleId)
    .order("sequence")
    .returns<{ id: number; sequence: number }[]>();
  for (const quarter of quarters ?? []) {
    const offset = (quarter.sequence - 1) * 3;
    const start = monthStart(startDate, offset);
    const end = monthEnd(startDate, offset + 2);
    const name = String(formData.get(`quarter_name_${quarter.id}`) ?? "").trim();
    const scoreBy = readDate(formData, `quarter_score_by_${quarter.id}`);
    const fullReview = String(formData.get(`quarter_full_review_${quarter.id}`) ?? "") === "true";
    if (!name) return { error: `Give Q${quarter.sequence} a label.` };
    if (!scoreBy) return { error: `Set the score-by date for Q${quarter.sequence}.` };
    const { error: quarterError } = await viewer.supabase
      .from("quarters")
      .update({
        name,
        start_date: start,
        end_date: end,
        scoring_due_at: `${scoreBy}T23:59:59.000Z`,
        is_full_review: fullReview,
      })
      .eq("id", quarter.id);
    if (quarterError)
      return { error: `The quarters could not be updated: ${quarterError.message}` };
  }

  refresh();
  return { error: null, message: "Cycle settings saved." };
}

/** First day of the month `offset` months after `start`, as an ISO date. */
function monthStart(start: string, offset: number) {
  const base = new Date(`${start}T00:00:00Z`);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 10);
}

/** Last day of the month `offset` months after `start`, as an ISO date. */
function monthEnd(start: string, offset: number) {
  const base = new Date(`${start}T00:00:00Z`);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset + 1, 0))
    .toISOString()
    .slice(0, 10);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function quarterName(sequence: number, start: string, end: string) {
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  const label = `${MONTH_NAMES[from.getUTCMonth()].slice(0, 3)}–${MONTH_NAMES[to.getUTCMonth()].slice(0, 3)} ${to.getUTCFullYear()}`;
  return `Q${sequence} · ${label}`;
}

/**
 * Load the competency library into the database.
 *
 * The library in `src/data/library.ts` stays the source of truth for the
 * wording; this copies it into `competencies` and `competency_levels` so a
 * charter can reference a real row. Safe to run repeatedly — existing rows are
 * updated in place, matched on the (organisation, name) unique constraint.
 */
export async function seedCompetencyLibrary(): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can load the library." };

  const { supabase, organizationId } = viewer;

  const rows = LIBRARY_COMPETENCIES.map((competency) => ({
    organization_id: organizationId,
    name: competency.name,
    category: competency.unit,
    description: competency.definition,
    evidence_guidance: competency.measure,
    // The coach add-on replaces a standard competency for people who coach; it
    // is not carried by everyone, so only the true library-wide ones are fixed.
    fixed_for_everyone: competency.mandatory && competency.unit !== COACH_ADDON_UNIT,
    active: true,
  }));

  const { data: saved, error } = await supabase
    .from("competencies")
    .upsert(rows, { onConflict: "organization_id,name" })
    .select("id, name")
    .returns<{ id: number; name: string }[]>();

  if (error) return { error: `The library could not be saved: ${error.message}` };

  const byName = new Map((saved ?? []).map((row) => [row.name, row.id]));
  const levels = LIBRARY_COMPETENCIES.flatMap((competency) => {
    const competencyId = byName.get(competency.name);
    if (!competencyId) return [];
    return [
      { rating: 5, label: "Exceptional", behaviour_description: competency.l5 },
      { rating: 3, label: "Meets expectations", behaviour_description: competency.l3 },
      { rating: 1, label: "Does not meet", behaviour_description: competency.l1 },
    ].map((level) => ({ competency_id: competencyId, job_level: null, ...level }));
  });

  /*
   * The anchors cannot be upserted. `competency_levels_scope_unique` is an
   * expression index on `coalesce(job_level, 0)`, and ON CONFLICT can only
   * target a plain column list — and there is no delete policy on the table, so
   * replacing the rows is not open either. Read what is there, insert what is
   * missing, and update only the rows whose wording actually changed.
   */
  const competencyIds = [...byName.values()];
  const { data: existing, error: readError } = await supabase
    .from("competency_levels")
    .select("id, competency_id, rating, label, behaviour_description")
    .in("competency_id", competencyIds)
    .is("job_level", null)
    .returns<
      {
        id: number;
        competency_id: number;
        rating: number;
        label: string;
        behaviour_description: string;
      }[]
    >();

  if (readError) {
    return { error: `The existing behaviour anchors could not be read: ${readError.message}` };
  }

  const byKey = new Map((existing ?? []).map((row) => [`${row.competency_id}:${row.rating}`, row]));

  const toInsert = levels.filter((level) => !byKey.has(`${level.competency_id}:${level.rating}`));
  const toUpdate = levels.flatMap((level) => {
    const current = byKey.get(`${level.competency_id}:${level.rating}`);
    if (!current) return [];
    const unchanged =
      current.label === level.label &&
      current.behaviour_description === level.behaviour_description;
    return unchanged ? [] : [{ id: current.id, level }];
  });

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("competency_levels").insert(toInsert);
    if (insertError) {
      return { error: `The behaviour anchors could not be saved: ${insertError.message}` };
    }
  }

  for (const { id, level } of toUpdate) {
    const { error: updateError } = await supabase
      .from("competency_levels")
      .update({ label: level.label, behaviour_description: level.behaviour_description })
      .eq("id", id);
    if (updateError) {
      return { error: `The behaviour anchors could not be updated: ${updateError.message}` };
    }
  }

  refresh();
  const anchors = toInsert.length + toUpdate.length;
  return {
    error: null,
    message:
      anchors === 0
        ? `${rows.length} competencies loaded; behaviour anchors already up to date.`
        : `${rows.length} competencies loaded, ${anchors} behaviour anchors written.`,
  };
}

/**
 * Open a cycle: the cycle row, its two quarters, and an enrolment for every
 * active person on the roster with their coach and level snapshotted.
 *
 * Enrolment snapshots deliberately freeze title, level and employment type at
 * the moment the cycle opens, so a later promotion does not silently rewrite
 * the basis a completed cycle was scored against.
 */
export async function openCycle(
  _previous: CycleActionResult,
  formData: FormData,
): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can open a cycle." };

  const { supabase, organizationId, personId } = viewer;

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const goalWindowStart = String(formData.get("goal_window_start") ?? "").trim();
  const goalWindowEnd = String(formData.get("goal_window_end") ?? "").trim();

  if (!name) return { error: "Give the cycle a name." };
  if (!startDate) return { error: "Set the date the cycle starts." };
  if (!endDate) return { error: "Set the date the cycle ends." };
  if (!goalWindowStart) return { error: "Set the date the goal window opens." };
  if (!goalWindowEnd) return { error: "Set the date the goal window closes." };
  if (endDate < startDate) return { error: "The cycle cannot end before it starts." };
  if (goalWindowEnd < goalWindowStart) {
    return { error: "The goal window cannot close before it opens." };
  }
  if (goalWindowEnd > startDate) {
    return {
      error: `The goal window must close on or before the cycle starts — it closes ${formatDate(goalWindowEnd)} but the cycle starts ${formatDate(startDate)}.`,
    };
  }

  const { data: cycle, error } = await supabase
    .from("cycles")
    .insert({
      organization_id: organizationId,
      name,
      start_date: startDate,
      end_date: endDate,
      goal_window_start: goalWindowStart,
      goal_window_end: goalWindowEnd,
      status: "goal_setting",
      created_by_person_id: personId,
    })
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error || !cycle) {
    return { error: `The cycle could not be created: ${error?.message ?? "unknown error"}` };
  }

  // Two quarters, each three months, measured from the cycle start.
  const quarters = [1, 2].map((sequence) => {
    const offset = (sequence - 1) * 3;
    const start = monthStart(startDate, offset);
    const end = monthEnd(startDate, offset + 2);
    return {
      cycle_id: cycle.id,
      sequence,
      name: quarterName(sequence, start, end),
      start_date: start,
      end_date: end,
      scoring_due_at: `${end}T23:59:59.000Z`,
      is_full_review: sequence === 2,
      status: "scheduled",
    };
  });

  const { error: quarterError } = await supabase.from("quarters").insert(quarters);
  if (quarterError) {
    return { error: `The quarters could not be created: ${quarterError.message}` };
  }

  const enrollment = await syncCycleParticipants(supabase, organizationId, cycle.id);
  if (enrollment.error) return { error: enrollment.error };

  refresh();
  return {
    error: null,
    message: `${enrollment.added + enrollment.restored} people enrolled in ${name}.`,
  };
}

/** Move a cycle between its lifecycle states (goal setting → active → closed). */
export async function setCycleStatus(
  cycleId: number,
  status: "draft" | "goal_setting" | "active" | "calibration" | "closed",
): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can change the cycle." };

  let enrollment: CycleEnrollmentSync | null = null;
  if (status === "active") {
    const { data: targetCycle } = await viewer.supabase
      .from("cycles")
      .select("id")
      .eq("id", cycleId)
      .eq("organization_id", viewer.organizationId)
      .maybeSingle<{ id: number }>();
    if (!targetCycle) return { error: "That cycle is not available to you." };

    enrollment = await syncCycleParticipants(viewer.supabase, viewer.organizationId, cycleId);
    if (enrollment.error) return { error: enrollment.error };

    const { error: closeError } = await viewer.supabase
      .from("cycles")
      .update({ status: "closed" })
      .eq("organization_id", viewer.organizationId)
      .eq("status", "active")
      .neq("id", cycleId);
    if (closeError)
      return { error: `The previous current cycle could not be closed: ${closeError.message}` };
  }

  const { error } = await viewer.supabase
    .from("cycles")
    .update({ status })
    .eq("id", cycleId)
    .eq("organization_id", viewer.organizationId);
  if (error) return { error: `The cycle could not be updated: ${error.message}` };

  refresh();
  if (enrollment && enrollment.added + enrollment.restored > 0) {
    return {
      error: null,
      message: `${enrollment.added + enrollment.restored} active roster members now have access.`,
    };
  }
  return OK;
}

/** Repair access for an already-active cycle without changing its lifecycle state. */
export async function syncActiveCycle(): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can sync cycle access." };

  const { data: cycle } = await viewer.supabase
    .from("cycles")
    .select("id")
    .eq("organization_id", viewer.organizationId)
    .eq("status", "active")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number }>();
  if (!cycle) return { error: "There is no active cycle to sync." };

  const enrollment = await syncCycleParticipants(viewer.supabase, viewer.organizationId, cycle.id);
  if (enrollment.error) return { error: enrollment.error };

  refresh();
  const changed = enrollment.added + enrollment.restored;
  return {
    error: null,
    message:
      changed === 0
        ? "Roster access is already in sync."
        : `${changed} active roster members now have access.`,
  };
}

/** Remove only an unused cycle; historical cycles are closed, not deleted. */
export async function removeCycle(cycleId: number): Promise<CycleActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only an administrator can remove a cycle." };
  if (!Number.isInteger(cycleId) || cycleId <= 0) return { error: "Choose a valid cycle." };

  const { data: cycle } = await viewer.supabase
    .from("cycles")
    .select("id, status")
    .eq("id", cycleId)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle<{ id: number; status: string }>();
  if (!cycle) return { error: "That cycle is not available to you." };
  if (cycle.status === "active") return { error: "Change the current cycle before removing it." };

  const { count, error: countError } = await viewer.supabase
    .from("cycle_participants")
    .select("id", { count: "exact", head: true })
    .eq("cycle_id", cycleId);
  if (countError)
    return { error: `The cycle contents could not be checked: ${countError.message}` };
  if ((count ?? 0) > 0) {
    return { error: "This cycle has enrolled records. Set it to Closed to preserve its history." };
  }

  const { data: removed, error } = await viewer.supabase
    .from("cycles")
    .delete()
    .eq("id", cycleId)
    .eq("organization_id", viewer.organizationId)
    .select("id")
    .maybeSingle<{ id: number }>();
  if (error) return { error: `The cycle could not be removed: ${error.message}` };
  if (!removed) return { error: "The cycle could not be removed in its current state." };

  refresh();
  return { error: null, message: "Unused cycle removed." };
}
