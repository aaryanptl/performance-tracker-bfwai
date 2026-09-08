import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CycleSummary } from "@/lib/data/performance-types";
import { cn, formatDate } from "@/lib/utils";

interface Stage {
  id: string;
  title: string;
  detail: string;
  state: "open" | "later";
}

/**
 * The stages of the cycle, derived from the cycle itself.
 *
 * `state` is decided by today's date rather than being written down, so the
 * timeline keeps telling the truth as the cycle runs: a stage is "open" once it
 * has started and stays open until the next one begins.
 */
function stagesFor(cycle: CycleSummary, today: string): Stage[] {
  const weights = `Goals scored 0.0–1.0 → Score 1, competencies discussed → Score 2, combined ${cycle.okrWeight}/${cycle.competencyWeight}.`;

  return [
    {
      id: "goal-setting",
      title: `Goal setting · ${formatDate(cycle.goalWindowStart)} – ${formatDate(cycle.goalWindowEnd)}`,
      detail:
        "You draft → coach reviews → Leadership approves. The approved sheet is your charter for the cycle.",
      state: today <= cycle.goalWindowEnd ? "open" : "later",
    },
    {
      id: "check-ins",
      title: "Monthly check-ins · 15 minutes",
      detail:
        "A two-way conversation. No ratings, no status labels — blockers out, way forward agreed.",
      state: today >= cycle.startDate && today <= cycle.endDate ? "open" : "later",
    },
    ...cycle.quarters.map((quarter) => ({
      id: `quarter-${quarter.id}`,
      title: `${quarter.name} · scoring by ${formatDate(quarter.scoringDueAt ?? quarter.endDate)}`,
      detail: quarter.isFullReview
        ? `${weights} Half-yearly review and feedback session happens here.`
        : weights,
      state: (today >= quarter.startDate && today <= quarter.endDate ? "open" : "later") as
        | "open"
        | "later",
    })),
    {
      id: "close",
      title: "Cycle close",
      detail:
        "Half-yearly score = the average of the two quarters. Annual = the average of the halves.",
      state: today > cycle.endDate ? "open" : "later",
    },
  ];
}

export function CycleTimeline({
  cycle,
  className,
}: {
  cycle: CycleSummary | null;
  className?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const stages = cycle ? stagesFor(cycle, today) : [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>The cycle</CardTitle>
          <Badge
            variant="secondary"
            className="uppercase tracking-[0.14em] text-[0.65rem] text-muted-foreground"
          >
            {cycle?.name ?? "No cycle open"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {cycle === null ? (
          <p className="text-sm leading-6 text-muted-foreground">
            An administrator opens the cycle and enrols the roster. The timeline appears here as
            soon as that happens.
          </p>
        ) : (
          <ol>
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1;
              return (
                <li key={stage.id} className="grid grid-cols-[auto_1fr] gap-x-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1.5 shrink-0 rounded-full border-2 bg-card",
                        stage.state === "open"
                          ? "size-3.5 border-primary"
                          : "size-2.5 border-muted-foreground/35",
                      )}
                    />
                    {isLast ? null : (
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1 w-px flex-1",
                          stage.state === "open" ? "bg-primary/40" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                  <div className={cn(isLast ? "pb-0" : "pb-6")}>
                    <p className="font-heading text-sm font-semibold leading-6">{stage.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
