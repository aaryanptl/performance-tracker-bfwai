"use client";

import { Pencil, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { assignCoach, type RosterActionResult } from "@/app/(workspace)/admin/people/actions";
import { AddPersonDialog } from "@/app/components/add-person-dialog";
import { PersonEditSheet } from "@/app/components/person-edit-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initials } from "@/data/people";
import { EMPLOYMENT_LABELS, type Roster, type RosterPerson } from "@/lib/data/roster-fields";

const ROLE_BADGE = {
  admin: "default",
  coach: "secondary",
  member: "outline",
} as const;

export function PeopleRoster({ roster }: { roster: Roster }) {
  const { people, units, viewerId } = roster;
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [coachDrafts, setCoachDrafts] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const coachOptions = useMemo(
    () =>
      people
        .filter((person) => person.active)
        .map((person) => ({ id: person.id, name: person.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      if (!person.active && !showInactive) return false;
      if (!needle) return true;
      return [person.name, person.email, person.title, person.unitName].some((field) =>
        field.toLowerCase().includes(needle),
      );
    });
  }, [people, query, showInactive]);

  const inactiveCount = people.filter((person) => !person.active).length;
  const editing = people.find((person) => person.id === editingId) ?? null;

  function changeCoach(person: RosterPerson, value: string) {
    setCoachDrafts((current) => ({ ...current, [person.id]: value }));
    setBusyId(person.id);
    setMessage(null);
    startTransition(async () => {
      const result: RosterActionResult = await assignCoach(person.id, value ? Number(value) : null);
      setBusyId(null);
      setCoachDrafts((current) => {
        const next = { ...current };
        delete next[person.id];
        return next;
      });
      if (result.error) setMessage(result.error);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search the roster"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, position or unit"
            value={query}
          />
        </div>
        <div className="flex items-center gap-2">
          {inactiveCount > 0 ? (
            <Button onClick={() => setShowInactive((value) => !value)} size="sm" variant="ghost">
              {showInactive ? "Hide" : "Show"} {inactiveCount} inactive
            </Button>
          ) : null}
          <AddPersonDialog coaches={coachOptions} units={units} />
        </div>
      </div>

      {message ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="min-w-44">Coach</TableHead>
                <TableHead className="text-right">Coachees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((person) => (
                <TableRow key={person.id} className={person.active ? undefined : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{person.name}</p>
                          <Badge variant={ROLE_BADGE[person.role]} className="capitalize">
                            {person.role}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">{person.title}</TableCell>
                  <TableCell className="whitespace-normal">{person.unitName}</TableCell>
                  <TableCell>
                    <p className="whitespace-nowrap">Level {person.level}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {EMPLOYMENT_LABELS[person.employment]}
                    </p>
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      aria-label={`Coach of ${person.name}`}
                      className="w-full"
                      disabled={busyId === person.id}
                      onChange={(event) => changeCoach(person, event.target.value)}
                      size="sm"
                      value={coachDrafts[person.id] ?? String(person.coachId ?? "")}
                    >
                      <NativeSelectOption value="">No coach</NativeSelectOption>
                      {coachOptions
                        .filter((coach) => coach.id !== person.id)
                        .map((coach) => (
                          <NativeSelectOption key={coach.id} value={String(coach.id)}>
                            {coach.name}
                          </NativeSelectOption>
                        ))}
                    </NativeSelect>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{person.coacheeCount}</TableCell>
                  <TableCell>
                    <Badge variant={person.active ? "outline" : "destructive"}>
                      {person.active ? "Active" : "Inactive"}
                    </Badge>
                    {person.active && !person.hasAccount ? (
                      <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                        No sign-in yet
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      aria-label={`Edit ${person.name}`}
                      onClick={() => setEditingId(person.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={8}>
                    No one on the roster matches that search.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        The coach column saves as soon as you choose, because it is the access boundary: a new
        coaching line opens and the old one closes. Everything else about a person — name, email,
        position, unit, level, employment and authority — is edited in one panel behind{" "}
        <span className="font-medium text-foreground">Edit</span>.
      </p>

      <PersonEditSheet
        isViewer={editing?.id === viewerId}
        onOpenChange={(open) => setEditingId(open ? editingId : null)}
        person={editing}
        units={units}
      />
    </div>
  );
}
