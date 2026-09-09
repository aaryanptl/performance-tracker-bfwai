import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { CharterChangeHistory } from "@/app/components/charter-change-history";
import { CharterEditor } from "@/app/components/charter-editor";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { getCompetencyIds } from "@/lib/data/competencies";
import {
  getActiveCycleForRequest,
  getOwnParticipant,
  getPreviousCycle,
} from "@/lib/data/cycle";
import { getCharter, getCharterHistory } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function EditCharterPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  if (!cycle) {
    return (
      <WorkflowEmpty
        icon={CalendarClock}
        title="No cycle is open yet"
        description="An administrator opens the cycle and enrols the roster. Your charter becomes available as soon as that happens."
      />
    );
  }

  const participant = await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId);
  if (!participant) {
    return (
      <WorkflowEmpty
        icon={CalendarClock}
        title="You are not enrolled in this cycle"
        description={
          viewer.isAdmin
            ? "Add yourself to the current cycle from People & coaches, then return here to draft your charter."
            : "Ask an administrator to add you to the current cycle from People & coaches."
        }
        actionLabel={viewer.isAdmin ? "Open People & coaches" : undefined}
        href={viewer.isAdmin ? "/admin/people" : undefined}
      />
    );
  }

  const [charterHistory, competencyIds, previousCycle] = await Promise.all([
    getCharterHistory(viewer.supabase, participant.id),
    getCompetencyIds(viewer.supabase),
    getPreviousCycle(viewer.supabase, cycle),
  ]);
  const charter = charterHistory[0] ?? null;
  const previousParticipant = previousCycle
    ? await getOwnParticipant(viewer.supabase, previousCycle.id, viewer.personId)
    : null;
  const previousCharter =
    charter === null && previousParticipant
      ? await getCharter(viewer.supabase, previousParticipant.id)
      : null;

  return (
    <>
      <CharterEditor
        cycle={cycle}
        charter={charter}
        previousCharter={previousCharter}
        previousCycleName={previousCycle?.name ?? null}
        competencyIds={competencyIds}
        personName={participant.personName}
        unitName={participant.unitName}
        coachName={participant.coachName}
      />
      <div className="mt-6">
        <CharterChangeHistory history={charterHistory} />
      </div>
    </>
  );
}
