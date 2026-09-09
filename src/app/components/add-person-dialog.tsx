"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const router = useRouter();

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
      router.refresh();
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
            This creates the roster row. After adding them, use Send invite in the roster to create
            or link their Supabase Auth account.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <PersonFormFields idPrefix="add" units={units} />
          <div className="grid gap-2">
            <Label htmlFor="add-coach">Coach</Label>
            <Select className="w-full" defaultValue="" name="coachId">
              <SelectTrigger id="add-coach">
                <SelectValue>
                  {(value) =>
                    coaches.find((coach) => String(coach.id) === value)?.name ?? "Assign later"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Assign later</SelectItem>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={String(coach.id)}>
                    {coach.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
