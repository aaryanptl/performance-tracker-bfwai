import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { ImpactForm } from "@/app/components/performance-forms";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import { getImpactStatements } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function ImpactPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participant = cycle
    ? await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Written by you"
        title="Impact Statement"
        description="Your account, in your words, of the impact you created — with real numbers. Share it three days before the scoring conversation. This is the only section you write, and it is the most important one."
      />
      <Card className="mb-6 bg-accent/40">
        <CardContent className="text-sm leading-6">
          Your coach reads this before scoring and verifies each claim against the Goal Charter, the
          check-in records, and the named data sources. Once shared it becomes read-only, so the
          record cannot move after the fact.
        </CardContent>
      </Card>

      {!cycle || !participant ? (
        <WorkflowEmpty
          icon={CalendarClock}
          title={cycle ? "You are not enrolled in this cycle" : "No cycle is open yet"}
          description={
            cycle
              ? "Ask an administrator to add you to the current cycle from Cycles & settings."
              : "An administrator opens the cycle and enrols the roster. Your impact statement becomes available then."
          }
        />
      ) : (
        <ImpactForm
          quarters={cycle.quarters}
          statements={await getImpactStatements(viewer.supabase, participant.id)}
        />
      )}
    </>
  );
}
