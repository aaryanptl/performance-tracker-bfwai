"use client";

import { UserPlus } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";

import { addPerson } from "@/app/(workspace)/admin/people/actions";
import { PersonFormFields } from "@/app/components/person-form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { RosterUnit } from "@/lib/data/roster-fields";

export function AddPersonDialog({
  coaches,
  units,
}: {
  coaches: { id: number; name: string }[];
  units: RosterUnit[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await addPerson({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setError(null);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus /> Add a person
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a person to the roster</DialogTitle>
          <DialogDescription>
            This creates the roster row. Sign-in credentials are issued separately by running
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">pnpm provision:users</code>,
            which sends a temporary password to anyone who does not have an account yet.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <PersonFormFields idPrefix="add" units={units} />
          <div className="grid gap-2">
            <Label htmlFor="add-coach">Coach</Label>
            <NativeSelect className="w-full" defaultValue="" id="add-coach" name="coachId">
              <NativeSelectOption value="">Assign later</NativeSelectOption>
              {coaches.map((coach) => (
                <NativeSelectOption key={coach.id} value={String(coach.id)}>
                  {coach.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Adding…" : "Add to the roster"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
