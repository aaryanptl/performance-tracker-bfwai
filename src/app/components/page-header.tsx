import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  actionBelow = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  actionBelow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-6 border-b pb-6",
        actionBelow
          ? "grid gap-5"
          : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn(actionBelow ? "max-w-4xl" : "max-w-3xl")}>
        {eyebrow ? (
          <Badge variant="outline" className="mb-3">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action ? (
        <div className={cn(!actionBelow && "flex shrink-0 items-center gap-2")}>{action}</div>
      ) : null}
    </div>
  );
}
