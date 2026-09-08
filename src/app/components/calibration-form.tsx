"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { type CoachingActionResult, calibrateReview } from "@/app/(workspace)/coaching/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuarterlyReview } from "@/lib/data/performance-types";

export function CalibrationForm({ review }: { review: QuarterlyReview }) {
  const [score, setScore] = useState(String(review.calibratedScore ?? review.quarterlyScore ?? ""));
  const [rationale, setRationale] = useState("");
  const [state, setState] = useState<CoachingActionResult>({ error: null });
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await calibrateReview(
        review.id,
        score.trim() === "" ? null : Number(score),
        rationale,
      );
      setState(result);
      if (!result.error) setRationale("");
    });
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-1 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Coach Score 1</p>
          <p className="font-heading text-xl font-semibold">{review.okrRating ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Coach Score 2</p>
          <p className="font-heading text-xl font-semibold">{review.competencyRating ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Calculated score</p>
          <p className="font-heading text-xl font-semibold">
            {review.quarterlyScore?.toFixed(2) ?? "—"}
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor={`calibrated-score-${review.id}`}>Calibrated final score</Label>
        <Input
          id={`calibrated-score-${review.id}`}
          max={5}
          min={1}
          onChange={(event) => setScore(event.target.value)}
          placeholder="e.g. 2.00"
          step={0.01}
          type="number"
          value={score}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`calibration-rationale-${review.id}`}>Calibration rationale</Label>
        <Textarea
          id={`calibration-rationale-${review.id}`}
          onChange={(event) => setRationale(event.target.value)}
          placeholder="Explain why the final score changed or why the calculated score stands."
          rows={3}
          value={rationale}
        />
      </div>
      <div>
        <Button disabled={pending} onClick={submit} type="button">
          <Save />
          {pending ? "Saving…" : "Save calibration"}
        </Button>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : state.message ? (
        <Alert>
          <AlertDescription>
            <CheckCircle2 className="mr-2 inline size-4" />
            {state.message}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
