import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { ExportActions } from "@/app/components/export-actions";
import { PageHeader } from "@/app/components/page-header";
import { ParticipantTable } from "@/app/components/participant-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROGRAMME_OWNER_LABEL } from "@/data/performance";
import { buildExports } from "@/lib/data/exports";
import { getVisibleRecords } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

const CSV_EXPORTS = [
  [
    "Goal charters",
    "One row per goal: objective, key result, baseline, target and the named data source, for every person in your scope.",
  ],
  [
    "Monthly check-ins",
    "One row per check-in: progress, blockers, the way forward agreed, and whether the person has signed it.",
  ],
  [
    "Impact statements",
    "One row per entry, exactly as written by the team member, with the quarter and the sharing status.",
  ],
  [
    "Quarterly scores",
    "Goal-attainment average, Score 1, Score 2, the computed quarterly score, the recommendation and the release date.",
  ],
  [
    "Conversation transcript",
    "Every transcript entry attached to a check-in, impact statement, or quarterly review, with its author and timestamp.",
  ],
  [
    "People and coaching map",
    "One row per person: name, email, title, unit, level, coach, charter status and the half-yearly score.",
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

export default async function RecordsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const records = await getVisibleRecords(viewer.supabase);
  const files = buildExports(records);
  const periods = records[0]?.cycle.quarters;
  const summaries = Object.fromEntries(
    records.map((record) => {
      const releasedReviews = record.reviews.filter(
        (review) => review.releasedAt !== null && review.quarterlyScore !== null,
      );
      const latestReview = releasedReviews.at(-1);
      return [
        record.participant.id,
        {
          goalCount: record.charter?.goals.length ?? 0,
          impactCount: record.impactStatements.reduce(
            (count, statement) => count + statement.items.length,
            0,
          ),
          latestScore: latestReview?.calibratedScore ?? latestReview?.quarterlyScore ?? null,
          charterStatus: record.charter ? record.charter.status.replace(/_/g, " ") : "Not started",
          checkInCount: record.checkIns.filter((checkIn) => checkIn.notes !== null).length,
          checkInTarget: 6,
          quarterScores: Object.fromEntries(
            record.reviews.map((review) => [
              review.quarterId,
              review.calibratedScore ?? review.quarterlyScore,
            ]),
          ),
          impactPeriods: Object.fromEntries(
            record.impactStatements
              .filter((statement) => statement.quarterId !== null)
              .map((statement) => [statement.quarterId as number, statement.submittedAt !== null]),
          ),
        },
      ];
    }),
  );

  return (
    <>
      <PageHeader
        eyebrow="Scope-aware exports"
        title="Records & downloads"
        description="Everything written in Ascend is downloadable: the charters, every monthly check-in, every Impact Statement and every scoring conversation — as CSV for analysis, or as a record book to read and print."
        action={<ExportActions exports={files} canDownloadAll={viewer.isAdmin} />}
        actionBelow
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
      <ParticipantTable
        participants={records.map((record) => record.participant)}
        action="record"
        periods={periods}
        summaries={summaries}
        emptyMessage="No records are available yet. A cycle must be open and the roster enrolled."
      />
    </>
  );
}
