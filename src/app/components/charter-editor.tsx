"use client";

import {
  ArrowRight,
  Check,
  Copy,
  LibraryBig,
  Plus,
  Printer,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  type CharterActionResult,
  saveCharter,
  submitCharter,
} from "@/app/(workspace)/charter/actions";
import {
  CharterApprovalStrip,
  charterStepForStatus,
} from "@/app/components/charter-approval-strip";
import { CompetencyAnchorsDialog } from "@/app/components/competency-anchors-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LIBRARY_OKRS } from "@/data/library";
import {
  APPROVER_LABEL,
  CHARTER_CHOSEN_COMPETENCIES,
  choosableCompetencies,
  competencyByName,
  fixedCompetenciesFor,
} from "@/data/performance";
import {
  CHARTER_EDITABLE,
  CHARTER_STATUS_LABELS,
  type Charter,
  type CharterStatus,
  type CycleSummary,
} from "@/lib/data/performance-types";
import type { LibraryCompetency, OkrExample } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalDraft {
  id: string;
  objective: string;
  keyResult: string;
  baseline: string;
  target: string;
  dataSource: string;
}

const ALL_UNITS = "All units";

function emptyGoal(id: string): GoalDraft {
  return { id, objective: "", keyResult: "", baseline: "", target: "", dataSource: "" };
}

function goalFromExample(id: string, example: OkrExample): GoalDraft {
  return {
    id,
    objective: example.objective,
    keyResult: example.kr,
    baseline: "",
    target: "",
    dataSource: example.source,
  };
}

/** Title, supporting line, and actions — the visual break between Goals and Competencies. */
function SectionHeading({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
          {meta}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A labelled control with an optional one-line hint sitting under the label. */
function Field({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="-mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

/** "n of max" as a row of filled segments — reads at a glance without a number. */
function CountMeter({ value, max, label }: { value: number; max: number; label: string }) {
  const segments = Array.from({ length: max }, (_, position) => position + 1);
  return (
    <div className="flex items-center gap-2" title={label}>
      <span className="flex gap-1" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1.5 w-4 rounded-full transition-colors",
              segment <= value ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </span>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {value}/{max}
        <span className="sr-only"> {label}</span>
      </span>
    </div>
  );
}

const STATUS_TONE: Record<CharterStatus, string> = {
  draft: "bg-muted text-foreground",
  submitted: "bg-accent text-accent-foreground",
  coach_reviewed: "bg-accent text-accent-foreground",
  coach_changes_requested: "bg-destructive/10 text-destructive",
  founder_changes_requested: "bg-destructive/10 text-destructive",
  approved_locked: "bg-primary text-primary-foreground",
};

function StatusBadge({ status }: { status: CharterStatus }) {
  return (
    <Badge className={cn("gap-1.5 border-transparent", STATUS_TONE[status])}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {CHARTER_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Browse the library's example key results, filtered by unit, and start a goal from one. */
function GoalLibraryDialog({
  defaultUnit,
  disabled,
  onPick,
}: {
  defaultUnit: string;
  disabled: boolean;
  onPick: (example: OkrExample) => void;
}) {
  const [open, setOpen] = useState(false);
  const units = useMemo(() => [ALL_UNITS, ...new Set(LIBRARY_OKRS.map((o) => o.unit))], []);
  const [unit, setUnit] = useState(() =>
    LIBRARY_OKRS.some((example) => example.unit === defaultUnit) ? defaultUnit : ALL_UNITS,
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, OkrExample[]>();
    for (const example of LIBRARY_OKRS) {
      if (unit !== ALL_UNITS && example.unit !== unit) continue;
      const list = groups.get(example.objective) ?? [];
      list.push(example);
      groups.set(example.objective, list);
    }
    return [...groups];
  }, [unit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={disabled}>
            <LibraryBig />
            Add from the library
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add a goal from the library</DialogTitle>
          <DialogDescription>
            {LIBRARY_OKRS.length} example key results, grouped by objective. A menu, not a binding
            list &mdash; adapt the wording to your real work, and replace the illustrative numbers
            with your own baseline and target.
          </DialogDescription>
        </DialogHeader>
        <Select
          className="w-full sm:w-64"
          value={unit}
          onValueChange={(value) => setUnit(value ?? "")}
        >
          <SelectTrigger aria-label="Filter by unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {units.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid gap-6">
          {grouped.map(([objective, examples]) => (
            <div key={objective}>
              <Eyebrow>{examples[0].unit}</Eyebrow>
              <p className="mt-1 font-heading text-sm font-semibold">{objective}</p>
              <div className="mt-2 grid gap-2">
                {examples.map((example) => (
                  <Button
                    key={example.kr}
                    variant="outline"
                    className="h-auto w-full justify-start p-3 text-left shadow-none hover:border-primary/40 hover:bg-accent/40"
                    onClick={() => {
                      onPick(example);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block font-normal text-pretty whitespace-normal">
                        {example.kr}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        Measured from: {example.source}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Pick one of the library's optional competencies for an open charter slot. */
function CompetencyPickerDialog({
  taken,
  disabled,
  onPick,
  variant = "outline",
}: {
  taken: string[];
  disabled: boolean;
  onPick: (competency: LibraryCompetency) => void;
  variant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const available = choosableCompetencies().filter((item) => !taken.includes(item.name));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} disabled={disabled}>
            <Sparkles />
            Choose a competency
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a competency with your coach</DialogTitle>
          <DialogDescription>
            {available.length} available. Pick the ones that match the work of this cycle &mdash;
            each carries a one-line commitment that the quarterly discussion is judged against.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {available.map((competency) => (
            <Button
              key={competency.name}
              variant="outline"
              className="h-auto w-full justify-start p-4 text-left shadow-none hover:border-primary/40 hover:bg-accent/40"
              onClick={() => {
                onPick(competency);
                setOpen(false);
              }}
            >
              <span className="min-w-0">
                <span className="block font-medium">{competency.name}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground text-pretty whitespace-normal">
                  {competency.unit} &middot; {competency.definition}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  goal: GoalDraft;
  index: number;
  disabled: boolean;
  onChange: (patch: Partial<GoalDraft>) => void;
  onRemove: () => void;
}) {
  const fieldId = useId();
  const number = String(index + 1).padStart(2, "0");
  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-muted font-heading text-xs font-semibold tabular-nums text-foreground">
              {number}
            </span>
            <Eyebrow>Goal {index + 1}</Eyebrow>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remove goal ${index + 1}`}
            title="Remove goal"
          >
            <Trash2 />
          </Button>
        </div>

        <Field
          id={`${fieldId}-objective`}
          label="Objective"
          hint="What you want to achieve this cycle — one clear sentence."
        >
          <Input
            id={`${fieldId}-objective`}
            value={goal.objective}
            onChange={(event) => onChange({ objective: event.target.value })}
            disabled={disabled}
            placeholder="e.g. Make every new cohort self-serve from day one"
            className="h-11 px-3.5 font-heading text-base font-medium md:text-base"
          />
        </Field>

        <Field
          id={`${fieldId}-key-result`}
          label="Key result"
          hint="The number that proves the objective happened."
        >
          <Input
            id={`${fieldId}-key-result`}
            value={goal.keyResult}
            onChange={(event) => onChange({ keyResult: event.target.value })}
            disabled={disabled}
            placeholder="e.g. Onboarding tickets per cohort"
          />
        </Field>

        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr_1.35fr]">
          <Field id={`${fieldId}-baseline`} label="Baseline">
            <Input
              id={`${fieldId}-baseline`}
              value={goal.baseline}
              onChange={(event) => onChange({ baseline: event.target.value })}
              disabled={disabled}
              placeholder="where you start"
            />
          </Field>
          <ArrowRight
            aria-hidden="true"
            className="mb-2.5 hidden size-4 text-muted-foreground/70 md:block"
          />
          <Field id={`${fieldId}-target`} label="Target">
            <Input
              id={`${fieldId}-target`}
              value={goal.target}
              onChange={(event) => onChange({ target: event.target.value })}
              disabled={disabled}
              placeholder="what success is"
            />
          </Field>
          <Field id={`${fieldId}-data-source`} label="Data source">
            <Input
              id={`${fieldId}-data-source`}
              value={goal.dataSource}
              onChange={(event) => onChange({ dataSource: event.target.value })}
              disabled={disabled}
              placeholder="where the number comes from"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetencyCard({
  competency,
  index,
  commitment,
  disabled,
  onCommitmentChange,
  onRemove,
}: {
  competency: LibraryCompetency;
  index: number;
  commitment: string;
  disabled: boolean;
  onCommitmentChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const fieldId = useId();
  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-muted font-heading text-[0.7rem] font-semibold tabular-nums">
              {index + 1}
            </span>
            <Badge variant={competency.mandatory ? "secondary" : "outline"}>
              {competency.mandatory ? "Fixed for everyone" : "Chosen with coach"}
            </Badge>
          </div>
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              disabled={disabled}
              onClick={onRemove}
              aria-label={`Remove ${competency.name}`}
              title="Remove competency"
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>

        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold leading-snug">{competency.name}</h3>
          <p className="mt-1.5 line-clamp-3 text-[0.8125rem] leading-5 text-muted-foreground">
            {competency.definition}
          </p>
          <div className="-ml-2 mt-1">
            <CompetencyAnchorsDialog competency={competency} />
          </div>
        </div>

        <div className="mt-auto grid gap-1.5">
          <Label htmlFor={`${fieldId}-commitment`}>My commitment</Label>
          <Textarea
            id={`${fieldId}-commitment`}
            value={commitment}
            onChange={(event) => onCommitmentChange(event.target.value)}
            disabled={disabled}
            placeholder="e.g. weekly written project update to all stakeholders"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            One line. This is what the quarterly discussion is judged against.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Save / send controls. Rendered twice — beside the title and again at the
 * foot of the form — so a long charter never needs a scroll back up to act.
 * Only actions that are possible right now are shown; the disabled-button-
 * with-a-status-label pattern is gone.
 */
function CharterActions({
  charter,
  editable,
  canSend,
  approvedAndLocked,
  saving,
  sending,
  hasUnsavedChanges,
  sendAction,
  previousCycleName,
  onCopyPrevious,
  compact = false,
}: {
  charter: Charter | null;
  editable: boolean;
  canSend: boolean;
  approvedAndLocked: boolean;
  saving: boolean;
  sending: boolean;
  /** The form differs from what is stored — Save is live and Send must wait. */
  hasUnsavedChanges: boolean;
  sendAction: (formData: FormData) => void;
  previousCycleName: string | null;
  onCopyPrevious: (() => void) | null;
  compact?: boolean;
}) {
  const saveLabel = saving
    ? "Saving…"
    : !hasUnsavedChanges
      ? "Saved"
      : approvedAndLocked
        ? "Save revision"
        : "Save draft";
  // Save leads while there is nothing else to do; once a clean draft can be
  // sent, Send takes over as the primary action.
  const savePrimary = editable && (!canSend || hasUnsavedChanges);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && onCopyPrevious && previousCycleName ? (
        <Button type="button" variant="ghost" onClick={onCopyPrevious}>
          <Copy />
          Copy from {previousCycleName}
        </Button>
      ) : null}
      {!compact && charter ? (
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href={`/book/${charter.participantId}`} target="_blank" />}
        >
          <Printer />
          Print / PDF
        </Button>
      ) : null}
      {editable ? (
        <Button
          type="submit"
          variant={savePrimary ? "default" : "outline"}
          disabled={saving || sending || !hasUnsavedChanges}
        >
          {!saving && !hasUnsavedChanges ? <Check /> : <Save />}
          {saveLabel}
        </Button>
      ) : null}
      {canSend ? (
        <Button
          type="submit"
          variant={hasUnsavedChanges ? "outline" : "default"}
          formAction={sendAction}
          disabled={saving || sending || hasUnsavedChanges}
          title={hasUnsavedChanges ? "Save your changes before sending" : undefined}
        >
          <Send />
          {sending ? "Sending…" : "Send to my coach"}
        </Button>
      ) : null}
    </div>
  );
}

export function CharterEditor({
  cycle,
  charter,
  previousCharter,
  previousCycleName,
  competencyIds,
  personName,
  unitName,
  coachName,
}: {
  cycle: CycleSummary;
  charter: Charter | null;
  previousCharter: Charter | null;
  previousCycleName: string | null;
  /** Competency name to its `public.competencies` id, from the loaded library. */
  competencyIds: Record<string, number>;
  personName: string;
  unitName: string;
  coachName: string | null;
}) {
  const fixed = fixedCompetenciesFor();
  const [saveState, saveAction, saving] = useActionState(saveCharter, { error: null });
  const [sendState, sendAction, sending] = useActionState(async () => submitCharter(), {
    error: null,
  } as CharterActionResult);

  const status = charter?.status ?? "draft";
  const approvedAndLocked = status === "approved_locked";
  const editable = charter === null || CHARTER_EDITABLE.includes(status) || approvedAndLocked;
  const canSend = charter !== null && CHARTER_EDITABLE.includes(status);

  // A saved charter seeds the editor; an unsaved one starts with a single row
  // so there is always something to type into.
  const [nextId, setNextId] = useState(() => (charter?.goals.length ?? 0) + 2);
  const [goals, setGoals] = useState<GoalDraft[]>(() =>
    charter && charter.goals.length > 0
      ? charter.goals.map((goal) => ({
          id: `goal-${goal.id}`,
          objective: goal.outcome,
          keyResult: goal.keyResult,
          baseline: goal.baseline,
          target: goal.target,
          dataSource: goal.dataSource,
        }))
      : [emptyGoal("goal-1")],
  );
  const [commitments, setCommitments] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (charter?.competencies ?? []).map((competency) => [competency.name, competency.commitment]),
    ),
  );
  const [chosen, setChosen] = useState<LibraryCompetency[]>(() => {
    const fixedNames = new Set(fixed.map((competency) => competency.name));
    return (charter?.competencies ?? [])
      .filter((competency) => !fixedNames.has(competency.name))
      .map((competency) => competencyByName(competency.name))
      .filter((competency): competency is LibraryCompetency => Boolean(competency));
  });

  const goalsLeft = cycle.maxGoals - goals.length;
  const stillToChoose = CHARTER_CHOSEN_COMPETENCIES - chosen.length;
  const totalCompetencies = fixed.length + CHARTER_CHOSEN_COMPETENCIES;
  const libraryLoaded = Object.keys(competencyIds).length > 0;

  const copyPreviousCharter = () => {
    if (!previousCharter) return;

    setGoals(
      previousCharter.goals.map((goal, index) => ({
        id: `goal-previous-${index + 1}`,
        objective: goal.outcome,
        keyResult: goal.keyResult,
        baseline: goal.baseline,
        target: goal.target,
        dataSource: goal.dataSource,
      })),
    );
    setCommitments(
      Object.fromEntries(
        previousCharter.competencies.map((competency) => [competency.name, competency.commitment]),
      ),
    );
    setChosen(
      previousCharter.competencies
        .filter((competency) => !fixed.some((item) => item.name === competency.name))
        .map((competency) => competencyByName(competency.name))
        .filter((competency): competency is LibraryCompetency => Boolean(competency)),
    );
  };

  const addGoal = (example?: OkrExample) => {
    if (goalsLeft <= 0) return;
    const id = `goal-${nextId}`;
    setNextId((value) => value + 1);
    setGoals((current) => [...current, example ? goalFromExample(id, example) : emptyGoal(id)]);
  };

  const pickCompetency = (competency: LibraryCompetency) =>
    setChosen((current) =>
      current.length >= CHARTER_CHOSEN_COMPETENCIES ? current : [...current, competency],
    );

  /* The two hidden payloads the action parses. Serialising here keeps the
     order on screen identical to the order that is stored. */
  const goalsPayload = JSON.stringify(
    goals.map((goal) => ({
      outcome: goal.objective,
      keyResult: goal.keyResult,
      baseline: goal.baseline,
      target: goal.target,
      dataSource: goal.dataSource,
    })),
  );

  const competenciesPayload = JSON.stringify(
    [...fixed, ...chosen]
      .map((competency) => ({
        competencyId: competencyIds[competency.name],
        selectionType: competency.mandatory ? "fixed" : "selected",
        commitment: commitments[competency.name] ?? "",
      }))
      .filter((entry) => Number.isInteger(entry.competencyId)),
  );

  /* Dirty tracking. The stored charter is the baseline; a successful save
     moves the baseline to whatever was on screen when Save was pressed, so
     edits made while the request was in flight still count as unsaved. */
  const currentPayload = `${goalsPayload}|${competenciesPayload}`;
  const [savedPayload, setSavedPayload] = useState<string | null>(() =>
    charter ? currentPayload : null,
  );
  const pendingPayload = useRef<string | null>(null);
  const hasUnsavedChanges = savedPayload !== currentPayload;

  const save = (formData: FormData) => {
    pendingPayload.current = currentPayload;
    saveAction(formData);
  };

  useEffect(() => {
    if (saveState.error === null && saveState.message && pendingPayload.current !== null) {
      setSavedPayload(pendingPayload.current);
      pendingPayload.current = null;
    }
  }, [saveState]);

  // Closing the tab or reloading with unsaved edits asks first.
  useEffect(() => {
    if (!hasUnsavedChanges || !editable) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, editable]);

  const message = saveState.message ?? sendState.message ?? null;
  const error = saveState.error ?? sendState.error ?? null;
  const libraryError = !libraryLoaded
    ? "The competency library has not been loaded into this workspace yet, so competency commitments cannot be saved. An administrator loads it from Cycles & settings."
    : null;
  const errorMessage = error ?? libraryError;
  const [errorDialogOpen, setErrorDialogOpen] = useState(Boolean(errorMessage));

  useEffect(() => {
    if (errorMessage) setErrorDialogOpen(true);
  }, [errorMessage]);

  const actionProps = {
    charter,
    editable,
    canSend,
    approvedAndLocked,
    saving,
    sending,
    hasUnsavedChanges,
    sendAction,
    previousCycleName,
    onCopyPrevious: previousCharter ? copyPreviousCharter : null,
  };

  // What the foot of the form says depends on where the charter is on its path.
  const footer = !editable
    ? {
        title: CHARTER_STATUS_LABELS[status],
        body: `Your coach reviews first — refining targets and checking measurability — then ${APPROVER_LABEL} gives final approval. You can edit again if changes are requested.`,
      }
    : approvedAndLocked
      ? {
          title: "Revise this charter",
          body: "This charter is approved and locked for the cycle. Saving a revision keeps the approved version in the change history.",
        }
      : canSend && hasUnsavedChanges
        ? {
            title: "You have unsaved changes",
            body: "Save the draft first so your coach sees the latest version, then send it for review.",
          }
        : canSend
          ? {
              title: "Ready to send?",
              body: `Your coach reviews first — refining targets and checking measurability — then ${APPROVER_LABEL} gives final approval. After that the charter is locked for the cycle.`,
            }
          : {
              title: "Save a draft first",
              body: "Once a draft is saved you can send it to your coach. Nothing is shared until you do.",
            };

  return (
    <form action={save} className="space-y-10">
      <input type="hidden" name="goals" value={goalsPayload} />
      <input type="hidden" name="competencies" value={competenciesPayload} />

      <div className="grid gap-8">
        <CharterApprovalStrip currentStep={charterStepForStatus(status)} />

        <div className="flex flex-col gap-5 border-b pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{cycle.name}</Eyebrow>
              <StatusBadge status={status} />
            </div>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-[2rem]">
              Goal Charter
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{personName}</span> &middot; {unitName}
              {coachName ? (
                <>
                  {" "}
                  &middot; Coach <span className="font-medium text-foreground">{coachName}</span>
                </>
              ) : null}
            </p>
          </div>
          <CharterActions {...actionProps} />
        </div>
      </div>

      <Dialog open={Boolean(errorMessage) && errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check your charter</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {message && !error && !hasUnsavedChanges ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {charter?.decisions.length ? (
        <section>
          <Eyebrow className="mb-3">Review history</Eyebrow>
          <Card size="sm">
            <CardContent className="divide-y">
              {charter.decisions.map((decision) => (
                <div key={decision.id} className="grid gap-1 py-3 text-sm first:pt-0 last:pb-0">
                  <p>
                    <span className="font-medium">{decision.actorName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      &middot; {decision.capacity === "coach" ? "Coach" : APPROVER_LABEL} &middot;{" "}
                      {decision.decision.replace(/_/g, " ")}
                    </span>
                  </p>
                  {decision.comment ? (
                    <p className="leading-6 text-muted-foreground">{decision.comment}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <SectionHeading
          title="Goals"
          description={`Maximum ${cycle.maxGoals}. Every goal needs a measurable key result and a named data source.`}
          meta={
            <CountMeter
              value={goals.length}
              max={cycle.maxGoals}
              label={`${goals.length} of ${cycle.maxGoals} goals`}
            />
          }
          actions={
            <>
              <GoalLibraryDialog
                defaultUnit={unitName}
                disabled={goalsLeft <= 0 || !editable}
                onPick={addGoal}
              />
              <Button
                type="button"
                variant="outline"
                disabled={goalsLeft <= 0 || !editable}
                onClick={() => addGoal()}
              >
                <Plus />
                Write my own
              </Button>
            </>
          }
        />
        <div className="grid gap-4">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              disabled={!editable}
              onChange={(patch) =>
                setGoals((current) =>
                  current.map((item) => (item.id === goal.id ? { ...item, ...patch } : item)),
                )
              }
              onRemove={() => setGoals((current) => current.filter((item) => item.id !== goal.id))}
            />
          ))}
          {goals.length === 0 ? (
            <div className="grid place-items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                No goals yet. Pick from the library for your unit, or write your own. Either way,
                adapt the wording to your real work.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <GoalLibraryDialog defaultUnit={unitName} disabled={!editable} onPick={addGoal} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!editable}
                  onClick={() => addGoal()}
                >
                  <Plus />
                  Write my own
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t pt-9">
        <SectionHeading
          title="Competencies"
          description={`${fixed.length} fixed for everyone, ${CHARTER_CHOSEN_COMPETENCIES} chosen with your coach. Each carries a one-line commitment.`}
          meta={
            <CountMeter
              value={fixed.length + chosen.length}
              max={totalCompetencies}
              label={`${fixed.length + chosen.length} of ${totalCompetencies} competencies`}
            />
          }
          actions={
            <CompetencyPickerDialog
              taken={chosen.map((item) => item.name)}
              disabled={stillToChoose <= 0 || !editable}
              onPick={pickCompetency}
            />
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...fixed, ...chosen].map((competency, index) => (
            <CompetencyCard
              key={competency.name}
              competency={competency}
              index={index}
              commitment={commitments[competency.name] ?? ""}
              disabled={!editable}
              onCommitmentChange={(value) =>
                setCommitments((current) => ({ ...current, [competency.name]: value }))
              }
              onRemove={
                competency.mandatory
                  ? undefined
                  : () =>
                      setChosen((current) =>
                        current.filter((item) => item.name !== competency.name),
                      )
              }
            />
          ))}
          {/* One placeholder per competency still to choose. The slot number is
              its position in the charter, which is what makes it a stable key. */}
          {Array.from(
            { length: Math.max(stillToChoose, 0) },
            (_, slot) => fixed.length + chosen.length + slot + 1,
          ).map((position) => (
            <div
              key={`open-slot-${position}`}
              className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center"
            >
              <span className="grid size-6 place-items-center rounded-md bg-muted font-heading text-[0.7rem] font-semibold tabular-nums text-muted-foreground">
                {position}
              </span>
              <p className="max-w-[16rem] text-[0.8125rem] leading-5 text-muted-foreground">
                Open slot. Pick a competency from the library that matches the work of this cycle.
              </p>
              <CompetencyPickerDialog
                taken={chosen.map((item) => item.name)}
                disabled={!editable}
                onPick={pickCompetency}
              />
            </div>
          ))}
        </div>
      </section>

      <Card className={cn(!editable && "bg-accent/30")}>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="font-heading text-base font-semibold">{footer.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{footer.body}</p>
          </div>
          <div className="shrink-0">
            <CharterActions {...actionProps} compact />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
