import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { CharterDecisionForm, ReleaseAllReviewsButton } from "@/app/components/record-actions";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPROVER_LABEL } from "@/data/performance";
import { getApprovalQueue } from "@/lib/data/approvals";
import { getActiveCycleForRequest, getVisibleParticipants } from "@/lib/data/cycle";
import { CHARTER_STATUS_LABELS } from "@/lib/data/performance-types";
import { getReviews } from "@/lib/data/records";
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

  const cycle = await getActiveCycleForRequest();
  // The order is fixed: a coach acts on what they were sent, Leadership acts
  // on what a coach has already signed.
  const queue = await getApprovalQueue({
    supabase: viewer.supabase,
    cycle,
    personId: viewer.personId,
    isAdmin: viewer.isAdmin,
  });
  const coachParticipants = cycle
    ? (await getVisibleParticipants(viewer.supabase, cycle.id)).filter(
        (participant) => participant.coachId === viewer.personId,
      )
    : [];
  const coachReviews = await Promise.all(
    coachParticipants.map((participant) => getReviews(viewer.supabase, participant.id)),
  );
  const releaseableReviewCount = coachReviews
    .flat()
    .filter(
      (review) =>
        review.status === "coach_draft" &&
        review.okrRating !== null &&
        review.competencyRating !== null,
    ).length;

  return (
    <>
      <PageHeader
        eyebrow="Coach review"
        title="Charter reviews"
        description={`Review order is fixed: coach first, then ${APPROVER_LABEL} when calibration is needed. Completed scores can be released directly to the person.`}
      />
      {releaseableReviewCount > 0 ? (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Release completed scores</CardTitle>
            <p className="text-sm text-muted-foreground">
              Release all {releaseableReviewCount} completed score
              {releaseableReviewCount === 1 ? "" : "s"} for your people in the active cycle. Only
              reviews with both Score 1 and Score 2 are included.
            </p>
          </CardHeader>
          <CardContent>
            <ReleaseAllReviewsButton count={releaseableReviewCount} />
          </CardContent>
        </Card>
      ) : null}
      {queue.length === 0 && releaseableReviewCount === 0 ? (
        <WorkflowEmpty
          icon={ShieldCheck}
          title="Nothing is waiting on you"
          description="Charters appear here the moment they are sent for review. You will see the ones sent to you as a coach, and — for Leadership — the ones a coach has already signed."
        />
      ) : queue.length > 0 ? (
        <div className="grid gap-6">
          {queue.map((entry) => {
            const charter = entry.charter;
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
      ) : null}

      <Card className="mt-6">
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
    </>
  );
}
