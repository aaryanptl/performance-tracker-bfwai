import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVE_CYCLE, CYCLE_STAGES } from "@/data/performance";
import { cn } from "@/lib/utils";

export function CycleTimeline({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>The cycle</CardTitle>
          <Badge
            variant="secondary"
            className="uppercase tracking-[0.14em] text-[0.65rem] text-muted-foreground"
          >
            {ACTIVE_CYCLE.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol>
          {CYCLE_STAGES.map((stage, index) => {
            const isLast = index === CYCLE_STAGES.length - 1;
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
      </CardContent>
    </Card>
  );
}
