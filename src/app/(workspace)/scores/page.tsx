import { Trophy } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { ScoringGuideDialog } from "@/app/components/scoring-guide-dialog";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Card, CardContent } from "@/components/ui/card";

const SCORE_PERIODS = [
  { label: "Q1 · Sep–Nov 2026" },
  { label: "Q2 · Dec–Feb 2027" },
  { label: "Half-yearly · (Q1 + Q2) ÷ 2" },
] as const;

export default function ScoresPage() {
  return (
    <>
      <PageHeader
        eyebrow="60% outcomes · 40% competencies"
        title="My scores"
        description="Scores are given every quarter. The half-yearly score is the plain average of the two; the annual score is the average of the halves. Nothing is weighted beyond the 0.6/0.4 split between what you delivered and how."
        action={<ScoringGuideDialog />}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {SCORE_PERIODS.map((period) => (
          <Card key={period.label}>
            <CardContent>
              <p className="font-heading text-3xl font-semibold text-muted-foreground">&mdash;</p>
              <p className="mt-2 text-sm text-muted-foreground">{period.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <WorkflowEmpty
        icon={Trophy}
        title="No scores released yet"
        description="Scores appear here after the quarterly conversation and calibration."
      />
    </>
  );
}
