import { redirect } from "next/navigation";

import { OpenCycleCard, SeedLibraryCard } from "@/app/components/cycle-setup";
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
import { APPROVER_LABEL, CHARTER_STEPS } from "@/data/performance";
import { getActiveCycle, getVisibleParticipants } from "@/lib/data/cycle";
import { getViewer } from "@/lib/data/viewer";

export default async function CyclesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];

  const { count } = await viewer.supabase
    .from("competencies")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  const settings = cycle
    ? ([
        ["Cycle starts", cycle.startDate],
        ["Cycle ends", cycle.endDate],
        ["Goal window opens", cycle.goalWindowStart],
        ["Goal window closes", cycle.goalWindowEnd],
        ["Quarters", String(cycle.quarters.length)],
        ["People enrolled", String(participants.length)],
        ["Maximum goals per person", String(cycle.maxGoals)],
        ["Weight — what was delivered", String(cycle.okrWeight)],
        ["Weight — how it was delivered", String(cycle.competencyWeight)],
      ] as const)
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Programme settings"
        title="Cycles & settings"
        description="A cycle is six months: goal setting once at the front, monthly check-ins throughout, scoring at each quarter end, and the full review at the close."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SeedLibraryCard loaded={count ?? 0} />
        {cycle ? null : <OpenCycleCard />}
      </div>

      {cycle ? (
        <>
          <Card className="mb-6">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>{cycle.name}</CardTitle>
                <CardDescription className="mt-1">
                  Review order is fixed: {CHARTER_STEPS.map((step) => step.title).join(" → ")}, with{" "}
                  {APPROVER_LABEL} giving the final approval.
                </CardDescription>
              </div>
              <Badge variant="outline">{cycle.status.replace(/_/g, " ")}</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    {settings.map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell className="text-muted-foreground">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quarters</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Starts</TableHead>
                      <TableHead>Ends</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycle.quarters.map((quarter) => (
                      <TableRow key={quarter.id}>
                        <TableCell className="font-medium">{quarter.name}</TableCell>
                        <TableCell className="text-muted-foreground">{quarter.startDate}</TableCell>
                        <TableCell className="text-muted-foreground">{quarter.endDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{quarter.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </>
  );
}
