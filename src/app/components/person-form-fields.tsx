"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { LEVELS } from "@/data/performance";
import {
  AUTHORITY_LABELS,
  AUTHORITY_ROLES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
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
        <Input
          autoComplete="off"
          defaultValue={person?.title ?? ""}
          id={`${idPrefix}-title`}
          name="title"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
        <NativeSelect
          className="w-full"
          defaultValue={person?.unitId ? String(person.unitId) : ""}
          id={`${idPrefix}-unit`}
          name="unitId"
          required
        >
          <NativeSelectOption value="" disabled>
            Choose a unit
          </NativeSelectOption>
          {units.map((unit) => (
            <NativeSelectOption key={unit.id} value={String(unit.id)}>
              {unit.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-level`}>Year-at-level</Label>
          <NativeSelect
            className="w-full"
            defaultValue={String(person?.level ?? 1)}
            id={`${idPrefix}-level`}
            name="level"
          >
            {levelValues.map((value) => (
              <NativeSelectOption key={value} value={String(value)}>
                Level {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-employment`}>Employment type</Label>
          <NativeSelect
            className="w-full"
            defaultValue={person?.employment ?? "full_time"}
            id={`${idPrefix}-employment`}
            name="employment"
          >
            {EMPLOYMENT_TYPES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {EMPLOYMENT_LABELS[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-authority`}>Authority</Label>
        <NativeSelect
          className="w-full"
          defaultValue={person?.authority ?? "member"}
          id={`${idPrefix}-authority`}
          name="authority"
        >
          {AUTHORITY_ROLES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {AUTHORITY_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          Founder and People &amp; HR carry administrator access. The coach role is not set here —
          it follows from having coachees.
        </p>
      </div>
    </div>
  );
}
