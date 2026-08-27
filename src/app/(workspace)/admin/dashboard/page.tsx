import { BriefcaseBusiness, CalendarCheck2, Goal, ShieldCheck } from "lucide-react";

import { MetricCard } from "@/app/components/metric-card";
import { PageHeader } from "@/app/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCoachees, PEOPLE } from "@/data/people";
import { ACTIVE_CYCLE } from "@/data/performance";

export default function AdminDashboardPage() {
  const coaches = PEOPLE.filter((person) => person.role === "coach" || person.role === "admin");
  const scored = PEOPLE.filter((person) => person.role !== "admin");

  return (
    <>
      <PageHeader
        eyebrow={ACTIVE_CYCLE.name}
        title="Programme dashboard"
        description={`${ACTIVE_CYCLE.start} – ${ACTIVE_CYCLE.end} · ${PEOPLE.length} people, ${coaches.length} coaches. Whether the rhythm is actually being kept: completion, score distribution, and coach load.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="People in programme"
          value={String(PEOPLE.length)}
          detail={`${coaches.length} coaches · ${scored.length} scored people`}
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Charters approved and locked"
          value={`0 / ${scored.length}`}
          detail="Charters cannot be scored until they are approved."
          icon={Goal}
          badge="Attention"
        />
        <MetricCard
          label="Check-in completion"
          value={`0 / ${scored.length * ACTIVE_CYCLE.checkins}`}
          detail={`${ACTIVE_CYCLE.checkins} per person across the cycle.`}
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
            <CardTitle>Score distribution</CardTitle>
            <CardDescription>
              Appears once scores are signed off and released for the quarter.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Alert>
              <ShieldCheck />
              <AlertTitle>Nothing released yet</AlertTitle>
              <AlertDescription>
                Watch for central tendency — everyone landing on 3 — and for a coach whose ratings
                sit consistently above or below the group. Both are calibration conversations, not
                data problems.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coach load and completion</CardTitle>
          <CardDescription>
            Six to eight coachees is a workable load at 15 minutes a month each plus quarterly
            scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead className="text-right">Coachees</TableHead>
                <TableHead className="text-right">Check-ins</TableHead>
                <TableHead className="text-right">Charters signed</TableHead>
                <TableHead className="text-right">Scores signed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => {
                const coachees = getCoachees(coach.id).length;
                return (
                  <TableRow key={coach.id}>
                    <TableCell>
                      {coach.name}
                      {coach.role === "admin" ? (
                        <span className="ml-2 text-xs text-muted-foreground">admin</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{coachees}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      0 / {coachees * ACTIVE_CYCLE.checkins}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">0 / {coachees}</TableCell>
                    <TableCell className="text-right tabular-nums">0</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
