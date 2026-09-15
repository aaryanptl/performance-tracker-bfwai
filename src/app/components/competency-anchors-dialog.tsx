"use client";

import { BookOpenText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LibraryCompetency } from "@/lib/types";

const ANCHORS = [
  { value: 5, key: "l5" as const, label: "A 5 looks like" },
  { value: 3, key: "l3" as const, label: "A 3 looks like" },
  { value: 1, key: "l1" as const, label: "A 1 looks like" },
];

/** The library's level descriptions for one competency — what a 5, a 3 and a 1 look like. */
export function CompetencyAnchorsDialog({ competency }: { competency: LibraryCompetency }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`What a 5, 3 and 1 look like for ${competency.name}`}
          />
        }
      >
        <BookOpenText />5 · 3 · 1 guide
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-5 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{competency.name}</DialogTitle>
          <DialogDescription>{competency.definition}</DialogDescription>
        </DialogHeader>
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            How it is measured
          </p>
          <p className="mt-1 text-sm leading-6">{competency.measure}</p>
        </div>
        <div className="grid gap-2">
          {ANCHORS.map((anchor) => (
            <div
              key={anchor.value}
              className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-lg border p-3.5"
            >
              <span
                className={
                  anchor.value === 5
                    ? "grid size-9 place-items-center rounded-md bg-primary font-heading text-base font-semibold text-primary-foreground"
                    : "grid size-9 place-items-center rounded-md bg-muted font-heading text-base font-semibold text-foreground"
                }
              >
                {anchor.value}
              </span>
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {anchor.label}
                </p>
                <p className="mt-1 text-sm leading-6">{competency[anchor.key]}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
