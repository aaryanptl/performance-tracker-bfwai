import { PageHeader } from "@/app/components/page-header";
import { PeopleTable } from "@/app/components/people-table";
import { Badge } from "@/components/ui/badge";
import { PEOPLE } from "@/data/people";

export default function PeoplePage() {
  return (
    <>
      <PageHeader
        eyebrow="17 people"
        title="People & coaches"
        description="The source of truth for programme access. A coaching-line change immediately changes which records a coach can reach."
        action={
          <>
            <Badge variant="outline">2 administrators</Badge>
            <Badge variant="outline">6 coaches</Badge>
            <Badge variant="outline">9 members</Badge>
          </>
        }
      />
      <PeopleTable people={PEOPLE} />
    </>
  );
}
