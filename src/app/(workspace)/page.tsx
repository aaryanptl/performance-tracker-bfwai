import { CalendarDays, CircleGauge, Goal, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ACTIVE_CYCLE } from "@/data/performance";

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Goal charter"
          value="Not started"
          detail="Draft up to five measurable outcomes."
          icon={Goal}
          badge="Action needed"
        />
        <MetricCard
          label="Monthly check-ins"
          value="0 / 6"
          detail="No conversations recorded in this cycle."
          icon={MessageSquareText}
        />
        <MetricCard
          label="Impact statements"
          value="0 / 2"
          detail="Capture evidence at the end of each quarter."
          icon={Sparkles}
        />
        <MetricCard
          label="Current score"
          value="Pending"
          detail="Released after the quarterly review."
          icon={CircleGauge}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Cycle progress</CardTitle>
                <CardDescription>
                  {ACTIVE_CYCLE.start} to {ACTIVE_CYCLE.end}
                </CardDescription>
              </div>
              <Badge>{ACTIVE_CYCLE.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={12}>
              <ProgressLabel>Time elapsed</ProgressLabel>
              <span className="ml-auto text-sm tabular-nums text-muted-foreground">12%</span>
            </Progress>
            <Separator />
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { label: "Goal window", value: "21–31 Aug", detail: "Draft and agree outcomes" },
                { label: "Q1 review", value: "30 Nov", detail: "Evidence and score" },
                { label: "Cycle closes", value: "28 Feb", detail: "Final review and record" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-heading text-lg font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <CardDescription>Complete these in order to keep the cycle moving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                href: "/charter/edit",
                title: "Draft your goal charter",
                detail: "Turn priorities into measurable outcomes.",
              },
              {
                href: "/library",
                title: "Review role expectations",
                detail: "Choose evidence that matches your level.",
              },
              {
                href: "/docs",
                title: "Understand the cycle",
                detail: "See who owns each decision and when.",
              },
            ].map((item, index) => (
              <Button
                key={item.href}
                variant="outline"
                className="h-auto w-full justify-start rounded-xl p-4 text-left"
                nativeButton={false}
                render={<Link href={item.href} />}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <Alert className="mt-6">
        <CalendarDays />
        <AlertTitle>Nothing is overdue</AlertTitle>
        <AlertDescription>
          Your first deadline is the goal-charter window. Start early so the coach review can focus
          on quality rather than formatting.
        </AlertDescription>
      </Alert>
    </>
  );
}
