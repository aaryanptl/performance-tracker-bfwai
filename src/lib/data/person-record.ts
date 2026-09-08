import { getActiveCycle, getParticipantById, getVisibleParticipants } from "@/lib/data/cycle";
import type { PersonRecord } from "@/lib/data/performance-types";
import {
  getCharter,
  getCheckIns,
  getDevelopmentActions,
  getImpactStatements,
  getReviews,
} from "@/lib/data/records";
import type { SupabaseClient } from "@/lib/data/viewer";

/**
 * One person's complete cycle, assembled from every record table.
 *
 * Scope is not re-implemented here. Every underlying read runs through
 * row-level security, so a participant outside the caller's scope simply does
 * not come back from `getParticipantById` and this returns null — the same
 * answer a record page and a downloaded book both act on.
 */
export async function getPersonRecord(
  supabase: SupabaseClient,
  participantId: number,
): Promise<PersonRecord | null> {
  const participant = await getParticipantById(supabase, participantId);
  if (!participant) return null;

  const cycle = await getActiveCycle(supabase);
  if (!cycle) return null;

  const [charter, checkIns, impactStatements, reviews, developmentActions] = await Promise.all([
    getCharter(supabase, participantId),
    getCheckIns(supabase, participantId),
    getImpactStatements(supabase, participantId),
    getReviews(supabase, participantId),
    getDevelopmentActions(supabase, participantId),
  ]);

  return { participant, cycle, charter, checkIns, impactStatements, reviews, developmentActions };
}

/**
 * Every record the caller may read, for a team or organisation-wide book.
 * Built from `getVisibleParticipants`, so the set is exactly what RLS allows.
 */
export async function getVisibleRecords(supabase: SupabaseClient): Promise<PersonRecord[]> {
  const cycle = await getActiveCycle(supabase);
  if (!cycle) return [];

  const participants = await getVisibleParticipants(supabase, cycle.id);
  const records = await Promise.all(
    participants.map(async (participant) => {
      const [charter, checkIns, impactStatements, reviews, developmentActions] = await Promise.all([
        getCharter(supabase, participant.id),
        getCheckIns(supabase, participant.id),
        getImpactStatements(supabase, participant.id),
        getReviews(supabase, participant.id),
        getDevelopmentActions(supabase, participant.id),
      ]);
      return {
        participant,
        cycle,
        charter,
        checkIns,
        impactStatements,
        reviews,
        developmentActions,
      };
    }),
  );

  return records;
}
