import { getVisibleParticipants } from "@/lib/data/cycle";
import type { Charter, CycleSummary, ParticipantSummary } from "@/lib/data/performance-types";
import { getCharter } from "@/lib/data/records";
import type { SupabaseClient } from "@/lib/data/viewer";

export interface ApprovalQueueEntry {
  participant: ParticipantSummary;
  charter: Charter;
  capacity: "coach" | "founder";
}

/**
 * Keep the sidebar badge and the approvals page on the same queue rules.
 * Visibility still comes from the participant query and database policies.
 */
export async function getApprovalQueue({
  supabase,
  cycle,
  personId,
  isAdmin,
}: {
  supabase: SupabaseClient;
  cycle: CycleSummary | null;
  personId: number;
  isAdmin: boolean;
}): Promise<ApprovalQueueEntry[]> {
  if (!cycle) return [];

  const participants = await getVisibleParticipants(supabase, cycle.id);
  const charters = await Promise.all(
    participants.map(async (participant) => ({
      participant,
      charter: await getCharter(supabase, participant.id),
    })),
  );

  const waitingOnCoach = charters.filter(
    (entry): entry is { participant: ParticipantSummary; charter: Charter } =>
      entry.charter?.status === "submitted" && entry.participant.coachId === personId,
  );
  const waitingOnLeadership = isAdmin
    ? charters.filter(
        (entry): entry is { participant: ParticipantSummary; charter: Charter } =>
          entry.charter?.status === "coach_reviewed",
      )
    : [];

  return [
    ...waitingOnCoach.map((entry) => ({ ...entry, capacity: "coach" as const })),
    ...waitingOnLeadership.map((entry) => ({ ...entry, capacity: "founder" as const })),
  ];
}
