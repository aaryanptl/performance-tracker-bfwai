import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Coach review"
        title="Charter approvals"
        description="Check that outcomes are measurable, appropriately weighted, and connected to the person's role before approving."
      />
      <WorkflowEmpty
        icon={ShieldCheck}
        title="No charters waiting"
        description="Submitted charters from people in your coaching scope will appear here."
      />
    </>
  );
}
