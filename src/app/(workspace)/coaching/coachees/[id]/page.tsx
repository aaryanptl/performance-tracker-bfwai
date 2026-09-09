import { BookOpen, CalendarPlus, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CsvDownloadButton } from "@/app/components/csv-download-button";
import { PageHeader } from "@/app/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/data/people";
import { buildExports } from "@/lib/data/exports";
import {
  CHARTER_STATUS_LABELS,
  CHECK_IN_STATUS_LABELS,
  halfYearScore,
  IMPACT_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/data/performance-types";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";
import { formatDate } from "@/lib/utils";

function ReviewBadge({
  review,
}: {
  review:
    | {
        status: keyof typeof REVIEW_STATUS_LABELS;
        quarterlyScore: number | null;
        calibratedScore: number | null;
      }
    | undefined;
}) {
  if (!review) return <Badge variant="outline">Not scored</Badge>;
  if (
    review.status === "released" &&
    (review.calibratedScore !== null || review.quarterlyScore !== null)
  ) {
    return <Badge>{(review.calibratedScore ?? review.quarterlyScore)?.toFixed(2)}</Badge>;
  }
  return <Badge variant="outline">{REVIEW_STATUS_LABELS[review.status]}</Badge>;
}

export default async function CoacheePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  // The record and every child collection are scoped by Supabase RLS.
  const record = await getPersonRecord(viewer.supabase, participantId);
  if (!record) notFound();

  const { participant, cycle, charter, checkIns, impactStatements, reviews, developmentActions } =
    record;
  const recorded = checkIns.filter((checkIn) => checkIn.notes !== null).length;
  const half = halfYearScore(reviews);
  const userExports = buildExports([record]);

  return (
    <>
      <PageHeader
        eyebrow={`${cycle.name} · ${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`}
        title="Coachee record"
        description="The complete cycle record: charter, monthly conversations, impact statements, scoring, and development follow-through."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CsvDownloadButton
              files={[
                { filename: "ascend-user-people.csv", content: userExports.people },
                { filename: "ascend-user-charters.csv", content: userExports.charters },
                { filename: "ascend-user-check-ins.csv", content: userExports.checkIns },
                { filename: "ascend-user-impact.csv", content: userExports.impact },
                { filename: "ascend-user-scores.csv", content: userExports.scores },
                { filename: "ascend-user-transcript.csv", content: userExports.transcript },
                {
                  filename: "ascend-user-development-actions.csv",
                  content: userExports.developmentActions,
                },
              ]}
              label="Download user CSVs"
            />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/book/${participant.id}`} target="_blank" />}
            >
              <BookOpen />
              Record book
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/coaching/check-ins/${participant.id}`} />}
            >
              <CalendarPlus />
              Record a check-in
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/coaching/reviews/${participant.id}`} />}
            >
              <ClipboardCheck />
              Quarterly scoring
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="size-14">
          <AvatarFallback>{initials(participant.personName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-semibold">{participant.personName}</h2>
          <p className="text-sm text-muted-foreground">
            {participant.title} · {participant.unitName} · coached by{" "}
            {participant.coachName ?? "Leadership"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{participant.personEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">L{participant.jobLevel}</Badge>
          <Badge variant="outline">
            Half-year score {half === null ? "pending" : half.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Goal Charter</CardTitle>
            <Badge variant="outline">
              {charter ? CHARTER_STATUS_LABELS[charter.status] : "Not started"}
            </Badge>
          </CardHeader>
          <CardContent>
            {charter ? (
              <div className="grid gap-5">
                {charter.cycleIntent || charter.context ? (
                  <div className="grid gap-3 rounded-xl bg-muted/30 p-4 text-sm">
                    {charter.cycleIntent ? (
                      <p>
                        <span className="font-medium">Cycle intent:</span> {charter.cycleIntent}
                      </p>
                    ) : null}
                    {charter.context ? (
                      <p>
                        <span className="font-medium">Context:</span> {charter.context}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                      <tr>
                        <th className="p-3 font-medium">Key result</th>
                        <th className="p-3 font-medium">Target</th>
                        <th className="p-3 font-medium">Data source</th>
                        {cycle.quarters.map((quarter) => (
                          <th key={quarter.id} className="p-3 text-right font-medium">
                            {quarter.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {charter.goals.map((goal) => (
                        <tr key={goal.id}>
                          <td className="p-3 align-top">
                            <p className="font-medium">{goal.keyResult}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{goal.outcome}</p>
                          </td>
                          <td className="p-3 align-top text-muted-foreground">
                            {goal.target || "—"}
                          </td>
                          <td className="p-3 align-top text-xs text-muted-foreground">
                            {goal.dataSource || "—"}
                          </td>
                          {cycle.quarters.map((quarter) => {
                            const score = reviews
                              .find((review) => review.quarterId === quarter.id)
                              ?.goalScores.find(
                                (entry) => entry.charterGoalId === goal.id,
                              )?.attainment;
                            return (
                              <td key={quarter.id} className="p-3 text-right font-medium">
                                {score === undefined ? "—" : score.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {charter.competencies.length ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Competency commitments
                    </p>
                    <div className="divide-y rounded-xl border">
                      {charter.competencies.map((competency) => (
                        <div key={competency.id} className="p-3 text-sm">
                          <p className="font-medium">{competency.name}</p>
                          <p className="mt-1 text-muted-foreground">
                            {competency.commitment || "No commitment written."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No charter drafted yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Check-ins</CardTitle>
              <Badge variant="outline">{recorded} of 6</Badge>
            </CardHeader>
            <CardContent>
              {checkIns.length ? (
                <div className="divide-y rounded-xl border">
                  {checkIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Check-in {checkIn.checkInNumber} · {formatDate(checkIn.monthStart)}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {checkIn.notes?.wayForward ?? "No way forward recorded yet."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/coaching/check-ins/${participant.id}?month=${checkIn.monthStart}`}
                          />
                        }
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  No check-ins recorded. A skipped check-in tells the coachee their development is
                  optional.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact statements &amp; scores</CardTitle>
            </CardHeader>
            <CardContent className="divide-y rounded-xl border p-0">
              {cycle.quarters.map((quarter) => {
                const statement = impactStatements.find((entry) => entry.quarterId === quarter.id);
                const review = reviews.find((entry) => entry.quarterId === quarter.id);
                return (
                  <div key={quarter.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{quarter.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {statement?.submittedAt
                          ? `Impact statement shared ${formatDate(statement.submittedAt)}`
                          : "Impact statement not shared yet"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ReviewBadge review={review} />
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/coaching/reviews/${participant.id}`} />}
                      >
                        {review ? "Open" : "Start scoring"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check-in record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {checkIns.length ? (
              checkIns.map((checkIn) => (
                <div key={checkIn.id} className="rounded-xl border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      Check-in {checkIn.checkInNumber} · {formatDate(checkIn.monthStart)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{CHECK_IN_STATUS_LABELS[checkIn.status]}</Badge>
                      <Badge variant={checkIn.notes ? "secondary" : "outline"}>
                        Coach {checkIn.notes ? "signed" : "pending"}
                      </Badge>
                      <Badge variant={checkIn.acknowledgedByParticipant ? "secondary" : "outline"}>
                        Member {checkIn.acknowledgedByParticipant ? "signed" : "pending"}
                      </Badge>
                    </div>
                  </div>
                  {checkIn.notes ? (
                    <div className="mt-3 grid gap-2 text-muted-foreground">
                      {checkIn.notes.openContext ? (
                        <p>
                          <span className="font-medium text-foreground">Open:</span>{" "}
                          {checkIn.notes.openContext}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-foreground">Goals:</span>{" "}
                        {checkIn.notes.progressSummary}
                      </p>
                      {checkIn.notes.blockers ? (
                        <p>
                          <span className="font-medium text-foreground">Blockers:</span>{" "}
                          {checkIn.notes.blockers}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-foreground">Way forward:</span>{" "}
                        {checkIn.notes.wayForward}
                      </p>
                    </div>
                  ) : null}
                  {checkIn.transcript.length ? (
                    <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Transcript</p>
                      {checkIn.transcript.map((entry) => (
                        <p key={entry.id} className="mt-1 whitespace-pre-wrap">
                          {entry.authorName}: {entry.body}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No check-ins have been recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements and impact statements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {impactStatements.length ? (
              impactStatements.map((statement) => (
                <div key={statement.id} className="rounded-xl border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{statement.quarterName ?? "Half-year"}</p>
                    <Badge variant="outline">{IMPACT_STATUS_LABELS[statement.status]}</Badge>
                  </div>
                  {statement.items.map((item) => (
                    <div key={item.id} className="mt-3 grid gap-1">
                      <p>
                        <span className="font-medium">
                          Impact created — results against my goals:
                        </span>{" "}
                        {item.impactCreated}
                      </p>
                      {item.competencyDemonstrated ? (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Competency commitments I lived — and how:
                          </span>{" "}
                          {item.competencyDemonstrated}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No impact statement has been shared.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scores and calibration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-xl border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{review.quarterName}</p>
                    <Badge variant="outline">{REVIEW_STATUS_LABELS[review.status]}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Attainment</p>
                      <p className="font-medium">
                        {review.goalAttainmentAverage?.toFixed(2) ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score 1</p>
                      <p className="font-medium">{review.okrRating ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score 2</p>
                      <p className="font-medium">{review.competencyRating ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final score</p>
                      <p className="font-medium">
                        {review.calibratedScore?.toFixed(2) ??
                          review.quarterlyScore?.toFixed(2) ??
                          "—"}
                      </p>
                    </div>
                  </div>
                  {review.goalScores.length ? (
                    <div className="mt-4 grid gap-2 border-t pt-3">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Goal evidence
                      </p>
                      {review.goalScores.map((score) => (
                        <div key={score.id} className="rounded-lg bg-muted/30 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium">{score.goalOutcome}</p>
                            <Badge variant="outline">{score.attainment.toFixed(2)}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Actual result:</span>{" "}
                            {score.actualResult}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Evidence:</span>{" "}
                            {score.evidenceNote}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {review.coachVerifiedImpact ? (
                    <p className="mt-3 text-muted-foreground">
                      <span className="font-medium text-foreground">Coach statement:</span>{" "}
                      {review.coachVerifiedImpact}
                    </p>
                  ) : null}
                  {review.developmentNeeds ? (
                    <p className="mt-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Development needs:</span>{" "}
                      {review.developmentNeeds}
                    </p>
                  ) : null}
                  {review.recommendation ? (
                    <p className="mt-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Recommendation:</span>{" "}
                      {review.recommendation.replace(/_/g, " ")}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
                    {(["coach", "founder", "participant"] as const).map((capacity) => {
                      const signature = review.acknowledgments.find(
                        (entry) => entry.capacity === capacity,
                      );
                      const label =
                        capacity === "founder"
                          ? "Leadership"
                          : capacity === "participant"
                            ? "Member"
                            : "Coach";
                      return (
                        <p key={capacity}>
                          <span className="font-medium text-foreground">{label}:</span>{" "}
                          {signature?.actorName ??
                            (capacity === "participant" && review.status === "released"
                              ? "Awaiting acknowledgement"
                              : "Pending")}
                        </p>
                      );
                    })}
                  </div>
                  {review.calibrationEvents.length ? (
                    <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      {review.calibrationEvents.map((event) => (
                        <p key={event.id}>
                          {event.actorName} calibrated to{" "}
                          {event.newCalibratedScore?.toFixed(2) ?? "calculated score"}:{" "}
                          {event.rationale}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {review.transcript.length ? (
                    <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Scoring transcript</p>
                      {review.transcript.map((entry) => (
                        <p key={entry.id} className="mt-1 whitespace-pre-wrap">
                          {entry.authorName}: {entry.body}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No score has been recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {developmentActions.length ? (
              developmentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{action.actionText}</p>
                    <p className="mt-1 text-muted-foreground">
                      {action.supportType ?? "Support not specified"}
                      {action.dueDate ? ` · due ${formatDate(action.dueDate)}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{action.status.replace(/_/g, " ")}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No development actions recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
