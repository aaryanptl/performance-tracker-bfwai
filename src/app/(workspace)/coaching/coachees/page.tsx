import { redirect } from "next/navigation";

import { CheckInFramework } from "@/app/components/check-in-framework";
import { PageHeader } from "@/app/components/page-header";
import { ParticipantTable } from "@/app/components/participant-table";
import { RatingTraps } from "@/app/components/rating-traps";
import { getActiveCycle, getVisibleParticipants } from "@/lib/data/cycle";
import { getViewer } from "@/lib/data/viewer";

export default async function CoacheesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];

  // An administrator reads everyone; a coach reads themselves and their
  // coachees. Either way the coaching list is the people they actually coach.
  const coachees = participants.filter((participant) => participant.coachId === viewer.personId);

  return (
    <>
      <PageHeader
        eyebrow="Direct scope"
        title="My coachees"
        description="You are a development partner, not a task supervisor. One 15-minute check-in each month, scoring at each quarter end, and one development action per person per cycle."
      />
      <ParticipantTable
        participants={coachees}
        action="check-in"
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
