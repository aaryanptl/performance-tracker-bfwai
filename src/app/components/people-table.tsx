import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getPerson, initials } from "@/data/people";
import type { Person } from "@/lib/types";

export function PeopleTable({
  people,
  actionBase,
}: {
  people: readonly Person[];
  actionBase?: string;
}) {
  return (
    <Card>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Status</TableHead>
              {actionBase ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => {
              const coach = person.coachId ? getPerson(person.coachId) : undefined;
              return (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{person.unit}</TableCell>
                  <TableCell>Level {person.level}</TableCell>
                  <TableCell>{coach?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Pending</Badge>
                  </TableCell>
                  {actionBase ? (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`${actionBase}/${person.id}`} />}
                      >
                        Open
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
