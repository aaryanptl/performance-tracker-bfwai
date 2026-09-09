import Link from "next/link";

import { CsvDownloadButton } from "@/app/components/csv-download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantSummary } from "@/lib/data/performance-types";

/**
 * The people in a cycle that the caller may act on.
 *
 * The list is passed in already scoped — it comes from `getVisibleParticipants`,
 * which reads through row-level security — so this component only decides what
 * to show, never who may be shown.
 */
export function ParticipantTable({
  participants,
  action,
  emptyMessage,
  summaries,
  periods,
}: {
  participants: ParticipantSummary[];
  /** Which workflow the row's button opens. */
  action: "check-in" | "review" | "record" | "coachee";
  emptyMessage: string;
  summaries?: Record<number, ParticipantTableSummary>;
  periods?: { id: number; name: string }[];
}) {
  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  const label =
    action === "check-in"
      ? "Record check-in"
      : action === "review"
        ? "Score"
        : action === "coachee"
          ? "Open"
          : "Read";

  const hrefFor = (participant: ParticipantSummary) =>
    action === "check-in"
      ? `/coaching/check-ins/${participant.id}`
      : action === "review"
        ? `/coaching/reviews/${participant.id}`
        : action === "coachee"
          ? `/coaching/coachees/${participant.id}`
          : `/records/${participant.id}`;

  const csvRows = [
    [
      "Name",
      "Email",
      "Title",
      "Unit",
      "Level",
      "Coach",
      ...(summaries
        ? [
            "Charter",
            "Check-ins",
            ...(periods?.map((period) => period.name) ?? []),
            "Impact",
            "Score",
          ]
        : []),
    ],
    ...participants.map((participant) => {
      const summary = summaries?.[participant.id];
      return [
        participant.personName,
        participant.personEmail,
        participant.title,
        participant.unitName,
        participant.jobLevel,
        participant.coachName ?? "",
        ...(summaries
          ? [
              summary?.charterStatus ?? `${summary?.goalCount ?? 0} goals`,
              `${summary?.checkInCount ?? 0}/${summary?.checkInTarget ?? 6}`,
              ...(periods?.map((period) => summary?.quarterScores?.[period.id] ?? "") ?? []),
              periods?.length
                ? periods
                    .filter((period) => summary?.impactPeriods?.[period.id])
                    .map((period) => period.name)
                    .join("; ")
                : (summary?.impactCount ?? 0),
              summary?.latestScore ?? "",
            ]
          : []),
      ];
    }),
  ];

  const filename =
    action === "check-in"
      ? "ascend-check-ins-people.csv"
      : action === "review"
        ? "ascend-scoring-people.csv"
        : action === "coachee"
          ? "ascend-coachees.csv"
          : "ascend-records-people.csv";

  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 px-0">
        <div className="flex justify-end px-4 pt-4">
          <CsvDownloadButton filename={filename} rows={csvRows} label="Download table CSV" />
        </div>
        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Coach</TableHead>
                {summaries ? <TableHead>Charter</TableHead> : null}
                {summaries ? <TableHead>Check-ins</TableHead> : null}
                {summaries
                  ? periods?.map((period) => <TableHead key={period.id}>{period.name}</TableHead>)
                  : null}
                {summaries ? <TableHead>Impact</TableHead> : null}
                {summaries ? <TableHead>Score</TableHead> : null}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.personName}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.title}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.unitName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">L{participant.jobLevel}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {participant.coachName ?? "—"}
                  </TableCell>
                  {summaries ? (
                    <TableCell>
                      {summaries[participant.id]?.charterStatus ??
                        `${summaries[participant.id]?.goalCount ?? 0} goals`}
                    </TableCell>
                  ) : null}
                  {summaries ? (
                    <TableCell className="tabular-nums">
                      {summaries[participant.id]?.checkInCount ?? 0}/
                      {summaries[participant.id]?.checkInTarget ?? 6}
                    </TableCell>
                  ) : null}
                  {summaries
                    ? periods?.map((period) => {
                        const score = summaries[participant.id]?.quarterScores?.[period.id];
                        return (
                          <TableCell key={period.id} className="font-medium tabular-nums">
                            {score === undefined || score === null ? "—" : score.toFixed(2)}
                          </TableCell>
                        );
                      })
                    : null}
                  {summaries ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {periods?.length
                          ? periods.map((period) => (
                              <Badge
                                key={period.id}
                                variant={
                                  summaries[participant.id]?.impactPeriods?.[period.id]
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {period.name}
                              </Badge>
                            ))
                          : (summaries[participant.id]?.impactCount ?? 0)}
                      </div>
                    </TableCell>
                  ) : null}
                  {summaries ? (
                    <TableCell className="font-medium tabular-nums">
                      {summaries[participant.id]?.latestScore?.toFixed(2) ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={hrefFor(participant)} />}
                      >
                        {label}
                      </Button>
                      {action === "record" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<Link href={`/book/${participant.id}`} target="_blank" />}
                        >
                          Download
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export interface ParticipantTableSummary {
  goalCount: number;
  impactCount: number;
  latestScore: number | null;
  charterStatus?: string;
  checkInCount?: number;
  checkInTarget?: number;
  quarterScores?: Record<number, number | null>;
  impactPeriods?: Record<number, boolean>;
}
