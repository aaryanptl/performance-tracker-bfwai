import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVE_CYCLE, APPROVER_LABEL, CHARTER_STEPS } from "@/data/performance";

const QUARTERS = [
  { label: "Q1 · Sep–Nov 2026", scoreBy: "30 Nov 2026", review: false },
  { label: "Q2 · Dec–Feb 2027", scoreBy: "28 Feb 2027", review: true },
];

const SETTINGS = [
  ["Cycle starts", ACTIVE_CYCLE.start],
  ["Cycle ends", ACTIVE_CYCLE.end],
  ["Goal window opens", ACTIVE_CYCLE.goalWindow.from],
  ["Goal window closes", ACTIVE_CYCLE.goalWindow.to],
  ["Check-ins in the cycle", String(ACTIVE_CYCLE.checkins)],
  ["Maximum goals per person", String(ACTIVE_CYCLE.maxGoals)],
  ["Weight — what was delivered", String(ACTIVE_CYCLE.weights.okr)],
  ["Weight — how it was delivered", String(ACTIVE_CYCLE.weights.competency)],
] as const;

export default function CyclesPage() {
  const weightTotal = ACTIVE_CYCLE.weights.okr + ACTIVE_CYCLE.weights.competency;

  return (
    <>
      <PageHeader
        eyebrow="Programme settings"
        title="Cycles & settings"
        description="A cycle is six months: goal setting once at the front, monthly check-ins throughout, scoring at each quarter end, and the full review at the close."
      />
      <Card className="mb-6">
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
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SETTINGS.map(([label, value]) => (
            <div key={label} className="rounded-xl border p-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-heading text-base font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      {Math.abs(weightTotal - 1) > 0.001 ? (
        <Card className="mb-6 bg-destructive/10">
          <CardContent className="text-sm leading-6">
            <strong>The two weights add up to {weightTotal.toFixed(2)}, not 1.00.</strong> Quarterly
            scores will not sit on the 1–5 scale until they do.
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quarters</CardTitle>
            <CardDescription>
              One is a scoring checkpoint; the other also carries the full review and feedback
              session.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Score by</TableHead>
                  <TableHead>Full review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {QUARTERS.map((quarter) => (
                  <TableRow key={quarter.label}>
                    <TableCell className="font-medium">{quarter.label}</TableCell>
                    <TableCell>{quarter.scoreBy}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {quarter.review ? "Yes — review and feedback session" : "No — scoring only"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approval path</CardTitle>
            <CardDescription>
              Fixed order. {APPROVER_LABEL} gives the last signature, and the charter locks for the
              cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {CHARTER_STEPS.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
