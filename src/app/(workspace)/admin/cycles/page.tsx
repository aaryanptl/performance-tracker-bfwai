import Link from "next/link";
import { redirect } from "next/navigation";

import { CycleManager } from "@/app/components/cycle-manager";
import { OpenCycleCard, SeedLibraryCard } from "@/app/components/cycle-setup";
import { PageHeader } from "@/app/components/page-header";
import { ResetPersonDataCard } from "@/app/components/reset-person-data-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCycles, getVisibleParticipants } from "@/lib/data/cycle";
import { getViewer } from "@/lib/data/viewer";

export default async function CyclesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycles = await getCycles(viewer.supabase);
  const current =
    cycles.find((cycle) => cycle.status === "active") ??
    cycles.find((cycle) => cycle.status !== "closed") ??
    cycles[0] ??
    null;
  const resetCycle = current?.status === "closed" ? null : current;
  const resetPeople = resetCycle
    ? await getVisibleParticipants(viewer.supabase, resetCycle.id)
    : [];
  const { count } = await viewer.supabase
    .from("competencies")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  return (
    <>
      <PageHeader
        eyebrow="Programme settings"
        title="Cycles & settings"
        description="A cycle is six months: goal setting once at the front, monthly check-ins throughout, scoring at each quarter end, and the full review at the close."
        action={
          <Button nativeButton={false} render={<Link href="#add-cycle" />}>
            Add the next cycle
          </Button>
        }
      />

      <div className="mb-8" id="add-cycle">
        <OpenCycleCard />
      </div>

      <div className="grid gap-6">
        <div>
          <h2 className="font-heading text-xl font-semibold">Cycles</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Update each cycle below. Make one current when the programme moves forward; keep a cycle
            closed when its records need to remain available.
          </p>
        </div>
        {cycles.map((cycle) => (
          <CycleManager key={cycle.id} cycle={cycle} current={cycle.id === current?.id} />
        ))}
        {cycles.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              No cycles yet. Add the first cycle above.
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="mt-8">
        <ResetPersonDataCard cycle={resetCycle} people={resetPeople} />
      </div>

      <div className="mt-8">
        <SeedLibraryCard loaded={count ?? 0} />
      </div>
    </>
  );
}
