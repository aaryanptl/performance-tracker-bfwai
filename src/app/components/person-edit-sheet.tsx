"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";

import { savePerson, setPersonActive } from "@/app/(workspace)/admin/people/actions";
import { PersonFormFields } from "@/app/components/person-form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RosterPerson, RosterUnit } from "@/lib/data/roster-fields";

export function PersonEditSheet({
  isViewer,
  onOpenChange,
  person,
  units,
}: {
  isViewer: boolean;
  onOpenChange: (open: boolean) => void;
  person: RosterPerson | null;
  units: RosterUnit[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setError(null);
    onOpenChange(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await savePerson(person.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  function toggleActive() {
    if (!person) return;
    startTransition(async () => {
      const result = await setPersonActive(person.id, !person.active);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <Sheet open={person !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent className="gap-0 overflow-y-auto sm:max-w-md">
        {person ? (
          <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>{person.name}</SheetTitle>
              <SheetDescription>
                {person.hasAccount
                  ? "Changes here take effect the next time this person loads a page."
                  : "This person has no sign-in account yet, so they cannot open Ascend."}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 px-6">
              <PersonFormFields
                idPrefix={`edit-${person.id}`}
                key={person.id}
                person={person}
                units={units}
              />
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <SheetFooter className="gap-3">
              <div className="flex gap-2">
                <Button className="flex-1" disabled={pending} type="submit">
                  {pending ? "Saving…" : "Save changes"}
                </Button>
                <Button disabled={pending} onClick={close} type="button" variant="outline">
                  Cancel
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={pending || isViewer}
                onClick={toggleActive}
                type="button"
                variant={person.active ? "destructive" : "outline"}
              >
                {person.active ? <UserMinus /> : <UserPlus />}
                {person.active ? "Deactivate this person" : "Restore this person"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isViewer
                  ? "You cannot deactivate your own account."
                  : "Deactivating keeps every record intact and only removes access."}
              </p>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
