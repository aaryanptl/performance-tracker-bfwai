import { PageHeader } from "@/app/components/page-header";
import { ScopedPeopleTable } from "@/app/components/scoped-people-table";

export default function CoacheesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Direct scope"
        title="Coachees"
        description="See each person's charter readiness, coaching cadence, evidence, and review status without crossing coaching lines."
      />
      <ScopedPeopleTable />
    </>
  );
}
