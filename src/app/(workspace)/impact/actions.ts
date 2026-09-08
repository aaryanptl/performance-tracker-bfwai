"use server";

import { revalidatePath } from "next/cache";

import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import { getImpactStatements } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export interface ImpactActionResult {
  error: string | null;
  message?: string;
}

function refresh() {
  revalidatePath("/impact");
  revalidatePath("/records");
  revalidatePath("/coaching/scoring");
  revalidatePath("/");
}

interface ItemInput {
  impactCreated: string;
  numbersAndEvidence: string;
  competencyDemonstrated: string | null;
}

function parseItems(raw: FormDataEntryValue | null): ItemInput[] | string {
  if (typeof raw !== "string" || raw.trim() === "") {
    return "Write at least one impact entry.";
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "The statement could not be read. Reload the page and try again.";
  }
  if (!Array.isArray(parsed)) return "The statement could not be read.";

  const items: ItemInput[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const item = entry as Record<string, unknown>;
    const impactCreated = String(item.impactCreated ?? "").trim();
    const numbersAndEvidence = String(item.numbersAndEvidence ?? "").trim();
    const competencyDemonstrated = String(item.competencyDemonstrated ?? "").trim();
    if (!impactCreated && !numbersAndEvidence && !competencyDemonstrated) continue;
    if (!impactCreated) return "Every entry needs the impact you created.";
    items.push({
      impactCreated,
      // The prototype has one results field. Keep the legacy database column
      // populated without exposing a second, non-prototype field in the UI.
      numbersAndEvidence: numbersAndEvidence || "Captured in the impact statement.",
      competencyDemonstrated: competencyDemonstrated || null,
    });
  }

  if (items.length === 0) return "Write at least one impact entry.";
  return items;
}

/**
 * Save the signed-in person's impact statement for one quarter.
 *
 * A statement exists per (participant, quarter) — the schema enforces that with
 * a unique index — so this creates one on first save and updates it after.
 * Entries are replaced wholesale, for the same ordering reason as the charter.
 */
export async function saveImpact(
  _previous: ImpactActionResult,
  formData: FormData,
): Promise<ImpactActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const quarterId = Number(formData.get("quarter_id"));
  if (!Number.isInteger(quarterId) || quarterId <= 0) {
    return { error: "Choose the quarter this statement covers." };
  }

  const cycle = await getActiveCycle(supabase);
  if (!cycle) return { error: "No cycle is open yet." };
  if (!cycle.quarters.some((quarter) => quarter.id === quarterId)) {
    return { error: "That quarter is not part of the current cycle." };
  }

  const participant = await getOwnParticipant(supabase, cycle.id, viewer.personId);
  if (!participant) return { error: "You are not enrolled in the current cycle." };

  const items = parseItems(formData.get("items"));
  if (typeof items === "string") return { error: items };

  const learning = String(formData.get("learning_carried_forward") ?? "").trim() || null;

  const statements = await getImpactStatements(supabase, participant.id);
  const existing = statements.find((statement) => statement.quarterId === quarterId);

  if (existing && existing.status !== "draft") {
    return { error: "This statement has been shared and is now read-only." };
  }

  let statementId = existing?.id ?? null;

  if (statementId === null) {
    const { data, error } = await supabase
      .from("impact_statements")
      .insert({
        cycle_participant_id: participant.id,
        quarter_id: quarterId,
        period_type: "quarterly",
        status: "draft",
        learning_carried_forward: learning,
      })
      .select("id")
      .maybeSingle<{ id: number }>();

    if (error || !data) {
      return { error: `The statement could not be created: ${error?.message ?? "unknown error"}` };
    }
    statementId = data.id;
  } else {
    const { error } = await supabase
      .from("impact_statements")
      .update({ learning_carried_forward: learning })
      .eq("id", statementId);
    if (error) return { error: `The statement could not be saved: ${error.message}` };
  }

  await supabase.from("impact_items").delete().eq("impact_statement_id", statementId);
  const { error: itemError } = await supabase.from("impact_items").insert(
    items.map((item, index) => ({
      impact_statement_id: statementId,
      sort_order: index + 1,
      impact_created: item.impactCreated,
      numbers_and_evidence: item.numbersAndEvidence,
      competency_demonstrated: item.competencyDemonstrated,
    })),
  );
  if (itemError) return { error: `The entries could not be saved: ${itemError.message}` };

  refresh();
  return { error: null, message: "Draft saved." };
}

/** Share the statement with the coach. Once shared it becomes read-only. */
export async function submitImpact(statementId: number): Promise<ImpactActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };

  const { error } = await viewer.supabase
    .from("impact_statements")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", statementId)
    .eq("status", "draft");

  if (error) return { error: `The statement could not be shared: ${error.message}` };

  refresh();
  return { error: null, message: "Shared with your coach." };
}
