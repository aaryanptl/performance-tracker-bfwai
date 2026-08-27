import { Goal } from "lucide-react";
import Link from "next/link";

import { CycleTimeline } from "@/app/components/cycle-timeline";
import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ACTIVE_CYCLE } from "@/data/performance";

const NEXT_ACTIONS = [
  {
    href: "/charter/edit",
    title: "Draft your Goal Charter",
    detail: `Up to ${ACTIVE_CYCLE.maxGoals} measurable goals and ${ACTIVE_CYCLE.maxGoals} competencies, before the cycle starts.`,
    actionLabel: "Open",
  },
] as const;

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow={ACTIVE_CYCLE.name}
        title="Make the next conversation count."
        description="Ascend keeps goals, monthly coaching, evidence, and scoring in one continuous record so review day never starts from memory."
        action={
          <Button nativeButton={false} render={<Link href="/charter/edit" />}>
            <Goal />
            Start my charter
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>What needs you next</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {NEXT_ACTIONS.map((action) => (
                <div key={action.href} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-sm font-semibold">{action.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.detail}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    nativeButton={false}
                    render={<Link href={action.href} />}
                  >
                    {action.actionLabel}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>Your charter</CardTitle>
                <Badge
                  variant="secondary"
                  className="uppercase tracking-[0.14em] text-[0.65rem] text-muted-foreground"
                >
                  Not started
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Empty className="border bg-muted/30 p-10">
                <EmptyHeader>
                  <EmptyTitle>No charter yet</EmptyTitle>
                  <EmptyDescription>
                    Draft up to {ACTIVE_CYCLE.maxGoals} goals and {ACTIVE_CYCLE.maxGoals}{" "}
                    competencies to begin the cycle.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button nativeButton={false} render={<Link href="/charter/edit" />}>
                    Start my charter
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6">
          <CycleTimeline />
          <Card className="bg-accent/40">
            <CardHeader>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Remember
              </p>
              <CardTitle className="text-base font-semibold">
                On a five-point scale, 3 is a good rating.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                It means you reliably delivered what was agreed. A well-set charter usually averages
                0.7&ndash;0.8 on goal attainment &mdash; a row of perfect 1.0s usually means the
                goals were set too safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
