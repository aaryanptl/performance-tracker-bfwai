import { CalendarPlus, ClipboardCheck, Goal, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { PersonScopeGate } from "@/app/components/role-gate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCoach, getPerson, initials } from "@/data/people";

export default async function CoacheePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();
  const coach = getCoach(person);
  return (
    <PersonScopeGate personId={person.id}>
      <PageHeader
        eyebrow={`${person.unit} · Level ${person.level}`}
        title={person.name}
        description={`${person.title}. Coached by ${coach?.name ?? "Leadership"}.`}
        action={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/coaching/check-ins/${person.id}`} />}
            >
              <CalendarPlus />
              New check-in
            </Button>
            <Button nativeButton={false} render={<Link href={`/coaching/reviews/${person.id}`} />}>
              <ClipboardCheck />
              Review
            </Button>
          </>
        }
      />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14">
            <AvatarFallback>{initials(person.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">{person.email}</p>
          </div>
          <Badge variant="outline">{person.employment}</Badge>
          <Badge className="capitalize">{person.role}</Badge>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Goal charter"
          value="Pending"
          detail="No charter submitted for review."
          icon={Goal}
        />
        <MetricCard
          label="Check-ins"
          value="0 / 6"
          detail="No monthly conversations recorded."
          icon={MessageSquareText}
        />
        <MetricCard
          label="Quarterly review"
          value="Not open"
          detail="Review becomes available at quarter close."
          icon={ClipboardCheck}
        />
      </div>
    </PersonScopeGate>
  );
}
