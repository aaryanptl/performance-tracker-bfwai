"use client";

import { Trash2, TriangleAlert, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { removePerson, savePerson, setPersonActive } from "@/app/(workspace)/admin/people/actions";
import { PersonFormFields } from "@/app/components/person-form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
      router.refresh();
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
      router.refresh();
      close();
    });
  }

  function confirmRemove() {
    if (!person) return;
    startTransition(async () => {
      const result = await removePerson(person.id);
      if (result.error) {
        setRemoveError(result.error);
        return;
      }
      setRemoveOpen(false);
      router.refresh();
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
              <Button
                className="w-full"
                disabled={pending || isViewer}
                onClick={() => {
                  setRemoveError(null);
                  setRemoveOpen(true);
                }}
                type="button"
                variant="destructive"
              >
                <Trash2 />
                Remove from people
              </Button>
              <p className="text-xs text-muted-foreground">
                {isViewer
                  ? "You cannot deactivate or remove your own administrator profile."
                  : "Deactivating keeps every record intact and only removes access."}
              </p>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
      <Dialog
        open={removeOpen}
        onOpenChange={(open) => {
          setRemoveOpen(open);
          if (!open) setRemoveError(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove {person?.name} from people?</DialogTitle>
            <DialogDescription>
              Review the effects before confirming this permanent action.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>This permanently deletes their roster entry.</AlertTitle>
            <AlertDescription>
              Performance records are kept, though some activity links may be cleared. If required
              records still reference this person, removal is blocked and nothing is deleted. Their
              Supabase sign-in account remains, but they lose their Ascend profile and access. This
              cannot be undone.
            </AlertDescription>
          </Alert>
          {removeError ? (
            <Alert variant="destructive">
              <AlertDescription>{removeError}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => setRemoveOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={pending || !person || isViewer}
              onClick={confirmRemove}
              type="button"
              variant="destructive"
            >
              {pending ? "Removing…" : "Permanently remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
