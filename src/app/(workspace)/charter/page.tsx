import { Goal } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/app/components/page-header";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHARTER_STEPS } from "@/data/performance";

export default function CharterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cycle 1 · FY2026"
        title="My goal charter"
        description="A compact agreement about the outcomes you will create, how success will be measured, and which behaviours matter."
        action={
          <Button nativeButton={false} render={<Link href="/charter/edit" />}>
            <Goal />
            Create charter
          </Button>
        }
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Approval path</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {CHARTER_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl border p-4">
              <Badge variant={index === 0 ? "default" : "outline"}>{index + 1}</Badge>
              <div>
                <p className="font-medium">{step}</p>
                <p className="text-xs text-muted-foreground">
                  {index === 0 ? "Ready to begin" : "Waits for prior step"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <WorkflowEmpty
        icon={Goal}
        title="Your charter is ready to begin"
        description="Start with three focused outcomes. Each goal needs a measurable target, evidence source, and weight."
        actionLabel="Draft my charter"
        href="/charter/edit"
      />
    </>
  );
}
