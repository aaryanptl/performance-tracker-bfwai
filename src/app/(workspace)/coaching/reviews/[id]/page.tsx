import { notFound } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { ReviewForm } from "@/app/components/performance-forms";
import { PersonScopeGate } from "@/app/components/role-gate";
import { getPerson } from "@/data/people";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();
  return (
    <PersonScopeGate personId={person.id}>
      <PageHeader
        eyebrow="Q1 review"
        title={`Review ${person.name}`}
        description="Rate the work against agreed outcomes and the behaviours expected at the person's level."
      />
      <ReviewForm personName={person.name} />
    </PersonScopeGate>
  );
}
