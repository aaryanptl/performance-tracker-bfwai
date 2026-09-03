import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { CharterEditor } from "@/app/components/charter-editor";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { getCompetencyIds } from "@/lib/data/competencies";
import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import { getCharter } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function EditCharterPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
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
        description="Ask an administrator to add you to the current cycle from Cycles & settings."
      />
    );
  }

  const [charter, competencyIds] = await Promise.all([
    getCharter(viewer.supabase, participant.id),
    getCompetencyIds(viewer.supabase),
  ]);

  return (
    <CharterEditor
      cycle={cycle}
      charter={charter}
      competencyIds={competencyIds}
      personName={participant.personName}
      unitName={participant.unitName}
      coachName={participant.coachName}
    />
  );
}
