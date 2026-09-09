import { CsvDownloadButton } from "@/app/components/csv-download-button";
import { PageHeader } from "@/app/components/page-header";
import { PeopleRoster } from "@/app/components/people-roster";
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
import { LEVELS } from "@/data/performance";
import { getRoster } from "@/lib/data/roster";
import { EMPLOYMENT_LABELS, type RosterPerson } from "@/lib/data/roster-fields";

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
  "Authority is separate from coaching: Founder and People & HR carry administrator access, everyone else earns the coach role by having coachees.",
];

function tally(people: RosterPerson[], read: (person: RosterPerson) => string) {
  const counts = new Map<string, number>();
  for (const person of people) {
    const value = read(person);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function HeadcountCard({
  title,
  label,
  rows,
  total,
}: {
  title: string;
  label: string;
  rows: [string, number][];
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CsvDownloadButton
              filename={`ascend-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`}
              rows={[
                [label, "Count", "% of org"],
                ...rows.map(([name, count]) => [
                  name,
                  count,
                  total ? Math.round((count / total) * 100) : 0,
                ]),
              ]}
              label="Download CSV"
            />
            <Badge variant="outline">{total} people</Badge>
          </div>
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
                  {total ? Math.round((count / total) * 100) : 0}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function PeoplePage() {
  const roster = await getRoster();
  const active = roster.people.filter((person) => person.active);
  const admins = active.filter((person) => person.role === "admin").length;
  const coaches = active.filter((person) => person.role === "coach").length;
  const members = active.filter((person) => person.role === "member").length;
  const byLevel = tally(active, (person) => `Level ${person.level}`).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <>
      <PageHeader
        eyebrow={`${active.length} people`}
        title="People & coaches"
        description="The source of truth for the roster: names, units, levels, employment, authority, team leaders and coaching lines. A person's coach decides exactly what that coach can read and download, so changing that column changes their access."
        action={
          <>
            <Badge variant="outline">{admins} administrators</Badge>
            <Badge variant="outline">{coaches} coaches</Badge>
            <Badge variant="outline">{members} members</Badge>
          </>
        }
      />
      <PeopleRoster roster={roster} />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HeadcountCard
          title="Headcount by unit"
          label="Unit"
          rows={tally(active, (person) => person.unitName)}
          total={active.length}
        />
        <HeadcountCard
          title="Headcount by year-at-level"
          label="Level (YAL)"
          rows={byLevel}
          total={active.length}
        />
        <HeadcountCard
          title="Headcount by employment type"
          label="Employment type"
          rows={tally(active, (person) => EMPLOYMENT_LABELS[person.employment])}
          total={active.length}
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
