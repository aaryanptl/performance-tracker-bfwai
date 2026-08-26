import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { ScopedPeopleTable } from "@/app/components/scoped-people-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScoringPage() {
  return (
    <>
      <PageHeader
        eyebrow="Q1 review"
        title="Scoring"
        description="Use outcomes, evidence, monthly conversations, and role expectations to reach a fair rating."
      />
      <Alert className="mb-6">
        <ClipboardCheck />
        <AlertTitle>Reviews are evidence-led</AlertTitle>
        <AlertDescription>
          Start from the agreed charter and observed behaviours. Calibration can adjust consistency
          across teams, but should never invent evidence.
        </AlertDescription>
      </Alert>
      <ScopedPeopleTable actionBase="/coaching/reviews" />
    </>
  );
}
