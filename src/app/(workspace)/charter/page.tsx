import { Goal } from "lucide-react";
import Link from "next/link";

import { CharterApprovalStrip } from "@/app/components/charter-approval-strip";
import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Button } from "@/components/ui/button";

export default function CharterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cycle 1 · FY2026"
        title="My goal charter"
        description="A maximum of 5 goals — each with a measurable key result, a baseline, a target and a named data source — plus 5 competencies, each carrying a one-line commitment."
        action={
          <Button nativeButton={false} render={<Link href="/charter/edit" />}>
            <Goal />
            Create charter
          </Button>
        }
      />
      <CharterApprovalStrip className="mb-6" />
      <WorkflowEmpty
        icon={Goal}
        title="Your charter is ready to begin"
        description="Draft it, send it to your coach, and Leadership gives the final approval. Once approved it is locked for the cycle and becomes the single reference for what success means."
        actionLabel="Draft my charter"
        href="/charter/edit"
      />
    </>
  );
}
