import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { CheckInForm } from "@/app/components/performance-forms";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/data/people";
import { CHARTER_STATUS_LABELS, CHECK_IN_STATUS_LABELS } from "@/lib/data/performance-types";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";
import { formatDate } from "@/lib/utils";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** The first of each month the cycle spans, as select options. */
function monthsBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const months: { value: string; label: string }[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end && months.length < 12) {
    months.push({
      value: cursor.toISOString().slice(0, 10),
      label: MONTH_FORMAT.format(cursor),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export default async function CoachCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ month?: string | string[] }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  const record = await getPersonRecord(viewer.supabase, participantId);
  if (!record) notFound();

  const { participant, cycle, charter, checkIns } = record;
  const months = monthsBetween(cycle.startDate, cycle.endDate);
  const requestedMonth = (await searchParams)?.month;
  const initialMonth = Array.isArray(requestedMonth) ? requestedMonth[0] : requestedMonth;

  return (
    <>
      <PageHeader
        eyebrow={`Check-in · ${cycle.name}`}
        title={`${participant.personName} with ${participant.coachName ?? "Leadership"}`}
        description="A 15-minute conversation about what moved, what is in the way, what was recognised, and what happens next. No rating is given in a check-in."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/coaching/coachees/${participant.id}`} />}
            >
              <ArrowLeft />
              Back to record
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/book/${participant.id}`} target="_blank" />}
            >
              <BookOpen />
              Print / PDF
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="size-12">
          <AvatarFallback>{initials(participant.personName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold">{participant.personName}</h2>
          <p className="text-sm text-muted-foreground">
            {participant.title} · {participant.unitName} · {participant.personEmail}
          </p>
        </div>
        <Badge variant="outline">Cycle: {cycle.name}</Badge>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <CheckInForm
          participantId={participantId}
          personName={participant.personName}
          months={months}
          checkIns={checkIns}
          initialMonth={initialMonth}
        />

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Check-in history</CardTitle>
              <Badge variant="outline">{checkIns.length} of 6</Badge>
            </CardHeader>
            <CardContent>
              {checkIns.length ? (
                <div className="divide-y rounded-xl border">
                  {checkIns.map((checkIn) => (
                    <Link
                      key={checkIn.id}
                      href={`/coaching/check-ins/${participant.id}?month=${checkIn.monthStart}`}
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Check-in {checkIn.checkInNumber} · {formatDate(checkIn.monthStart)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {checkIn.notes?.progressSummary ?? "No conversation notes yet."}
                        </p>
                      </div>
                      <Badge variant="outline">{CHECK_IN_STATUS_LABELS[checkIn.status]}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  No check-ins recorded yet. Start with the month selected in the form.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Goal Charter — for the walk-through</CardTitle>
              <Badge variant="outline">
                {charter ? CHARTER_STATUS_LABELS[charter.status] : "Not started"}
              </Badge>
            </CardHeader>
            <CardContent>
              {charter?.goals.length ? (
                <div className="divide-y rounded-xl border">
                  {charter.goals.map((goal) => (
                    <div key={goal.id} className="p-3 text-sm">
                      <p className="font-medium">{goal.keyResult}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {goal.baseline || "No baseline"} → {goal.target || "No target"} ·{" "}
                        {goal.dataSource || "No data source"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  No approved goals are available for this conversation yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation guide</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                Bring the charter and the latest numbers. Use the record to name a concrete
                commitment, owner, and next step before the next monthly conversation.
              </p>
              <p>
                Blockers and transcript entries stay attached to this check-in so they are available
                during quarterly scoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
