import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  badge,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  badge?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
          <p className="mt-0.5 font-heading text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
