import Link from "next/link";

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
}: {
  participants: ParticipantSummary[];
  /** Which workflow the row's button opens. */
  action: "check-in" | "review" | "record";
  emptyMessage: string;
}) {
  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  const label =
    action === "check-in" ? "Record check-in" : action === "review" ? "Score" : "Open record";

  const hrefFor = (participant: ParticipantSummary) =>
    action === "check-in"
      ? `/coaching/check-ins/${participant.id}`
      : action === "review"
        ? `/coaching/reviews/${participant.id}`
        : `/records/${participant.id}`;

  return (
    <Card>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Coach</TableHead>
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
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={hrefFor(participant)} />}
                    >
                      {label}
                    </Button>
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
