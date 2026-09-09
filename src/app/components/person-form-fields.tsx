"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS } from "@/data/performance";
import {
  AUTHORITY_LABELS,
  AUTHORITY_ROLES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  POSITION_OPTIONS,
  type RosterPerson,
  type RosterUnit,
} from "@/lib/data/roster-fields";

/** The roster fields, laid out identically wherever a person is added or edited. */
export function PersonFormFields({
  idPrefix,
  person,
  units,
}: {
  idPrefix: string;
  person?: RosterPerson;
  units: RosterUnit[];
}) {
  const levels = LEVELS.map((level) => level.value);
  const levelValues =
    person && !levels.includes(person.level)
      ? [...levels, person.level].sort((a, b) => a - b)
      : levels;
  const positionOptions =
    person?.title && !POSITION_OPTIONS.includes(person.title as (typeof POSITION_OPTIONS)[number])
      ? [person.title, ...POSITION_OPTIONS]
      : POSITION_OPTIONS;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          autoComplete="off"
          defaultValue={person?.name ?? ""}
          id={`${idPrefix}-name`}
          name="name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-email`}>Work email</Label>
        <Input
          autoComplete="off"
          defaultValue={person?.email ?? ""}
          id={`${idPrefix}-email`}
          name="email"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Position</Label>
        <Select className="w-full" defaultValue={person?.title ?? ""} name="title" required>
          <SelectTrigger id={`${idPrefix}-title`}>
            <SelectValue placeholder="Choose a position" />
          </SelectTrigger>
          <SelectContent>
            {positionOptions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
        <Select
          className="w-full"
          defaultValue={person?.unitId ? String(person.unitId) : ""}
          name="unitId"
          required
        >
          <SelectTrigger id={`${idPrefix}-unit`}>
            <SelectValue>
              {(value) => units.find((unit) => String(unit.id) === value)?.name ?? "Choose a unit"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={String(unit.id)}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-level`}>Year-at-level</Label>
          <Select className="w-full" defaultValue={String(person?.level ?? 1)} name="level">
            <SelectTrigger id={`${idPrefix}-level`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levelValues.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  Level {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-employment`}>Employment type</Label>
          <Select
            className="w-full"
            defaultValue={person?.employment ?? "full_time"}
            name="employment"
          >
            <SelectTrigger id={`${idPrefix}-employment`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {EMPLOYMENT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-authority`}>Authority</Label>
        <Select className="w-full" defaultValue={person?.authority ?? "member"} name="authority">
          <SelectTrigger id={`${idPrefix}-authority`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTHORITY_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {AUTHORITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Founder and People &amp; HR carry administrator access. The coach role is not set here —
          it follows from having coachees.
        </p>
      </div>
    </div>
  );
}
