import { PageHeader } from "@/app/components/page-header";
import { PeopleTable } from "@/app/components/people-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PEOPLE } from "@/data/people";
import { LEVELS } from "@/data/performance";
import type { Person } from "@/lib/types";

const ROLE_DUTIES = [
  [
    "member",
    "Drafts their own charter, records what they achieved, writes the Impact Statement, signs check-ins, acknowledges scores with a verbatim comment.",
  ],
  [
    "coach",
    "Everything a member does, plus: reviews coachees' charters, runs and records monthly check-ins, scores each quarter, writes the impact summary and development needs.",
  ],
  [
    "admin",
    "Everything a coach does, plus: final charter approval, calibration and release of scores, people and cycle settings, and download of every record.",
  ],
] as const;

const ALLOCATION_RULES = [
  "Every person has exactly one named coach — including the coaches themselves.",
  "Six to eight coachees is a workable load at 15 minutes a month each plus quarterly scoring.",
  "Any change of coach is communicated one-to-one before it shows up here.",
  "The Coach column is the access control: it decides whose records that coach can open and download.",
];

function tally<K extends keyof Person>(key: K) {
  const counts = new Map<string, number>();
  for (const person of PEOPLE) {
    const value = String(person[key]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function HeadcountCard({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: [string, number][];
}) {
  const total = PEOPLE.length;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{total} people</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{label}</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">% of org</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([name, count]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell className="text-right tabular-nums">{count}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {Math.round((count / total) * 100)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function PeoplePage() {
  const admins = PEOPLE.filter((person) => person.role === "admin").length;
  const coaches = PEOPLE.filter((person) => person.role === "coach").length;
  const members = PEOPLE.filter((person) => person.role === "member").length;
  const byLevel = tally("level")
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, count]) => [`Level ${value}`, count] as [string, number]);

  return (
    <>
      <PageHeader
        eyebrow={`${PEOPLE.length} people`}
        title="People & coaches"
        description="Seeded from the headcount report and maintained here. A person's coach decides exactly what that coach can read and download, so changing that column changes their access."
        action={
          <>
            <Badge variant="outline">{admins} administrators</Badge>
            <Badge variant="outline">{coaches} coaches</Badge>
            <Badge variant="outline">{members} members</Badge>
          </>
        }
      />
      <PeopleTable people={PEOPLE} />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HeadcountCard title="Headcount by unit" label="Unit" rows={tally("unit")} />
        <HeadcountCard title="Headcount by year-at-level" label="Level (YAL)" rows={byLevel} />
        <HeadcountCard
          title="Headcount by employment type"
          label="Employment type"
          rows={tally("employment")}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What each level means</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {LEVELS.map((level) => (
              <div key={level.value} className="flex gap-3">
                <Badge variant="outline" className="shrink-0">
                  {level.label}
                </Badge>
                <p className="text-sm leading-6 text-muted-foreground">{level.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What each role can do</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {ROLE_DUTIES.map(([role, duty]) => (
              <div key={role} className="flex gap-3">
                <Badge variant="outline" className="shrink-0 capitalize">
                  {role}
                </Badge>
                <p className="text-sm leading-6 text-muted-foreground">{duty}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Allocation rules worth keeping</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-muted-foreground">
            {ALLOCATION_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
