import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { ParticipantTable } from "@/app/components/participant-table";
import { RatingTraps } from "@/app/components/rating-traps";
import { ScoringGuideDialog } from "@/app/components/scoring-guide-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_BANDS } from "@/data/performance";
import { getActiveCycle, getVisibleParticipants } from "@/lib/data/cycle";
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

  const cycle = await getActiveCycle(viewer.supabase);
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];
  const scoreable = viewer.isAdmin
    ? participants
    : participants.filter((participant) => participant.coachId === viewer.personId);

  return (
    <>
      <PageHeader
        eyebrow="Every quarter end"
        title="Quarterly scoring"
        description="The full review and feedback session happens at the half-year — do not confuse the two. Read the Impact Statement first, verify it against the data sources and your check-in records, then score."
        action={<ScoringGuideDialog />}
      />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
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
                , calibrated across all coaches before release.
              </span>
            </p>
          </CardContent>
        </Card>
        <RatingTraps />
      </div>
      <ParticipantTable
        participants={scoreable}
        action="review"
        emptyMessage={
          cycle
            ? "No one in your scope is ready to be scored yet."
            : "No cycle is open yet. An administrator opens the cycle and enrols the roster."
        }
      />
    </>
  );
}
