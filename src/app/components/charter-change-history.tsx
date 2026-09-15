import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHARTER_STATUS_LABELS, type Charter } from "@/lib/data/performance-types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Data sources are often a URL, which has no natural break points — let it wrap anywhere. */
function DataSource({ value }: { value: string }) {
  if (!value) return null;
  const isUrl = /^https?:\/\//i.test(value);
  return (
    <span className="block break-all text-xs">
      <span className="text-muted-foreground/80">Source: </span>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        value
      )}
    </span>
  );
}

export function CharterChangeHistory({ history }: { history: Charter[] }) {
  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change history</CardTitle>
        <p className="text-sm text-muted-foreground">
          Each saved revision is kept as a separate charter version.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {history.map((entry, index) => (
          <details key={entry.id} open={index === 0} className="group/version rounded-lg border">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3 transition-colors hover:bg-muted/50 group-open/version:bg-muted/30">
              <span className="font-medium tabular-nums">Version {entry.version}</span>
              {index === 0 ? <Badge variant="secondary">Current</Badge> : null}
              <Badge variant="outline">{CHARTER_STATUS_LABELS[entry.status]}</Badge>
              <time dateTime={entry.updatedAt} className="ml-auto text-xs text-muted-foreground">
                {formatDate(entry.updatedAt)}
              </time>
            </summary>
            <div className="grid gap-4 border-t p-4 text-sm md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-2 font-medium">Goals</p>
                <ol className="grid gap-2 text-muted-foreground">
                  {entry.goals.map((goal) => (
                    <li key={goal.id} className="min-w-0">
                      <span className="font-medium text-foreground">{goal.outcome}</span>
                      <span className="block">
                        {goal.keyResult} · {goal.baseline} → {goal.target}
                      </span>
                      <DataSource value={goal.dataSource} />
                    </li>
                  ))}
                </ol>
              </div>
              <div className="min-w-0">
                <p className="mb-2 font-medium">Competencies</p>
                <ul className="grid gap-2 text-muted-foreground">
                  {entry.competencies.map((competency) => (
                    <li key={competency.id}>
                      <span className="font-medium text-foreground">{competency.name}</span>
                      <span className="block">{competency.commitment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
