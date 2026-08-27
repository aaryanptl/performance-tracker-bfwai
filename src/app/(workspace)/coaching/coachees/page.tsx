import { CheckInFramework } from "@/app/components/check-in-framework";
import { PageHeader } from "@/app/components/page-header";
import { RatingTraps } from "@/app/components/rating-traps";
import { ScopedPeopleTable } from "@/app/components/scoped-people-table";

export default function CoacheesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Direct scope"
        title="My coachees"
        description="You are a development partner, not a task supervisor. One 15-minute check-in each month, scoring at each quarter end, and one development action per person per cycle."
      />
      <ScopedPeopleTable />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CheckInFramework />
        <RatingTraps />
      </div>
    </>
  );
}
