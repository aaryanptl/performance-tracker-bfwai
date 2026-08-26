import { BookOpenCheck, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  {
    number: "01",
    title: "Agree the charter",
    owner: "Member + coach",
    description:
      "Turn cycle priorities into three to five measurable outcomes with evidence sources and weights.",
  },
  {
    number: "02",
    title: "Coach monthly",
    owner: "Coach",
    description:
      "Recognise progress, surface reality, arrange support, and leave with a clear commitment.",
  },
  {
    number: "03",
    title: "Record impact",
    owner: "Member",
    description:
      "At quarter close, explain what changed and provide evidence that another person can verify.",
  },
  {
    number: "04",
    title: "Review and calibrate",
    owner: "Coach + leadership",
    description:
      "Use the charter, evidence, and observed behaviour to reach a consistent, explainable score.",
  },
] as const;

export default function DocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operating guide"
        title="How Ascend works"
        description="One continuous performance record, with clear ownership at every step and no surprises at review time."
      />
      <Alert className="mb-6">
        <BookOpenCheck />
        <AlertTitle>The conversation is the product</AlertTitle>
        <AlertDescription>
          Ascend provides structure and evidence. It does not replace judgement, direct feedback, or
          a useful coaching relationship.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4">
        {STEPS.map((step) => (
          <Card key={step.number}>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Badge>{step.number}</Badge>
                <div className="flex-1">
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription className="mt-2">{step.description}</CardDescription>
                </div>
                <Badge variant="outline">{step.owner}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <CardTitle>Fair-use principles</CardTitle>
          <CardDescription>Standards every participant should expect.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            "Goals are agreed before they are scored.",
            "Evidence is visible to the person being reviewed.",
            "A rating is explained with specific examples.",
            "Access follows direct coaching scope.",
            "Calibration improves consistency, not politics.",
            "Feedback should arrive during the cycle, not at its end.",
          ].map((principle) => (
            <div key={principle} className="flex items-start gap-3 rounded-xl border p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm">{principle}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
