import { redirect } from "next/navigation";

import { PrintButton } from "@/app/book/print-button";
import { RecordBook } from "@/app/book/record-book";
import { getVisibleRecords } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

export const metadata = { title: "Record book" };

/**
 * Every record the caller may read, in one document — a coach's team book, or
 * the organisation-wide book for an administrator. The set comes from
 * row-level security, so the book never reaches further than the screen does.
 */
export default async function TeamBookPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const records = await getVisibleRecords(viewer.supabase);

  if (records.length === 0) {
    return (
      <>
        <PrintButton />
        <h1>Record book</h1>
        <p className="muted">
          No records are available yet. A cycle must be open and the roster enrolled before a book
          can be produced.
        </p>
      </>
    );
  }

  return (
    <>
      <PrintButton />
      {records.map((record) => (
        <RecordBook key={record.participant.id} record={record} />
      ))}
    </>
  );
}
