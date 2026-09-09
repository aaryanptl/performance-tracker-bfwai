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

export function CharterApprovalStrip({
  currentStep = 1,
  className,
}: {
  currentStep?: number;
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid overflow-hidden rounded-2xl ring-1 ring-foreground/10 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {CHARTER_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;
        return (
          <li
            key={step.title}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 border-border bg-card p-4 sm:not-last:border-r",
              isCurrent && "bg-accent/50",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {stepNumber}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block font-heading text-sm font-semibold",
                  !isCurrent && "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
              <span className="block text-xs text-muted-foreground">{step.detail}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
