"use client";

import { LibraryBig, Plus, Printer, Send, Sparkles } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { CharterApprovalStrip } from "@/app/components/charter-approval-strip";
import { CompetencyAnchorsDialog } from "@/app/components/competency-anchors-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { LIBRARY_OKRS } from "@/data/library";
import {
  ACTIVE_CYCLE,
  APPROVER_LABEL,
  CHARTER_CHOSEN_COMPETENCIES,
  choosableCompetencies,
  fixedCompetenciesFor,
} from "@/data/performance";
import { getCoach } from "@/data/people";
import { useSession } from "@/hooks/use-session";
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

const FIELD = "rounded-xl";
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
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
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
          <Button disabled={disabled}>
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
        <NativeSelect
          aria-label="Filter by unit"
          className="w-full sm:w-64"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
        >
          {units.map((name) => (
            <NativeSelectOption key={name} value={name}>
              {name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="grid gap-5">
          {grouped.map(([objective, examples]) => (
            <div key={objective}>
              <Eyebrow>{examples[0].unit}</Eyebrow>
              <p className="mt-1 font-heading text-sm font-semibold">{objective}</p>
              <div className="mt-2 grid gap-2">
                {examples.map((example) => (
                  <Button
                    key={example.kr}
                    variant="outline"
                    className="h-auto w-full justify-start rounded-xl p-3 text-left"
                    onClick={() => {
                      onPick(example);
                      setOpen(false);
                    }}
                  >
                    <span>
                      <span className="block font-normal">{example.kr}</span>
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
}: {
  taken: string[];
  disabled: boolean;
  onPick: (competency: LibraryCompetency) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = choosableCompetencies().filter((item) => !taken.includes(item.name));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={disabled}>
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
              className="h-auto w-full justify-start rounded-xl p-4 text-left"
              onClick={() => {
                onPick(competency);
                setOpen(false);
              }}
            >
              <span>
                <span className="block font-medium">{competency.name}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
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
  onChange,
  onRemove,
}: {
  goal: GoalDraft;
  index: number;
  onChange: (patch: Partial<GoalDraft>) => void;
  onRemove: () => void;
}) {
  const fieldId = useId();
  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Eyebrow>Goal {index + 1}</Eyebrow>
            <Label htmlFor={`${fieldId}-objective`} className="sr-only">
              Goal {index + 1} objective
            </Label>
            <Input
              id={`${fieldId}-objective`}
              value={goal.objective}
              onChange={(event) => onChange({ objective: event.target.value })}
              placeholder="My objective"
              className="mt-1 h-auto rounded-none border-x-0 border-t-0 bg-transparent px-0 pt-0 pb-1.5 font-heading text-base font-semibold placeholder:text-foreground/70 focus-visible:border-b-primary focus-visible:ring-0"
            />
          </div>
          <Button variant="destructive" size="sm" className="shrink-0" onClick={onRemove}>
            Remove
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${fieldId}-key-result`}>Key result &mdash; the measurable outcome</Label>
          <Input
            id={`${fieldId}-key-result`}
            value={goal.keyResult}
            onChange={(event) => onChange({ keyResult: event.target.value })}
            placeholder="the number that proves the objective happened"
            className={FIELD}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-baseline`}>Baseline</Label>
            <Input
              id={`${fieldId}-baseline`}
              value={goal.baseline}
              onChange={(event) => onChange({ baseline: event.target.value })}
              placeholder="where you start"
              className={FIELD}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-target`}>Target</Label>
            <Input
              id={`${fieldId}-target`}
              value={goal.target}
              onChange={(event) => onChange({ target: event.target.value })}
              placeholder="what success is"
              className={FIELD}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-data-source`}>Data source</Label>
            <Input
              id={`${fieldId}-data-source`}
              value={goal.dataSource}
              onChange={(event) => onChange({ dataSource: event.target.value })}
              placeholder="where the number comes from"
              className={FIELD}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetencyCard({
  competency,
  index,
  commitment,
  onCommitmentChange,
  onRemove,
}: {
  competency: LibraryCompetency;
  index: number;
  commitment: string;
  onCommitmentChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const fieldId = useId();
  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>
              Competency {index + 1} &middot;{" "}
              {competency.mandatory ? "Fixed for everyone" : "Chosen with your coach"}
            </Eyebrow>
            <h3 className="mt-1 font-heading text-base font-semibold">{competency.name}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onRemove ? (
              <Button variant="destructive" size="sm" onClick={onRemove}>
                Remove
              </Button>
            ) : null}
            <CompetencyAnchorsDialog competency={competency} />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{competency.definition}</p>
        <div className="grid gap-2">
          <Label htmlFor={`${fieldId}-commitment`}>My commitment &mdash; one line</Label>
          <p className="-mt-1 text-xs text-muted-foreground">
            What you will actually do under this competency. This is what the quarterly discussion
            is judged against.
          </p>
          <Input
            id={`${fieldId}-commitment`}
            value={commitment}
            onChange={(event) => onCommitmentChange(event.target.value)}
            placeholder="e.g. weekly written project update to all stakeholders"
            className={FIELD}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function CharterEditor() {
  const { person } = useSession();
  const coach = getCoach(person);
  const fixed = fixedCompetenciesFor();

  const [nextId, setNextId] = useState(2);
  const [goals, setGoals] = useState<GoalDraft[]>([emptyGoal("goal-1")]);
  const [commitments, setCommitments] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<LibraryCompetency[]>([]);
  const [sent, setSent] = useState(false);

  const goalsLeft = ACTIVE_CYCLE.maxGoals - goals.length;
  const stillToChoose = CHARTER_CHOSEN_COMPETENCIES - chosen.length;

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

  return (
    <div className="space-y-10">
      <CharterApprovalStrip currentStep={sent ? 2 : 1} />

      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Goal Charter &middot; {ACTIVE_CYCLE.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.name} &middot; {person.unit}
            {coach ? ` · coach: ${coach.name}` : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="uppercase tracking-[0.14em] text-[0.65rem] text-muted-foreground"
          >
            {sent ? "With your coach" : "Draft"}
          </Badge>
          <Button disabled={sent} onClick={() => setSent(true)}>
            <Send />
            {sent ? "Sent to your coach" : "Send to my coach"}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Print / PDF
          </Button>
        </div>
      </div>

      <section>
        <SectionHeading
          title="Goals"
          description={`Maximum ${ACTIVE_CYCLE.maxGoals}. Every goal needs a measurable key result and a named data source.`}
          actions={
            <>
              <Badge variant="outline" className="mr-1">
                {goals.length} of {ACTIVE_CYCLE.maxGoals}
              </Badge>
              <GoalLibraryDialog
                defaultUnit={person.unit}
                disabled={goalsLeft <= 0}
                onPick={addGoal}
              />
              <Button variant="outline" disabled={goalsLeft <= 0} onClick={() => addGoal()}>
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
              onChange={(patch) =>
                setGoals((current) =>
                  current.map((item) => (item.id === goal.id ? { ...item, ...patch } : item)),
                )
              }
              onRemove={() => setGoals((current) => current.filter((item) => item.id !== goal.id))}
            />
          ))}
          {goals.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="text-center text-sm text-muted-foreground">
                No goals yet. Pick from the library for your unit, or write your own. Either way,
                adapt the wording to your real work.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section className="border-t pt-8">
        <SectionHeading
          title="Competencies"
          description={`${fixed.length} fixed for everyone, ${CHARTER_CHOSEN_COMPETENCIES} chosen with your coach. Each carries a one-line commitment.`}
          actions={
            <>
              {stillToChoose > 0 ? (
                <Badge className="mr-1 border-amber-500/30 bg-amber-500/12 text-[0.65rem] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                  {stillToChoose} still to choose
                </Badge>
              ) : (
                <Badge variant="outline" className="mr-1">
                  All {fixed.length + CHARTER_CHOSEN_COMPETENCIES} set
                </Badge>
              )}
              <CompetencyPickerDialog
                taken={chosen.map((item) => item.name)}
                disabled={stillToChoose <= 0}
                onPick={pickCompetency}
              />
            </>
          }
        />
        <div className="grid gap-4">
          {[...fixed, ...chosen].map((competency, index) => (
            <CompetencyCard
              key={competency.name}
              competency={competency}
              index={index}
              commitment={commitments[competency.name] ?? ""}
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
          {Array.from({ length: Math.max(stillToChoose, 0) }).map((_, index) => (
            <Card
              key={`open-slot-${fixed.length + chosen.length + index}`}
              className="border-dashed bg-muted/30"
            >
              <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Eyebrow>
                    Competency {fixed.length + chosen.length + index + 1} &middot; Chosen with your
                    coach
                  </Eyebrow>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick one from the library that matches the work of this cycle.
                  </p>
                </div>
                <CompetencyPickerDialog
                  taken={chosen.map((item) => item.name)}
                  disabled={false}
                  onPick={pickCompetency}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className={cn("bg-accent/40", sent && "bg-primary/10")}>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-base font-semibold">
              {sent ? "Sent to your coach" : "Ready to send?"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Your coach reviews first &mdash; refining targets and checking measurability &mdash;
              then {APPROVER_LABEL} gives final approval. After that the charter is locked for the
              cycle.
            </p>
          </div>
          <Button className="shrink-0" disabled={sent} onClick={() => setSent(true)}>
            <Send />
            {sent ? "Sent to your coach" : "Send to my coach"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
