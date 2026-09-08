"use client";

import { Crown, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import {
  type CycleActionResult,
  removeCycle,
  setCycleStatus,
  updateCycle,
} from "@/app/(workspace)/admin/cycles/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CycleSummary } from "@/lib/data/performance-types";

const STATUSES = ["draft", "goal_setting", "active", "calibration", "closed"] as const;

export function CycleManager({ cycle, current }: { cycle: CycleSummary; current: boolean }) {
  const [state, setState] = useState<CycleActionResult>({ error: null });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(operation: () => Promise<CycleActionResult>) {
    startTransition(async () => {
      const result = await operation();
      setState(result);
      if (!result.error) router.refresh();
    });
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => updateCycle(cycle.id, formData));
  }

  function changeStatus(value: string) {
    if (!STATUSES.includes(value as (typeof STATUSES)[number])) return;
    run(() => setCycleStatus(cycle.id, value as (typeof STATUSES)[number]));
  }

  function makeCurrent() {
    run(() => setCycleStatus(cycle.id, "active"));
  }

  function remove() {
    if (!window.confirm(`Remove the unused cycle “${cycle.name}”?`)) return;
    run(() => removeCycle(cycle.id));
  }

  return (
    <Card className={current ? "ring-2 ring-primary/20" : undefined}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{cycle.name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {current ? "Current cycle" : "Cycle"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {cycle.status === "active" ? (
            <Badge variant="secondary">
              <Crown /> Current
            </Badge>
          ) : (
            <Button
              disabled={pending}
              onClick={makeCurrent}
              size="sm"
              type="button"
              variant="outline"
            >
              <Crown /> Make current
            </Button>
          )}
          <Select
            className="w-40"
            disabled={pending}
            onValueChange={(value) => {
              if (value) changeStatus(value);
            }}
            value={cycle.status}
          >
            <SelectTrigger aria-label={`Status for ${cycle.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <form onSubmit={save}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`cycle-name-${cycle.id}`}>Name</Label>
            <Input defaultValue={cycle.name} id={`cycle-name-${cycle.id}`} name="name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              id={`start-${cycle.id}`}
              label="Starts"
              name="start_date"
              value={cycle.startDate}
            />
            <DateField id={`end-${cycle.id}`} label="Ends" name="end_date" value={cycle.endDate} />
            <DateField
              id={`goal-open-${cycle.id}`}
              label="Goal window opens"
              name="goal_window_start"
              value={cycle.goalWindowStart}
            />
            <DateField
              id={`goal-close-${cycle.id}`}
              label="Goal window closes"
              name="goal_window_end"
              value={cycle.goalWindowEnd}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor={`check-ins-${cycle.id}`}>Check-ins in the cycle</Label>
              <Input defaultValue={6} id={`check-ins-${cycle.id}`} readOnly type="number" />
              <p className="text-xs text-muted-foreground">One conversation each month.</p>
            </div>
            <NumberField
              id={`okr-${cycle.id}`}
              label="Weight — what was delivered"
              name="okr_weight"
              step="0.05"
              value={cycle.okrWeight}
            />
            <NumberField
              id={`competency-${cycle.id}`}
              label="Weight — how it was delivered"
              name="competency_weight"
              step="0.05"
              value={cycle.competencyWeight}
            />
            <NumberField
              id={`max-goals-${cycle.id}`}
              label="Maximum goals per person"
              name="max_goals"
              step="1"
              value={cycle.maxGoals}
            />
          </div>
          <div className="grid gap-4">
            <div>
              <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Quarters
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Set the label, scoring deadline, and the quarter that carries the full review.
              </p>
            </div>
            {cycle.quarters.map((quarter) => (
              <div key={quarter.id} className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
                <div className="sm:col-span-3 flex items-center justify-between gap-3">
                  <p className="font-medium">Q{quarter.sequence}</p>
                  <Badge variant="outline">{quarter.status}</Badge>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`quarter-name-${quarter.id}`}>Label</Label>
                  <Input
                    defaultValue={quarter.name}
                    id={`quarter-name-${quarter.id}`}
                    name={`quarter_name_${quarter.id}`}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`quarter-score-by-${quarter.id}`}>Score by</Label>
                  <Input
                    defaultValue={(quarter.scoringDueAt ?? quarter.endDate).slice(0, 10)}
                    id={`quarter-score-by-${quarter.id}`}
                    name={`quarter_score_by_${quarter.id}`}
                    required
                    type="date"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`quarter-full-review-${quarter.id}`}>
                    Full review happens in this quarter
                  </Label>
                  <Select
                    defaultValue={String(quarter.isFullReview)}
                    name={`quarter_full_review_${quarter.id}`}
                  >
                    <SelectTrigger id={`quarter-full-review-${quarter.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No — scoring only</SelectItem>
                      <SelectItem value="true">Yes — review and feedback session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
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
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Button disabled={pending} type="submit">
              <Save />
              {pending ? "Saving…" : "Save cycle settings"}
            </Button>
            <Button
              disabled={pending || cycle.status === "active"}
              onClick={remove}
              type="button"
              variant="destructive"
            >
              <Trash2 />
              Remove unused cycle
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function DateField({
  id,
  label,
  name,
  value,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input defaultValue={value} id={id} name={name} required type="date" />
    </div>
  );
}

function NumberField({
  id,
  label,
  name,
  step,
  value,
}: {
  id: string;
  label: string;
  name: string;
  step: string;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        defaultValue={value}
        id={id}
        max={name === "max_goals" ? 5 : 1}
        min={name === "max_goals" ? 1 : 0}
        name={name}
        required
        step={step}
        type="number"
      />
    </div>
  );
}
