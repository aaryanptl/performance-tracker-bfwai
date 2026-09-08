"use server";

import { revalidatePath } from "next/cache";

import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import { CHARTER_EDITABLE } from "@/lib/data/performance-types";
import { getCharter } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export interface CharterActionResult {
  error: string | null;
  message?: string;
}

function refresh() {
  revalidatePath("/charter");
  revalidatePath("/charter/edit");
  revalidatePath("/coaching/approvals");
  revalidatePath("/records");
  revalidatePath("/");
}

interface GoalInput {
  outcome: string;
  keyResult: string;
  baseline: string;
  target: string;
  dataSource: string;
}

interface CompetencyInput {
  competencyId: number;
  selectionType: "fixed" | "selected";
  commitment: string;
}

/**
 * Goals and competencies arrive as JSON in one field rather than as indexed
 * form keys: the editor adds and removes rows freely, and a single payload
 * keeps the ordering the person sees identical to the ordering that is stored.
 */
function parseGoals(raw: FormDataEntryValue | null): GoalInput[] | string {
  if (typeof raw !== "string" || raw.trim() === "") return "Add at least one goal.";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "The charter could not be read. Reload the page and try again.";
  }
  if (!Array.isArray(parsed)) return "The charter could not be read.";

  const goals: GoalInput[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const goal = entry as Record<string, unknown>;
    const outcome = String(goal.outcome ?? "").trim();
    const keyResult = String(goal.keyResult ?? "").trim();
    const baseline = String(goal.baseline ?? "").trim();
    const target = String(goal.target ?? "").trim();
    const dataSource = String(goal.dataSource ?? "").trim();
    // A blank row is a row the person started and abandoned; drop it rather
    // than failing the save they asked for.
    if (!outcome && !keyResult && !baseline && !target && !dataSource) continue;
    if (!outcome) return "Every goal needs an objective.";
    if (!keyResult) return "Every goal needs a measurable key result.";
    if (!baseline) return "Every goal needs a baseline — where it stands today.";
    if (!target) return "Every goal needs a target.";
    if (!dataSource) return "Every goal needs a named data source.";
    goals.push({ outcome, keyResult, baseline, target, dataSource });
  }

  if (goals.length === 0) return "Add at least one goal.";
  if (goals.length > 5) return "A charter carries at most five goals.";
  return goals;
}

function parseCompetencies(raw: FormDataEntryValue | null): CompetencyInput[] | string {
  if (typeof raw !== "string" || raw.trim() === "") return "Choose your competencies.";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "The charter could not be read. Reload the page and try again.";
  }
  if (!Array.isArray(parsed)) return "The charter could not be read.";

  const competencies: CompetencyInput[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const item = entry as Record<string, unknown>;
    const competencyId = Number(item.competencyId);
    const commitment = String(item.commitment ?? "").trim();
    const selectionType = item.selectionType === "fixed" ? "fixed" : "selected";
    if (!Number.isInteger(competencyId) || competencyId <= 0) continue;
    if (!commitment) return "Every competency needs a one-line commitment.";
    competencies.push({ competencyId, selectionType, commitment });
  }

  if (competencies.length === 0) return "Choose your competencies.";
  if (competencies.length > 5) return "A charter carries at most five competencies.";

  const unique = new Set(competencies.map((competency) => competency.competencyId));
  if (unique.size !== competencies.length) return "Each competency can only be chosen once.";

  return competencies;
}

/**
 * Save the signed-in person's charter for the active cycle.
 *
 * Goals and competencies are replaced wholesale rather than diffed: the charter
 * is a small, ordered document, and `sort_order` carries a unique constraint
 * per charter, so a delete-then-insert avoids transient collisions that an
 * in-place reorder would hit.
 */
export async function saveCharter(
  _previous: CharterActionResult,
  formData: FormData,
): Promise<CharterActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const cycle = await getActiveCycle(supabase);
  if (!cycle) return { error: "No cycle is open yet. An administrator opens the cycle." };

  const participant = await getOwnParticipant(supabase, cycle.id, viewer.personId);
  if (!participant) return { error: "You are not enrolled in the current cycle." };

  const goals = parseGoals(formData.get("goals"));
  if (typeof goals === "string") return { error: goals };
  const competencies = parseCompetencies(formData.get("competencies"));
  if (typeof competencies === "string") return { error: competencies };

  if (goals.length > cycle.maxGoals) {
    return { error: `This cycle allows at most ${cycle.maxGoals} goals.` };
  }

  const cycleIntent = String(formData.get("cycle_intent") ?? "").trim() || null;
  const context = String(formData.get("context") ?? "").trim() || null;

  const existing = await getCharter(supabase, participant.id);
  if (existing && !CHARTER_EDITABLE.includes(existing.status)) {
    return { error: "This charter is with a reviewer and cannot be edited right now." };
  }

  let charterId = existing?.id ?? null;

  if (charterId === null) {
    const { data, error } = await supabase
      .from("goal_charters")
      .insert({
        cycle_participant_id: participant.id,
        version: 1,
        cycle_intent: cycleIntent,
        context,
        status: "draft",
      })
      .select("id")
      .maybeSingle<{ id: number }>();

    if (error || !data) {
      return { error: `The charter could not be created: ${error?.message ?? "unknown error"}` };
    }
    charterId = data.id;
  } else {
    const { error } = await supabase
      .from("goal_charters")
      .update({ cycle_intent: cycleIntent, context })
      .eq("id", charterId);
    if (error) return { error: `The charter could not be saved: ${error.message}` };
  }

  await supabase.from("charter_goals").delete().eq("charter_id", charterId);
  const { error: goalError } = await supabase.from("charter_goals").insert(
    goals.map((goal, index) => ({
      charter_id: charterId,
      sort_order: index + 1,
      outcome: goal.outcome,
      key_result: goal.keyResult,
      baseline: goal.baseline,
      target: goal.target,
      data_source: goal.dataSource,
    })),
  );
  if (goalError) return { error: `The goals could not be saved: ${goalError.message}` };

  await supabase.from("charter_competencies").delete().eq("charter_id", charterId);
  const { error: competencyError } = await supabase.from("charter_competencies").insert(
    competencies.map((competency, index) => ({
      charter_id: charterId,
      competency_id: competency.competencyId,
      sort_order: index + 1,
      selection_type: competency.selectionType,
      commitment: competency.commitment,
    })),
  );
  if (competencyError) {
    return { error: `The competencies could not be saved: ${competencyError.message}` };
  }

  refresh();
  return { error: null, message: "Charter saved." };
}

/** Send the charter to the coach. Editing reopens only if it is sent back. */
export async function submitCharter(): Promise<CharterActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const cycle = await getActiveCycle(supabase);
  if (!cycle) return { error: "No cycle is open yet." };

  const participant = await getOwnParticipant(supabase, cycle.id, viewer.personId);
  if (!participant) return { error: "You are not enrolled in the current cycle." };

  const charter = await getCharter(supabase, participant.id);
  if (!charter) return { error: "Draft your charter before sending it." };
  if (!CHARTER_EDITABLE.includes(charter.status)) {
    return { error: "This charter has already been sent." };
  }
  if (charter.goals.length === 0) return { error: "Add at least one goal before sending." };
  if (charter.competencies.length === 0) {
    return { error: "Add your competency commitments before sending." };
  }

  const { error } = await supabase
    .from("goal_charters")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", charter.id);

  if (error) return { error: `The charter could not be sent: ${error.message}` };

  refresh();
  return { error: null, message: "Charter sent to your coach." };
}

/**
 * A coach's or Leadership's decision on a charter.
 *
 * The order is fixed — coach first, then Leadership — and is enforced by the
 * status the charter must be in for each capacity to act.
 */
export async function decideCharter(
  charterId: number,
  capacity: "coach" | "founder",
  decision: "reviewed" | "approved" | "changes_requested",
  comment: string,
): Promise<CharterActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const trimmed = comment.trim();
  if (decision === "changes_requested" && !trimmed) {
    return { error: "Say what must change before sending it back." };
  }

  const { data: charter } = await supabase
    .from("goal_charters")
    .select("id, version, status")
    .eq("id", charterId)
    .maybeSingle<{ id: number; version: number; status: string }>();

  if (!charter) return { error: "That charter is not available to you." };

  if (capacity === "coach" && charter.status !== "submitted") {
    return { error: "This charter is not waiting on a coach review." };
  }
  if (capacity === "founder" && charter.status !== "coach_reviewed") {
    return { error: "This charter has not been reviewed by its coach yet." };
  }

  const now = new Date().toISOString();
  const patch =
    decision === "changes_requested"
      ? {
          status: capacity === "coach" ? "coach_changes_requested" : "founder_changes_requested",
        }
      : capacity === "coach"
        ? { status: "coach_reviewed", coach_reviewed_at: now }
        : { status: "approved_locked", founder_approved_at: now, locked_at: now };

  // Row-level security filters rather than refuses, so an update the caller may
  // not make comes back as zero rows, not an error. Ask for the row back to
  // tell the two apart.
  const { data: updated, error } = await supabase
    .from("goal_charters")
    .update(patch)
    .eq("id", charterId)
    .select("id");
  if (error) return { error: `The decision could not be recorded: ${error.message}` };
  if (!updated || updated.length === 0) {
    return { error: "You are not allowed to decide on this charter." };
  }

  const { error: decisionError } = await supabase.from("charter_decisions").insert({
    charter_id: charterId,
    charter_version: charter.version,
    actor_person_id: viewer.personId,
    actor_capacity: capacity,
    decision,
    comment: trimmed || null,
  });
  if (decisionError) {
    return { error: `The decision could not be recorded: ${decisionError.message}` };
  }

  refresh();
  return {
    error: null,
    message: decision === "changes_requested" ? "Sent back with your note." : "Recorded.",
  };
}
