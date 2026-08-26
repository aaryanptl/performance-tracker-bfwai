"use client";

import { PeopleTable } from "@/app/components/people-table";
import { getCoachees } from "@/data/people";
import { useSession } from "@/hooks/use-session";

export function ScopedPeopleTable({ actionBase = "/coaching/coachees" }: { actionBase?: string }) {
  const { person } = useSession();
  if (!person) return null;
  return (
    <PeopleTable people={getCoachees(person.id, person.role === "admin")} actionBase={actionBase} />
  );
}
