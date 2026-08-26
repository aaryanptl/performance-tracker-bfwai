import { PageHeader } from "@/app/components/page-header";
import { ImpactForm } from "@/app/components/performance-forms";

export default function ImpactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quarterly evidence"
        title="Impact statements"
        description="A concise account of what changed, the evidence behind it, and the learning you will carry into the next quarter."
      />
      <ImpactForm />
    </>
  );
}
