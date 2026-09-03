import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { CharterDecisionForm } from "@/app/components/record-actions";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPROVER_LABEL } from "@/data/performance";
import { getActiveCycle, getVisibleParticipants } from "@/lib/data/cycle";
import { CHARTER_STATUS_LABELS } from "@/lib/data/performance-types";
import { getCharter } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

const CHECKLIST = [
  "Every goal has a measurable key result, a baseline, a target, and a named data source. A missing data source is the one thing to always send back.",
  "The targets are ambitious but reachable — a well-set charter averages 0.7–0.8 on attainment; a row of straight 1.0s means the goals were set too safe.",
  "The five competency commitments say what the person will actually do, not what the competency is called.",
  "Either sign the review, or return it with a written note saying exactly what must change.",
];

export default async function ApprovalsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];

  const charters = await Promise.all(
    participants.map(async (participant) => ({
      participant,
      charter: await getCharter(viewer.supabase, participant.id),
    })),
  );

  // The order is fixed: a coach acts on what they were sent, Leadership acts
  // on what a coach has already signed.
  const waitingOnCoach = charters.filter(
    (entry) =>
      entry.charter?.status === "submitted" && entry.participant.coachId === viewer.personId,
  );
  const waitingOnLeadership = viewer.isAdmin
    ? charters.filter((entry) => entry.charter?.status === "coach_reviewed")
    : [];

  const queue = [
    ...waitingOnCoach.map((entry) => ({ ...entry, capacity: "coach" as const })),
    ...waitingOnLeadership.map((entry) => ({ ...entry, capacity: "founder" as const })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Coach review"
        title="Charter reviews"
        description={`Review order is fixed: coach first, then ${APPROVER_LABEL}. Nothing changes silently after a conversation.`}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What to check before you sign</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-muted-foreground">
            {CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {queue.length === 0 ? (
        <WorkflowEmpty
          icon={ShieldCheck}
          title="Nothing is waiting on you"
          description="Charters appear here the moment they are sent for review. You will see the ones sent to you as a coach, and — for Leadership — the ones a coach has already signed."
        />
      ) : (
        <div className="grid gap-6">
          {queue.map((entry) => {
            const charter = entry.charter;
            if (!charter) return null;
            return (
              <Card key={`${entry.capacity}-${charter.id}`}>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle>{entry.participant.personName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.participant.title} &middot; {entry.participant.unitName}
                    </p>
                  </div>
                  <Badge variant="outline">{CHARTER_STATUS_LABELS[charter.status]}</Badge>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    {charter.goals.map((goal) => (
                      <div key={goal.id} className="rounded-xl border p-3 text-sm">
                        <p className="font-medium">{goal.outcome}</p>
                        <p className="text-muted-foreground">
                          {goal.keyResult} &middot; baseline {goal.baseline} &rarr; target{" "}
                          {goal.target}
                        </p>
                        <p className="text-xs text-muted-foreground">Source: {goal.dataSource}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2">
                    {charter.competencies.map((competency) => (
                      <div key={competency.id} className="rounded-xl border p-3 text-sm">
                        <p className="font-medium">{competency.name}</p>
                        <p className="text-muted-foreground">{competency.commitment}</p>
                      </div>
                    ))}
                  </div>

                  <CharterDecisionForm charterId={charter.id} capacity={entry.capacity} />

                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href={`/book/${entry.participant.id}`} target="_blank" />}
                    >
                      Open the full record
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
