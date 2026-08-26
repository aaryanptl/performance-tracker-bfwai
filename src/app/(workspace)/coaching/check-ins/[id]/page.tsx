import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/page-header";
import { CheckInForm } from "@/app/components/performance-forms";
import { PersonScopeGate } from "@/app/components/role-gate";
import { getPerson } from "@/data/people";

export default async function CoachCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();
  return (
    <PersonScopeGate personId={person.id}>
      <PageHeader
        eyebrow="September 2026"
        title={`Check-in with ${person.name}`}
        description="Capture the conversation accurately and leave with a clear commitment on both sides."
      />
      <CheckInForm personName={person.name} />
    </PersonScopeGate>
  );
}
