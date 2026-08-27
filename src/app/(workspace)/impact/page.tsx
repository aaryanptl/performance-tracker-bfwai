import { PageHeader } from "@/app/components/page-header";
import { ImpactForm } from "@/app/components/performance-forms";
import { Card, CardContent } from "@/components/ui/card";

export default function ImpactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Written by you"
        title="Impact Statement"
        description="Your account, in your words, of the impact you created — with real numbers. Share it three days before the scoring conversation. This is the only section you write, and it is the most important one."
      />
      <Card className="mb-6 bg-accent/40">
        <CardContent className="text-sm leading-6">
          Your coach reads this before scoring and verifies each claim against the Goal Charter, the
          check-in records, and the named data sources. Once shared it becomes read-only, so the
          record cannot move after the fact.
        </CardContent>
      </Card>
      <ImpactForm />
    </>
  );
}
