import { CircleGauge, Trophy } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScoresPage() {
  return (
    <>
      <PageHeader
        eyebrow="60% outcomes · 40% competencies"
        title="My scores"
        description="Scores are the result of an evidence-backed conversation, not a substitute for one."
      />
      <Alert className="mb-6">
        <CircleGauge />
        <AlertTitle>How the score is calculated</AlertTitle>
        <AlertDescription>
          Goal delivery contributes 60% and role competencies contribute 40%. Scores remain private
          until the review is complete and released.
        </AlertDescription>
      </Alert>
      <WorkflowEmpty
        icon={Trophy}
        title="No released scores yet"
        description="Your quarterly score will appear here after the review is completed and released to you."
      />
    </>
  );
}
