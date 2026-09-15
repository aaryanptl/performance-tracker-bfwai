import { Check } from "lucide-react";

import { CHARTER_STEPS } from "@/data/performance";
import type { CharterStatus } from "@/lib/data/performance-types";
import { cn } from "@/lib/utils";

/** The four-step path a charter travels, from draft to locked. */
export function charterStepForStatus(status: CharterStatus | null): number {
  if (status === null || status === "draft") return 1;
  if (status === "approved_locked") return 4;
  if (status === "coach_reviewed") return 3;
  return 2;
}

/**
 * A slim stepper: numbered dots joined by a hairline, with the step that is
 * live right now outlined in brand blue and everything already passed filled.
 */
export function CharterApprovalStrip({
  currentStep = 1,
  className,
}: {
  currentStep?: number;
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {CHARTER_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isLast = index === CHARTER_STEPS.length - 1;
        return (
          <li
            key={step.title}
            aria-current={isCurrent ? "step" : undefined}
            className="grid gap-2.5"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  isCurrent && "bg-card text-primary ring-2 ring-primary ring-inset",
                  !isDone &&
                    !isCurrent &&
                    "bg-card text-muted-foreground ring-1 ring-border ring-inset",
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} /> : stepNumber}
              </span>
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn("h-px flex-1", isDone ? "bg-primary" : "bg-border")}
                />
              ) : null}
            </div>
            <div className="min-w-0 pr-3">
              <p
                className={cn(
                  "font-heading text-sm font-semibold leading-tight",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
