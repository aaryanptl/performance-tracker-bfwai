import CoacheePage from "@/app/(workspace)/coaching/coachees/[id]/page";

/**
 * Keep the individual Records entry point identical to the complete coachee
 * record. This prevents the exports table from opening a reduced, separate
 * view that silently omits check-in detail, impact evidence, transcripts and
 * calibration history.
 */
export default function PersonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  return <CoacheePage params={params} />;
}
