import { PageHeader } from "@/app/components/page-header";
import { CharterForm } from "@/app/components/performance-forms";

export default function EditCharterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Draft"
        title="Build a goal charter with evidence built in."
        description="Keep the charter small enough to guide decisions. Three clear goals are usually stronger than five overlapping ones."
      />
      <CharterForm />
    </>
  );
}
