import Link from "next/link";
import { redirect } from "next/navigation";
import { CsvDownloadButton } from "@/app/components/csv-download-button";
import { PageHeader } from "@/app/components/page-header";
import { RatingTraps } from "@/app/components/rating-traps";
import { ScoringGuideDialog } from "@/app/components/scoring-guide-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SCORE_BANDS } from "@/data/performance";
import { getActiveCycleForRequest, getVisibleParticipants } from "@/lib/data/cycle";
import { REVIEW_STATUS_LABELS } from "@/lib/data/performance-types";
import { getPersonRecord } from "@/lib/data/person-record";
import { getViewer } from "@/lib/data/viewer";

const STEPS = [
  "Read Part 1 — the Impact Statement, alongside what the person recorded as their actuals.",
  "Score each goal 0.0–1.0 against its target, using the named data source. Delivered fully = 1.0; delivered 80% of the target ≈ 0.8.",
  "The average converts to Score 1 on the fixed bands below.",
  "Discuss the five competencies orally against the written commitments and the library's level descriptions, then record one overall rating as Score 2.",
  "Write the verified impact summary and the development needs, choose a recommendation, and sign. The quarterly score is computed, not typed.",
];

export default async function ScoringPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];
  const scoreable = viewer.isAdmin
    ? participants
    : participants.filter((participant) => participant.coachId === viewer.personId);
  const records = await Promise.all(
    scoreable.map(async (participant) => ({
      participant,
      record: await getPersonRecord(viewer.supabase, participant.id),
    })),
  );

  return (
    <>
      <PageHeader
        eyebrow="Every quarter end"
        title="Quarterly scoring"
        description="The full review and feedback session happens at the half-year — do not confuse the two. Read the Impact Statement first, verify it against the data sources and your check-in records, then score."
        action={<ScoringGuideDialog />}
      />
      {!cycle || records.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {cycle
              ? "No one in your scope is ready to be scored yet."
              : "No cycle is open yet. An administrator opens the cycle and enrols the roster."}
          </CardContent>
        </Card>
      ) : (
        cycle.quarters.map((quarter) => (
          <section key={quarter.id} className="mb-6">
            {(() => {
              const csvRows = [
                [
                  "Person",
                  "Email",
                  "Title",
                  "Impact statement",
                  "Goals scored",
                  "Goals total",
                  "Score 1",
                  "Score 2",
                  "Quarterly score",
                  "Status",
                ],
                ...records.map(({ participant, record }) => {
                  const review = record?.reviews.find((entry) => entry.quarterId === quarter.id);
                  const statement = record?.impactStatements.find(
                    (entry) => entry.quarterId === quarter.id,
                  );
                  return [
                    participant.personName,
                    participant.personEmail,
                    participant.title,
                    statement?.submittedAt ? "Shared" : "Not shared",
                    review?.goalScores.length ?? 0,
                    record?.charter?.goals.length ?? 0,
                    review?.okrRating ?? "",
                    review?.competencyRating ?? "",
                    review?.calibratedScore ?? review?.quarterlyScore ?? "",
                    review ? REVIEW_STATUS_LABELS[review.status] : "Not started",
                  ];
                }),
              ];

              return (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">{quarter.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Score by{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(
                        new Date(
                          `${quarter.scoringDueAt?.slice(0, 10) ?? quarter.endDate}T00:00:00Z`,
                        ),
                      )}
                      {quarter.isFullReview ? " · full review quarter" : ""}
                    </p>
                  </div>
                  <CsvDownloadButton
                    filename={`ascend-${quarter.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-scoring.csv`}
                    rows={csvRows}
                    label="Download CSV"
                  />
                </div>
              );
            })()}
            <Card>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Impact statement</TableHead>
                        <TableHead>Goals scored</TableHead>
                        <TableHead>Score 1</TableHead>
                        <TableHead>Score 2</TableHead>
                        <TableHead>Quarterly</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map(({ participant, record }) => {
                        const review = record?.reviews.find(
                          (entry) => entry.quarterId === quarter.id,
                        );
                        const statement = record?.impactStatements.find(
                          (entry) => entry.quarterId === quarter.id,
                        );
                        const goalTotal = record?.charter?.goals.length ?? 0;
                        const scored = review?.goalScores.length ?? 0;
                        const finalScore = review?.calibratedScore ?? review?.quarterlyScore;
                        return (
                          <TableRow key={participant.id}>
                            <TableCell>
                              <p className="font-medium">{participant.personName}</p>
                              <p className="text-xs text-muted-foreground">{participant.title}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statement?.submittedAt ? "default" : "outline"}>
                                {statement?.submittedAt ? "Shared" : "Not shared"}
                              </Badge>
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {goalTotal ? `${scored}/${goalTotal}` : "—"}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {review?.okrRating ?? "—"}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {review?.competencyRating ?? "—"}
                            </TableCell>
                            <TableCell className="font-medium tabular-nums">
                              {finalScore?.toFixed(2) ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {review ? REVIEW_STATUS_LABELS[review.status] : "Not started"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={<Link href={`/coaching/reviews/${participant.id}`} />}
                              >
                                {review ? "Open" : "Start"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        ))
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How to work down the screen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-muted-foreground">
              {STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-sm leading-6">
              <span className="font-medium">Bands:</span>{" "}
              <span className="text-muted-foreground">
                {SCORE_BANDS.map((band) => `${band.range} → ${band.rating}`).join(" · ")}
              </span>
            </p>
            <p className="text-sm leading-6">
              <span className="font-medium">
                Quarterly score = (Score 1 × {cycle?.okrWeight ?? 0.6}) + (Score 2 ×{" "}
                {cycle?.competencyWeight ?? 0.4})
              </span>
              <span className="text-muted-foreground">
                . Leadership can calibrate the score before release when needed.
              </span>
            </p>
          </CardContent>
        </Card>
        <RatingTraps />
      </div>
    </>
  );
}
