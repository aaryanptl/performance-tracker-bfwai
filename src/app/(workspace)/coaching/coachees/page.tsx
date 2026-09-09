import { redirect } from "next/navigation";

import { CheckInFramework } from "@/app/components/check-in-framework";
import { PageHeader } from "@/app/components/page-header";
import { ParticipantTable, type ParticipantTableSummary } from "@/app/components/participant-table";
import { RatingTraps } from "@/app/components/rating-traps";
import { getActiveCycleForRequest, getVisibleParticipants } from "@/lib/data/cycle";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

export default async function CoacheesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];

  // An administrator reads everyone; a coach reads themselves and their
  // coachees. Either way the coaching list is the people they actually coach.
  const coachees = participants.filter((participant) => participant.coachId === viewer.personId);
  const summaries = Object.fromEntries(
    await Promise.all(
      coachees.map(async (participant) => {
        const record = await getPersonRecord(viewer.supabase, participant.id);
        const releasedReviews = record?.reviews.filter(
          (review) => review.releasedAt !== null && review.quarterlyScore !== null,
        );
        const latestReview = releasedReviews?.at(-1);
        const latestScore = latestReview?.calibratedScore ?? latestReview?.quarterlyScore ?? null;
        const summary: ParticipantTableSummary = {
          goalCount: record?.charter?.goals.length ?? 0,
          impactCount:
            record?.impactStatements.reduce(
              (count, statement) => count + statement.items.length,
              0,
            ) ?? 0,
          latestScore,
          charterStatus: record?.charter ? record.charter.status.replace(/_/g, " ") : "Not started",
          checkInCount: record?.checkIns.filter((checkIn) => checkIn.notes !== null).length ?? 0,
          checkInTarget: 6,
          quarterScores: Object.fromEntries(
            (record?.reviews ?? []).map((review) => [
              review.quarterId,
              review.calibratedScore ?? review.quarterlyScore,
            ]),
          ),
          impactPeriods: Object.fromEntries(
            (record?.impactStatements ?? [])
              .filter((statement) => statement.quarterId !== null)
              .map((statement) => [statement.quarterId as number, statement.submittedAt !== null]),
          ),
        };
        return [participant.id, summary] as const;
      }),
    ),
  );

  return (
    <>
      <PageHeader
        eyebrow="Direct scope"
        title="My coachees"
        description="You are a development partner, not a task supervisor. One 15-minute check-in each month, scoring at each quarter end, and one development action per person per cycle."
      />
      <ParticipantTable
        participants={coachees}
        action="coachee"
        summaries={summaries}
        periods={cycle?.quarters}
        emptyMessage={
          cycle
            ? "No one is assigned to you as a coachee in this cycle."
            : "No cycle is open yet. An administrator opens the cycle and enrols the roster."
        }
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CheckInFramework />
        <RatingTraps />
      </div>
    </>
  );
}
