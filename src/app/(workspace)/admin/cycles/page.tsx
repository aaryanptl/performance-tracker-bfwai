import { CalendarRange, LockKeyhole, Scale } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVE_CYCLE } from "@/data/performance";

export default function CyclesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Programme settings"
        title="Cycles"
        description="A clear operating rhythm for goals, monthly coaching, quarterly evidence, and score release."
      />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{ACTIVE_CYCLE.name}</CardTitle>
              <CardDescription>
                {ACTIVE_CYCLE.start} to {ACTIVE_CYCLE.end}
              </CardDescription>
            </div>
            <Badge>{ACTIVE_CYCLE.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CalendarRange,
              title: "Cadence",
              value: `${ACTIVE_CYCLE.checkins} monthly check-ins`,
              detail: "Two quarterly evidence and review points",
            },
            {
              icon: Scale,
              title: "Score weights",
              value: "60% · 40%",
              detail: "Goal outcomes · role competencies",
            },
            {
              icon: LockKeyhole,
              title: "Goal window",
              value: "21–31 August",
              detail: `Maximum ${ACTIVE_CYCLE.maxGoals} goals per charter`,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border p-5">
              <item.icon className="mb-5 size-5 text-primary" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.title}
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
