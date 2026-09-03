"use client";

import { Check, Plus, Save, Send, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  type CoachingActionResult,
  recordCheckIn,
  saveReview,
} from "@/app/(workspace)/coaching/actions";
import {
  type ImpactActionResult,
  saveImpact,
  submitImpact,
} from "@/app/(workspace)/impact/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { APPROVER_LABEL, CHECKIN_STAGES, RATINGS } from "@/data/performance";
import type {
  CharterGoal,
  CheckInRecord,
  ImpactStatement,
  QuarterlyReview,
  QuarterSummary,
} from "@/lib/data/performance-types";
import {
  IMPACT_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  RECOMMENDATIONS,
} from "@/lib/data/performance-types";

function Feedback({ state }: { state: { error: string | null; message?: string } }) {
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
        <AlertDescription>
          <Check className="mr-2 inline size-4" />
          {state.message}
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

function Field({
  id,
  name,
  label,
  hint,
  placeholder,
  rows = 4,
  defaultValue,
  disabled,
}: {
  id: string;
  name?: string;
  label: string;
  hint?: string;
  placeholder: string;
  rows?: number;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <Textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- impact */

interface ImpactEntry {
  key: string;
  impactCreated: string;
  numbersAndEvidence: string;
  competencyDemonstrated: string;
}

function entriesFor(statement: ImpactStatement | undefined): ImpactEntry[] {
  if (!statement || statement.items.length === 0) {
    return [
      { key: "entry-1", impactCreated: "", numbersAndEvidence: "", competencyDemonstrated: "" },
    ];
  }
  return statement.items.map((item) => ({
    key: `entry-${item.id}`,
    impactCreated: item.impactCreated,
    numbersAndEvidence: item.numbersAndEvidence,
    competencyDemonstrated: item.competencyDemonstrated ?? "",
  }));
}

function ImpactQuarterPanel({
  quarter,
  statement,
}: {
  quarter: QuarterSummary;
  statement: ImpactStatement | undefined;
}) {
  const [state, formAction, pending] = useActionState(saveImpact, {
    error: null,
  } as ImpactActionResult);
  const [shareState, shareAction, sharing] = useActionState(
    async () => (statement ? submitImpact(statement.id) : { error: "Save a draft first." }),
    { error: null } as ImpactActionResult,
  );

  const [entries, setEntries] = useState<ImpactEntry[]>(() => entriesFor(statement));
  const [nextKey, setNextKey] = useState(entries.length + 1);
  const readOnly = statement !== undefined && statement.status !== "draft";

  const payload = JSON.stringify(
    entries.map((entry) => ({
      impactCreated: entry.impactCreated,
      numbersAndEvidence: entry.numbersAndEvidence,
      competencyDemonstrated: entry.competencyDemonstrated,
    })),
  );

  const patch = (key: string, next: Partial<ImpactEntry>) =>
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...next } : entry)),
    );

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="quarter_id" value={quarter.id} />
      <input type="hidden" name="items" value={payload} />

      <Feedback state={state.error || state.message ? state : shareState} />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Part 1 — written by you</CardTitle>
              <CardDescription className="mt-1">
                Your coach cannot see this until you share it. Once shared it becomes read-only.
              </CardDescription>
            </div>
            <Badge variant="outline">{IMPACT_STATUS_LABELS[statement?.status ?? "draft"]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {entries.map((entry, index) => (
            <div key={entry.key} className="grid gap-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Entry {index + 1}</p>
                {entries.length > 1 && !readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEntries((current) => current.filter((item) => item.key !== entry.key))
                    }
                  >
                    <Trash2 />
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${entry.key}-impact`}>Impact created — against my goals</Label>
                <Textarea
                  id={`${entry.key}-impact`}
                  rows={3}
                  disabled={readOnly}
                  value={entry.impactCreated}
                  onChange={(event) => patch(entry.key, { impactCreated: event.target.value })}
                  placeholder="e.g. Inbound response within 48h moved from 70% to 95%."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${entry.key}-numbers`}>Numbers and evidence</Label>
                <Textarea
                  id={`${entry.key}-numbers`}
                  rows={3}
                  disabled={readOnly}
                  value={entry.numbersAndEvidence}
                  onChange={(event) => patch(entry.key, { numbersAndEvidence: event.target.value })}
                  placeholder="e.g. CRM export, Sep–Nov. Closed ₹16L of the ₹20L target."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${entry.key}-competency`}>
                  Competency commitments I lived — and how
                </Label>
                <Textarea
                  id={`${entry.key}-competency`}
                  rows={3}
                  disabled={readOnly}
                  value={entry.competencyDemonstrated}
                  onChange={(event) =>
                    patch(entry.key, { competencyDemonstrated: event.target.value })
                  }
                  placeholder="e.g. Communication — sent the weekly written pipeline update 12 of 12 weeks."
                />
              </div>
            </div>
          ))}

          {!readOnly ? (
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEntries((current) => [
                    ...current,
                    {
                      key: `entry-new-${nextKey}`,
                      impactCreated: "",
                      numbersAndEvidence: "",
                      competencyDemonstrated: "",
                    },
                  ]);
                  setNextKey((value) => value + 1);
                }}
              >
                <Plus />
                Add another entry
              </Button>
            </div>
          ) : null}

          <Field
            id={`${quarter.id}-learning`}
            name="learning_carried_forward"
            label="Learning carried forward"
            hint="What you take into the next quarter."
            placeholder="Optional."
            rows={3}
            defaultValue={statement?.learningCarriedForward ?? ""}
            disabled={readOnly}
          />
        </CardContent>
        <CardFooter className="justify-end gap-3 border-t">
          <Button type="submit" variant="outline" disabled={readOnly || pending}>
            <Save />
            {pending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="submit"
            formAction={shareAction}
            disabled={readOnly || sharing || statement === undefined}
          >
            <Send />
            {sharing ? "Sharing…" : "Share with my coach"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export function ImpactForm({
  quarters,
  statements,
}: {
  quarters: QuarterSummary[];
  statements: ImpactStatement[];
}) {
  if (quarters.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          This cycle has no quarters yet, so there is nothing to write against.
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={String(quarters[0].id)}>
      <TabsList className="mb-5">
        {quarters.map((quarter) => (
          <TabsTrigger key={quarter.id} value={String(quarter.id)}>
            {quarter.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {quarters.map((quarter) => (
        <TabsContent key={quarter.id} value={String(quarter.id)}>
          <ImpactQuarterPanel
            quarter={quarter}
            statement={statements.find((statement) => statement.quarterId === quarter.id)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* -------------------------------------------------------------- check-in */

export function CheckInForm({
  participantId,
  personName,
  months,
  checkIns,
}: {
  participantId: number;
  personName: string;
  /** First-of-month dates in the cycle, with the label to show for each. */
  months: { value: string; label: string }[];
  checkIns: CheckInRecord[];
}) {
  const [state, formAction, pending] = useActionState(recordCheckIn, {
    error: null,
  } as CoachingActionResult);
  const [month, setMonth] = useState(months[0]?.value ?? "");

  const existing = checkIns.find((checkIn) => checkIn.monthStart === month);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="participant_id" value={participantId} />
      <Feedback state={state} />

      <Card>
        <CardHeader>
          <CardTitle>The conversation with {personName}</CardTitle>
          <CardDescription>
            15 minutes on the four-stage framework. Recorded by the coach, in the room. No ratings
            are given in a check-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="month_start">Month</Label>
            <NativeSelect
              id="month_start"
              name="month_start"
              className="w-full sm:w-80"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              {months.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* The four stages map onto the record the schema keeps: what moved,
              what is in the way, what was recognised, and what happens next. */}
          <Field
            key={`${month}-progress`}
            id="progress_summary"
            name="progress_summary"
            label={`${CHECKIN_STAGES[1].title} · ${CHECKIN_STAGES[1].minutes} min`}
            hint={CHECKIN_STAGES[1].prompt}
            placeholder="What moved this month, and what the numbers say."
            rows={3}
            defaultValue={existing?.notes?.progressSummary ?? ""}
          />
          <Field
            key={`${month}-blockers`}
            id="blockers"
            name="blockers"
            label={`${CHECKIN_STAGES[2].title} · ${CHECKIN_STAGES[2].minutes} min`}
            hint={CHECKIN_STAGES[2].prompt}
            placeholder="What is in the way. Optional."
            rows={3}
            defaultValue={existing?.notes?.blockers ?? ""}
          />
          <Field
            key={`${month}-recognition`}
            id="recognition"
            name="recognition"
            label="Recognition"
            hint="One specific thing done well. Optional."
            placeholder="Name it concretely."
            rows={2}
            defaultValue={existing?.notes?.recognition ?? ""}
          />
          <Field
            key={`${month}-forward`}
            id="way_forward"
            name="way_forward"
            label={`${CHECKIN_STAGES[3].title} · ${CHECKIN_STAGES[3].minutes} min`}
            hint={CHECKIN_STAGES[3].prompt}
            placeholder="Specific actions, owners, and what happens before the next one."
            rows={3}
            defaultValue={existing?.notes?.wayForward ?? ""}
          />
          <Field
            key={`${month}-support`}
            id="support_to_arrange"
            name="support_to_arrange"
            label="Support to arrange"
            hint="What you will set up for them. Optional."
            placeholder="Optional."
            rows={2}
            defaultValue={existing?.notes?.supportToArrange ?? ""}
          />
        </CardContent>
        <CardFooter className="justify-end gap-3 border-t">
          <Button type="submit" disabled={pending}>
            <Save />
            {pending ? "Saving…" : `Record and share with ${personName}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- review */

interface ScoreDraft {
  charterGoalId: number;
  outcome: string;
  actualResult: string;
  attainment: string;
  evidenceNote: string;
}

export function ReviewForm({
  participantId,
  personName,
  quarters,
  goals,
  reviews,
}: {
  participantId: number;
  personName: string;
  quarters: QuarterSummary[];
  goals: CharterGoal[];
  reviews: QuarterlyReview[];
}) {
  const [state, formAction, pending] = useActionState(saveReview, {
    error: null,
  } as CoachingActionResult);
  const [quarterId, setQuarterId] = useState(quarters[0]?.id ?? 0);

  const review = reviews.find((entry) => entry.quarterId === quarterId);

  const [scores, setScores] = useState<ScoreDraft[]>(() =>
    goals.map((goal) => {
      const existing = review?.goalScores.find((score) => score.charterGoalId === goal.id);
      return {
        charterGoalId: goal.id,
        outcome: goal.outcome,
        actualResult: existing?.actualResult ?? "",
        attainment: existing ? String(existing.attainment) : "",
        evidenceNote: existing?.evidenceNote ?? "",
      };
    }),
  );

  const payload = JSON.stringify(
    scores.map((score) => ({
      charterGoalId: score.charterGoalId,
      actualResult: score.actualResult,
      attainment: score.attainment,
      evidenceNote: score.evidenceNote,
    })),
  );

  const patch = (goalId: number, next: Partial<ScoreDraft>) =>
    setScores((current) =>
      current.map((score) => (score.charterGoalId === goalId ? { ...score, ...next } : score)),
    );

  const readOnly = review?.status === "released" || review?.status === "employee_acknowledged";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="scores" value={payload} />

      <Feedback state={state} />

      <Card>
        <CardHeader>
          <CardTitle>Quarter</CardTitle>
          <CardDescription>
            Each quarter is scored on its own. The half-yearly score is the plain average of the
            two.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NativeSelect
            name="quarter_id"
            className="w-full sm:w-80"
            value={String(quarterId)}
            onChange={(event) => setQuarterId(Number(event.target.value))}
          >
            {quarters.map((quarter) => (
              <NativeSelectOption key={quarter.id} value={String(quarter.id)}>
                {quarter.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score 1 — what was delivered</CardTitle>
          <CardDescription>
            One row per goal on the charter. Attainment is 0.00–1.00 against the target; the average
            is what the rating rests on.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {personName} has no approved goals to score yet.
            </p>
          ) : null}
          {scores.map((score) => (
            <div key={score.charterGoalId} className="grid gap-3 rounded-xl border p-4">
              <p className="text-sm font-medium">{score.outcome}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="grid gap-2">
                  <Label htmlFor={`actual-${score.charterGoalId}`}>Actual result</Label>
                  <Input
                    id={`actual-${score.charterGoalId}`}
                    disabled={readOnly}
                    value={score.actualResult}
                    onChange={(event) =>
                      patch(score.charterGoalId, { actualResult: event.target.value })
                    }
                    placeholder="What the data source says."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`attainment-${score.charterGoalId}`}>Attainment</Label>
                  <Input
                    id={`attainment-${score.charterGoalId}`}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={readOnly}
                    value={score.attainment}
                    onChange={(event) =>
                      patch(score.charterGoalId, { attainment: event.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`evidence-${score.charterGoalId}`}>Evidence</Label>
                <Textarea
                  id={`evidence-${score.charterGoalId}`}
                  rows={2}
                  disabled={readOnly}
                  value={score.evidenceNote}
                  onChange={(event) =>
                    patch(score.charterGoalId, { evidenceNote: event.target.value })
                  }
                  placeholder="Where the number came from, and what it means."
                />
              </div>
            </div>
          ))}

          <div className="grid gap-2">
            <Label htmlFor="okr_rating">Rating — what was delivered</Label>
            <NativeSelect
              id="okr_rating"
              name="okr_rating"
              className="w-full sm:w-80"
              defaultValue={review?.okrRating ? String(review.okrRating) : ""}
              disabled={readOnly}
            >
              <NativeSelectOption value="">Not yet rated</NativeSelectOption>
              {RATINGS.map((rating) => (
                <NativeSelectOption key={rating.value} value={String(rating.value)}>
                  {rating.value} — {rating.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score 2 — how it was delivered</CardTitle>
          <CardDescription>
            Discussed orally against the written commitments, then one overall rating out of 5.
            Anchor it in specifics from your check-in records.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="competency_rating">Rating for {personName}</Label>
            <NativeSelect
              id="competency_rating"
              name="competency_rating"
              className="w-full sm:w-80"
              defaultValue={review?.competencyRating ? String(review.competencyRating) : ""}
              disabled={readOnly}
            >
              <NativeSelectOption value="">Not yet rated</NativeSelectOption>
              {RATINGS.map((rating) => (
                <NativeSelectOption key={rating.value} value={String(rating.value)}>
                  {rating.value} — {rating.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Part 2 — coach review</CardTitle>
          <CardDescription>
            Written after scoring, and released to {personName} once {APPROVER_LABEL} signs off.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Field
            id="coach_verified_impact"
            name="coach_verified_impact"
            label="1 · The impact this person has created — your verified summary"
            hint="Verified against the charter, the check-in records and the named data sources."
            placeholder="What changed because of this person's work this quarter."
            defaultValue={review?.coachVerifiedImpact ?? ""}
            disabled={readOnly}
          />
          <Field
            id="development_needs"
            name="development_needs"
            label="2 · Development needs — and the support to be provided"
            hint="You own one development action per coachee per cycle. Name it here and follow it through."
            placeholder="The gap, and the specific support you will arrange for it."
            defaultValue={review?.developmentNeeds ?? ""}
            disabled={readOnly}
          />
          <Field
            id="support_to_provide"
            name="support_to_provide"
            label="3 · Support to provide"
            placeholder="Training, exposure, or time you will arrange."
            rows={3}
            defaultValue={review?.supportToProvide ?? ""}
            disabled={readOnly}
          />
          <div className="grid gap-2">
            <Label htmlFor="recommendation">4 · Recommendation</Label>
            <NativeSelect
              id="recommendation"
              name="recommendation"
              className="w-full sm:w-80"
              defaultValue={review?.recommendation ?? ""}
              disabled={readOnly}
            >
              <NativeSelectOption value="">Not recorded</NativeSelectOption>
              {RECOMMENDATIONS.map((recommendation) => (
                <NativeSelectOption key={recommendation} value={recommendation}>
                  {RECOMMENDATION_LABELS[recommendation]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-3 border-t">
          <Button type="submit" disabled={readOnly || pending}>
            <Save />
            {pending ? "Saving…" : "Save review"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
