"use client";

import { Check, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEventHandler } from "react";
import { useActionState, useEffect, useState } from "react";

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
import { type CheckInDraft, TranscriptAssistant } from "@/app/components/transcript-assistant";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { APPROVER_LABEL, CHECKIN_STAGES, RATINGS } from "@/data/performance";
import type {
  CharterGoal,
  CheckInRecord,
  ImpactStatement,
  QuarterlyReview,
  QuarterSummary,
  TranscriptEntry,
} from "@/lib/data/performance-types";
import {
  IMPACT_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  RECOMMENDATIONS,
} from "@/lib/data/performance-types";
import { formatDateTime } from "@/lib/utils";

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
  value,
  onChange,
  disabled,
}: {
  id: string;
  name?: string;
  label: string;
  hint?: string;
  placeholder: string;
  rows?: number;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
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
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function TranscriptList({ entries }: { entries: TranscriptEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Conversation transcript</p>
        <p className="text-xs text-muted-foreground">Entries are kept with this record.</p>
      </div>
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border bg-background p-3 text-sm">
          <p className="text-xs text-muted-foreground">
            {entry.authorName} · {formatDateTime(entry.createdAt)}
          </p>
          <p className="mt-1 whitespace-pre-wrap leading-6">{entry.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- impact */

interface ImpactEntry {
  key: string;
  impactCreated: string;
  competencyDemonstrated: string;
}

function entriesFor(statement: ImpactStatement | undefined): ImpactEntry[] {
  if (!statement || statement.items.length === 0) {
    return [{ key: "entry-1", impactCreated: "", competencyDemonstrated: "" }];
  }
  return statement.items.map((item) => ({
    key: `entry-${item.id}`,
    impactCreated: item.impactCreated,
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
  const router = useRouter();

  const [entries, setEntries] = useState<ImpactEntry[]>(() => entriesFor(statement));
  const readOnly = statement !== undefined && statement.status !== "draft";
  const savedMessage = "message" in state ? state.message : undefined;
  const shareMessage = "message" in shareState ? shareState.message : undefined;

  useEffect(() => {
    if (savedMessage || shareMessage) router.refresh();
  }, [router, savedMessage, shareMessage]);

  const payload = JSON.stringify(
    entries.map((entry) => ({
      impactCreated: entry.impactCreated,
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
          {entries.slice(0, 1).map((entry) => (
            <div key={entry.key} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor={`${entry.key}-impact`}>
                  Impact created — results against my goals
                </Label>
                <Textarea
                  id={`${entry.key}-impact`}
                  rows={4}
                  disabled={readOnly}
                  value={entry.impactCreated}
                  onChange={(event) => patch(entry.key, { impactCreated: event.target.value })}
                  placeholder="What results did you create against your goals?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${entry.key}-competency`}>
                  Competency commitments I lived — and how
                </Label>
                <Textarea
                  id={`${entry.key}-competency`}
                  rows={4}
                  disabled={readOnly}
                  value={entry.competencyDemonstrated}
                  onChange={(event) =>
                    patch(entry.key, { competencyDemonstrated: event.target.value })
                  }
                  placeholder="Which commitments did you live, and how?"
                />
              </div>
            </div>
          ))}
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

function checkInDraftFor(existing: CheckInRecord | undefined): CheckInDraft {
  return {
    openContext: existing?.notes?.openContext ?? "",
    progressSummary: existing?.notes?.progressSummary ?? "",
    blockers: existing?.notes?.blockers ?? "",
    wayForward: existing?.notes?.wayForward ?? "",
  };
}

export function CheckInForm({
  participantId,
  personName,
  months,
  checkIns,
  initialMonth,
}: {
  participantId: number;
  personName: string;
  /** First-of-month dates in the cycle, with the label to show for each. */
  months: { value: string; label: string }[];
  checkIns: CheckInRecord[];
  initialMonth?: string;
}) {
  const [state, formAction, pending] = useActionState(recordCheckIn, {
    error: null,
  } as CoachingActionResult);
  const router = useRouter();
  const [month, setMonth] = useState(
    initialMonth && months.some((option) => option.value === initialMonth)
      ? initialMonth
      : (months[0]?.value ?? ""),
  );
  const existing = checkIns.find((checkIn) => checkIn.monthStart === month);
  const [draft, setDraft] = useState<CheckInDraft>(() => checkInDraftFor(existing));
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    setDraft(checkInDraftFor(checkIns.find((checkIn) => checkIn.monthStart === month)));
    setTranscript("");
  }, [checkIns, month]);

  useEffect(() => {
    if (state.message) router.refresh();
  }, [router, state.message]);

  const patchDraft = (next: Partial<CheckInDraft>) =>
    setDraft((current) => ({ ...current, ...next }));

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="participant_id" value={participantId} />
      <Feedback state={state} />

      <Card key={month}>
        <CardHeader>
          <CardTitle>The conversation with {personName}</CardTitle>
          <CardDescription>
            15 minutes on the four-stage framework. Recorded by the coach, in the room. No ratings
            are given in a check-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="month_start">Month</Label>
              <Select
                name="month_start"
                value={month}
                onValueChange={(value) => setMonth(value ?? "")}
              >
                <SelectTrigger id="month_start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="held_at">Conversation date</Label>
              <Input
                id="held_at"
                name="held_at"
                type="date"
                defaultValue={existing?.heldAt?.slice(0, 10) ?? ""}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                The date the conversation happened, separate from the month it covers.
              </p>
            </div>
          </div>

          <TranscriptAssistant
            participantId={participantId}
            monthStart={month}
            personName={personName}
            onApply={(nextDraft, sourceTranscript) => {
              setDraft(nextDraft);
              setTranscript(sourceTranscript);
            }}
          />

          {/* The four stages map directly onto the prototype's check-in record. */}
          <Field
            key={`${month}-open`}
            id="open_context"
            name="open_context"
            label={`${CHECKIN_STAGES[0].title} · ${CHECKIN_STAGES[0].minutes} min`}
            hint={CHECKIN_STAGES[0].prompt}
            placeholder="How has the month been? Let them speak first. Optional notes."
            rows={2}
            value={draft.openContext}
            onChange={(event) => patchDraft({ openContext: event.target.value })}
          />
          <Field
            key={`${month}-progress`}
            id="progress_summary"
            name="progress_summary"
            label={`${CHECKIN_STAGES[1].title} · ${CHECKIN_STAGES[1].minutes} min`}
            hint={CHECKIN_STAGES[1].prompt}
            placeholder="What moved this month, and what the numbers say."
            rows={3}
            value={draft.progressSummary}
            onChange={(event) => patchDraft({ progressSummary: event.target.value })}
          />
          <Field
            key={`${month}-blockers`}
            id="blockers"
            name="blockers"
            label={`${CHECKIN_STAGES[2].title} · ${CHECKIN_STAGES[2].minutes} min`}
            hint={CHECKIN_STAGES[2].prompt}
            placeholder="What is in the way. Optional."
            rows={3}
            value={draft.blockers}
            onChange={(event) => patchDraft({ blockers: event.target.value })}
          />
          <Field
            key={`${month}-forward`}
            id="way_forward"
            name="way_forward"
            label={`${CHECKIN_STAGES[3].title} · ${CHECKIN_STAGES[3].minutes} min`}
            hint={CHECKIN_STAGES[3].prompt}
            placeholder="Specific actions, owners, and what happens before the next one."
            rows={3}
            value={draft.wayForward}
            onChange={(event) => patchDraft({ wayForward: event.target.value })}
          />
          <TranscriptList entries={existing?.transcript ?? []} />
          <Field
            key={`${month}-transcript`}
            id="transcript"
            name="transcript"
            label="Add transcript entry"
            hint="Optional. Keep the important wording or decision from this conversation with the record."
            placeholder="What was said, decided, or agreed."
            rows={4}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
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
  keyResult: string;
  target: string;
  dataSource: string;
  actualResult: string;
  attainment: string;
  evidenceNote: string;
}

export function ReviewForm({
  participantId,
  personName,
  quarters,
  goals,
  okrWeight,
  competencyWeight,
  impacts,
  reviews,
}: {
  participantId: number;
  personName: string;
  quarters: QuarterSummary[];
  goals: CharterGoal[];
  okrWeight: number;
  competencyWeight: number;
  impacts: ImpactStatement[];
  reviews: QuarterlyReview[];
}) {
  const [state, formAction, pending] = useActionState(saveReview, {
    error: null,
  } as CoachingActionResult);
  const router = useRouter();
  const [quarterId, setQuarterId] = useState(quarters[0]?.id ?? 0);

  const review = reviews.find((entry) => entry.quarterId === quarterId);
  const impact = impacts.find((entry) => entry.quarterId === quarterId);

  const [scores, setScores] = useState<ScoreDraft[]>(() =>
    goals.map((goal) => {
      const existing = review?.goalScores.find((score) => score.charterGoalId === goal.id);
      return {
        charterGoalId: goal.id,
        outcome: goal.outcome,
        keyResult: goal.keyResult,
        target: goal.target,
        dataSource: goal.dataSource,
        actualResult: existing?.actualResult ?? "",
        attainment: existing ? String(existing.attainment) : "",
        evidenceNote: existing?.evidenceNote ?? "",
      };
    }),
  );

  useEffect(() => {
    setScores(
      goals.map((goal) => {
        const existing = review?.goalScores.find((score) => score.charterGoalId === goal.id);
        return {
          charterGoalId: goal.id,
          outcome: goal.outcome,
          keyResult: goal.keyResult,
          target: goal.target,
          dataSource: goal.dataSource,
          actualResult: existing?.actualResult ?? "",
          attainment: existing ? String(existing.attainment) : "",
          evidenceNote: existing?.evidenceNote ?? "",
        };
      }),
    );
  }, [goals, review]);

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

  useEffect(() => {
    if (state.message) router.refresh();
  }, [router, state.message]);

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
          <Select
            className="w-full sm:w-80"
            name="quarter_id"
            value={String(quarterId)}
            onValueChange={(value) => setQuarterId(Number(value ?? 0))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((quarter) => (
                <SelectItem key={quarter.id} value={String(quarter.id)}>
                  {quarter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card key={quarterId}>
        <CardHeader>
          <CardTitle>Part 1 — Impact Statement</CardTitle>
          <CardDescription>
            The member&apos;s written account of the results created and the competency commitments
            they lived this quarter.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {impact?.items.length ? (
            impact.items.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-xl border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Impact created — against my goals</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{item.impactCreated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Competency commitments I lived — and how
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {item.competencyDemonstrated || "—"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No impact statement has been shared for this quarter yet.
            </p>
          )}
          <TranscriptList entries={impact?.transcript ?? []} />
        </CardContent>
      </Card>

      <Card key={`score-1-${quarterId}`}>
        <CardHeader>
          <CardTitle>Score 1 — what was delivered</CardTitle>
          <CardDescription>
            Score each goal from 0.00–1.00 against its target. The average is converted to Score 1.
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
              <div>
                <p className="text-sm font-medium">{score.keyResult || score.outcome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{score.outcome}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="mt-1">{score.target || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data source</p>
                  <p className="mt-1">{score.dataSource || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Their actuals</p>
                  <p className="mt-1 whitespace-pre-wrap">{score.actualResult || "—"}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:max-w-40">
                <Label htmlFor={`attainment-${score.charterGoalId}`}>Score 0.0–1.0</Label>
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
          ))}

          <TranscriptList entries={review?.transcript ?? []} />
          <Field
            id="transcript"
            name="transcript"
            label="Add transcript entry"
            hint="Optional. Keep the important wording or decision from the scoring conversation with the review."
            placeholder="What was said, decided, or agreed."
            rows={4}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quarterly score</CardTitle>
          <CardDescription>
            Quarterly score = (Score 1 × {okrWeight}) + (Score 2 × {competencyWeight}). Leadership
            may calibrate it before release.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary" style={{ width: `${okrWeight * 100}%` }} />
              <div className="bg-secondary" style={{ width: `${competencyWeight * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Score 1 · {Math.round(okrWeight * 100)}%</span>
              <span>Score 2 · {Math.round(competencyWeight * 100)}%</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Score 1</p>
              <p className="mt-1 text-lg font-semibold">{review?.okrRating ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score 2</p>
              <p className="mt-1 text-lg font-semibold">{review?.competencyRating ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {review?.calibratedScore !== null && review?.calibratedScore !== undefined
                  ? "Calibrated score"
                  : "Calculated score"}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {review?.calibratedScore?.toFixed(2) ?? review?.quarterlyScore?.toFixed(2) ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card key={`score-2-${quarterId}`}>
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
            <Select
              className="w-full sm:w-80"
              defaultValue={review?.competencyRating ? String(review.competencyRating) : ""}
              disabled={readOnly}
              name="competency_rating"
            >
              <SelectTrigger id="competency_rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not yet rated</SelectItem>
                {RATINGS.map((rating) => (
                  <SelectItem key={rating.value} value={String(rating.value)}>
                    {rating.value} — {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="grid gap-2">
            <Label htmlFor="recommendation">3 · Recommendation</Label>
            <Select
              className="w-full sm:w-80"
              defaultValue={review?.recommendation ?? ""}
              disabled={readOnly}
              name="recommendation"
            >
              <SelectTrigger id="recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not recorded</SelectItem>
                {RECOMMENDATIONS.map((recommendation) => (
                  <SelectItem key={recommendation} value={recommendation}>
                    {RECOMMENDATION_LABELS[recommendation]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-3 border-t">
          <Button type="submit" disabled={readOnly || pending}>
            <Save />
            {pending ? "Saving…" : "Save review"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signatures and calibration</CardTitle>
          <CardDescription>
            The coach sends the review to calibration; Leadership signs off before it is released to
            the team member.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Coach</p>
            <p className="mt-1 font-medium">
              {review?.status && review.status !== "coach_draft" ? "Signed" : "Draft"}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Leadership</p>
            <p className="mt-1 font-medium">
              {review?.status === "founder_signed" ||
              review?.status === "released" ||
              review?.status === "employee_acknowledged"
                ? "Signed"
                : review?.status === "calibration"
                  ? "In calibration"
                  : "Pending"}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Team member</p>
            <p className="mt-1 font-medium">
              {review?.status === "employee_acknowledged"
                ? "Acknowledged"
                : review?.status === "released"
                  ? "Awaiting acknowledgement"
                  : "Available after release"}
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
