import { CalendarCheck2, ClipboardCheck, Goal, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHARTER_STATUS_LABELS, halfYearScore } from "@/lib/data/performance-types";
import { getVisibleRecords } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";
import { formatDate } from "@/lib/utils";

const CHECK_INS_PER_PERSON = 6;

function percent(part: number, whole: number) {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

export default async function AdminDashboardPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const records = await getVisibleRecords(viewer.supabase);
  const cycle = records[0]?.cycle ?? null;

  const total = records.length;
  const drafted = records.filter((record) => record.charter !== null).length;
  const approved = records.filter((record) => record.charter?.status === "approved_locked").length;
  const coached = records.filter((record) => record.participant.coachId !== null).length;
  const checkInsRecorded = records.reduce(
    (sum, record) => sum + record.checkIns.filter((checkIn) => checkIn.notes !== null).length,
    0,
  );
  const withFirstCheckIn = records.filter((record) =>
    record.checkIns.some((checkIn) => checkIn.notes !== null),
  ).length;

  const releasedScores = records.flatMap((record) =>
    record.reviews.filter((review) => review.releasedAt !== null && review.quarterlyScore !== null),
  );
  const meanQuarterlyScore =
    releasedScores.length > 0
      ? releasedScores.reduce(
          (sum, review) => sum + (review.calibratedScore ?? review.quarterlyScore ?? 0),
          0,
        ) / releasedScores.length
      : null;

  // Coach load is derived from who is actually named on each enrolment.
  const coaches = new Map<
    number,
    { name: string; coachees: number; checkIns: number; charters: number; scores: number }
  >();
  for (const record of records) {
    const coachId = record.participant.coachId;
    if (coachId === null) continue;
    const entry = coaches.get(coachId) ?? {
      name: record.participant.coachName ?? "Unknown",
      coachees: 0,
      checkIns: 0,
      charters: 0,
      scores: 0,
    };
    entry.coachees += 1;
    entry.checkIns += record.checkIns.filter((checkIn) => checkIn.notes !== null).length;
    entry.charters += record.charter?.status === "approved_locked" ? 1 : 0;
    entry.scores += record.reviews.filter((review) => review.okrRating !== null).length;
    coaches.set(coachId, entry);
  }

  const distribution = [5, 4, 3, 2, 1].map((band) => ({
    band,
    count: releasedScores.filter(
      (review) => Math.round(review.calibratedScore ?? review.quarterlyScore ?? 0) === band,
    ).length,
  }));

  return (
    <>
      <PageHeader
        eyebrow={cycle?.name ?? "No cycle open"}
        title="Programme dashboard"
        action={
          <Button variant="outline" nativeButton={false} render={<Link href="/records" />}>
            Records &amp; downloads
          </Button>
        }
        description={
          cycle
            ? `${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)} · ${total} people, ${coaches.size} coaches. Whether the rhythm is actually being kept: completion, score distribution, and coach load.`
            : "No cycle is open yet. Open one from Cycles & settings to enrol the roster."
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Charters approved and locked"
          value={`${approved} / ${total}`}
          detail="Charters cannot be scored until they are approved."
          icon={Goal}
          badge={approved < total ? "Attention" : undefined}
        />
        <MetricCard
          label="Check-in completion"
          value={`${checkInsRecorded} / ${total * CHECK_INS_PER_PERSON}`}
          detail={`${CHECK_INS_PER_PERSON} per person across the cycle.`}
          icon={CalendarCheck2}
        />
        <MetricCard
          label="Scores released"
          value={String(releasedScores.length)}
          detail="Signed off and visible to the team member."
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Mean quarterly score"
          value={meanQuarterlyScore === null ? "—" : meanQuarterlyScore.toFixed(2)}
          detail="Across released quarterly scores."
          icon={Trophy}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness by stage</CardTitle>
            <CardDescription>Progress through the cycle&rsquo;s required workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Charters drafted", value: percent(drafted, total) },
              { label: "Coach approved", value: percent(approved, total) },
              { label: "First check-in complete", value: percent(withFirstCheckIn, total) },
              { label: "Coaching line assigned", value: percent(coached, total) },
            ].map((item) => (
              <Progress key={item.label} value={item.value}>
                <ProgressLabel>{item.label}</ProgressLabel>
                <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                  {item.value}%
                </span>
              </Progress>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score distribution</CardTitle>
            <CardDescription>
              Appears once scores are signed off and released for the quarter.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {releasedScores.length === 0 ? (
              <Alert>
                <ShieldCheck />
                <AlertTitle>Nothing released yet</AlertTitle>
                <AlertDescription>
                  Watch for central tendency — everyone landing on 3 — and for a coach whose ratings
                  sit consistently above or below the group. Both are calibration conversations, not
                  data problems.
                </AlertDescription>
              </Alert>
            ) : (
              distribution.map((entry) => (
                <Progress key={entry.band} value={percent(entry.count, releasedScores.length)}>
                  <ProgressLabel>Score {entry.band}</ProgressLabel>
                  <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                    {entry.count}
                  </span>
                </Progress>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coach load and completion</CardTitle>
          <CardDescription>
            Six to eight coachees is a workable load at 15 minutes a month each plus quarterly
            scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead className="text-right">Coachees</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                  <TableHead className="text-right">Charters signed</TableHead>
                  <TableHead className="text-right">Scores signed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coaches.size === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No coaching lines are assigned in this cycle yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...coaches.entries()].map(([coachId, entry]) => (
                    <TableRow key={coachId}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.coachees}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.checkIns} / {entry.coachees * CHECK_INS_PER_PERSON}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.charters} / {entry.coachees}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{entry.scores}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Everyone, at a glance</CardTitle>
            <CardDescription>
              The programme record for every person in this cycle, with the same scope used by the
              records and downloads pages.
            </CardDescription>
          </div>
          <Badge variant="outline">{cycle?.name ?? "No cycle"}</Badge>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Charter</TableHead>
                  <TableHead>Check-ins</TableHead>
                  {cycle?.quarters.map((quarter) => (
                    <TableHead key={quarter.id}>{quarter.name}</TableHead>
                  ))}
                  <TableHead>Half-yearly</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.participant.id}>
                    <TableCell>
                      <p className="font-medium">{record.participant.personName}</p>
                      <p className="text-xs text-muted-foreground">{record.participant.title}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.participant.unitName}
                    </TableCell>
                    <TableCell>{record.participant.coachName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.charter
                          ? CHARTER_STATUS_LABELS[record.charter.status]
                          : "Not started"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {record.checkIns.filter((checkIn) => checkIn.notes !== null).length} / 6
                    </TableCell>
                    {cycle?.quarters.map((quarter) => {
                      const review = record.reviews.find((entry) => entry.quarterId === quarter.id);
                      const score = review?.calibratedScore ?? review?.quarterlyScore;
                      return (
                        <TableCell key={quarter.id} className="font-medium tabular-nums">
                          {score?.toFixed(2) ?? "—"}
                        </TableCell>
                      );
                    })}
                    <TableCell className="font-medium tabular-nums">
                      {halfYearScore(record.reviews)?.toFixed(2) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/records/${record.participant.id}`} />}
                      >
                        Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
