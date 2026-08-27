import { ShieldCheck } from "lucide-react";

import { ExportActions } from "@/app/components/export-actions";
import { PageHeader } from "@/app/components/page-header";
import { ScopedPeopleTable } from "@/app/components/scoped-people-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROGRAMME_OWNER_LABEL } from "@/data/performance";

const CSV_EXPORTS = [
  [
    "Goal charters",
    "One row per goal: objective, key result, baseline, target, data source, actuals and each quarter's score. Competency commitments follow as their own rows.",
  ],
  [
    "Monthly check-ins",
    "One row per check-in: all four stages, both signatures, and the way forward agreed.",
  ],
  [
    "Impact statements",
    "One row per person per quarter, exactly as written by the team member, with the date shared.",
  ],
  [
    "Quarterly scores",
    "Goal-score average, Score 1, Score 2, the quarterly score, impact summary, development needs, recommendation and all three sign-offs.",
  ],
  [
    "Score summary",
    "One row per person: every quarter's Score 1, Score 2 and quarterly score, the half-yearly score, and the standing recommendation.",
  ],
  [
    "Conversation transcript",
    "Every entry added by a coach or a team member to any record, with author, role and timestamp.",
  ],
  [
    "People and coaching map",
    "One row per person: position, unit, year-at-level, employment type, team leader and coach.",
  ],
] as const;

const DOCUMENTS = [
  [
    "Record book (HTML)",
    "One person's complete file, or everyone in your scope at once, formatted to read and to print or save as PDF. The document to hand over in a promotion discussion, an audit, or an exit.",
  ],
  [
    "Full backup (JSON)",
    `Everything, restorable elsewhere. ${PROGRAMME_OWNER_LABEL} only, because it contains every person's record.`,
  ],
] as const;

export default function RecordsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scope-aware exports"
        title="Records & downloads"
        description="Everything written in Ascend is downloadable: the charters, every monthly check-in, every Impact Statement, every scoring conversation, and the full transcript of what the coach and the team member each put on the record."
        action={<ExportActions />}
      />
      <Alert className="mb-6">
        <ShieldCheck />
        <AlertTitle>The same boundary applies on screen and in downloads</AlertTitle>
        <AlertDescription>
          You see yourself, and a coach also sees the people they coach. Coaches receive their own
          team; administrators receive the organisation. Changing a URL or a download type never
          expands the selected person's coaching scope.
        </AlertDescription>
      </Alert>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spreadsheet exports (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {CSV_EXPORTS.map(([label, detail]) => (
              <div key={label}>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Whole documents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {DOCUMENTS.map(([label, detail]) => (
              <div key={label}>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            ))}
            <p className="text-sm leading-6 text-muted-foreground">
              Individual forms &mdash; charter, check-in, impact statement, review &mdash; also
              print to PDF from their own screens.
            </p>
          </CardContent>
        </Card>
      </div>
      <ScopedPeopleTable actionBase="/records" />
    </>
  );
}
