import { CalendarClock, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { AcknowledgeReviewButton } from "@/app/components/record-actions";
import { ScoringGuideDialog } from "@/app/components/scoring-guide-dialog";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCycle, getOwnParticipant } from "@/lib/data/cycle";
import {
  halfYearScore,
  performanceLevelForScore,
  RECOMMENDATION_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/data/performance-types";
import { getReviews } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function ScoresPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycle(viewer.supabase);
  const participant = cycle
    ? await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId)
    : null;
  const reviews = participant ? await getReviews(viewer.supabase, participant.id) : [];

  // A score exists for the person only once it has been released to them.
  const released = reviews.filter((review) => review.releasedAt !== null);
  const half = halfYearScore(reviews);

  const tiles = [
    ...(cycle?.quarters ?? []).map((quarter) => {
      const review = released.find((entry) => entry.quarterId === quarter.id);
      return {
        label: quarter.name,
        value: review?.calibratedScore ?? review?.quarterlyScore ?? null,
      };
    }),
    { label: "Half-yearly · (Q1 + Q2) ÷ 2", value: half },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${Math.round((cycle?.okrWeight ?? 0.6) * 100)}% outcomes · ${Math.round((cycle?.competencyWeight ?? 0.4) * 100)}% competencies`}
        title="My scores"
        description={`Scores are given every quarter. The half-yearly score is the plain average of the two; the annual score is the average of the halves. Quarterly scores use the cycle's ${Math.round((cycle?.okrWeight ?? 0.6) * 100)}/${Math.round((cycle?.competencyWeight ?? 0.4) * 100)} blend between what you delivered and how.`}
        action={<ScoringGuideDialog />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent>
              <p className="font-heading text-3xl font-semibold">
                {tile.value === null ? (
                  <span className="text-muted-foreground">&mdash;</span>
                ) : (
                  tile.value.toFixed(2)
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{tile.label}</p>
                {tile.value !== null ? (
                  <Badge variant="outline">Level {performanceLevelForScore(tile.value)}</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!cycle || !participant ? (
        <WorkflowEmpty
          icon={CalendarClock}
          title={cycle ? "You are not enrolled in this cycle" : "No cycle is open yet"}
          description={
            cycle
              ? "Ask an administrator to add you to the current cycle from Cycles & settings."
              : "An administrator opens the cycle and enrols the roster."
          }
        />
      ) : released.length === 0 ? (
        <WorkflowEmpty
          icon={Trophy}
          title="No scores released yet"
          description="Scores appear here after the quarterly conversation and calibration."
        />
      ) : (
        <div className="grid gap-6">
          {released.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle>{review.quarterName}</CardTitle>
                <Badge variant="outline">{REVIEW_STATUS_LABELS[review.status]}</Badge>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm leading-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">What was delivered</p>
                    <p className="font-heading text-xl font-semibold">{review.okrRating ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">How it was delivered</p>
                    <p className="font-heading text-xl font-semibold">
                      {review.competencyRating ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quarterly score</p>
                    {(() => {
                      const effectiveScore = review.calibratedScore ?? review.quarterlyScore;
                      const level = performanceLevelForScore(effectiveScore);
                      return (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-heading text-xl font-semibold">
                            {effectiveScore?.toFixed(2) ?? "—"}
                          </p>
                          {level !== null ? <Badge variant="outline">Level {level}</Badge> : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-primary"
                      style={{ width: `${(cycle?.okrWeight ?? 0.6) * 100}%` }}
                    />
                    <div
                      className="bg-secondary"
                      style={{ width: `${(cycle?.competencyWeight ?? 0.4) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Score 1 · {Math.round((cycle?.okrWeight ?? 0.6) * 100)}%</span>
                    <span>Score 2 · {Math.round((cycle?.competencyWeight ?? 0.4) * 100)}%</span>
                  </div>
                </div>

                {review.goalScores.length > 0 ? (
                  <div className="grid gap-2">
                    <p className="font-medium">Goal attainment</p>
                    {review.goalScores.map((score) => (
                      <div key={score.id} className="rounded-xl border p-3">
                        <p className="font-medium">{score.goalOutcome}</p>
                        <p className="text-muted-foreground">
                          {score.actualResult} &middot; attainment {score.attainment.toFixed(2)}
                        </p>
                        <p className="text-muted-foreground">{score.evidenceNote}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {review.coachVerifiedImpact ? (
                  <div>
                    <p className="font-medium">Your coach&rsquo;s verified summary</p>
                    <p className="text-muted-foreground">{review.coachVerifiedImpact}</p>
                  </div>
                ) : null}
                {review.developmentNeeds ? (
                  <div>
                    <p className="font-medium">Development needs</p>
                    <p className="text-muted-foreground">{review.developmentNeeds}</p>
                  </div>
                ) : null}
                {review.recommendation ? (
                  <div>
                    <p className="font-medium">Recommendation</p>
                    <p className="text-muted-foreground">
                      {RECOMMENDATION_LABELS[review.recommendation]}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
                  <p className="font-medium">Signatures</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["coach", "founder", "participant"] as const).map((capacity) => {
                      const signature = review.acknowledgments.find(
                        (entry) => entry.capacity === capacity,
                      );
                      const label =
                        capacity === "founder"
                          ? "Leadership"
                          : capacity === "participant"
                            ? "You"
                            : "Coach";
                      return (
                        <div key={capacity}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-medium">
                            {signature?.actorName ??
                              (capacity === "participant" && review.status === "released"
                                ? "Awaiting your acknowledgement"
                                : "Awaiting sign-off")}
                          </p>
                          {signature?.comment ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {signature.comment}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {review.transcript.length > 0 ? (
                  <div className="grid gap-2 rounded-xl border bg-muted/20 p-4">
                    <p className="font-medium">Conversation transcript</p>
                    {review.transcript.map((entry) => (
                      <div key={entry.id} className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          {entry.authorName} · {entry.createdAt.slice(0, 10)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{entry.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {review.status === "released" ? (
                  <AcknowledgeReviewButton reviewId={review.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
