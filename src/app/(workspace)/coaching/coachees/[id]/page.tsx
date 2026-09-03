import { BookOpen, CalendarPlus, ClipboardCheck, Goal, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/data/people";
import { CHARTER_STATUS_LABELS, halfYearScore } from "@/lib/data/performance-types";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

export default async function CoacheePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  // Scope is row-level security: a coachee outside it does not come back.
  const record = await getPersonRecord(viewer.supabase, participantId);
  if (!record) notFound();

  const { participant, charter, checkIns, reviews } = record;
  const recorded = checkIns.filter((checkIn) => checkIn.notes !== null).length;
  const half = halfYearScore(reviews);

  return (
    <>
      <PageHeader
        eyebrow={`${participant.unitName} · Level ${participant.jobLevel}`}
        title={participant.personName}
        description={`${participant.title}. Coached by ${participant.coachName ?? "Leadership"}.`}
        action={
          <>
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
              New check-in
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/coaching/reviews/${participant.id}`} />}
            >
              <ClipboardCheck />
              Review
            </Button>
          </>
        }
      />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14">
            <AvatarFallback>{initials(participant.personName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold">{participant.personName}</p>
            <p className="text-sm text-muted-foreground">{participant.personEmail}</p>
          </div>
          <Badge variant="outline">L{participant.jobLevel}</Badge>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Goal charter"
          value={charter ? CHARTER_STATUS_LABELS[charter.status] : "Not started"}
          detail={
            charter ? `${charter.goals.length} goals on the charter.` : "No charter drafted yet."
          }
          icon={Goal}
        />
        <MetricCard
          label="Check-ins"
          value={`${recorded} / 6`}
          detail={
            recorded === 0 ? "No monthly conversations recorded." : "Recorded across the cycle."
          }
          icon={MessageSquareText}
        />
        <MetricCard
          label="Half-yearly score"
          value={half === null ? "Pending" : half.toFixed(2)}
          detail={half === null ? "No review released yet." : "Average of released quarters."}
          icon={ClipboardCheck}
        />
      </div>
    </>
  );
}
