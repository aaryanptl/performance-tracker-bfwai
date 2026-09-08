"use client";

import { LibraryBig, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import {
  type CycleActionResult,
  openCycle,
  seedCompetencyLibrary,
} from "@/app/(workspace)/admin/cycles/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const IDLE: CycleActionResult = { error: null };

function Result({ state }: { state: CycleActionResult }) {
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  if (state.message) {
    return (
      <Alert>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}

/**
 * Loads the competency library into the workspace. Charters reference real
 * competency rows, so this has to have run once before anyone can commit to a
 * competency.
 */
export function SeedLibraryCard({ loaded }: { loaded: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async () => {
    const result = await seedCompetencyLibrary();
    if (!result.error) router.refresh();
    return result;
  }, IDLE);

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>Competency library</CardTitle>
          <CardDescription>
            {loaded > 0
              ? `${loaded} competencies are loaded. Running this again updates their wording and behaviour anchors from the library file.`
              : "The library has not been loaded yet. Charters cannot record competency commitments until it is."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Result state={state} />
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" disabled={pending}>
            <LibraryBig />
            {pending ? "Loading…" : loaded > 0 ? "Reload library" : "Load library"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

/** Opens a cycle and enrols every active person on the roster. */
function shift(iso: string, { days = 0, months = 0 }: { days?: number; months?: number }) {
  const base = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return "";
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, base.getUTCDate() + days),
  )
    .toISOString()
    .slice(0, 10);
}

export function OpenCycleCard() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (previous: CycleActionResult, formData: FormData) => {
      const result = await openCycle(previous, formData);
      if (!result.error) router.refresh();
      return result;
    },
    IDLE,
  );

  /*
   * All four dates are controlled. They used to be uncontrolled, which meant a
   * rejected submit re-rendered the form and silently emptied every field the
   * server had complained about. They are also derived from the start date,
   * because the other three are simply offsets from it — six months to the end,
   * and the goal window in the eleven days before it opens, which is what the
   * `goal_window_end <= start_date` constraint requires.
   */
  const [dates, setDates] = useState({
    start: "",
    end: "",
    goalOpen: "",
    goalClose: "",
  });

  const setStart = (start: string) =>
    setDates(
      start
        ? {
            start,
            end: shift(start, { months: 6, days: -1 }),
            goalOpen: shift(start, { days: -11 }),
            goalClose: shift(start, { days: -1 }),
          }
        : { start: "", end: "", goalOpen: "", goalClose: "" },
    );

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>Add the next cycle</CardTitle>
          <CardDescription>
            A cycle is six months: goal setting once at the front, monthly check-ins throughout,
            scoring at each quarter end, and the full review at the close. Adding one creates its
            two quarters and enrols every active person.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cycle-name">Name</Label>
            <Input id="cycle-name" name="name" placeholder="Cycle 1 · FY2026" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cycle-start">Starts</Label>
              <Input
                id="cycle-start"
                name="start_date"
                type="date"
                required
                value={dates.start}
                onChange={(event) => setStart(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cycle-end">Ends</Label>
              <Input
                id="cycle-end"
                name="end_date"
                type="date"
                required
                value={dates.end}
                onChange={(event) => setDates({ ...dates, end: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-open">Goal window opens</Label>
              <Input
                id="goal-open"
                name="goal_window_start"
                type="date"
                required
                value={dates.goalOpen}
                onChange={(event) => setDates({ ...dates, goalOpen: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-close">Goal window closes</Label>
              <Input
                id="goal-close"
                name="goal_window_end"
                type="date"
                required
                value={dates.goalClose}
                onChange={(event) => setDates({ ...dates, goalClose: event.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pick the start date and the rest fill in for you — six months to the close, with the
            goal window in the eleven days before it opens. The goal window must close on or before
            the cycle starts: goals are set before the cycle runs, not during it.
          </p>
          <Result state={state} />
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" disabled={pending}>
            <Play />
            {pending ? "Adding…" : "Add the next cycle"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
