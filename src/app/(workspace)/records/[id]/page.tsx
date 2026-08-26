import { CalendarCheck2, Goal, Sparkles, Trophy } from "lucide-react";
import { notFound } from "next/navigation";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { PersonScopeGate } from "@/app/components/role-gate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCoach, getPerson } from "@/data/people";

export default async function PersonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();
  const coach = getCoach(person);
  return (
    <PersonScopeGate personId={person.id}>
      <PageHeader
        eyebrow={`${person.unit} · Level ${person.level}`}
        title={`${person.name}'s record`}
        description={`${person.title}. Coach: ${coach?.name ?? "Leadership"}.`}
      />
      <Alert className="mb-6">
        <Goal />
        <AlertTitle>Record created, cycle activity pending</AlertTitle>
        <AlertDescription>
          The roster profile is complete. Charter, check-in, impact, and score sections will
          populate as the cycle progresses.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Charter" value="Pending" detail="No approved goals yet." icon={Goal} />
        <MetricCard
          label="Check-ins"
          value="0 / 6"
          detail="No monthly records yet."
          icon={CalendarCheck2}
        />
        <MetricCard
          label="Impact"
          value="0 / 2"
          detail="No quarterly evidence yet."
          icon={Sparkles}
        />
        <MetricCard label="Score" value="Pending" detail="No released review yet." icon={Trophy} />
      </div>
    </PersonScopeGate>
  );
}
