import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHECKIN_STAGES } from "@/data/performance";

const TOTAL = CHECKIN_STAGES.reduce((minutes, stage) => minutes + stage.minutes, 0);

/** The four-stage, 15-minute check-in framework the coach runs in the room. */
export function CheckInFramework({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>The {TOTAL}-minute framework</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {CHECKIN_STAGES.map((stage, index) => (
          <div key={stage.key} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {stage.title}{" "}
                <span className="font-normal text-muted-foreground">· {stage.minutes} min</span>
              </p>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{stage.prompt}</p>
            </div>
          </div>
        ))}
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Listen roughly 70/30 in their favour. Ask before offering solutions. Complete the form in
          the room &mdash; it takes two minutes.
        </p>
      </CardContent>
    </Card>
  );
}
