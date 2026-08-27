import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPROVER_LABEL } from "@/data/performance";

const CHECKLIST = [
  "Every goal has a measurable key result, a baseline, a target, and a named data source. A missing data source is the one thing to always send back.",
  "The targets are ambitious but reachable — a well-set charter averages 0.7–0.8 on attainment; a row of straight 1.0s means the goals were set too safe.",
  "The five competency commitments say what the person will actually do, not what the competency is called.",
  "Either sign the review, or return it with a written note saying exactly what must change.",
];

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Coach review"
        title="Charter reviews"
        description={`Review order is fixed: coach first, then ${APPROVER_LABEL}. Nothing changes silently after a conversation.`}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What to check before you sign</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-muted-foreground">
            {CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <WorkflowEmpty
        icon={ShieldCheck}
        title="Nothing waiting on you"
        description="Charters appear here when a coachee sends theirs. After your signature they go for final approval and lock for the cycle."
      />
    </>
  );
}
