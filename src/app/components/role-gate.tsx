"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPerson } from "@/data/people";
import { useSession } from "@/hooks/use-session";
import type { Role } from "@/lib/types";

export function RoleGate({ children, roles }: { children: React.ReactNode; roles: Role[] }) {
  const { person, ready } = useSession();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  if (!person || !roles.includes(person.role)) {
    return (
      <Alert className="mx-auto max-w-2xl py-5">
        <ShieldAlert />
        <AlertTitle>Not available to you</AlertTitle>
        <AlertDescription>
          This section sits outside your current performance scope. Your sidebar only shows the
          records and workflows available to your role.
        </AlertDescription>
        <div className="col-start-2 mt-3">
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Return to overview
          </Button>
        </div>
      </Alert>
    );
  }
  return children;
}

export function PersonScopeGate({
  children,
  personId,
}: {
  children: React.ReactNode;
  personId: string;
}) {
  const { person, ready } = useSession();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  const target = getPerson(personId);
  const allowed = Boolean(
    person &&
      target &&
      (person.role === "admin" || person.id === target.id || target.coachId === person.id),
  );
  if (!allowed) {
    return (
      <Alert className="mx-auto max-w-2xl py-5">
        <ShieldAlert />
        <AlertTitle>Record outside your scope</AlertTitle>
        <AlertDescription>
          This performance record is not available to the selected identity.
        </AlertDescription>
        <div className="col-start-2 mt-3">
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Return to overview
          </Button>
        </div>
      </Alert>
    );
  }
  return children;
}
