"use client";

import { Info } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_WEIGHTS, RATINGS, SCORE_BANDS } from "@/data/performance";
import { cn } from "@/lib/utils";

/** Info button + dialog explaining how a quarterly score is built and what each rating means. */
export function ScoringGuideDialog() {
  const { okr, competency } = DEFAULT_WEIGHTS;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label="How the number is built">
            <Info />
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] gap-5 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>How the number is built</DialogTitle>
          <DialogDescription>
            Scores are given every quarter. The half-yearly score is the plain average of the two;
            the annual score is the average of the halves.
          </DialogDescription>
        </DialogHeader>
        <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 marker:text-muted-foreground">
          <li>
            Each goal in your charter is scored 0.0&ndash;1.0 against its target, from the named
            data source.
          </li>
          <li>
            The average converts to <span className="font-medium">Score 1</span>:{" "}
            {SCORE_BANDS.map((band, index) => (
              <Fragment key={band.rating}>
                {index > 0 ? " · " : null}
                {band.range} &rarr; {band.rating}
              </Fragment>
            ))}
            .
          </li>
          <li>
            Your five competency commitments are discussed orally; your coach records one rating out
            of 5 as <span className="font-medium">Score 2</span>.
          </li>
          <li>
            <span className="font-medium">
              Quarterly score = (Score 1 &times; {okr}) + (Score 2 &times; {competency})
            </span>
            , calibrated across all coaches before release.
          </li>
        </ol>
        <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rating</TableHead>
                <TableHead className="w-52">Label</TableHead>
                <TableHead>Meaning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RATINGS.map((rating) => (
                <TableRow key={rating.value} className={cn(rating.value === 3 && "bg-accent/40")}>
                  <TableCell className="font-semibold tabular-nums">{rating.value}</TableCell>
                  <TableCell className="font-medium">{rating.label}</TableCell>
                  <TableCell className="text-muted-foreground">{rating.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
