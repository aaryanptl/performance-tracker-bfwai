import { notFound, redirect } from "next/navigation";

import { PrintButton } from "@/app/book/print-button";
import { RecordBook } from "@/app/book/record-book";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

export const metadata = { title: "Performance record" };

/**
 * One person's record book.
 *
 * Scope is the same rule as every record page: `getPersonRecord` reads through
 * row-level security, so a participant outside the caller's scope produces a
 * 404 here rather than a partial document.
 */
export default async function PersonBookPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  const record = await getPersonRecord(viewer.supabase, participantId);
  if (!record) notFound();

  return (
    <>
      <PrintButton />
      <RecordBook record={record} />
    </>
  );
}
