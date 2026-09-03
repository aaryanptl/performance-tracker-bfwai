import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { CheckInForm } from "@/app/components/performance-forms";
import { getActiveCycle, getParticipantById } from "@/lib/data/cycle";
import { getCheckIns } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

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

export default async function CoachCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  // Row-level security decides this: a participant outside the caller's
  // coaching scope simply does not come back.
  const participant = await getParticipantById(viewer.supabase, participantId);
  if (!participant) notFound();

  const cycle = await getActiveCycle(viewer.supabase);
  if (!cycle) notFound();

  const checkIns = await getCheckIns(viewer.supabase, participantId);

  return (
    <>
      <PageHeader
        eyebrow={cycle.name}
        title={`Check-in with ${participant.personName}`}
        description="Capture the conversation accurately and leave with a clear commitment on both sides."
      />
      <CheckInForm
        participantId={participantId}
        personName={participant.personName}
        months={monthsBetween(cycle.startDate, cycle.endDate)}
        checkIns={checkIns}
      />
    </>
  );
}
