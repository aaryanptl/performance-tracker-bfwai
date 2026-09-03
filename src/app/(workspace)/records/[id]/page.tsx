import { BookOpen, CalendarCheck2, Goal, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Button } from "@/components/ui/button";
import {
  CHARTER_STATUS_LABELS,
  halfYearScore,
  IMPACT_STATUS_LABELS,
} from "@/lib/data/performance-types";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

export default async function PersonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  // Scope is row-level security: a record outside it does not come back.
  const record = await getPersonRecord(viewer.supabase, participantId);
  if (!record) notFound();

  const { participant, charter, checkIns, impactStatements, reviews } = record;
  const recorded = checkIns.filter((checkIn) => checkIn.notes !== null).length;
  const shared = impactStatements.filter((statement) => statement.status !== "draft").length;
  const half = halfYearScore(reviews);
  const latestImpact = impactStatements.at(-1);

  return (
    <>
      <PageHeader
        eyebrow={`${participant.unitName} · Level ${participant.jobLevel}`}
        title={`${participant.personName}'s record`}
        description={`${participant.title}. Coach: ${participant.coachName ?? "Leadership"}.`}
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/book/${participant.id}`} target="_blank" />}
          >
            <BookOpen />
            Record book
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Charter"
          value={charter ? CHARTER_STATUS_LABELS[charter.status] : "Not started"}
          detail={charter ? `${charter.goals.length} goals` : "No charter drafted yet."}
          icon={Goal}
        />
        <MetricCard
          label="Check-ins"
          value={`${recorded} / 6`}
          detail={recorded === 0 ? "No monthly records yet." : "Recorded by the coach."}
          icon={CalendarCheck2}
        />
        <MetricCard
          label="Impact"
          value={`${shared} / ${Math.max(impactStatements.length, 2)}`}
          detail={
            latestImpact ? IMPACT_STATUS_LABELS[latestImpact.status] : "No quarterly evidence yet."
          }
          icon={Sparkles}
        />
        <MetricCard
          label="Score"
          value={half === null ? "Pending" : half.toFixed(2)}
          detail={half === null ? "No released review yet." : "Half-yearly average."}
          icon={Trophy}
        />
      </div>
    </>
  );
}
