"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LIBRARY_COMPETENCIES, LIBRARY_OKRS } from "@/data/library";
import type { OkrExample } from "@/lib/types";

const ALL_UNITS = "All";

export function LibraryBrowser() {
  const [tab, setTab] = useState<"okr" | "competencies">("okr");
  const [unit, setUnit] = useState(ALL_UNITS);

  const units = useMemo(
    () => [
      ALL_UNITS,
      ...new Set([
        ...LIBRARY_OKRS.map((item) => item.unit),
        ...LIBRARY_COMPETENCIES.map((item) => item.unit),
      ]),
    ],
    [],
  );

  const objectives = useMemo(() => {
    const groups = new Map<string, OkrExample[]>();
    for (const example of LIBRARY_OKRS) {
      if (unit !== ALL_UNITS && example.unit !== unit) continue;
      const list = groups.get(example.objective) ?? [];
      list.push(example);
      groups.set(example.objective, list);
    }
    return [...groups];
  }, [unit]);

  const competencies = LIBRARY_COMPETENCIES.filter(
    (item) => unit === ALL_UNITS || item.unit === unit,
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant={tab === "okr" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("okr")}
        >
          Objectives &amp; key results
        </Button>
        <Button
          variant={tab === "competencies" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("competencies")}
        >
          Competencies
        </Button>
        <Select className="ml-auto" value={unit} onValueChange={(value) => setUnit(value ?? "")}>
          <SelectTrigger aria-label="Filter by unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {units.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tab === "okr" ? (
        <div className="grid gap-4">
          {objectives.map(([objective, examples]) => (
            <Card key={objective}>
              <CardHeader>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {examples[0].unit}
                </p>
                <CardTitle>{objective}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[52%]">Key result — pick and adapt</TableHead>
                      <TableHead>How to measure (data source)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examples.map((example) => (
                      <TableRow key={example.kr}>
                        <TableCell className="whitespace-normal">{example.kr}</TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {example.source}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {competencies.map((competency) => (
            <Card key={competency.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {competency.unit}
                      {competency.mandatory ? " · mandatory" : null}
                    </p>
                    <CardTitle className="mt-1">{competency.name}</CardTitle>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {competency.definition}
                    </p>
                  </div>
                  {competency.mandatory ? <Badge>Fixed</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm leading-6">
                  <span className="font-medium">How it is measured:</span>{" "}
                  <span className="text-muted-foreground">{competency.measure}</span>
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "A 5 looks like", text: competency.l5, accent: true },
                    { label: "A 3 looks like", text: competency.l3, accent: false },
                    { label: "A 1 looks like", text: competency.l1, accent: false },
                  ].map((anchor) => (
                    <div
                      key={anchor.label}
                      className={
                        anchor.accent ? "rounded-xl bg-accent/50 p-4" : "rounded-xl bg-muted/50 p-4"
                      }
                    >
                      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {anchor.label}
                      </p>
                      <p className="mt-1 text-sm leading-6">{anchor.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
