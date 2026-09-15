"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  type CycleActionResult,
  resetPersonCurrentCycleData,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CycleSummary, ParticipantSummary } from "@/lib/data/performance-types";

const IDLE: CycleActionResult = { error: null };

export function ResetPersonDataCard({
  cycle,
  people,
}: {
  cycle: CycleSummary | null;
  people: ParticipantSummary[];
}) {
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [state, setState] = useState<CycleActionResult>(IDLE);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    const personId = Number(selectedPersonId);
    const person = people.find((item) => item.personId === personId);
    if (!person || !cycle) return;

    const confirmed = window.confirm(
      `Reset all current-cycle performance data for ${person.personName}? This permanently removes their goals, competencies, charter revisions, reviews, check-ins, scores, and related workflow history. Their account and roster profile will remain.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await resetPersonCurrentCycleData(cycle.id, person.personId);
      setState(result);
      if (!result.error) {
        setSelectedPersonId("");
        router.refresh();
      }
    });
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          Reset a person&apos;s current-cycle data
        </CardTitle>
        <CardDescription>
          Use this for test data only. It removes the selected person&apos;s goals, competency
          selections, charter history, reviews, check-ins, impact entries, scores, and related
          workflow history. Their account, cycle enrollment, roster profile, coach assignment, and
          shared competency library are preserved.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {cycle ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="reset-person">Person to reset</Label>
              <Select
                disabled={pending || people.length === 0}
                onValueChange={(value) => {
                  if (value) setSelectedPersonId(value);
                }}
                value={selectedPersonId}
              >
                <SelectTrigger id="reset-person">
                  <SelectValue placeholder="Choose a person" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.personId} value={String(person.personId)}>
                      {person.personName} · {person.personEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current cycle: {cycle.name}. This does not delete the person, their enrollment, or
                shared library data.
              </p>
            </div>
            {people.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active people are enrolled in the current cycle.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create an active cycle and enroll people before using this reset.
          </p>
        )}
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : state.message ? (
          <Alert>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="border-t">
        <Button
          disabled={pending || !selectedPersonId || !cycle}
          onClick={reset}
          type="button"
          variant="destructive"
        >
          <RotateCcw />
          {pending ? "Resetting…" : "Reset selected person"}
        </Button>
      </CardFooter>
    </Card>
  );
}
