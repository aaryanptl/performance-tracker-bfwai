import { Goal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CycleTimeline } from "@/app/components/cycle-timeline";
import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import { CHARTER_STATUS_LABELS } from "@/lib/data/performance-types";
import { getCharter, getCheckIns, getImpactStatements } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function OverviewPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participant = cycle
    ? await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId)
    : null;

  const [charter, checkIns, impact] = participant
    ? await Promise.all([
        getCharter(viewer.supabase, participant.id),
        getCheckIns(viewer.supabase, participant.id),
        getImpactStatements(viewer.supabase, participant.id),
      ])
    : [null, [], []];

  const unsigned = checkIns.filter(
    (checkIn) => checkIn.notes !== null && !checkIn.acknowledgedByParticipant,
  );
  const openDrafts = impact.filter((statement) => statement.status === "draft");

  /* What actually needs this person, in the order the cycle asks for it. */
  const nextActions: { href: string; title: string; detail: string }[] = [];
  if (!charter) {
    nextActions.push({
      href: "/charter/edit",
      title: "Draft your Goal Charter",
      detail: `Up to ${cycle?.maxGoals ?? 5} measurable goals and 5 competencies, before the cycle starts.`,
    });
  } else if (charter.status === "draft") {
    nextActions.push({
      href: "/charter/edit",
      title: "Send your charter to your coach",
      detail: "It is saved as a draft. Your coach reviews it before Leadership approves.",
    });
  } else if (
    charter.status === "coach_changes_requested" ||
    charter.status === "founder_changes_requested"
  ) {
    nextActions.push({
      href: "/charter/edit",
      title: "Your charter came back with changes",
      detail: "Read the note on the charter, make the changes, and send it again.",
    });
  }
  if (unsigned.length > 0) {
    nextActions.push({
      href: "/check-ins",
      title: `Sign ${unsigned.length} check-in record${unsigned.length > 1 ? "s" : ""}`,
      detail: "Your coach has recorded the conversation. Read it and sign the record.",
    });
  }
  if (openDrafts.length > 0) {
    nextActions.push({
      href: "/impact",
      title: "Share your Impact Statement",
      detail: "A draft is saved but not yet shared. Share it before the scoring conversation.",
    });
  }

  return (
    <>
      <PageHeader
        eyebrow={cycle?.name ?? "No cycle open"}
        title="Make the next conversation count."
        description="Ascend keeps goals, monthly coaching, evidence, and scoring in one continuous record so review day never starts from memory."
        action={
          <Button nativeButton={false} render={<Link href="/charter/edit" />}>
            <Goal />
            {charter ? "Open my charter" : "Start my charter"}
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>What needs you next</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {nextActions.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Nothing is waiting on you right now.
                </p>
              ) : (
                nextActions.map((action) => (
                  <div key={action.href} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-sm font-semibold">{action.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {action.detail}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      nativeButton={false}
                      render={<Link href={action.href} />}
                    >
                      Open
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>Your charter</CardTitle>
                <Badge
                  variant="secondary"
                  className="uppercase tracking-[0.14em] text-[0.65rem] text-muted-foreground"
                >
                  {charter ? CHARTER_STATUS_LABELS[charter.status] : "Not started"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {charter && charter.goals.length > 0 ? (
                <div className="grid gap-3">
                  {charter.goals.map((goal) => (
                    <div key={goal.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{goal.outcome}</p>
                      <p className="text-muted-foreground">
                        {goal.keyResult} &middot; target {goal.target}
                      </p>
                    </div>
                  ))}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/charter" />}
                    >
                      Open my charter
                    </Button>
                  </div>
                </div>
              ) : (
                <Empty className="border bg-muted/30 p-10">
                  <EmptyHeader>
                    <EmptyTitle>No charter yet</EmptyTitle>
                    <EmptyDescription>
                      Draft up to {cycle?.maxGoals ?? 5} goals and 5 competencies to begin the
                      cycle.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button nativeButton={false} render={<Link href="/charter/edit" />}>
                      Start my charter
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6">
          <CycleTimeline cycle={cycle} />
          <Card className="bg-accent/40">
            <CardHeader>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Remember
              </p>
              <CardTitle className="text-base font-semibold">
                On a five-point scale, 3 is a good rating.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                It means you reliably delivered what was agreed. A well-set charter usually averages
                0.7&ndash;0.8 on goal attainment &mdash; a row of perfect 1.0s usually means the
                goals were set too safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
