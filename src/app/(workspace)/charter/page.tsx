import { CalendarClock, Goal, Printer } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CharterApprovalStrip,
  charterStepForStatus,
} from "@/app/components/charter-approval-strip";
import { CharterChangeHistory } from "@/app/components/charter-change-history";
import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveCycleForRequest, getOwnParticipant } from "@/lib/data/cycle";
import { CHARTER_STATUS_LABELS } from "@/lib/data/performance-types";
import { getCharterHistory, getReviews } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function CharterPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  if (!cycle) {
    return (
      <>
        <PageHeader
          title="My goal charter"
          description="A maximum of 5 goals — each with a measurable key result, a baseline, a target and a named data source — plus 5 competencies, each carrying a one-line commitment."
        />
        <WorkflowEmpty
          icon={CalendarClock}
          title="No cycle is open yet"
          description="An administrator opens the cycle and enrols the roster. Your charter becomes available as soon as that happens."
        />
      </>
    );
  }

  const participant = await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId);
  if (!participant) {
    return (
      <>
        <PageHeader eyebrow={cycle.name} title="My goal charter" description="" />
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
      </>
    );
  }

  const [charterHistory, reviews] = await Promise.all([
    getCharterHistory(viewer.supabase, participant.id),
    getReviews(viewer.supabase, participant.id),
  ]);
  const charter = charterHistory[0] ?? null;
  const step = charterStepForStatus(charter?.status ?? null);

  return (
    <>
      <PageHeader
        eyebrow={cycle.name}
        title="My goal charter"
        description="A maximum of 5 goals — each with a measurable key result, a baseline, a target and a named data source — plus 5 competencies, each carrying a one-line commitment."
        action={
          <div className="flex flex-wrap gap-2">
            {charter ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/book/${participant.id}`} target="_blank" />}
              >
                <Printer />
                Print / PDF
              </Button>
            ) : null}
            <Button nativeButton={false} render={<Link href="/charter/edit" />}>
              <Goal />
              {charter ? "Edit charter" : "Create charter"}
            </Button>
          </div>
        }
      />
      <CharterApprovalStrip className="mb-6" currentStep={step} />

      {charter === null ? (
        <WorkflowEmpty
          icon={Goal}
          title="Your charter is ready to begin"
          description="Draft it, send it to your coach, and Leadership gives the final approval. Once approved it is locked for the cycle and becomes the single reference for what success means."
          actionLabel="Draft my charter"
          href="/charter/edit"
        />
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Goals</CardTitle>
              <Badge variant="outline">{CHARTER_STATUS_LABELS[charter.status]}</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Objective</TableHead>
                      <TableHead>Key result</TableHead>
                      <TableHead>Baseline</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Data source</TableHead>
                      {charter.status === "approved_locked"
                        ? cycle.quarters.map((quarter) => (
                            <TableHead key={quarter.id}>{quarter.name} actuals / score</TableHead>
                          ))
                        : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charter.goals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.outcome}</TableCell>
                        <TableCell>{goal.keyResult}</TableCell>
                        <TableCell>{goal.baseline}</TableCell>
                        <TableCell>{goal.target}</TableCell>
                        <TableCell className="text-muted-foreground">{goal.dataSource}</TableCell>
                        {charter.status === "approved_locked"
                          ? cycle.quarters.map((quarter) => {
                              const score = reviews
                                .find((review) => review.quarterId === quarter.id)
                                ?.goalScores.find((entry) => entry.charterGoalId === goal.id);
                              return (
                                <TableCell key={quarter.id} className="min-w-48 align-top">
                                  <p className="text-xs text-muted-foreground">
                                    {quarter.name} — what you actually achieved
                                  </p>
                                  <p>{score?.actualResult || "—"}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Coach score: {score?.attainment.toFixed(2) ?? "not scored yet"}
                                  </p>
                                </TableCell>
                              );
                            })
                          : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competency commitments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {charter.competencies.map((competency) => (
                <div key={competency.id} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{competency.name}</p>
                    <Badge variant="secondary" className="text-[0.65rem] uppercase">
                      {competency.selectionType}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {competency.commitment}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {charter.decisions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Review history</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {charter.decisions.map((decision) => (
                  <div key={decision.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-medium">
                      {decision.actorName} &middot; {decision.decision.replace(/_/g, " ")}
                    </p>
                    {decision.comment ? (
                      <p className="mt-1 leading-6 text-muted-foreground">{decision.comment}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <CharterChangeHistory history={charterHistory} />
        </div>
      )}
    </>
  );
}
