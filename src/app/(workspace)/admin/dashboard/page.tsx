import { BriefcaseBusiness, CalendarCheck2, Goal, ShieldCheck } from "lucide-react";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { PEOPLE } from "@/data/people";

export default function AdminDashboardPage() {
  const coaches = PEOPLE.filter((person) => person.role === "coach").length;
  const members = PEOPLE.filter((person) => person.role === "member").length;
  return (
    <>
      <PageHeader
        eyebrow="Cycle 1 · FY2026"
        title="Programme dashboard"
        description="A single view of readiness, coaching coverage, and the work that needs intervention before deadlines slip."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="People in programme"
          value={String(coaches + members)}
          detail={`${coaches} coaches · ${members} team members`}
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Charters approved"
          value="0%"
          detail="No charters submitted in this cycle."
          icon={Goal}
          badge="Attention"
        />
        <MetricCard
          label="Check-in completion"
          value="0%"
          detail="The first monthly window has not opened."
          icon={CalendarCheck2}
        />
        <MetricCard
          label="Coaching coverage"
          value="100%"
          detail="Every scored person has a named coach."
          icon={ShieldCheck}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness by stage</CardTitle>
            <CardDescription>Progress through the cycle's required workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Charters drafted", value: 0 },
              { label: "Coach approved", value: 0 },
              { label: "First check-in complete", value: 0 },
              { label: "Coaching line assigned", value: 100 },
            ].map((item) => (
              <Progress key={item.label} value={item.value}>
                <ProgressLabel>{item.label}</ProgressLabel>
                <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                  {item.value}%
                </span>
              </Progress>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Programme notes</CardTitle>
            <CardDescription>
              What leadership should know before the next checkpoint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheck />
              <AlertTitle>Roster is ready</AlertTitle>
              <AlertDescription>
                All 15 scored people have a unit, level, employment type, leader, and coach. The
                next risk is charter quality and completion, not data coverage.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
