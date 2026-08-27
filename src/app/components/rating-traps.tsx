import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TRAPS = [
  [
    "Recency bias",
    "Rating the last month instead of the quarter. Re-read the quarter's check-in records before scoring.",
  ],
  [
    "Central tendency",
    "Defaulting everyone to 3 to avoid conversations. If someone exceeded, say 4 and defend it; if they fell short, say 2 and coach it.",
  ],
  [
    "Halo and horns",
    "Letting one win or one visible miss colour everything. Score goals on their numbers; discuss competencies on their own evidence.",
  ],
] as const;

/** The three rating traps a coach is asked to watch for before scoring. */
export function RatingTraps({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Common rating traps</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {TRAPS.map(([name, detail]) => (
          <div key={name}>
            <p className="text-sm font-medium">{name}</p>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
